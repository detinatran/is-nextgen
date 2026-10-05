import { Injectable, Logger } from '@nestjs/common';
import type { Mailer, MailMessage } from './mailer.interface';

/**
 * Capture mailer for environments without SMTP (local dev).
 * Deliberately logs metadata only — message bodies carry OTPs and must never
 * reach logs. Real inspection happens through MailPit in Docker or the
 * notification_intents table.
 */
@Injectable()
export class ConsoleCaptureMailer implements Mailer {
  private readonly logger = new Logger(ConsoleCaptureMailer.name);

  async send(message: MailMessage): Promise<void> {
    this.logger.log(`captured mail to=${message.to} subject="${message.subject}" (body withheld)`);
  }
}
