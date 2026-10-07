import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

/**
 * GET /health/live — process is up.
 * GET /health/ready — required dependency (PostgreSQL) is reachable.
 * Redis is an optional accelerator and is never claimed as data state here.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('live')
  live(): { status: string } {
    return { status: 'ok' };
  }

  @Get('ready')
  async ready(): Promise<{ status: string; checks: Record<string, string> }> {
    const postgresOk = await this.prisma.isHealthy();
    return {
      status: postgresOk ? 'ok' : 'degraded',
      checks: {
        postgres: postgresOk ? 'up' : 'down',
        redis: 'not_used', // optional accelerator, not a dependency of candidate flow
      },
    };
  }
}
