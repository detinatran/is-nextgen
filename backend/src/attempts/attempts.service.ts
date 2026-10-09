import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { attempts } from '@prisma/client';
import type { Tx } from '../common/idempotency/idempotency.service';
import type { AppConfig } from '../config/configuration';
import { AppException } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { AuditService } from '../common/audit/audit.service';
import { IdempotencyService } from '../common/idempotency/idempotency.service';
import { PrismaService } from '../database/prisma.service';
import { AttemptFinalizationService } from './finalization.service';
import type {
  AnswerSavedResponse,
  AttemptView,
  SubmissionResponse,
  TakeoverResponse,
} from './dto/attempt.dto';

/**
 * FR-20 sanitized attempt view, FR-21 answer saving with optimistic
 * revisions, review flags, writer takeover, FR-22 manual submission.
 * PostgreSQL is the only truth for deadlines, revisions and writer authority.
 */
@Injectable()
export class AttemptsService {
  private readonly logger = new Logger(AttemptsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly audit: AuditService,
    private readonly finalization: AttemptFinalizationService,
    private readonly config: ConfigService<AppConfig>,
  ) {}

  // ---------- helpers ----------

  private async lockOwnedAttempt(tx: Tx, attemptId: string, userId: string): Promise<attempts> {
    const rows = await tx.$queryRaw<attempts[]>`
      SELECT a.* FROM attempts a
      JOIN candidates c ON c.id = a.candidate_id
      WHERE a.id = ${attemptId}::uuid AND c.user_id = ${userId}::uuid
      FOR UPDATE OF a`;
    if (rows.length === 0) throw AppException.notFound('Attempt not found');
    return rows[0];
  }

  private assertWriterBinding(
    authority: {
      attempt_id: string;
      auth_session_id: string;
      user_id: string;
    } | null,
    attemptId: string,
    userId: string,
    sessionId: string,
  ): void {
    if (
      !authority ||
      authority.attempt_id !== attemptId ||
      authority.user_id !== userId ||
      authority.auth_session_id !== sessionId
    ) {
      throw AppException.conflict(
        ErrorCodes.STATE_CONFLICT,
        'Writer authority is held by another session; reconnect via session takeover',
      );
    }
  }

  /** F02: supplied generation must equal the authoritative writer generation. */
  private assertWriterGeneration(
    authority: { writer_generation?: bigint | number } | null,
    writerGeneration: number,
  ): void {
    if (!authority || Number(authority.writer_generation) !== writerGeneration) {
      throw AppException.conflict(
        ErrorCodes.STATE_CONFLICT,
        'Writer generation conflict; session was taken over',
        { reason: 'STALE_WRITER_GENERATION' },
      );
    }
  }

  /**
   * F02: the guard resolves identity BEFORE the transaction; session
   * revocation/expiry or user disablement can happen while the request waits
   * on the attempt lock. Authoritative current authority is therefore
   * re-checked INSIDE the gate, after the attempt row lock, on every
   * candidate mutation (save, flag, takeover, submit).
   */
  private async revalidateWriterAuthority(tx: Tx, sessionId: string, userId: string): Promise<void> {
    const session = await tx.auth_sessions.findUnique({ where: { id: sessionId } });
    if (!session || session.revoked_at !== null || session.expires_at <= new Date()) {
      throw AppException.authRequired('Session is no longer valid');
    }
    const user = await tx.users.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw AppException.forbidden('Account is not active');
    }
  }

  /** Maps DB trigger rejections to the stable machine codes. */
  static mapWriteError(e: unknown): AppException | null {
    const message = String((e as { message?: string })?.message ?? '');
    if (message.includes('cutoff or finalized')) {
      return AppException.conflict(ErrorCodes.DEADLINE_PASSED, 'Attempt deadline has passed');
    }
    if (message.includes('revision or reparent conflict') || message.includes('initial revision')) {
      return AppException.conflict(ErrorCodes.REVISION_CONFLICT, 'Answer revision conflict');
    }
    if (message.includes('no reset/delete/refund')) {
      return AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Attempt is finalized');
    }
    return null;
  }

  // ---------- FR-20 ----------

  async getAttemptView(userId: string, attemptId: string): Promise<AttemptView> {
    let attempt = await this.prisma.attempts.findUnique({ where: { id: attemptId } });
    if (!attempt) throw AppException.notFound('Attempt not found');
    const candidate = await this.prisma.candidates.findUniqueOrThrow({
      where: { id: attempt.candidate_id },
    });
    if (candidate.user_id !== userId) throw AppException.notFound('Attempt not found');

    // Opportunistic reconciliation at the read boundary.
    if (attempt.state === 'ACTIVE' && new Date() >= attempt.deadline_at) {
      await this.finalization.finalizeOverdueAttempt(attemptId, `reconcile-read:${attemptId}`);
      attempt = await this.prisma.attempts.findUniqueOrThrow({ where: { id: attemptId } });
    }

    const form = await this.prisma.delivered_exam_forms.findUniqueOrThrow({
      where: { attempt_id: attemptId },
    });
    const questions = await this.prisma.delivered_questions.findMany({
      where: { form_id: form.id, attempt_id: attemptId },
      orderBy: { position: 'asc' },
    });
    const optionRows = await this.prisma.delivered_options.findMany({
      where: { delivered_question_id: { in: questions.map((q) => q.id) } },
      orderBy: { position: 'asc' },
    });
    const sourceOptionTexts = await this.prisma.question_options.findMany({
      where: { id: { in: optionRows.map((o) => o.question_option_id) } },
      select: { id: true, text: true },
    });
    const textById = new Map(sourceOptionTexts.map((o) => [o.id, o.text]));
    const answerRows = await this.prisma.answers.findMany({ where: { attempt_id: attemptId } });
    const flagRows = await this.prisma.review_flags.findMany({ where: { attempt_id: attemptId } });
    const answerByQuestion = new Map(answerRows.map((a) => [a.delivered_question_id, a]));
    const flagByQuestion = new Map(flagRows.map((f) => [f.delivered_question_id, f]));

    const delivered = await this.prisma.delivered_questions.findMany({
      where: { form_id: form.id },
      select: { id: true, question_version_id: true },
    });
    const promptSources = await this.prisma.question_versions.findMany({
      where: { id: { in: delivered.map((q) => q.question_version_id) } },
      select: { id: true, prompt: true },
    });
    const versionToPrompt = new Map(promptSources.map((q) => [q.id, q.prompt]));
    const promptById = new Map(delivered.map((q) => [q.id, versionToPrompt.get(q.question_version_id) ?? '']));

    const writer = await this.prisma.active_exam_sessions.findUnique({
      where: { candidate_id: attempt.candidate_id },
    });
    const now = new Date().toISOString();
    return {
      attempt: {
        id: attempt.id,
        ordinal: attempt.ordinal,
        state: attempt.state as 'ACTIVE' | 'FINALIZED',
        startedAt: attempt.started_at.toISOString(),
        deadlineAt: attempt.deadline_at.toISOString(),
        serverTime: now,
        writerGeneration: writer ? Number(writer.writer_generation) : null,
      },
      form: questions.map((q) => ({
        deliveredQuestionId: q.id,
        position: q.position,
        prompt: promptById.get(q.id) ?? '',
        points: Number(q.configured_points),
        options: optionRows
          .filter((o) => o.delivered_question_id === q.id)
          .map((o) => ({
            deliveredOptionId: o.id,
            position: o.position,
            text: textById.get(o.question_option_id) ?? '',
          })),
      })),
      candidateState: questions.map((q) => {
        const answer = answerByQuestion.get(q.id);
        const flag = flagByQuestion.get(q.id);
        return {
          deliveredQuestionId: q.id,
          selectedOptionId: answer?.selected_delivered_option_id ?? null,
          answerRevision: answer ? Number(answer.revision) : 0,
          reviewFlag: flag?.flagged ?? false,
          flagRevision: flag ? Number(flag.revision) : 0,
        };
      }),
    };
  }

  // ---------- FR-21 ----------

  async saveAnswer(
    userId: string,
    sessionId: string,
    attemptId: string,
    deliveredQuestionId: string,
    dto: { selectedOptionId: string | null; expectedRevision: number; mutationId: string; writerGeneration: number },
    correlationId: string,
  ): Promise<AnswerSavedResponse> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const attempt = await this.lockOwnedAttempt(tx, attemptId, userId);
        await this.revalidateWriterAuthority(tx, sessionId, userId);
        const now = new Date();
        if (attempt.state !== 'ACTIVE') {
          throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Attempt is finalized');
        }
        if (now >= attempt.deadline_at) {
          throw AppException.conflict(ErrorCodes.DEADLINE_PASSED, 'Attempt deadline has passed');
        }
        const writer = await tx.active_exam_sessions.findUnique({
          where: { candidate_id: attempt.candidate_id },
        });
        this.assertWriterBinding(writer, attemptId, userId, sessionId);
        this.assertWriterGeneration(writer, dto.writerGeneration);

        const question = await tx.delivered_questions.findFirst({
          where: { id: deliveredQuestionId, attempt_id: attemptId },
        });
        if (!question) throw AppException.notFound('Delivered question not found in this attempt');
        if (dto.selectedOptionId !== null) {
          const option = await tx.delivered_options.findFirst({
            where: { id: dto.selectedOptionId, delivered_question_id: question.id },
          });
          if (!option) {
            throw AppException.validation('Selected option does not belong to the question');
          }
        }

        const existing = await tx.answers.findUnique({
          where: {
            attempt_id_delivered_question_id: {
              attempt_id: attemptId,
              delivered_question_id: deliveredQuestionId,
            },
          },
        });
        const currentRevision = existing ? Number(existing.revision) : 0;
        if (dto.expectedRevision !== currentRevision) {
          throw AppException.conflict(ErrorCodes.REVISION_CONFLICT, 'Answer revision conflict', {
            currentRevision,
          });
        }

        if (!existing) {
          await tx.answers.create({
            data: {
              attempt_id: attemptId,
              delivered_question_id: deliveredQuestionId,
              selected_delivered_option_id: dto.selectedOptionId,
              last_mutation_id: dto.mutationId,
            },
          });
        } else {
          await tx.answers.update({
            where: {
              attempt_id_delivered_question_id: {
                attempt_id: attemptId,
                delivered_question_id: deliveredQuestionId,
              },
            },
            data: {
              selected_delivered_option_id: dto.selectedOptionId,
              revision: { increment: 1 },
              last_mutation_id: dto.mutationId,
            },
          });
        }
        const updated = await tx.answers.findUniqueOrThrow({
          where: {
            attempt_id_delivered_question_id: {
              attempt_id: attemptId,
              delivered_question_id: deliveredQuestionId,
            },
          },
        });
        await this.audit.record(tx, {
          actor_user_id: userId,
          action: 'attempt.answer_saved',
          target_type: 'answer',
          target_id: attemptId,
          correlation_id: correlationId,
          metadata: {
            deliveredQuestionId,
            revision: Number(updated.revision),
            cleared: dto.selectedOptionId === null,
          },
        });
        return {
          revision: Number(updated.revision),
          savedAt: updated.updated_at.toISOString(),
          serverTime: new Date().toISOString(),
        };
      });
    } catch (e) {
      const mapped = AttemptsService.mapWriteError(e);
      if (mapped) throw mapped;
      throw e;
    }
  }

  async setReviewFlag(
    userId: string,
    sessionId: string,
    attemptId: string,
    deliveredQuestionId: string,
    dto: { flagged: boolean; expectedRevision: number; writerGeneration: number },
  ): Promise<{ flagged: boolean; revision: number }> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const attempt = await this.lockOwnedAttempt(tx, attemptId, userId);
        await this.revalidateWriterAuthority(tx, sessionId, userId);
        const now = new Date();
        if (attempt.state !== 'ACTIVE') {
          throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Attempt is finalized');
        }
        if (now >= attempt.deadline_at) {
          throw AppException.conflict(ErrorCodes.DEADLINE_PASSED, 'Attempt deadline has passed');
        }
        const writer = await tx.active_exam_sessions.findUnique({
          where: { candidate_id: attempt.candidate_id },
        });
        this.assertWriterBinding(writer, attemptId, userId, sessionId);
        this.assertWriterGeneration(writer, dto.writerGeneration);

        const question = await tx.delivered_questions.findFirst({
          where: { id: deliveredQuestionId, attempt_id: attemptId },
        });
        if (!question) throw AppException.notFound('Delivered question not found in this attempt');

        const existing = await tx.review_flags.findUnique({
          where: {
            attempt_id_delivered_question_id: {
              attempt_id: attemptId,
              delivered_question_id: deliveredQuestionId,
            },
          },
        });
        const currentRevision = existing ? Number(existing.revision) : 0;
        if (dto.expectedRevision !== currentRevision) {
          throw AppException.conflict(ErrorCodes.REVISION_CONFLICT, 'Review flag revision conflict', {
            currentRevision,
          });
        }
        if (!existing) {
          await tx.review_flags.create({
            data: {
              attempt_id: attemptId,
              delivered_question_id: deliveredQuestionId,
              flagged: dto.flagged,
            },
          });
        } else {
          await tx.review_flags.update({
            where: {
              attempt_id_delivered_question_id: {
                attempt_id: attemptId,
                delivered_question_id: deliveredQuestionId,
              },
            },
            data: { flagged: dto.flagged, revision: { increment: 1 } },
          });
        }
        // Review flags never influence scoring; no audit noise needed beyond this.
        return { flagged: dto.flagged, revision: currentRevision + 1 };
      });
    } catch (e) {
      const mapped = AttemptsService.mapWriteError(e);
      if (mapped) throw mapped;
      throw e;
    }
  }

  // ---------- takeover ----------

  async takeoverSession(
    userId: string,
    sessionId: string,
    attemptId: string,
    correlationId: string,
  ): Promise<TakeoverResponse> {
    const windowMs = this.config.get('reauthWindowSeconds', 300) * 1000;
    return this.prisma.$transaction(async (tx) => {
      const attempt = await this.lockOwnedAttempt(tx, attemptId, userId);
      await this.revalidateWriterAuthority(tx, sessionId, userId);
      const now = new Date();
      if (attempt.state !== 'ACTIVE') {
        throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Attempt is finalized');
      }
      if (now >= attempt.deadline_at) {
        throw AppException.conflict(ErrorCodes.DEADLINE_PASSED, 'Attempt deadline has passed');
      }
      const session = await tx.auth_sessions.findUniqueOrThrow({ where: { id: sessionId } });
      if (now.getTime() - (session.reauthenticated_at?.getTime() ?? 0) > windowMs) {
        throw AppException.forbidden('Fresh reauthentication is required for takeover');
      }

      const existing = await tx.active_exam_sessions.findUnique({
        where: { candidate_id: attempt.candidate_id },
      });
      let generation: number;
      if (existing && existing.attempt_id === attemptId) {
        const updated = await tx.active_exam_sessions.update({
          where: { candidate_id: attempt.candidate_id },
          data: {
            writer_generation: { increment: 1 },
            auth_session_id: sessionId,
            reauthenticated_at: now,
            bound_at: now,
          },
        });
        generation = Number(updated.writer_generation);
      } else if (!existing) {
        // Writer was released (e.g. logout); rebind with a fresh generation.
        const created = await tx.active_exam_sessions.create({
          data: {
            candidate_id: attempt.candidate_id,
            attempt_id: attemptId,
            user_id: userId,
            auth_session_id: sessionId,
            writer_generation: 1,
            reauthenticated_at: now,
          },
        });
        generation = Number(created.writer_generation);
      } else {
        throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Writer is bound to a different attempt');
      }
      await this.audit.record(tx, {
        actor_user_id: userId,
        action: 'exam.writer_takeover',
        target_type: 'attempt',
        target_id: attemptId,
        correlation_id: correlationId,
        metadata: { writerGeneration: generation },
      });
      return { attemptId, writerGeneration: generation, boundAt: now.toISOString() };
    });
  }

  // ---------- FR-22 ----------

  async submitAttempt(
    userId: string,
    sessionId: string,
    attemptId: string,
    idempotencyKey: string,
    correlationId: string,
    writerGeneration: number,
  ): Promise<SubmissionResponse> {
    const requestHash = this.idempotency.hashRequest({ attemptId });
    const result = await this.prisma.$transaction(async (tx) => {
      // Ownership is checked for every replay, before consulting a known receipt.
      const attempt = await this.lockOwnedAttempt(tx, attemptId, userId);
      await this.revalidateWriterAuthority(tx, sessionId, userId);
      const claim = {
        scope_key: `attempt-submit:${attemptId}`,
        idempotency_key: idempotencyKey,
        command_code: 'ATTEMPT_SUBMIT' as const,
        actor_user_id: userId,
        resource_type: 'attempt',
        resource_id: attemptId,
      };
      const receipt = await this.idempotency.claim(tx, claim, requestHash);
      if (receipt.replayed) {
        // Immutable receipt: rebuild the committed outcome from domain state.
        return this.finalization.buildCommittedResult(tx, attemptId);
      }

      if (attempt.state === 'FINALIZED') {
        return this.finalization.buildCommittedResult(tx, attemptId);
      }
      const now = new Date();
      if (now >= attempt.deadline_at) {
        throw AppException.conflict(ErrorCodes.DEADLINE_PASSED, 'Attempt deadline has passed');
      }
      const writer = await tx.active_exam_sessions.findUnique({
        where: { candidate_id: attempt.candidate_id },
      });
      this.assertWriterBinding(writer, attemptId, userId, sessionId);
      // FR-22: the writer generation is mandatory — an omitted or stale
      // generation can never finalize, so a takeover cannot be raced past.
      this.assertWriterGeneration(writer, writerGeneration);

      await this.finalization.finalizeInTx(tx, attempt, 'MANUAL', correlationId);
      return this.finalization.buildCommittedResult(tx, attemptId);
    });
    this.logger.log(`attempt submitted correlationId=${correlationId}`);
    return result;
  }


  /** FR-3.2: append-only evidence of leaving the exam page; only for the owner's ACTIVE attempt. */
  async recordFocusEvent(
    userId: string,
    attemptId: string,
    dto: { kind: 'HIDDEN' | 'BLUR'; count: number },
    correlationId: string,
  ): Promise<void> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT a.id FROM attempts a JOIN candidates c ON c.id = a.candidate_id
      WHERE a.id = ${attemptId}::uuid AND c.user_id = ${userId}::uuid AND a.state = 'ACTIVE'`;
    if (rows.length === 0) throw AppException.notFound('Active attempt not found');
    await this.prisma.$transaction((tx) =>
      this.audit.record(tx, {
        actor_user_id: userId,
        action: 'exam.focus_lost',
        target_type: 'attempt',
        target_id: attemptId,
        correlation_id: correlationId,
        metadata: { kind: dto.kind, count: dto.count },
      }),
    );
  }

}
