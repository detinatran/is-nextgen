import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import type { Mailer, MailMessage } from './mailer.interface';

@Injectable()
export class SmtpMailer implements Mailer {
  private readonly logger = new Logger(SmtpMailer.name);
  private readonly transport;

  constructor(smtpUrl: string) {
    this.transport = nodemailer.createTransport(smtpUrl);
  }

  async send(message: MailMessage): Promise<void> {
    await this.transport.sendMail({
      from: process.env.MAIL_FROM ?? 'NextGen Manager <nextgen@vnuis.edu.vn>',
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    });
    this.logger.log('smtp notification sent');
  }
}
