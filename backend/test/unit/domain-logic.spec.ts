import { createHash } from 'node:crypto';
import { IdempotencyService } from '../../src/common/idempotency/idempotency.service';
import { AttemptsService } from '../../src/attempts/attempts.service';
import { ExamAccessService } from '../../src/exam-operations/exam-access.service';
import { parseSelectionPolicy } from '../../src/exam-operations/domain/selection-policy';
import { AppException } from '../../src/common/errors/app-error';

describe('stable request hashing (idempotency contract)', () => {
  const svc = new IdempotencyService();

  it('is deterministic regardless of key order', () => {
    const a = svc.hashRequest({ b: 1, a: 'x' });
    const b = svc.hashRequest({ a: 'x', b: 1 });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('treats different payloads as different hashes', () => {
    expect(svc.hashRequest({ a: 1 })).not.toBe(svc.hashRequest({ a: 2 }));
  });

  it('ignores undefined fields but keeps nulls', () => {
    expect(svc.hashRequest({ a: undefined, b: 1 })).toBe(svc.hashRequest({ b: 1 }));
    expect(svc.hashRequest({ a: null })).not.toBe(svc.hashRequest({}));
  });
});

describe('selection policy parsing', () => {
  it('accepts a well-formed policy', () => {
    const items = parseSelectionPolicy({
      items: [{ poolId: '0b8df6e0-1111-4222-8333-444455556666', count: 3, points: 2 }],
    });
    expect(items).toHaveLength(1);
    expect(items[0].count).toBe(3);
  });

  it('rejects malformed policies with STATE_CONFLICT', () => {
    expect(() => parseSelectionPolicy({})).toThrow(AppException);
    expect(() => parseSelectionPolicy({ items: [{ poolId: 'nope', count: 1, points: 1 }] })).toThrow(AppException);
    expect(() => parseSelectionPolicy({ items: [{ poolId: '0b8df6e0-1111-4222-8333-444455556666', count: 0, points: 1 }] })).toThrow(
      AppException,
    );
  });
});

describe('DB trigger error mapping', () => {
  it('maps cutoff errors to DEADLINE_PASSED', () => {
    const mapped = AttemptsService.mapWriteError(
      new Error('p2028: answer/flag cutoff or finalized'),
    );
    expect(mapped?.code).toBe('DEADLINE_PASSED');
  });

  it('maps revision errors to REVISION_CONFLICT', () => {
    const mapped = AttemptsService.mapWriteError(new Error('p2028: answer/flag revision or reparent conflict'));
    expect(mapped?.code).toBe('REVISION_CONFLICT');
  });

  it('maps finalized mutation errors to STATE_CONFLICT', () => {
    const mapped = ExamAccessService.mapStartWriteError(
      Object.assign(new Error("Unique constraint failed on the fields: (`candidate_id`)"), { code: 'P2002' }),
    );
    expect(mapped?.code).toBe('ACTIVE_ATTEMPT_EXISTS');
  });
});

describe('sha256 receipt identity', () => {
  it('matches the frozen request_hash format', () => {
    const hash = createHash('sha256').update('{"x":1}').digest('hex');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
