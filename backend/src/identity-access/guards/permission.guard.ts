import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppException } from '../../common/errors/app-error';
import type { AuthenticatedRequest } from '../../common/http/request-context';
import { PrismaService } from '../../database/prisma.service';

export const PERMISSION_KEY = 'required_permission';

/** Declares the permission code (permissions.code) a route requires, e.g. 'candidate.read'. */
export const RequirePermission = (code: string) => SetMetadata(PERMISSION_KEY, code);

/**
 * F05 permission layer: resolves the caller's permissions through
 * user roles → role_permissions → permissions (seeded in the baseline
 * migration) and denies routes whose declared permission is missing.
 * Must run after AuthGuard (needs req.auth) and, for Admin routes, AdminGuard.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const auth = request.auth;
    if (!auth) throw AppException.authRequired('Authentication required');
    const rows = await this.prisma.$queryRaw<{ ok: number }[]>`
      SELECT 1 AS ok
      FROM user_roles ur
      JOIN role_permissions rp ON rp.role_id = ur.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = ${auth.userId}::uuid AND p.code = ${required}
      LIMIT 1`;
    if (rows.length === 0) throw AppException.forbidden(`Permission ${required} is required`);
    return true;
  }
}
