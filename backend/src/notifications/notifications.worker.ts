import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import type { AppConfig } from '../config/configuration';

@Injectable()
export class NotificationsWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsWorker.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly notifications: NotificationsService,
    config: ConfigService<AppConfig>,
  ) {
    if (process.env['WORKERS_DISABLED'] !== '1') {
      const interval = config.get('notificationPollIntervalMs', 2000);
      this.timer = setInterval(() => {
        void this.sweep();
      }, interval);
      this.timer.unref?.();
    }
  }

  onModuleInit(): void {
    this.logger.log('notifications worker started');
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async sweep(): Promise<void> {
    try {
      await this.notifications.dispatchPending();
    } catch (e) {
      this.logger.warn(`notifications sweep error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}
