import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { MAILER } from './mailer/mailer.tokens';
import type { Mailer } from './mailer/mailer.interface';
import type { Tx } from '../common/idempotency/idempotency.service';

export interface EnqueueInput {
  templateCode:
    | 'ACTIVATION'
    | 'EMAIL_VERIFY'
    | 'PASSWORD_RESET'
    | 'REGISTRATION_CONFIRMED';
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
      const intents = await tx.notification_intents.findMany({
        where: {
          status: { in: ['PENDING', 'RETRY_PENDING'] },
          available_at: { lte: now },
          OR: [{ lease_until: null }, { lease_until: { lte: now } }],
        },
        orderBy: { available_at: 'asc' },
        take: 20,
      });
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
  ): { subject: string; text: string } {
    const code = typeof payload['code'] === 'string' ? payload['code'] : '';
    const candidateCode = typeof payload['candidateCode'] === 'string' ? payload['candidateCode'] : '';
    switch (templateCode) {
      case 'ACTIVATION':
        return {
          subject: 'IS-NextGen: Kích hoạt tài khoản',
          text: `Ma kich hoat tai khoan cua ban la: ${code}. Ma co hieu luc 15 phut.`,
        };
      case 'EMAIL_VERIFY':
        return {
          subject: 'IS-NextGen: Xac thuc email',
          text: `Ma xac thuc email cua ban la: ${code}. Ma co hieu luc 15 phut.`,
        };
      case 'PASSWORD_RESET':
        return {
          subject: 'IS-NextGen: Dat lai mat khau',
          text: `Ma dat lai mat khau cua ban la: ${code}. Ma co hieu luc 15 phut.`,
        };
      case 'REGISTRATION_CONFIRMED':
        return {
          subject: 'IS-NextGen: Xac nhan dang ky thanh cong',
          text: `Ban da dang ky thanh cong. Ma dinh danh cua ban la: ${candidateCode}.`,
        };
      default:
        return { subject: 'IS-NextGen', text: '' };
    }
  }
}
