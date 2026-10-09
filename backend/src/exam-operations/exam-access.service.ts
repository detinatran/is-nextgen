import { Injectable, Logger } from '@nestjs/common';
import { randomInt, randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import { AppException } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { AuditService } from '../common/audit/audit.service';
import { IdempotencyService } from '../common/idempotency/idempotency.service';
import { PrismaService } from '../database/prisma.service';
import { parseSelectionPolicy, selectFrozenVersions } from './domain/selection-policy';
import type { AssignmentSummary, AttemptStartedResponse, AvailabilityResponse } from './dto/exam-access.dto';

// FR-19: làm xong (đã nộp/hết giờ) thì không vào lại; BTC muốn cho thi lại thì nâng EXAM_ATTEMPT_QUOTA
const ATTEMPT_QUOTA = Math.max(1, Number(process.env.EXAM_ATTEMPT_QUOTA) || 1);

/** Thời lượng làm bài theo ca (cột duration_seconds do trang quản trị thêm vào exam_schedules); chưa có thì dùng thời lượng của kỳ thi. */
async function scheduleDurationSeconds(db: Prisma.TransactionClient | PrismaService, scheduleId: string, fallback: number): Promise<number> {
  const rows = await db.$queryRaw<{ d: number | null }[]>`
    SELECT (to_jsonb(s)->>'duration_seconds')::int AS d FROM exam_schedules s WHERE s.id = ${scheduleId}::uuid`;
  const d = rows[0]?.d;
  return d && d > 0 ? d : fallback;
}

/**
 * FR-19 exam access: assignments view, availability and the atomic Start.
 * Start creates Attempt + sealed delivered form + writer session + receipt
 * in ONE PostgreSQL transaction; rollback consumes zero attempts.
 */
@Injectable()
export class ExamAccessService {
  private readonly logger = new Logger(ExamAccessService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly audit: AuditService,
  ) {}

  private async candidateIdForUser(userId: string): Promise<string> {
    const candidate = await this.prisma.candidates.findUnique({ where: { user_id: userId } });
    if (!candidate) throw AppException.forbidden('No candidate profile is linked to this account');
    return candidate.id;
  }

  async listAssignments(userId: string): Promise<{ assignments: AssignmentSummary[] }> {
    const candidateId = await this.candidateIdForUser(userId);
    const assignments = await this.prisma.candidate_assignments.findMany({
      where: { candidate_id: candidateId },
      orderBy: { created_at: 'asc' },
    });
    const summaries: AssignmentSummary[] = [];
    for (const a of assignments) {
      const [exam, schedule, attempts, finalScore] = await Promise.all([
        this.prisma.exams.findUniqueOrThrow({ where: { id: a.exam_id } }),
        this.prisma.exam_schedules.findUniqueOrThrow({ where: { id: a.schedule_id } }),
        this.prisma.attempts.findMany({ where: { assignment_id: a.id } }),
        this.prisma.candidate_final_scores.findUnique({ where: { assignment_id: a.id } }),
      ]);
      summaries.push({
        assignmentId: a.id,
        exam: {
          id: exam.id,
          round: exam.round,
          name: exam.name,
          durationSeconds: await scheduleDurationSeconds(this.prisma, a.schedule_id, exam.duration_seconds),
        },
        schedule: {
          opensAt: schedule.opens_at.toISOString(),
          closesAt: schedule.closes_at.toISOString(),
          capacity: schedule.capacity,
        },
        attemptsUsed: attempts.length,
        attemptQuota: ATTEMPT_QUOTA,
        activeAttemptId: attempts.find((at) => at.state === 'ACTIVE')?.id ?? null,
        finalScore: finalScore
          ? { points: finalScore.points.toString(), winningAttemptId: finalScore.winning_attempt_id }
          : null,
      });
    }
    return { assignments: summaries };
  }

  async availability(userId: string, assignmentId: string): Promise<AvailabilityResponse> {
    const candidateId = await this.candidateIdForUser(userId);
    const assignment = await this.prisma.candidate_assignments.findFirst({
      where: { id: assignmentId, candidate_id: candidateId },
    });
    if (!assignment) throw AppException.notFound('Assignment not found');

    const now = new Date();
    const reasons: string[] = [];
    const user = await this.prisma.users.findUniqueOrThrow({ where: { id: userId } });
    if (!user.email_verified_at) reasons.push('EMAIL_NOT_VERIFIED');
    const [schedule, attempts, blueprint] = await Promise.all([
      this.prisma.exam_schedules.findUniqueOrThrow({ where: { id: assignment.schedule_id } }),
      this.prisma.attempts.findMany({ where: { assignment_id: assignment.id } }),
      this.prisma.blueprint_versions.findUniqueOrThrow({
        where: { id: assignment.blueprint_version_id },
      }),
    ]);
    if (now < schedule.opens_at) reasons.push('ADMISSION_NOT_OPEN');
    if (now >= schedule.closes_at) reasons.push('ADMISSION_CLOSED');
    if (attempts.length >= ATTEMPT_QUOTA) reasons.push('ATTEMPT_LIMIT_REACHED');
    if (attempts.some((a) => a.state === 'ACTIVE')) reasons.push('ACTIVE_ATTEMPT_EXISTS');
    if (blueprint.state !== 'FROZEN') reasons.push('BLUEPRINT_NOT_FROZEN');

    return {
      assignmentId,
      canStart: reasons.length === 0,
      reasons,
      schedule: {
        opensAt: schedule.opens_at.toISOString(),
        closesAt: schedule.closes_at.toISOString(),
      },
      attemptQuota: { used: attempts.length, max: ATTEMPT_QUOTA },
      serverTime: now.toISOString(),
    };
  }

  async startAttempt(
    userId: string,
    authSessionId: string,
    assignmentId: string,
    idempotencyKey: string,
    correlationId: string,
  ): Promise<AttemptStartedResponse> {
    const candidateId = await this.candidateIdForUser(userId);
    const requestHash = this.idempotency.hashRequest({ assignmentId });
    const newAttemptId = randomUUID();
    const claim = {
      scope_key: `attempt-start:${assignmentId}`,
      idempotency_key: idempotencyKey,
      command_code: 'ATTEMPT_START' as const,
      actor_user_id: userId,
      resource_type: 'assignment',
      resource_id: assignmentId,
      result_metadata: { attemptId: newAttemptId },
    };

    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Known receipt keys confer no resource access.
          const owned = await tx.candidate_assignments.findFirst({ where: { id: assignmentId, candidate_id: candidateId } });
          if (!owned) throw AppException.notFound('Assignment not found');
          const receipt = await this.idempotency.claim(tx, claim, requestHash);
          if (receipt.replayed) {
            // command_receipts is immutable evidence: rebuild the committed
            // outcome from domain state (the authoritative source).
            if (!receipt.receiptCreatedAt) {
              throw AppException.conflict(ErrorCodes.IDEMPOTENCY_CONFLICT, 'Concurrent idempotent start');
            }
            return this.reconstructStart(assignmentId, candidateId, receipt.resultMetadata);
          }

          // Serialize concurrent starts of the same assignment on the row lock.
          const assignmentRows = await tx.$queryRaw<
            { id: string; candidate_id: string; exam_id: string; schedule_id: string; blueprint_version_id: string }[]
          >`SELECT id, candidate_id, exam_id, schedule_id, blueprint_version_id
             FROM candidate_assignments WHERE id = ${assignmentId}::uuid AND candidate_id = ${candidateId}::uuid FOR UPDATE`;
          if (assignmentRows.length === 0) throw AppException.notFound('Assignment not found');
          const assignment = assignmentRows[0];

        const user = await tx.users.findUniqueOrThrow({ where: { id: userId } });
        if (!user.email_verified_at) {
          throw AppException.forbidden('Email must be verified before exam access');
        }

        const schedule = await tx.exam_schedules.findUniqueOrThrow({
          where: { id: assignment.schedule_id },
        });
        const now = new Date();
        if (now < schedule.opens_at || now >= schedule.closes_at) {
          throw new AppException(403, ErrorCodes.ADMISSION_CLOSED, 'Exam admission window is not open');
        }
        const rosterCount = await tx.candidate_assignments.count({
          where: { schedule_id: schedule.id },
        });
        if (rosterCount > schedule.capacity) {
          throw AppException.conflict(ErrorCodes.CAPACITY_REACHED, 'Schedule capacity is exhausted');
        }

        const used = await tx.attempts.count({ where: { assignment_id: assignment.id } });
        if (used >= ATTEMPT_QUOTA) {
          throw AppException.conflict(ErrorCodes.ATTEMPT_LIMIT_REACHED, 'Attempt quota is exhausted');
        }
        const activeForCandidate = await tx.attempts.findFirst({
          where: { candidate_id: candidateId, state: 'ACTIVE' },
          select: { id: true },
        });
        if (activeForCandidate) {
          throw AppException.conflict(ErrorCodes.ACTIVE_ATTEMPT_EXISTS, 'An active attempt already exists', {
            attemptId: activeForCandidate.id,
          });
        }

        const exam = await tx.exams.findUniqueOrThrow({ where: { id: assignment.exam_id } });
        const blueprint = await tx.blueprint_versions.findUniqueOrThrow({
          where: { id: assignment.blueprint_version_id },
        });
        if (blueprint.state !== 'FROZEN') {
          throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Assignment blueprint is not frozen');
        }

        // Full delivered form materialized from frozen relations.
        const items = parseSelectionPolicy(blueprint.selection_policy);
        const selected: { versionId: string; points: number }[] = [];
        for (const item of items) {
          const versionIds = await selectFrozenVersions(tx, item.poolId, item.count);
          for (const versionId of versionIds) selected.push({ versionId, points: item.points });
        }

        const startedAt = new Date();
        const durationSeconds = await scheduleDurationSeconds(tx, schedule.id, exam.duration_seconds);
        const deadlineAt = new Date(startedAt.getTime() + durationSeconds * 1000);
        const attempt = await tx.attempts.create({
          data: {
            id: newAttemptId,
            assignment_id: assignment.id,
            candidate_id: candidateId,
            ordinal: used + 1,
            state: 'ACTIVE',
            started_at: startedAt,
            deadline_at: deadlineAt,
          },
        });
        const form = await tx.delivered_exam_forms.create({
          data: {
            attempt_id: attempt.id,
            assignment_id: assignment.id,
            blueprint_version_id: blueprint.id,
            blueprint_revision: blueprint.revision,
            scoring_policy_code: blueprint.scoring_policy_code,
          },
        });
        for (let i = 0; i < selected.length; i++) {
          const questionVersionId = selected[i].versionId;
          const deliveredQuestion = await tx.delivered_questions.create({
            data: {
              form_id: form.id,
              attempt_id: attempt.id,
              question_version_id: questionVersionId,
              position: i + 1,
              configured_points: selected[i].points,
            },
          });
          const options = await tx.question_options.findMany({
            where: { question_version_id: questionVersionId },
            orderBy: { position: 'asc' },
          });
          // FR-3.2: thứ tự đáp án xáo trộn riêng cho từng lượt thi (Fisher-Yates, CSPRNG)
          const positions = options.map((_, k) => k + 1);
          for (let k = positions.length - 1; k > 0; k--) {
            const j = randomInt(0, k + 1);
            [positions[k], positions[j]] = [positions[j], positions[k]];
          }
          for (let k = 0; k < options.length; k++) {
            await tx.delivered_options.create({
              data: {
                delivered_question_id: deliveredQuestion.id,
                question_version_id: questionVersionId,
                question_option_id: options[k].id,
                position: positions[k],
              },
            });
          }
        }
        // attempt_boundary requires one complete sealed form at commit.
        await tx.delivered_exam_forms.update({
          where: { id: form.id },
          data: { sealed_at: startedAt },
        });
        await tx.active_exam_sessions.create({
          data: {
            candidate_id: candidateId,
            attempt_id: attempt.id,
            user_id: userId,
            auth_session_id: authSessionId,
            writer_generation: 1,
            reauthenticated_at: startedAt,
          },
        });
        await this.audit.record(tx, {
          actor_user_id: userId,
          action: 'exam.attempt_started',
          target_type: 'attempt',
          target_id: attempt.id,
          correlation_id: correlationId,
          metadata: { assignmentId: assignment.id, ordinal: used + 1 },
        });

        const response: AttemptStartedResponse = {
          attemptId: attempt.id,
          assignmentId: assignment.id,
          ordinal: used + 1,
          state: 'ACTIVE',
          startedAt: startedAt.toISOString(),
          deadlineAt: deadlineAt.toISOString(),
          serverTime: new Date().toISOString(),
          writerGeneration: 1,
        };
        return response;
        },
        { timeout: 30_000 },
      );
      this.logger.log(`exam attempt started correlationId=${correlationId}`);
      return result;
    } catch (e) {
      // Same-key twin raced mid-transaction (e.g. on the attempt unique index):
      // the winner's receipt is committed, so replay its outcome.
      if (
        typeof e === 'object' &&
        e !== null &&
        (e as { code?: string }).code === 'P2002'
      ) {
        const receipt = await this.prisma.command_receipts.findUnique({
          where: {
            scope_key_idempotency_key: {
              scope_key: claim.scope_key,
              idempotency_key: claim.idempotency_key,
            },
          },
        });
        if (receipt && receipt.request_hash === requestHash && receipt.actor_user_id === userId) {
          return this.reconstructStart(assignmentId, candidateId, receipt.result_metadata);
        }
      }
      throw e;
    }
  }

  /** Rebuilds a committed start outcome from domain state (receipt is immutable). */
  private async reconstructStart(assignmentId: string, candidateId: string, metadata: Prisma.JsonValue): Promise<AttemptStartedResponse> {
    return this.prisma.$transaction(async (tx) => {
      const attemptId = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? metadata['attemptId'] : null;
      if (typeof attemptId !== 'string') {
        throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Legacy start receipt requires operational reconciliation');
      }
      const attempt = await tx.attempts.findFirst({
        where: {
          id: attemptId,
          assignment_id: assignmentId,
          candidate_id: candidateId,
        },
        orderBy: { ordinal: 'asc' },
      });
      if (!attempt) {
        throw AppException.conflict(
          ErrorCodes.STATE_CONFLICT,
          'Idempotent start could not resolve the committed attempt',
        );
      }
      const writer = await tx.active_exam_sessions.findUnique({
        where: { attempt_id: attempt.id },
      });
      return {
        attemptId: attempt.id,
        assignmentId,
        ordinal: attempt.ordinal,
        state: attempt.state as 'ACTIVE',
        startedAt: attempt.started_at.toISOString(),
        deadlineAt: attempt.deadline_at.toISOString(),
        serverTime: new Date().toISOString(),
        writerGeneration: writer ? Number(writer.writer_generation) : null,
      };
    });
  }

  /** Maps the partial-unique races the DB enforces to stable machine codes. */
  static mapStartWriteError(e: unknown): AppException | null {
    const code = (e as { code?: string })?.code;
    const message = String((e as { message?: string })?.message ?? '');
    if (code === 'P2002') {
      // Prisma names the FIELD, not the partial index, in P2002 messages.
      if (message.includes('`candidate_id`')) {
        return AppException.conflict(ErrorCodes.ACTIVE_ATTEMPT_EXISTS, 'An active attempt already exists');
      }
      if (message.includes('`assignment_id`') && message.includes('`ordinal`')) {
        return AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Attempt ordinal conflict');
      }
    }
    return null;
  }
}
