import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { AppConfig } from '../config/configuration';
import type { AuthenticatedRequest } from '../common/http/request-context';

/**
 * Dev/test-only provisioning endpoints. Hard-disabled in production:
 * they return 404 regardless of headers when FIXTURES_ENABLED is off.
 */
@Injectable()
export class FixturesGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppConfig>) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.config.get('fixturesEnabled', false)) return false; // Nest converts false to 403; controller re-checks for 404.
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const provided = request.header('x-fixtures-token') ?? '';
    const expected = this.config.getOrThrow('fixturesToken');
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
