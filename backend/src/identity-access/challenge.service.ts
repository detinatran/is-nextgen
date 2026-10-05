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

/**
 * Email OTP challenges (activation, verification, reset).
 * Only verifier hashes are stored; raw codes live exclusively in the
 * notification pipeline and are never logged or returned by any API.
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
   * Validates and consumes a code. Wrong codes count against the newest open
   * challenge; exhausting the attempt budget consumes it (fail-closed).
   */
  async consume(
    purpose: ChallengePurpose,
    code: string,
  ): Promise<{ userId: string | null; emailNormalized: string }> {
    const now = new Date();
    const consumed = await this.prisma.$transaction(async (tx) => {
      const open = await tx.$queryRaw<auth_challenges[]>`
        SELECT * FROM auth_challenges WHERE purpose=${purpose}
        AND consumed_at IS NULL AND expires_at>clock_timestamp()
        ORDER BY created_at DESC LIMIT 5 FOR UPDATE`;
      const hash = sha256(code);
      const match = open.find((c) => hashesEqual(c.verifier_hash, hash));
      if (!match) {
        const newest = open[0];
        if (newest) {
          const used = newest.attempts_used + 1;
          await tx.auth_challenges.update({
            where: { id: newest.id },
            data: { attempts_used: used, ...(used >= newest.attempts_limit ? { consumed_at: now } : {}) },
          });
        }
        // Return normally so the rejection counter commits. Throw only afterwards.
        return null;
      }
      await tx.auth_challenges.update({ where: { id: match.id }, data: { consumed_at: now } });
      return { userId: match.user_id, emailNormalized: match.email_normalized };
    });
    if (!consumed) throw AppException.authRequired('Invalid or expired verification code');
    return consumed;
  }
}
