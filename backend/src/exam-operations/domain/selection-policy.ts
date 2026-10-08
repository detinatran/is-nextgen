import { AppException } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import type { Tx } from '../../common/idempotency/idempotency.service';

export interface SelectionItem {
  poolId: string;
  count: number;
  points: number;
}

/**
 * blueprint_versions.selection_policy is an owned versioned VO. The exact
 * shape used by this implementation (Round 1, single choice):
 * { "items": [ { "poolId": "<uuid>", "count": 30, "points": 1 } ] }
 * Feasibility is validated inside the Start transaction; DB relations
 * (question pools/options) remain authoritative.
 */
export function parseSelectionPolicy(policy: unknown): SelectionItem[] {
  if (typeof policy !== 'object' || policy === null) {
    throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Blueprint selection policy is malformed');
  }
  const items = (policy as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) {
    throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Blueprint selection policy is malformed');
  }
  return items.map((raw) => {
    const item = raw as { poolId?: unknown; count?: unknown; points?: unknown };
    if (
      typeof item.poolId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.poolId) ||
      typeof item.count !== 'number' ||
      !Number.isInteger(item.count) ||
      item.count <= 0 ||
      typeof item.points !== 'number' ||
      !Number.isFinite(item.points) ||
      item.points < 0
    ) {
      throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Blueprint selection policy is malformed');
    }
    return { poolId: item.poolId, count: item.count, points: item.points };
  });
}

/** Picks N frozen versions from a pool. Pool relations stay authoritative. */
export async function selectFrozenVersions(
  tx: Tx,
  poolId: string,
  count: number,
): Promise<string[]> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT qv.id
    FROM question_pool_memberships m
    JOIN question_versions qv ON qv.id = m.question_version_id
    JOIN questions q ON q.id=qv.question_id
    WHERE m.pool_id = ${poolId}::uuid AND qv.state = 'FROZEN' AND q.archived_at IS NULL
      AND qv.version=(SELECT max(latest.version) FROM question_versions latest WHERE latest.question_id=q.id)
    ORDER BY random()
    LIMIT ${count}`;
  if (rows.length < count) {
    throw AppException.conflict(
      ErrorCodes.STATE_CONFLICT,
      'Blueprint selection is not feasible for the frozen question pool',
    );
  }
  return rows.map((r) => r.id);
}
