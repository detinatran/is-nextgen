import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import type { Tx } from '../idempotency/idempotency.service';

export interface AuditInput {
  actor_user_id?: string | null;
  action: string;
  target_type: string;
  target_id?: string | null;
  reason?: string | null;
  correlation_id: string;
  metadata?: Record<string, unknown>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Append-only audit trail writer (audit_events is DB-immutable).
 * Never record secrets, OTPs, session tokens, capability tokens or answer keys.
 * correlation_id/target_id are UUID columns; non-UUID labels are hashed into
 * deterministic UUIDs so worker sweeps keep a stable trace identity.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  async record(tx: Tx, input: AuditInput): Promise<void> {
    const correlationId = UUID_RE.test(input.correlation_id)
      ? input.correlation_id
      : this.uuidFromLabel(input.correlation_id);
    await tx.audit_events.create({
      data: {
        actor_user_id: input.actor_user_id ?? null,
        action: input.action,
        target_type: input.target_type,
        target_id: input.target_id ?? null,
        reason: input.reason ?? null,
        correlation_id: correlationId,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
    this.logger.log(`audit action=${input.action} target=${input.target_type}`);
  }

  /** Deterministic UUIDv5-style derivation from an arbitrary label. */
  private uuidFromLabel(label: string): string {
    const hash = createHash('sha256').update(label).digest('hex');
    return [hash.slice(0, 8), hash.slice(8, 12), hash.slice(12, 16), hash.slice(16, 20), hash.slice(20, 32)].join('-');
  }
}
