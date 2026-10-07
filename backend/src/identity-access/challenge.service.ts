import { Injectable } from '@nestjs/common';
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import type { auth_challenges } from '@prisma/client';
import { AppException } from '../common/errors/app-error';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { Tx } from '../common/idempotency/idempotency.service';

const CHALLENGE_TTL_MS = 15 * 60 * 1000;
const DEFAULT_ATTEMPTS_LIMIT = 5;

export type ChallengePurpose =
  | 'ACTIVATION'
  | 'EMAIL_VERIFY'
  | 'PASSWORD_RESET'
  | 'MFA'
  | 'REGISTRATION_RECOVERY';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hashesEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export interface ConsumedChallenge {
  challengeId: string;
  userId: string | null;
  emailNormalized: string;
}

/**
 * Email OTP challenges (activation, verification, reset, MFA, recovery).
 * Only verifier hashes are stored; raw codes live exclusively in the
 * notification pipeline and are never logged or returned by any API.
 *
 * F01 invariant: challenges are consumed BY IDENTITY — the caller supplies
 * the exact challengeId (locator) plus the OTP (verifier). There is no
 * lookup of accounts/challenges by OTP anywhere: two accounts that happen
 * to receive the same six-digit code can never cross-authenticate.
 */
@Injectable()
export class ChallengeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async issue(
    tx: Tx,
    purpose: ChallengePurpose,
    emailNormalized: string,
    userId: string | null,
  ): Promise<{ challengeId: string; expiresAt: Date }> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
    const challenge = await tx.auth_challenges.create({
      data: {
        user_id: userId,
        email_normalized: emailNormalized,
        purpose,
        verifier_hash: sha256(code),
        attempts_limit: DEFAULT_ATTEMPTS_LIMIT,
        expires_at: expiresAt,
      },
      select: { id: true },
    });
    await this.notifications.enqueue(tx, {
      templateCode:
        purpose === 'ACTIVATION'
          ? 'ACTIVATION'
          : purpose === 'PASSWORD_RESET'
            ? 'PASSWORD_RESET'
            : 'EMAIL_VERIFY',
      destinationEmail: emailNormalized,
      payload: { code },
      deduplicationKey: `challenge:${challenge.id}`,
      userId,
    });
    return { challengeId: challenge.id, expiresAt };
  }

  /**
   * Validates and consumes ONE exact challenge. Row-locked so concurrent
   * consumers serialize; wrong codes commit a durable attempt against that
   * challenge (budget exhaustion consumes it, fail-closed). Every failure
   * mode returns the same generic rejection — no existence or state leaks.
   *
   * F01-E: expiry is evaluated against the authoritative PostgreSQL clock
   * READ AFTER the row lock is held. A challenge that expires while its
   * consumer waited on the lock is rejected, never consumed.
   */
  async consumeById(
    challengeId: string,
    purpose: ChallengePurpose,
    code: string,
  ): Promise<ConsumedChallenge> {
    const consumed = await this.prisma.$transaction(async (tx) => {
      // Row lock first; the authoritative clock is read only after the lock
      // is held, so expiry-at-lock is decided with PostgreSQL's own time.
      const rows = await tx.$queryRaw<auth_challenges[]>`
        SELECT * FROM auth_challenges WHERE id=${challengeId}::uuid FOR UPDATE`;
      const clockRows = await tx.$queryRaw<{ db_now: Date }[]>`
        SELECT clock_timestamp() AS db_now`;
      const challenge = rows[0];
      const now = clockRows[0]?.db_now ?? new Date();
      if (
        !challenge ||
        challenge.purpose !== purpose ||
        challenge.consumed_at !== null ||
        challenge.expires_at <= now ||
        challenge.attempts_used >= challenge.attempts_limit
      ) {
        return null;
      }
      if (!hashesEqual(challenge.verifier_hash, sha256(code))) {
        const used = challenge.attempts_used + 1;
        await tx.auth_challenges.update({
          where: { id: challenge.id },
          data: { attempts_used: used, ...(used >= challenge.attempts_limit ? { consumed_at: now } : {}) },
        });
        // Return normally so the rejection counter commits. Throw only afterwards.
        return null;
      }
      await tx.auth_challenges.update({ where: { id: challenge.id }, data: { consumed_at: now } });
      return {
        challengeId: challenge.id,
        userId: challenge.user_id,
        emailNormalized: challenge.email_normalized,
      };
    });
    if (!consumed) throw AppException.authRequired('Invalid or expired verification code');
    return consumed;
  }
}
