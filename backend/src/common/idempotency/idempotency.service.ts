import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { AppException } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';

export type Tx = Prisma.TransactionClient;

/** Deterministic JSON stringification so the same payload always hashes the same. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(',')}}`;
}

export interface ReceiptClaim {
  scope_key: string;
  idempotency_key: string;
  command_code: 'REGISTRATION_SUBMIT' | 'ATTEMPT_START' | 'ATTEMPT_SUBMIT';
  actor_user_id?: string | null;
  resource_type: string;
  resource_id: string;
}

export interface ReceiptOutcome {
  /** True when a receipt already exists: the caller must reconstruct the committed outcome from domain state. */
  replayed: boolean;
  receiptCreatedAt: Date | null;
}

/**
 * Critical-command idempotency backed by the frozen command_receipts table.
 * command_receipts is immutable evidence (DB trigger), so the receipt is
 * inserted exactly once and never updated. The first-write claim serializes
 * concurrent duplicates on the (scope_key, idempotency_key) unique key;
 * same key + different payload hash is a conflict. On replay the caller
 * rechecks current access and rebuilds the committed outcome from domain
 * tables — the authoritative source per the frozen design.
 */
@Injectable()
export class IdempotencyService {
  hashRequest(payload: unknown): string {
    return createHash('sha256').update(stableStringify(payload)).digest('hex');
  }

  async claim(tx: Tx, c: ReceiptClaim, requestHash: string): Promise<ReceiptOutcome> {
    // A failed statement aborts a PG transaction; isolate the probe in a
    // SAVEPOINT so the transaction stays usable after a duplicate conflict.
    const savepoint = `receipt_claim_${Math.random().toString(36).slice(2, 10)}`;
    await tx.$executeRawUnsafe(`SAVEPOINT ${savepoint}`);
    try {
      await tx.command_receipts.create({
        data: {
          scope_key: c.scope_key,
          idempotency_key: c.idempotency_key,
          command_code: c.command_code,
          request_hash: requestHash,
          actor_user_id: c.actor_user_id ?? null,
          resource_type: c.resource_type,
          resource_id: c.resource_id,
          result_metadata: {},
        },
      });
      await tx.$executeRawUnsafe(`RELEASE SAVEPOINT ${savepoint}`);
      return { replayed: false, receiptCreatedAt: null };
    } catch (e) {
      await tx.$executeRawUnsafe(`ROLLBACK TO SAVEPOINT ${savepoint}`);
      if (!this.isUniqueViolation(e)) throw e;
      const existing = await tx.command_receipts.findUnique({
        where: {
          scope_key_idempotency_key: {
            scope_key: c.scope_key,
            idempotency_key: c.idempotency_key,
          },
        },
      });
      if (!existing) {
        throw AppException.conflict(
          ErrorCodes.IDEMPOTENCY_CONFLICT,
          'Idempotency key is being processed concurrently',
        );
      }
      if (existing.request_hash !== requestHash) {
        throw AppException.conflict(
          ErrorCodes.IDEMPOTENCY_CONFLICT,
          'Idempotency key reused with a different request payload',
        );
      }
      return { replayed: true, receiptCreatedAt: existing.created_at };
    }
  }

  private isUniqueViolation(e: unknown): boolean {
    return (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code?: string }).code === 'P2002'
    );
  }
}
