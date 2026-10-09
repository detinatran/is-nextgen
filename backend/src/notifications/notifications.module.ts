import { Logger, Module } from '@nestjs/common';
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
        const env = config.get('env', 'development');
        const smtpUrl = config.get('smtpUrl', '');
        // MAIL_CAPTURE=1: tạm chạy production khi chưa có SMTP, email chỉ ghi vào log (không gửi thật)
        if (env === 'production' && !smtpUrl) {
          if (process.env.MAIL_CAPTURE !== '1') throw new Error('SMTP_URL is required in production');
          new Logger('Mailer').warn('SMTP_URL not set: MAIL_CAPTURE=1, emails are only logged, not delivered');
        }
        return smtpUrl ? new SmtpMailer(smtpUrl) : new ConsoleCaptureMailer();
      },
    },
    NotificationsService,
    NotificationsWorker,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
