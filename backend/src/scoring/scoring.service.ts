import { Injectable, Logger } from '@nestjs/common';
import { Prisma, type async_intents } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../database/prisma.service';

const MAX_ATTEMPTS = 5;

/**
 * Automatic single-choice scoring (§21): correct → configured_points,
 * incorrect/unanswered → 0; no negative marking, no partial scores.
 * Reads the immutable delivered form + committed answers; writes the
 * immutable attempt_scores once, then rebuilds candidate_final_scores
 * with the MAX(valid finalized attempt score) rule.
 */
@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async scoreAttempt(attemptId: string, correlationId: string): Promise<{ points: string; maxPoints: string } | 'already_scored'> {
    const attempt = await this.prisma.attempts.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new Error(`scoring: attempt ${attemptId} not found`);
    if (attempt.state !== 'FINALIZED') throw new Error(`scoring: attempt ${attemptId} is not finalized`);
    const submission = await this.prisma.submissions.findUnique({ where: { attempt_id: attemptId } });
    if (!submission) throw new Error(`scoring: attempt ${attemptId} has no submission`);

    const existing = await this.prisma.attempt_scores.findUnique({ where: { attempt_id: attemptId } });
    if (existing) {
      this.logger.log(`scoring retry: attempt ${attemptId} already scored (idempotent no-op)`);
      return 'already_scored';
    }

    const aggregates = await this.prisma.$queryRaw<{ points: Prisma.Decimal; max_points: Prisma.Decimal }[]>`
      SELECT
        COALESCE(SUM(CASE WHEN po.is_correct THEN q.configured_points ELSE 0 END), 0) AS points,
        COALESCE(SUM(q.configured_points), 0) AS max_points
      FROM delivered_questions q
      LEFT JOIN answers a
        ON a.attempt_id = q.attempt_id AND a.delivered_question_id = q.id
      LEFT JOIN delivered_options o
        ON o.id = a.selected_delivered_option_id
      LEFT JOIN question_options po
        ON po.id = o.question_option_id
      WHERE q.attempt_id = ${attemptId}::uuid`;

    // Immutable table + PK on attempt_id makes double-create impossible.
    await this.prisma.$transaction(async (tx) => {
      await tx.attempt_scores.create({
        data: {
          attempt_id: attemptId,
          submission_id: submission.id,
          points: aggregates[0].points,
          max_points: aggregates[0].max_points,
          policy_code: 'SINGLE_CHOICE_CONFIGURED_POINTS_V1',
        },
      });
      await this.rebuildFinalScore(tx, attempt.assignment_id);
      await this.audit.record(tx, {
        action: 'scoring.completed',
        target_type: 'attempt',
        target_id: attemptId,
        correlation_id: correlationId,
        metadata: { points: aggregates[0].points.toString(), maxPoints: aggregates[0].max_points.toString() },
      });
    });
    this.logger.log(`scoring complete attemptId=${attemptId} points=${aggregates[0].points.toString()}`);
    return { points: aggregates[0].points.toString(), maxPoints: aggregates[0].max_points.toString() };
  }

  /** MAX(valid finalized Attempt scores) — never latest/average/sum. */
  private async rebuildFinalScore(tx: Prisma.TransactionClient, assignmentId: string): Promise<void> {
    const winners = await tx.$queryRaw<{ winning_attempt_id: string; points: Prisma.Decimal }[]>`
      SELECT s.attempt_id AS winning_attempt_id, s.points
      FROM attempt_scores s
      JOIN attempts a ON a.id = s.attempt_id
      WHERE a.assignment_id = ${assignmentId}::uuid AND a.state = 'FINALIZED'
      ORDER BY s.points DESC, a.finalized_at ASC
      LIMIT 1`;
    if (winners.length === 0) return;
    const winner = winners[0];
    await tx.candidate_final_scores.upsert({
      where: { assignment_id: assignmentId },
      create: {
        assignment_id: assignmentId,
        winning_attempt_id: winner.winning_attempt_id,
        points: winner.points,
      },
      update: {
        winning_attempt_id: winner.winning_attempt_id,
        points: winner.points,
        rebuilt_at: new Date(),
      },
    });
  }

  /** Worker dispatch: lease SCORING intents and process each exactly-once-enough. */
  async processPendingScoring(correlationId = 'scoring-worker'): Promise<number> {
    const leased = await this.prisma.$transaction(async (tx) => {
      const intents = await tx.$queryRaw<async_intents[]>`
        SELECT * FROM async_intents WHERE kind='SCORING'
        AND available_at<=clock_timestamp()
        AND ((status IN ('PENDING','RETRY_PENDING') AND (lease_until IS NULL OR lease_until<=clock_timestamp()))
          OR (status='RUNNING' AND lease_until<=clock_timestamp()))
        ORDER BY available_at LIMIT 20 FOR UPDATE SKIP LOCKED`;
      if (intents.length > 0) {
        await tx.async_intents.updateMany({
          where: { id: { in: intents.map((i) => i.id) } },
          data: { status: 'RUNNING', lease_until: new Date(Date.now() + 120_000) },
        });
      }
      return intents;
    });

    for (const intent of leased) {
      try {
        await this.scoreAttempt(intent.resource_id, correlationId);
        await this.prisma.async_intents.update({
          where: { id: intent.id },
          data: { status: 'SUCCEEDED', completed_at: new Date(), lease_until: null },
        });
      } catch {
        const attempts = intent.attempts_used + 1;
        const failed = attempts >= MAX_ATTEMPTS;
        await this.prisma.async_intents.update({
          where: { id: intent.id },
          data: {
            status: failed ? 'FAILED' : 'RETRY_PENDING',
            attempts_used: attempts,
            available_at: new Date(Date.now() + 5_000 * attempts),
            lease_until: null,
          },
        });
        this.logger.warn(
          `scoring attempt failed intentId=${intent.id} resource=${intent.resource_id} attempt=${attempts} failed=${failed}`,
        );
      }
    }
    return leased.length;
  }
}
