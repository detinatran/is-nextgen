import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min, MinLength, IsUUID } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import type { AppConfig } from '../config/configuration';
import { AppException } from '../common/errors/app-error';
import { PrismaService } from '../database/prisma.service';
import { FixturesGuard } from './fixtures.guard';
import { ChallengeService } from '../identity-access/challenge.service';
import { selectFrozenVersions } from '../exam-operations/domain/selection-policy';

export class ProvisionUserDto {
  @IsString()
  @MinLength(3)
  email!: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  password?: string;
}

export class SetupExamDto {
  @IsString()
  @MinLength(1)
  competitionCode!: string;

  @IsOptional() @IsInt() @Min(1) @Max(4) round?: number;
  @IsOptional() @IsInt() @Min(60) durationSeconds?: number;

  @IsDateString()
  opensAt!: string;

  @IsDateString()
  closesAt!: string;

  @IsOptional() @IsInt() @Min(1) capacity?: number;

  @IsInt() @Min(1) @Max(50)
  questionCount!: number;

  @IsOptional() @IsInt() @Min(0) pointsPerQuestion?: number;

  @IsString() @MinLength(3)
  studentEmail!: string;
}

export class InsertOverdueAttemptDto {
  @IsUUID()
  assignmentId!: string;

  @IsOptional() @IsInt() @Min(1) minutesOverdue?: number;
}

/**
 * Admin/test fixture support only — NOT an Admin product. Enabled solely for
 * provisioning Candidate/Exam/Assignment data needed to exercise FR-13..FR-22.
 */
@ApiTags('fixtures')
@UseGuards(FixturesGuard)
@Controller('internal/fixtures')
export class FixturesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly challenges: ChallengeService,
    private readonly config: ConfigService<AppConfig>,
  ) {}

  private ensureEnabled(): void {
    if (!this.config.get('fixturesEnabled', false)) {
      throw AppException.notFound('Route not found');
    }
  }

  @Post('provision-user')
  async provisionUser(@Body() dto: ProvisionUserDto) {
    this.ensureEnabled();
    const emailNormalized = dto.email.trim().toLowerCase();
    const result = await this.prisma.$transaction(async (tx) => {
      const admin = await ensureAdmin(tx);
      const user = await tx.users.upsert({
        where: { email_normalized: emailNormalized },
        create: { email: dto.email.trim(), email_normalized: emailNormalized, status: 'PROVISIONED' },
        update: {},
      });
      const studentRole = await tx.roles.findUniqueOrThrow({ where: { code: 'STUDENT' } });
      await tx.user_roles.upsert({
        where: { user_id_role_id: { user_id: user.id, role_id: studentRole.id } },
        create: { user_id: user.id, role_id: studentRole.id, granted_by_user_id: admin.id },
        update: {},
      });
      const candidate = await tx.candidates.upsert({
        where: { user_id: user.id },
        create: { user_id: user.id },
        update: {},
      });
      if (dto.password) {
        await tx.users.update({
          where: { id: user.id },
          data: {
            password_hash: await argon2.hash(dto.password, { type: argon2.argon2id }),
            status: 'ACTIVE',
            email_verified_at: new Date(),
          },
        });
      }
      // Activation challenge; the code is exposed only through this fixture.
      const { challengeId } = await this.challenges.issue(tx, 'ACTIVATION', emailNormalized, user.id);
      const intent = await tx.notification_intents.findUniqueOrThrow({
        where: { deduplication_key: `challenge:${challengeId}` },
      });
      const activationCode = (intent.payload as { code?: string }).code ?? '';
      return { userId: user.id, candidateId: candidate.id, activationCode, activationChallengeId: challengeId };
    });
    return result;
  }

  @Post('setup-exam')
  async setupExam(@Body() dto: SetupExamDto) {
    this.ensureEnabled();
    const round = dto.round ?? 1;
    const durationSeconds = round === 1 ? 3600 : (dto.durationSeconds ?? 3600);
    const points = dto.pointsPerQuestion ?? 1;

    return this.prisma.$transaction(async (tx) => {
      const admin = await ensureAdmin(tx);
      const now = new Date();
      const competition = await tx.competitions.upsert({
        where: { code: dto.competitionCode },
        create: {
          code: dto.competitionCode,
          name: `Competition ${dto.competitionCode}`,
          registration_opens_at: new Date(now.getTime() - 86_400_000),
          registration_closes_at: new Date(now.getTime() + 30 * 86_400_000),
        },
        update: {},
      });

      const poolCode = `pool-${dto.competitionCode}-${Date.now()}`;
      const pool = await tx.question_pools.create({
        data: { code: poolCode, name: poolCode },
      });
      const questionVersionIds: string[] = [];
      for (let i = 0; i < dto.questionCount; i++) {
        const version = await tx.question_versions.create({
          data: {
            question_id: (await tx.questions.create({ data: { created_by_user_id: admin.id } })).id,
            version: 1,
            state: 'DRAFT',
            prompt: `Fixture question ${i + 1}: choose the correct option`,
            difficulty: 'EASY',
            created_by_user_id: admin.id,
          },
        });
        for (let position = 1; position <= 4; position++) {
          await tx.question_options.create({
            data: {
              question_version_id: version.id,
              position,
              text: `Option ${position} for question ${i + 1}`,
              is_correct: position === 1,
            },
          });
        }
        await tx.question_versions.update({
          where: { id: version.id },
          data: { state: 'FROZEN', frozen_at: new Date() },
        });
        await tx.question_pool_memberships.create({
          data: { pool_id: pool.id, question_version_id: version.id },
        });
        questionVersionIds.push(version.id);
      }

      const exam = await tx.exams.create({
        data: {
          competition_id: competition.id,
          round,
          name: `Round ${round} of ${dto.competitionCode}`,
          duration_seconds: durationSeconds,
        },
      });
      const blueprint = await tx.blueprint_versions.create({
        data: {
          exam_id: exam.id,
          version: 1,
          state: 'FROZEN',
          question_count: dto.questionCount,
          selection_policy: {
            items: [{ poolId: pool.id, count: dto.questionCount, points }],
          },
          scoring_policy_code: 'SINGLE_CHOICE_CONFIGURED_POINTS_V1',
        },
      });
      const schedule = await tx.exam_schedules.create({
        data: {
          exam_id: exam.id,
          opens_at: new Date(dto.opensAt),
          closes_at: new Date(dto.closesAt),
          capacity: dto.capacity ?? 100,
        },
      });
      const student = await tx.users.findUnique({ where: { email_normalized: dto.studentEmail.trim().toLowerCase() } });
      if (!student) throw AppException.notFound('Fixture student user not provisioned');
      const candidate = await tx.candidates.findUniqueOrThrow({ where: { user_id: student.id } });
      const assignment = await tx.candidate_assignments.create({
        data: {
          candidate_id: candidate.id,
          exam_id: exam.id,
          schedule_id: schedule.id,
          blueprint_version_id: blueprint.id,
          assigned_by_user_id: admin.id,
        },
      });
      return {
        competitionId: competition.id,
        examId: exam.id,
        scheduleId: schedule.id,
        blueprintVersionId: blueprint.id,
        assignmentId: assignment.id,
        questionVersionIds,
      };
    }, { timeout: 30_000 });
  }

  /** Direct SQL fixture: an ACTIVE attempt whose deadline already passed. */
  @Post('insert-overdue-attempt')
  async insertOverdueAttempt(@Body() dto: InsertOverdueAttemptDto) {
    this.ensureEnabled();
    const minutesOverdue = dto.minutesOverdue ?? 60;
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.candidate_assignments.findUniqueOrThrow({
        where: { id: dto.assignmentId },
      });
      const blueprint = await tx.blueprint_versions.findUniqueOrThrow({
        where: { id: assignment.blueprint_version_id },
      });
      const items = (blueprint.selection_policy as { items: { poolId: string; count: number; points: number }[] }).items;
      const selected: { versionId: string; points: number }[] = [];
      for (const item of items) {
        for (const versionId of await selectFrozenVersions(tx, item.poolId, item.count)) {
          selected.push({ versionId, points: item.points });
        }
      }
      const startedAt = new Date(Date.now() - (minutesOverdue + 60) * 60_000);
      const deadlineAt = new Date(Date.now() - minutesOverdue * 60_000);
      const ordinal = await tx.attempts.count({ where: { assignment_id: assignment.id } });
      const attempt = await tx.attempts.create({
        data: {
          assignment_id: assignment.id,
          candidate_id: assignment.candidate_id,
          ordinal: ordinal + 1,
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
        const dq = await tx.delivered_questions.create({
          data: {
            form_id: form.id,
            attempt_id: attempt.id,
            question_version_id: selected[i].versionId,
            position: i + 1,
            configured_points: selected[i].points,
          },
        });
        const options = await tx.question_options.findMany({
          where: { question_version_id: selected[i].versionId },
          orderBy: { position: 'asc' },
        });
        for (const o of options) {
          await tx.delivered_options.create({
            data: {
              delivered_question_id: dq.id,
              question_version_id: selected[i].versionId,
              question_option_id: o.id,
              position: o.position,
            },
          });
        }
      }
      await tx.delivered_exam_forms.update({
        where: { id: form.id },
        data: { sealed_at: startedAt },
      });
      return { attemptId: attempt.id };
    });
  }
}

type FixtureTx = Prisma.TransactionClient;

async function ensureAdmin(tx: FixtureTx): Promise<{ id: string }> {
  const emailNormalized = 'admin@fixtures.internal';
  const existing = await tx.users.findUnique({ where: { email_normalized: emailNormalized } });
  if (existing) return existing;
  const admin = await tx.users.create({
    data: {
      email: 'admin@fixtures.internal',
      email_normalized: emailNormalized,
      status: 'ACTIVE',
      password_hash: await argon2.hash(randomBytes(32).toString('hex'), { type: argon2.argon2id }),
    },
  });
  const adminRole = await tx.roles.findUniqueOrThrow({ where: { code: 'ADMIN' } });
  await tx.user_roles.create({
    data: { user_id: admin.id, role_id: adminRole.id },
  });
  return admin;
}
