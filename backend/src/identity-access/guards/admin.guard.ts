import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-error';
import type { AuthContext, AuthenticatedRequest } from '../../common/http/request-context';

/**
 * F05: Admin domain authority requires ALL of:
 * valid current session + ACTIVE user (AuthGuard) + ADMIN role + a
 * current-session MFA proof (auth_sessions.mfa_verified_at written at the
 * moment the MFA challenge was consumed). The legacy mfa_enabled user flag
 * is enrollment metadata, never proof; old Admin sessions with
 * mfa_verified_at = null are denied.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const auth = request.auth as AuthContext | undefined;
    if (!auth) throw AppException.authRequired('Authentication required');
    if (!auth.roles.includes('ADMIN')) {
      throw AppException.forbidden('ADMIN role is required');
    }
    if (!auth.mfaVerifiedAt) {
      throw AppException.forbidden('Admin MFA verification is required for this session');
    }
    return true;
  }
}
