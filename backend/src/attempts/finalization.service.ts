import { Injectable, Logger } from '@nestjs/common';
import type { attempts } from '@prisma/client';
import { AuditService } from '../common/audit/audit.service';
import type { Tx } from '../common/idempotency/idempotency.service';
import { PrismaService } from '../database/prisma.service';

export interface FinalizationResult {
  attemptId: string;
  state: 'FINALIZED';
  cause: 'MANUAL' | 'TIMEOUT';
  submittedAt: string;
}

/**
 * The single finalization implementation. Manual submit (FR-22) and the
 * timeout reconciler share it; neither duplicates the workflow.
 * Caller must hold the attempt row lock and pass the attempt row.
 */
@Injectable()
export class AttemptFinalizationService {
  private readonly logger = new Logger(AttemptFinalizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async finalizeInTx(
    tx: Tx,
    attempt: attempts,
    cause: 'MANUAL' | 'TIMEOUT',
    correlationId: string,
  ): Promise<FinalizationResult> {
    if (attempt.state === 'FINALIZED') {
      throw new Error('finalizeInTx called on a finalized attempt');
    }
    const submittedAt = new Date();
    await tx.submissions.create({
      data: { attempt_id: attempt.id, cause, submitted_at: submittedAt },
    });
    // Release writer authority before the attempt transitions.
    await tx.active_exam_sessions.deleteMany({ where: { attempt_id: attempt.id } });
    await tx.attempts.update({
      where: { id: attempt.id },
      data: {
        state: 'FINALIZED',
        finalized_at: submittedAt,
        finalization_cause: cause,
      },
    });
    // Durable scoring intent; the scoring worker owns the rest.
    await tx.async_intents.create({
      data: {
        kind: 'SCORING',
        resource_id: attempt.id,
        payload: {},
        deduplication_key: `scoring:${attempt.id}`,
      },
    });
    await this.audit.record(tx, {
      actor_user_id: null,
      action: 'attempt.finalized',
      target_type: 'attempt',
      target_id: attempt.id,
      correlation_id: correlationId,
      metadata: { cause },
    });
    return {
      attemptId: attempt.id,
      state: 'FINALIZED',
      cause,
      submittedAt: submittedAt.toISOString(),
    };
  }

  async buildCommittedResult(tx: Tx, attemptId: string): Promise<FinalizationResult & { score: { points: string; maxPoints: string } | null }> {
    const attempt = await tx.attempts.findUniqueOrThrow({ where: { id: attemptId } });
    const submission = await tx.submissions.findUnique({ where: { attempt_id: attemptId } });
    const score = await tx.attempt_scores.findUnique({ where: { attempt_id: attemptId } });
    return {
      attemptId,
      state: 'FINALIZED',
      cause: attempt.finalization_cause as 'MANUAL' | 'TIMEOUT',
      submittedAt: (submission?.submitted_at ?? attempt.finalized_at as Date).toISOString(),
      score: score ? { points: score.points.toString(), maxPoints: score.max_points.toString() } : null,
    };
  }

  /** Reconciler entry point: finalizes one overdue ACTIVE attempt (TIMEOUT). */
  async finalizeOverdueAttempt(attemptId: string, correlationId: string): Promise<FinalizationResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<attempts[]>`
        SELECT * FROM attempts WHERE id = ${attemptId}::uuid FOR UPDATE`;
      const attempt = rows[0];
      if (!attempt || attempt.state !== 'ACTIVE') return null;
      const result = await this.finalizeInTx(tx, attempt, 'TIMEOUT', correlationId);
      this.logger.log(`attempt finalized by timeout attemptId=${attemptId}`);
      return result;
    });
  }

  /** Sweep entry point for the worker: finalize overdue ACTIVE attempts. */
  async sweepOverdue(limit = 50): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<attempts[]>`
        SELECT * FROM attempts
        WHERE state = 'ACTIVE' AND deadline_at <= clock_timestamp()
        ORDER BY deadline_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED`;
      let count = 0;
      for (const attempt of rows) {
        await this.finalizeInTx(tx, attempt, 'TIMEOUT', `timeout-sweep:${attempt.id}`);
        count += 1;
      }
      if (count > 0) this.logger.log(`timeout sweep finalized ${count} attempts`);
      return count;
    });
  }
}
