import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-error';
import { CSRF_COOKIE, CSRF_HEADER, SESSION_COOKIE, type AuthenticatedRequest } from '../../common/http/request-context';

/**
 * Double-submit CSRF defense for cookie-authenticated state-changing requests.
 * The session cookie is HttpOnly; a separate readable CSRF cookie must match
 * the x-csrf-token header. Only applies to mutations.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;
    const cookieToken = request.cookies?.[CSRF_COOKIE] as string | undefined;
    const headerToken = request.header(CSRF_HEADER);
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw AppException.forbidden('Missing or invalid CSRF token', { header: CSRF_HEADER });
    }
    return true;
  }
}

/** A cookie-free logout is a no-op; a presented session requires CSRF proof. */
@Injectable()
export class LogoutCsrfGuard extends CsrfGuard {
  override canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return !request.cookies?.[SESSION_COOKIE] || super.canActivate(context);
  }
}
