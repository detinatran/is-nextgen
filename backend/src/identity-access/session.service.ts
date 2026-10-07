import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export interface IssuedSessionTokens {
  token: string;
  csrfToken: string;
  expiresAt: Date;
}

export interface ResolvedSession {
  sessionId: string;
  userId: string;
  email: string;
  status: string;
  reauthenticatedAt: Date;
  mfaVerifiedAt: Date | null;
}

/**
 * Opaque server-side sessions. PostgreSQL owns session truth (auth_sessions);
 * the cookie carries only a random bearer whose hash is stored server-side.
 */
@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * F05: mfaVerifiedAt is written at creation time — a session is either
   * created with its MFA proof already committed, or it never carries one.
   * Pre-MFA Admin authority is impossible by construction.
   */
  async issue(userId: string, ttlHours: number, options?: { mfaVerifiedAt?: Date }): Promise<IssuedSessionTokens> {
    const token = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(24).toString('base64url');
    const expiresAt = new Date(Date.now() + ttlHours * 3_600_000);
    await this.prisma.auth_sessions.create({
      data: {
        user_id: userId,
        token_hash: sha256(token),
        expires_at: expiresAt,
        reauthenticated_at: new Date(), // login itself is a fresh authentication
        mfa_verified_at: options?.mfaVerifiedAt ?? null,
      },
    });
    return { token, csrfToken, expiresAt };
  }

  async resolve(token: string | undefined): Promise<ResolvedSession | null> {
    if (!token) return null;
    const session = await this.prisma.auth_sessions.findUnique({
      where: { token_hash: sha256(token) },
    });
    if (!session || session.revoked_at || session.expires_at <= new Date()) return null;
    const user = await this.prisma.users.findUniqueOrThrow({ where: { id: session.user_id } });
    if (user.status !== 'ACTIVE') return null;
    return {
      sessionId: session.id,
      userId: session.user_id,
      email: user.email,
      status: user.status,
      reauthenticatedAt: session.reauthenticated_at ?? new Date(0),
      mfaVerifiedAt: session.mfa_verified_at,
    };
  }

  async markReauthenticated(sessionId: string): Promise<Date> {
    const at = new Date();
    await this.prisma.auth_sessions.update({
      where: { id: sessionId },
      data: { reauthenticated_at: at },
    });
    return at;
  }
}
