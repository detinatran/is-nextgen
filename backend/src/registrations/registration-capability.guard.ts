import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import { AppException } from '../common/errors/app-error';
import { PrismaService } from '../database/prisma.service';
import {
  DRAFT_CAPABILITY_AUDIT_ACTION,
  DRAFT_CAPABILITY_TTL_MS,
} from './registrations.service';
import type { AuthenticatedRequest, RegistrationAuthContext } from '../common/http/request-context';

export const REGISTRATION_SCOPE_KEY = 'registration_scope';
export type RegistrationScope = 'READ_EDIT_PROFILE' | 'DRAFT_UPLOAD';

/** Declares which grant scope a route requires. */
export const RequireRegistrationScope = (scope: RegistrationScope) =>
  SetMetadata(REGISTRATION_SCOPE_KEY, scope);

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * Authorization for private registrations uses opaque scoped capability
 * tokens. A registrationId, email or candidate code alone never authorizes
 * access. Two token kinds resolve here:
 * - verified recovery grants (registration_access_grants rows, scoped
 *   READ_EDIT_PROFILE, revocable, email_verified_at = actual proof time);
 * - the F03 anonymous initial capability, bound through append-only audit
 *   evidence (DRAFT_UPLOAD only, TTL from its issue time, no verified-email
 *   columns involved).
 */
@Injectable()
export class RegistrationCapabilityGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const requiredScope = this.reflector.get<RegistrationScope | undefined>(
      REGISTRATION_SCOPE_KEY,
      context.getHandler(),
    );

    const token = request.header('x-registration-token');
    if (!token) throw AppException.authRequired('Registration capability token required');
    const tokenHash = sha256(token);

    let auth: RegistrationAuthContext | null = null;
    const grant = await this.prisma.registration_access_grants.findUnique({
      where: { token_hash: tokenHash },
    });
    if (grant) {
      if (grant.revoked_at || grant.expires_at <= new Date()) {
        throw AppException.authRequired('Registration capability token is invalid or expired');
      }
      auth = { grantId: grant.id, registrationId: grant.registration_id, scopes: [grant.scope] };
    } else {
      // F03: anonymous initial capability — append-only audit binding with a
      // TTL; there is nothing to revoke because it grants no private read/edit.
      const event = await this.prisma.audit_events.findFirst({
        where: {
          action: DRAFT_CAPABILITY_AUDIT_ACTION,
          metadata: { path: ['tokenHash'], equals: tokenHash },
        },
        orderBy: { occurred_at: 'desc' },
      });
      if (
        event?.target_id &&
        event.occurred_at.getTime() + DRAFT_CAPABILITY_TTL_MS > Date.now()
      ) {
        auth = { grantId: event.id, registrationId: event.target_id, scopes: ['DRAFT_UPLOAD'] };
      }
    }
    if (!auth) {
      throw AppException.authRequired('Registration capability token is invalid or expired');
    }
    if (requiredScope && !auth.scopes.includes(requiredScope)) {
      throw AppException.forbidden('Registration capability token lacks the required scope', {
        requiredScope,
      });
    }
    const registrationId = request.params?.['registrationId'];
    if (registrationId && registrationId !== auth.registrationId) {
      throw AppException.forbidden('Registration capability token does not cover this registration');
    }
    request.registrationAuth = auth;
    return true;
  }
}
