import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma, notification_intents } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { MAILER } from './mailer/mailer.tokens';
import type { Mailer } from './mailer/mailer.interface';
import type { Tx } from '../common/idempotency/idempotency.service';
import { registrationConfirmed } from './templates/registration-confirmed';

export interface EnqueueInput {
  templateCode:
    | 'ACTIVATION'
    | 'EMAIL_VERIFY'
    | 'PASSWORD_RESET'
    | 'REGISTRATION_CONFIRMED'
    | 'EXAM_INVITATION';
  destinationEmail: string;
  payload: Record<string, unknown>;
  deduplicationKey: string;
  userId?: string | null;
  candidateId?: string | null;
}

const MAX_ATTEMPTS = 8;
const RETRY_DELAY_MS = 30_000;

/**
 * Durable notification intents: business transactions only enqueue here;
 * delivery happens later and must never roll back the owning transaction.
 * Email delivery failure never affects business state.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAILER) private readonly mailer: Mailer,
  ) {}

  async enqueue(tx: Tx, input: EnqueueInput): Promise<string> {
    const intent = await tx.notification_intents.create({
      data: {
        template_code: input.templateCode,
        destination_email: input.destinationEmail,
        payload: input.payload as Prisma.InputJsonValue,
        deduplication_key: input.deduplicationKey,
        user_id: input.userId ?? null,
        candidate_id: input.candidateId ?? null,
      },
      select: { id: true },
    });
    return intent.id;
  }

  /** One dispatch sweep. Lease-protected so multiple workers never double-send. */
  async dispatchPending(now = new Date()): Promise<number> {
    const leased = await this.prisma.$transaction(async (tx) => {
      const intents = await tx.$queryRaw<notification_intents[]>`
        SELECT * FROM notification_intents WHERE available_at<=${now}::timestamptz
        AND ((status IN ('PENDING','RETRY_PENDING') AND (lease_until IS NULL OR lease_until<=${now}::timestamptz))
          OR (status='SENDING' AND lease_until<=${now}::timestamptz))
        ORDER BY available_at LIMIT 20 FOR UPDATE SKIP LOCKED`;
      if (intents.length > 0) {
        await tx.notification_intents.updateMany({
          where: { id: { in: intents.map((i) => i.id) } },
          data: { status: 'SENDING', lease_until: new Date(now.getTime() + 60_000) },
        });
      }
      return intents;
    });

    for (const intent of leased) {
      try {
        await this.mailer.send({
          to: intent.destination_email,
          ...this.render(intent.template_code, intent.payload as Record<string, unknown>),
        });
        await this.prisma.notification_intents.update({
          where: { id: intent.id },
          data: { status: 'SENT', sent_at: new Date(), attempts_used: { increment: 1 } },
        });
      } catch {
        const attempts = intent.attempts_used + 1;
        const failed = attempts >= MAX_ATTEMPTS;
        await this.prisma.notification_intents.update({
          where: { id: intent.id },
          data: {
            status: failed ? 'FAILED' : 'RETRY_PENDING',
            attempts_used: attempts,
            available_at: new Date(Date.now() + RETRY_DELAY_MS * attempts),
            lease_until: null,
          },
        });
        this.logger.warn(
          `notification dispatch failed intentId=${intent.id} template=${intent.template_code} attempt=${attempts} failed=${failed}`,
        );
      }
    }
    return leased.length;
  }

  /** Bodies carry OTPs; they are only ever rendered into the mail pipeline, never logs. */
  private render(
    templateCode: string,
    payload: Record<string, unknown>,
  ): { subject: string; text: string; html?: string } {
    const code = typeof payload['code'] === 'string' ? payload['code'] : '';
    const candidateCode = typeof payload['candidateCode'] === 'string' ? payload['candidateCode'] : '';
    const site = process.env.PUBLIC_SITE_URL ?? 'https://nextgen.vnuis.edu.vn';
    const text = (key: string) => (typeof payload[key] === 'string' ? (payload[key] as string) : '');
    const sign = '\n\nBan Tổ chức NextGen Manager Challenge 2026\nnextgen@vnuis.edu.vn · Hotline 0962 132 535';
    switch (templateCode) {
      case 'ACTIVATION':
        return {
          subject: 'NextGen Manager: Mã kích hoạt tài khoản thi',
          text: `Mã kích hoạt tài khoản của bạn là: ${code}\nMã có hiệu lực trong 15 phút. Nhập mã tại ${site}/thi/kich-hoat/ để đặt mật khẩu.${sign}`,
        };
      case 'EMAIL_VERIFY':
        return {
          subject: 'NextGen Manager: Mã xác thực',
          text: `Mã xác thực của bạn là: ${code}\nMã có hiệu lực trong 15 phút. Nếu bạn không yêu cầu mã này, hãy bỏ qua email.${sign}`,
        };
      case 'PASSWORD_RESET':
        return {
          subject: 'NextGen Manager: Đặt lại mật khẩu',
          text: `Mã đặt lại mật khẩu của bạn là: ${code}\nMã có hiệu lực trong 15 phút. Nhập mã tại ${site}/thi/quen-mat-khau/.${sign}`,
        };
      case 'REGISTRATION_CONFIRMED':
        return registrationConfirmed({ fullName: text('fullName'), candidateCode, site });
      case 'EXAM_INVITATION':
        return {
          subject: 'NextGen Manager: Tài khoản và lịch thi Vòng 1',
          text:
            `Chào ${text('fullName') || 'bạn'},\n\n` +
            `Bạn đã được xếp lịch thi Vòng 1 (trắc nghiệm trực tuyến, ${text('durationMinutes') || '60'} phút).\n` +
            `Mã thí sinh: ${candidateCode}\n` +
            `Ca thi: ${text('schedule')}\n\n` +
            `Bước 1: Kích hoạt tài khoản và đặt mật khẩu tại ${site}/thi/kich-hoat/ (dùng email này để nhận mã).\n` +
            `Bước 2: Đến giờ thi, đăng nhập tại ${site}/thi/ và bấm "Vào thi".\n\n` +
            `Lưu ý: dùng máy tính có kết nối ổn định; không chuyển tab trong khi làm bài; hết giờ hệ thống tự nộp bài.${sign}`,
        };
      default:
        return { subject: 'NextGen Manager', text: '' };
    }
  }
}
