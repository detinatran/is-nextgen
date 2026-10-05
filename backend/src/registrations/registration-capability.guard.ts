import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import { AppException } from '../common/errors/app-error';
import { PrismaService } from '../database/prisma.service';
import type { AuthenticatedRequest } from '../common/http/request-context';

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
 * grants (registration_access_grants). A registrationId, email or candidate
 * code alone never authorizes access.
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
    const grant = await this.prisma.registration_access_grants.findUnique({
      where: { token_hash: sha256(token) },
    });
    if (!grant || grant.revoked_at || grant.expires_at <= new Date()) {
      throw AppException.authRequired('Registration capability token is invalid or expired');
    }
    if (requiredScope && grant.scope !== requiredScope) {
      throw AppException.forbidden('Registration capability token lacks the required scope', {
        requiredScope,
      });
    }
    const registrationId = request.params?.['registrationId'];
    if (registrationId && registrationId !== grant.registration_id) {
      throw AppException.forbidden('Registration capability token does not cover this registration');
    }
    request.registrationAuth = {
      grantId: grant.id,
      registrationId: grant.registration_id,
      scopes: [grant.scope],
    };
    return true;
  }
}
