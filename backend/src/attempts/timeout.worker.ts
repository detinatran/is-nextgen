import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AttemptFinalizationService } from './finalization.service';
import type { AppConfig } from '../config/configuration';

/**
 * 60-minute expiry must finalize automatically. Periodic sweep + opportunistic
 * reconciliation on reads share the same idempotent finalizer. Worker restarts
 * recover pending overdue attempts from PostgreSQL — no in-memory state.
 */
@Injectable()
export class TimeoutWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TimeoutWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly finalization: AttemptFinalizationService,
    config: ConfigService<AppConfig>,
  ) {
    if (process.env['WORKERS_DISABLED'] !== '1') {
      const interval = config.get('timeoutSweepIntervalMs', 10_000);
      this.timer = setInterval(() => {
        void this.sweep();
      }, interval);
      this.timer.unref?.();
    }
  }

  onModuleInit(): void {
    this.logger.log('timeout worker started');
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async sweep(): Promise<void> {
    try {
      await this.finalization.sweepOverdue();
    } catch (e) {
      this.logger.warn(`timeout sweep error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
