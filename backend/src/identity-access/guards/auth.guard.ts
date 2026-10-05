import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AppException } from '../../common/errors/app-error';
import { PrismaService } from '../../database/prisma.service';
import { SESSION_COOKIE } from '../../common/http/request-context';
import type { AuthContext, AuthenticatedRequest } from '../../common/http/request-context';
import { SessionService } from '../session.service';

/**
 * Cookie-authenticated guard backed by auth_sessions (server-side truth).
 * Attaches AuthContext to the request; never trusts frontend role state.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[SESSION_COOKIE] as string | undefined;
    const resolved = await this.sessions.resolve(token);
    if (!resolved) throw AppException.authRequired('Authentication required');

    const roleRows = await this.prisma.user_roles.findMany({ where: { user_id: resolved.userId } });
    const roleIds = roleRows.map((r) => r.role_id);
    const roleCodes = roleIds.length
      ? await this.prisma.roles.findMany({ where: { id: { in: roleIds } }, select: { code: true } })
      : [];
    const auth: AuthContext = {
      userId: resolved.userId,
      sessionId: resolved.sessionId,
      email: resolved.email,
      roles: roleCodes.map((r) => r.code),
    };
    request.auth = auth;
    return true;
  }
}
