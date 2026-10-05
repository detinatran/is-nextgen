import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsWorker } from './notifications.worker';
import { ConsoleCaptureMailer } from './mailer/console-capture.mailer';
import { SmtpMailer } from './mailer/smtp.mailer';
import type { Mailer } from './mailer/mailer.interface';
import { MAILER } from './mailer/mailer.tokens';
import type { AppConfig } from '../config/configuration';

@Module({
  providers: [
    {
      provide: MAILER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>): Mailer => {
        const smtpUrl = config.get('smtpUrl', '');
        return smtpUrl ? new SmtpMailer(smtpUrl) : new ConsoleCaptureMailer();
      },
    },
    NotificationsService,
    NotificationsWorker,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
