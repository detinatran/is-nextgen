import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import argon2 from 'argon2';
import type { AppConfig } from '../config/configuration';
import { AppException } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { ChallengeService } from './challenge.service';
import { SessionService } from './session.service';

export interface LoginResult {
  kind: 'session';
  userId: string;
  email: string;
  roles: string[];
  sessionToken: string;
  csrfToken: string;
  expiresAt: Date;
}

export interface MfaRequiredResult {
  kind: 'mfa_required';
  userId: string;
  email: string;
  challengeId: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Candidate authentication (FR-17) and logout-without-losing-answers (FR-18).
 * Argon2id password hashing; opaque server-side sessions; hashed OTP challenges.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly challenges: ChallengeService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<AppConfig>,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  private async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  private async roleCodesFor(userId: string): Promise<string[]> {
    const roleRows = await this.prisma.user_roles.findMany({ where: { user_id: userId } });
    const roleIds = roleRows.map((r) => r.role_id);
    if (roleIds.length === 0) return [];
    const roles = await this.prisma.roles.findMany({
      where: { id: { in: roleIds } },
      select: { code: true },
    });
    return roles.map((r) => r.code);
  }

  async activate(challengeId: string, code: string, password: string, correlationId: string): Promise<{ userId: string; email: string }> {
    const consumed = await this.challenges.consumeById(challengeId, 'ACTIVATION', code);
    const user = await this.prisma.$transaction(async (tx) => {
      // Identity comes from the exact consumed challenge only.
      const found = consumed.userId
        ? await tx.users.findUnique({ where: { id: consumed.userId } })
        : null;
      if (!found) throw AppException.notFound('Account not found');
      if (found.status !== 'PROVISIONED') {
        throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Account is not awaiting activation');
      }
      const updated = await tx.users.update({
        where: { id: found.id },
        data: {
          password_hash: await this.hashPassword(password),
          status: 'ACTIVE',
          email_verified_at: found.email_verified_at ?? new Date(),
        },
      });
      await this.audit.record(tx, {
        action: 'auth.activation',
        target_type: 'user',
        target_id: found.id,
        correlation_id: correlationId,
      });
      return updated;
    });
    this.logger.log(`auth activation success correlationId=${correlationId}`);
    return { userId: user.id, email: user.email };
  }

  async login(identifier: string, password: string, correlationId: string): Promise<LoginResult | MfaRequiredResult> {
    const fail = (category: string): AppException => {
      this.logger.log(`auth login failure category=${category} correlationId=${correlationId}`);
      return AppException.authRequired('Invalid credentials');
    };

    const id = identifier.trim();
    const user = id.includes('@')
      ? await this.prisma.users.findUnique({ where: { email_normalized: normalizeEmail(id) } })
      : await this.prisma.candidates
          .findUnique({ where: { candidate_code: id }, select: { user_id: true } })
          .then((c) => (c?.user_id ? this.prisma.users.findUnique({ where: { id: c.user_id } }) : null));

    if (!user || !user.password_hash) throw fail(user ? 'NOT_ACTIVATED' : 'INVALID_CREDENTIALS');
    if (!(await this.verifyPassword(user.password_hash, password))) throw fail('INVALID_CREDENTIALS');
    if (user.status === 'PROVISIONED') throw fail('NOT_ACTIVATED');
    if (user.status === 'DISABLED') throw fail('DISABLED');

    const roles = await this.roleCodesFor(user.id);

    // F05: ADMIN authority requires a completed email-OTP MFA challenge.
    // No session (not even a limited one) is issued before MFA succeeds.
    if (roles.includes('ADMIN')) {
      const { challengeId } = await this.prisma.$transaction((tx) =>
        this.challenges.issue(tx, 'MFA', normalizeEmail(user.email), user.id),
      );
      await this.audit.record(this.prisma, {
        actor_user_id: user.id,
        action: 'auth.login',
        target_type: 'user',
        target_id: user.id,
        correlation_id: correlationId,
        metadata: { outcome: 'MFA_REQUIRED' },
      });
      this.logger.log(`auth login mfa_required correlationId=${correlationId}`);
      return { kind: 'mfa_required', userId: user.id, email: user.email, challengeId };
    }

    const ttl = this.config.get('sessionTtlHours', 24);
    const { token, csrfToken, expiresAt } = await this.sessions.issue(user.id, ttl);

    await this.audit.record(this.prisma, {
      actor_user_id: user.id,
      action: 'auth.login',
      target_type: 'user',
      target_id: user.id,
      correlation_id: correlationId,
      metadata: { outcome: 'success' },
    });
    this.logger.log(`auth login success correlationId=${correlationId}`);
    return { kind: 'session', userId: user.id, email: user.email, roles, sessionToken: token, csrfToken, expiresAt };
  }

  /**
   * F05 step 2: the exact MFA challenge + OTP promote to a full Admin
   * session whose mfa_verified_at is committed at creation. Mail delivery
   * failures can never promote authority — the OTP lives in the durable
   * notification intent and the session is created only on correct proof.
   */
  async verifyAdminMfa(
    challengeId: string,
    code: string,
    correlationId: string,
  ): Promise<LoginResult> {
    const consumed = await this.challenges.consumeById(challengeId, 'MFA', code);
    if (!consumed.userId) {
      // MFA challenges are always user-bound; unbound proof never promotes.
      throw AppException.authRequired('Invalid or expired verification code');
    }
    const user = await this.prisma.users.findUnique({ where: { id: consumed.userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw AppException.authRequired('Invalid or expired verification code');
    }
    // Defense in depth: the MFA proof must belong to an actual ADMIN.
    const roles = await this.roleCodesFor(user.id);
    if (!roles.includes('ADMIN')) {
      throw AppException.forbidden('Account does not hold the ADMIN role');
    }
    const ttl = this.config.get('sessionTtlHours', 24);
    const mfaVerifiedAt = new Date();
    const { token, csrfToken, expiresAt } = await this.sessions.issue(user.id, ttl, { mfaVerifiedAt });
    await this.audit.record(this.prisma, {
      actor_user_id: user.id,
      action: 'auth.admin_mfa_verified',
      target_type: 'user',
      target_id: user.id,
      correlation_id: correlationId,
      metadata: { challengeId },
    });
    this.logger.log(`auth admin mfa verified correlationId=${correlationId}`);
    return { kind: 'session', userId: user.id, email: user.email, roles, sessionToken: token, csrfToken, expiresAt };
  }

  /**
   * FR-18: revokes the session and releases writer authority, but never
   * touches the Attempt, its Answers, its deadline or the attempt quota.
   * Idempotent: unknown/invalid cookies are a no-op.
   */
  async logout(sessionToken: string | undefined, correlationId: string): Promise<void> {
    if (!sessionToken) return;
    const resolved = await this.sessions.resolve(sessionToken);
    if (!resolved) return;
    await this.prisma.$transaction(async (tx) => {
      // Serialize release with takeover/save using the same attempt gate.
      await tx.$queryRaw`
        SELECT a.id FROM attempts a JOIN candidates c ON c.id=a.candidate_id
        WHERE c.user_id=${resolved.userId}::uuid AND a.state='ACTIVE'
        ORDER BY a.id FOR UPDATE OF a`;
      await tx.auth_sessions.updateMany({
        where: { id: resolved.sessionId, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      // Release writer authority; active attempt remains and reconnect uses takeover.
      await tx.active_exam_sessions.deleteMany({ where: { user_id: resolved.userId, auth_session_id: resolved.sessionId } });
      await this.audit.record(tx, {
        actor_user_id: resolved.userId,
        action: 'auth.logout',
        target_type: 'auth_session',
        target_id: resolved.sessionId,
        correlation_id: correlationId,
      });
    });
    this.logger.log(`auth logout correlationId=${correlationId}`);
  }

  /**
   * Returns a challenge locator for the flow. Unknown/disabled accounts get a
   * random decoy so the response shape never reveals account existence; the
   * decoy can never verify because no matching challenge row exists.
   */
  async requestEmailVerification(email: string, correlationId: string): Promise<{ challengeId: string }> {
    this.logger.log(`auth email verification requested correlationId=${correlationId}`);
    const normalized = normalizeEmail(email);
    const user = await this.prisma.users.findUnique({ where: { email_normalized: normalized } });
    if (user && user.status !== 'DISABLED') {
      const { challengeId } = await this.prisma.$transaction((tx) =>
        this.challenges.issue(tx, 'EMAIL_VERIFY', normalized, user.id),
      );
      return { challengeId };
    }
    return { challengeId: randomUUID() };
  }

  async verifyEmail(challengeId: string, code: string): Promise<{ email: string }> {
    const consumed = await this.challenges.consumeById(challengeId, 'EMAIL_VERIFY', code);
    const user = await this.prisma.$transaction(async (tx) => {
      const found = consumed.userId
        ? await tx.users.findUnique({ where: { id: consumed.userId } })
        : null;
      if (!found) throw AppException.notFound('Account not found');
      return tx.users.update({
        where: { id: found.id },
        data: { email_verified_at: found.email_verified_at ?? new Date() },
      });
    });
    return { email: user.email };
  }

  /** Same decoy contract as email verification (no account enumeration). */
  /**
   * Thí sinh được Ban Tổ chức cấp tài khoản (PROVISIONED) tự xin mã kích hoạt mới
   * qua email. Không tiết lộ email có tồn tại hay không (luôn trả challengeId).
   */
  async requestActivation(email: string, correlationId: string): Promise<{ challengeId: string }> {
    this.logger.log(`auth activation requested correlationId=${correlationId}`);
    const normalized = normalizeEmail(email);
    const user = await this.prisma.users.findUnique({ where: { email_normalized: normalized } });
    if (user && user.status === 'PROVISIONED') {
      const { challengeId } = await this.prisma.$transaction((tx) =>
        this.challenges.issue(tx, 'ACTIVATION', normalized, user.id),
      );
      return { challengeId };
    }
    return { challengeId: randomUUID() };
  }

  async requestPasswordReset(email: string, correlationId: string): Promise<{ challengeId: string }> {
    this.logger.log(`auth password reset requested correlationId=${correlationId}`);
    const normalized = normalizeEmail(email);
    const user = await this.prisma.users.findUnique({ where: { email_normalized: normalized } });
    if (user && user.status === 'ACTIVE' && user.password_hash) {
      const { challengeId } = await this.prisma.$transaction((tx) =>
        this.challenges.issue(tx, 'PASSWORD_RESET', normalized, user.id),
      );
      return { challengeId };
    }
    return { challengeId: randomUUID() };
  }

  /** F01: reset targets exactly the challenge-bound user; no global OTP lookup. */
  async resetPassword(challengeId: string | null, code: string, newPassword: string, correlationId: string): Promise<void> {
    if (!challengeId) {
      // A code without its challenge locator can never identify an account.
      throw AppException.authRequired('Invalid or expired verification code');
    }
    const consumed = await this.challenges.consumeById(challengeId, 'PASSWORD_RESET', code);
    await this.prisma.$transaction(async (tx) => {
      const user = consumed.userId
        ? await tx.users.findUnique({ where: { id: consumed.userId } })
        : null;
      if (!user) throw AppException.notFound('Account not found');
      await tx.users.update({
        where: { id: user.id },
        data: { password_hash: await this.hashPassword(newPassword) },
      });
      await tx.auth_sessions.updateMany({
        where: { user_id: user.id, revoked_at: null },
        data: { revoked_at: new Date() },
      });
      await this.audit.record(tx, {
        actor_user_id: user.id,
        action: 'auth.password_reset',
        target_type: 'user',
        target_id: user.id,
        correlation_id: correlationId,
      });
    });
  }

  /** Fresh proof-of-possession for writer takeover; returns the reauth timestamp. */
  async reauthenticate(userId: string, sessionId: string, password: string): Promise<Date> {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user || !user.password_hash) throw AppException.authRequired('Reauthentication failed');
    if (!(await this.verifyPassword(user.password_hash, password))) {
      throw AppException.authRequired('Reauthentication failed');
    }
    return this.sessions.markReauthenticated(sessionId);
  }
}
