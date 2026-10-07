import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScoringService } from './scoring.service';
import type { AppConfig } from '../config/configuration';

@Injectable()
export class ScoringWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScoringWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly scoring: ScoringService,
    config: ConfigService<AppConfig>,
  ) {
    if (process.env['WORKERS_DISABLED'] !== '1') {
      const interval = config.get('scoringPollIntervalMs', 2_000);
      this.timer = setInterval(() => {
        void this.sweep();
      }, interval);
      this.timer.unref?.();
    }
  }

  onModuleInit(): void {
    this.logger.log('scoring worker started');
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async sweep(): Promise<void> {
    try {
      await this.scoring.processPendingScoring();
    } catch (e) {
      this.logger.warn(`scoring sweep error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
