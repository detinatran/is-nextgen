import { createHash, randomUUID } from 'node:crypto';
import { AttemptFinalizationService } from '../../src/attempts/finalization.service';
import { ChallengeService } from '../../src/identity-access/challenge.service';
import { ScoringService } from '../../src/scoring/scoring.service';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { MAILER } from '../../src/notifications/mailer/mailer.tokens';
import type { Mailer } from '../../src/notifications/mailer/mailer.interface';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { COMMUNICATION_MEDIA_POLICY, communicationRetentionUntil, protectedByCommunicationRetention } from '../../src/registrations/communication-media.policy';
import { authed, createDraft, createTestApp, destroyTestApp, login, provisionUser,
  recoverRegistration, resetDatabase, seedReadyPhoto, seedReadyVideo, setupExam, uploadPhoto,
  type TestContext, type SessionCookies } from '../integration/helpers/test-kit';

describe('post-ZCode release assertions (failures are release blockers)', () => {
  let ctx: TestContext;
  const password = 'Sup3rSecret!42';
  beforeAll(async () => { ctx = await createTestApp(); });
  afterAll(async () => { await destroyTestApp(ctx); });
  beforeEach(async () => { await resetDatabase(ctx.prisma); });

  async function actor() {
    const email = `release-${randomUUID()}@example.com`;
    const user = await provisionUser(ctx, email, password);
    const session = await login(ctx, email, password);
    return { ...user, email, cookies: session.cookies };
  }
  async function start(email: string, cookies: SessionCookies) {
    const exam = await setupExam(ctx, { studentEmail: email });
    const key = randomUUID();
    const response = await ctx.http.post(`/api/v1/me/assignments/${exam.assignmentId}/attempts`)
      .set(authed(cookies)).set('Idempotency-Key', key).send();
    expect(response.status).toBe(201);
    return { assignmentId: exam.assignmentId, key, attemptId: response.body.attemptId as string };
  }
  async function submitRegistration(draft: Awaited<ReturnType<typeof createDraft>>) {
    await seedReadyVideo(ctx, draft.registrationId);
    await seedReadyPhoto(ctx, draft.registrationId);
    return ctx.http.post(`/api/v1/registrations/${draft.registrationId}/submission`)
      .set('x-registration-token', draft.profileToken).set('Idempotency-Key', randomUUID()).send();
  }

  it('NEW-04: declining BOTH legacy communication purposes permits general registration', async () => {
    const draft = await createDraft(ctx, {
      mediaUsageConsent: { wordingVersion: 'MEDIA-V1-2026', granted: false },
      eventCoverageConsent: { wordingVersion: 'EVENT-V1-2026', granted: false },
    });
    const res = await submitRegistration(draft);
    expect(res.status).toBe(201);
    expect(res.body.favoriteCandidateEligible).toBe(false);
  });
  it('NEW-10: frontend receives the exact authorized withdrawal email', async () => {
    const res = await ctx.http.get('/api/v1/registration-form-config');
    expect(res.body.consents.mediaUsage.withdrawalNotice).toBe(
      'Bạn có thể rút lại sự đồng ý bất cứ lúc nào bằng cách gửi email tới nextgen@vnuis.edu.vn.');
  });
  it('SEC-PHOTO: a JPEG header followed by garbage is rejected', async () => {
    const draft = await createDraft(ctx);
    const bytes = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 0x11)]);
    const res = await uploadPhoto(ctx, draft, bytes);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: 'PHOTO_INVALID_FORMAT' });
  });
  it('SEC-REPLAY-SUBMIT: another candidate cannot replay a known submission key', async () => {
    const a = await actor(); const b = await actor(); const attempt = await start(a.email, a.cookies);
    const key = randomUUID();
    const submitted = await ctx.http.post(`/api/v1/me/attempts/${attempt.attemptId}/submission`)
      .set(authed(a.cookies)).set('Idempotency-Key', key).send({ writerGeneration: 1 });
    expect(submitted.status).toBe(200);
    const replay = await ctx.http.post(`/api/v1/me/attempts/${attempt.attemptId}/submission`)
      .set(authed(b.cookies)).set('Idempotency-Key', key).send({ writerGeneration: 1 });
    expect(replay.status).toBe(404);
  });
  it('SEC-REPLAY-START: another candidate cannot replay a known start key', async () => {
    const a = await actor(); const b = await actor(); const attempt = await start(a.email, a.cookies);
    const replay = await ctx.http.post(`/api/v1/me/assignments/${attempt.assignmentId}/attempts`)
      .set(authed(b.cookies)).set('Idempotency-Key', attempt.key).send();
    expect(replay.status).toBe(404);
  });
  it('TIMEOUT-CUTOFF: reconciliation cannot finalize before the DB deadline', async () => {
    const a = await actor(); const attempt = await start(a.email, a.cookies);
    const result = await ctx.app.get(AttemptFinalizationService).finalizeOverdueAttempt(attempt.attemptId, 'release-test');
    expect(result).toBeNull();
    expect((await ctx.prisma.attempts.findUniqueOrThrow({ where: { id: attempt.attemptId } })).state).toBe('ACTIVE');
  });
  it('LOGOUT-OLD-SESSION: logout on the old device preserves the new writer', async () => {
    const a = await actor(); const attempt = await start(a.email, a.cookies);
    const second = await login(ctx, a.email, password);
    await ctx.http.post('/api/v1/auth/reauthentication').set(authed(second.cookies)).send({ password });
    const takeover = await ctx.http.post(`/api/v1/me/attempts/${attempt.attemptId}/session-takeover`)
      .set(authed(second.cookies)).send();
    expect(takeover.status).toBe(200);
    await ctx.http.post('/api/v1/auth/logout').set(authed(a.cookies)).send();
    expect(await ctx.prisma.active_exam_sessions.count({ where: { attempt_id: attempt.attemptId } })).toBe(1);
  });
  it('GAP-OTP-BUDGET: an incorrect OTP consumes a durable attempt', async () => {
    const a = await actor();
    const requested = await ctx.http.post('/api/v1/auth/email-verification-requests').send({ email: a.email });
    const challenge = await ctx.prisma.auth_challenges.findFirstOrThrow({ where: { purpose: 'EMAIL_VERIFY' } });
    expect(challenge.id).toBe(requested.body.challengeId);
    const wrong = createHash('sha256').update('999999').digest('hex') === challenge.verifier_hash ? '888888' : '999999';
    const res = await ctx.http.post('/api/v1/auth/email-verifications').send({ challengeId: challenge.id, code: wrong });
    expect(res.status).toBe(401);
    expect((await ctx.prisma.auth_challenges.findUniqueOrThrow({ where: { id: challenge.id } })).attempts_used).toBe(1);
  });
  it('GAP-OTP-RACE: a locked challenge cannot be consumed concurrently twice', async () => {
    const a = await actor();
    await ctx.http.post('/api/v1/auth/email-verification-requests').send({ email: a.email });
    const intent = await ctx.prisma.notification_intents.findFirstOrThrow({ where: { template_code: 'EMAIL_VERIFY' } });
    const code = (intent.payload as { code: string }).code;
    const challenge = await ctx.prisma.auth_challenges.findFirstOrThrow({ where: { purpose: 'EMAIL_VERIFY' } });
    let release!: () => void; let locked!: () => void;
    const lockReady = new Promise<void>((resolve) => { locked = resolve; });
    const releaseLock = new Promise<void>((resolve) => { release = resolve; });
    const blocker = ctx.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM auth_challenges WHERE id=${challenge.id}::uuid FOR UPDATE`;
      locked(); await releaseLock;
    }, { timeout: 10000 });
    await lockReady;
    const service = ctx.app.get(ChallengeService);
    const calls = [service.consumeById(challenge.id, 'EMAIL_VERIFY', code), service.consumeById(challenge.id, 'EMAIL_VERIFY', code)];
    await new Promise((resolve) => setTimeout(resolve, 250));
    release(); await blocker;
    const results = await Promise.allSettled(calls);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  });
  it('NEW-05: an absent communication decision is rejected before submission', async () => {
    await expect(createDraft(ctx, { mediaUsageConsent: undefined })).rejects.toThrow('draft failed: 400');
  });
  it('NEW-06: conflicting simultaneous decisions cannot be represented by the input', async () => {
    await expect(createDraft(ctx, { mediaUsageConsent: { wordingVersion: 'MEDIA-V1-2026', granted: [true, false] } })).rejects.toThrow('draft failed: 400');
  });
  it('NEW-09/11: append-only withdrawal evidence removes eligibility (projection only; no Admin workflow)', async () => {
    const draft = await createDraft(ctx);
    expect((await submitRegistration(draft)).body.favoriteCandidateEligible).toBe(true);
    const grant = await recoverRegistration(ctx, draft);
    const before = await ctx.prisma.consents.findFirstOrThrow({ where: { registration_id: draft.registrationId, purpose: 'MEDIA_USAGE' } });
    await ctx.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`INSERT INTO consents(registration_id,purpose,granted,wording_version,recorded_at)
        VALUES(${draft.registrationId}::uuid,'MEDIA_USAGE',false,'MEDIA-V1-2026',clock_timestamp())`;
      await tx.audit_events.create({ data: { action: 'communication.withdrawal_recorded', target_type: 'registration', target_id: draft.registrationId,
        correlation_id: randomUUID(), reason: 'Synthetic emailed withdrawal evidence', metadata: { evidenceReference: 'test-email-reference' } } });
    });
    const view = await ctx.http.get(`/api/v1/registrations/${draft.registrationId}`).set('x-registration-token', grant.profileToken);
    expect(view.body.favoriteCandidateEligible).toBe(false);
    const history = await ctx.prisma.consents.findMany({ where: { registration_id: draft.registrationId, purpose: 'MEDIA_USAGE' } });
    expect(history).toHaveLength(2);
    expect(history.find((r) => r.id === before.id)).toMatchObject({ granted: true, wording_version: 'MEDIA-V1-2026', recorded_at: before.recorded_at });
    expect(view.body.consents.find((r: { purpose: string }) => r.purpose === 'MEDIA_USAGE')).toMatchObject({ granted: false, wordingVersion: 'MEDIA-V1-2026' });
  });
  it('NEW-12/13: private photo status denies anonymous and other-registration access', async () => {
    const a = await createDraft(ctx); const b = await createDraft(ctx);
    const photo = await uploadPhoto(ctx, a); expect(photo.status).toBe(201);
    const id = photo.body.uploadId;
    expect((await ctx.http.get(`/api/v1/uploads/${id}`)).status).toBe(401);
    expect((await ctx.http.get(`/api/v1/uploads/${id}`).set('x-registration-token', b.profileToken)).status).toBe(403);
    const row = await ctx.prisma.media_uploads.findUniqueOrThrow({ where: { id: String(id) } });
    expect((await ctx.http.get(`/${row.object_key}`)).status).toBe(404);
  });
  it('NEW-14: policy is exactly one calendar year from official end, not final publication', async () => {
    expect(COMMUNICATION_MEDIA_POLICY.retention).toEqual({ anchor: 'OFFICIAL_COMPETITION_END', period: 'P1Y' });
    expect(communicationRetentionUntil(new Date('2026-12-20T12:00:00Z')).toISOString()).toBe('2027-12-20T12:00:00.000Z');
    expect(communicationRetentionUntil(new Date('2028-02-29T12:00:00Z')).toISOString()).toBe('2029-02-28T12:00:00.000Z');
    const config = await ctx.http.get('/api/v1/registration-form-config');
    expect(config.body.consents.mediaUsage.cleanupEnforced).toBe(false);
    expect(config.body.consents.mediaUsage.defaultSelection).toBeNull();
    expect(config.body.consents.mediaUsage.selectionRequired).toBe(true);
  });
  it('NEW-15: active communications retention protects media past the normal 3-month window (policy only)', () => {
    const end = new Date('2026-01-01T00:00:00Z');
    expect(protectedByCommunicationRetention(true, end, new Date('2026-05-01T00:00:00Z'))).toBe(true);
    expect(protectedByCommunicationRetention(true, end, new Date('2027-01-01T00:00:00Z'))).toBe(false);
    expect(protectedByCommunicationRetention(true, null, new Date('2028-01-01T00:00:00Z'))).toBe(true);
  });
  it('GAP-WRITER-GENERATION: same-session takeover rejects the previous writer generation', async () => {
    const a = await actor(); const attempt = await start(a.email, a.cookies);
    const view = await ctx.http.get(`/api/v1/me/attempts/${attempt.attemptId}`).set('Cookie', a.cookies.session);
    const q = view.body.form[0];
    await ctx.http.post('/api/v1/auth/reauthentication').set(authed(a.cookies)).send({ password });
    const takeover = await ctx.http.post(`/api/v1/me/attempts/${attempt.attemptId}/session-takeover`).set(authed(a.cookies)).send();
    expect(takeover.body.writerGeneration).toBe(2);
    const oldWriter = await ctx.http.put(`/api/v1/me/attempts/${attempt.attemptId}/answers/${q.deliveredQuestionId}`)
      .set(authed(a.cookies)).send({ selectedOptionId: q.options[0].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: 1 });
    expect(oldWriter.status).toBe(409);
  });
  it('GAP-WORKER-RESTART: expired RUNNING scoring lease is recovered', async () => {
    const a = await actor(); const attempt = await start(a.email, a.cookies);
    await ctx.http.post(`/api/v1/me/attempts/${attempt.attemptId}/submission`).set(authed(a.cookies)).set('Idempotency-Key', randomUUID()).send({ writerGeneration: 1 });
    await ctx.prisma.async_intents.updateMany({ where: { kind: 'SCORING' }, data: { status: 'RUNNING', lease_until: new Date(Date.now() - 1000) } });
    expect(await ctx.app.get(ScoringService).processPendingScoring('restart-test')).toBe(1);
  });
  it('GAP-MAIL-RESTART: expired SENDING notification lease is recovered', async () => {
    const draft = await createDraft(ctx); await submitRegistration(draft);
    await ctx.prisma.notification_intents.updateMany({ where: { template_code: 'REGISTRATION_CONFIRMED' }, data: { status: 'SENDING', lease_until: new Date(Date.now() - 1000) } });
    expect(await ctx.app.get(NotificationsService).dispatchPending()).toBe(1);
  });
  it('START-EXACT-REPLAY: a second rapid attempt replays its own receipt', async () => {
    const a = await actor(); const first = await start(a.email, a.cookies);
    await ctx.http.post(`/api/v1/me/attempts/${first.attemptId}/submission`).set(authed(a.cookies)).set('Idempotency-Key', randomUUID()).send({ writerGeneration: 1 });
    const key = randomUUID();
    const second = await ctx.http.post(`/api/v1/me/assignments/${first.assignmentId}/attempts`).set(authed(a.cookies)).set('Idempotency-Key', key).send();
    const replay = await ctx.http.post(`/api/v1/me/assignments/${first.assignmentId}/attempts`).set(authed(a.cookies)).set('Idempotency-Key', key).send();
    expect(second.status).toBe(201); expect(replay.status).toBe(201);
    expect(replay.body.attemptId).toBe(second.body.attemptId);
    expect(replay.body.attemptId).not.toBe(first.attemptId);
  });
  it('GAP-OTP-IDENTITY: identical six-digit codes for two accounts must not reset the wrong account', async () => {
    const a = await actor(); const b = await actor();
    const hash = createHash('sha256').update('345678').digest('hex');
    for (const user of [a, b]) {
      await ctx.prisma.auth_challenges.create({ data: { user_id: user.userId, email_normalized: user.email,
        purpose: 'PASSWORD_RESET', verifier_hash: hash, expires_at: new Date(Date.now() + 60000) } });
    }
    const res = await ctx.http.post('/api/v1/auth/password-resets').send({ token: '345678', newPassword: 'An0therSecret!42' });
    expect(res.status).toBe(401);
  });
  it('SEC-LOGOUT-CSRF: missing/invalid tokens are denied, valid logout succeeds', async () => {
    const a = await actor();
    expect((await ctx.http.post('/api/v1/auth/logout').set('Cookie', a.cookies.session).send()).status).toBe(403);
    expect((await ctx.http.post('/api/v1/auth/logout').set(authed(a.cookies)).set('x-csrf-token', 'invalid').send()).status).toBe(403);
    expect((await ctx.http.post('/api/v1/auth/logout').set(authed(a.cookies)).send()).status).toBe(204);
  });
  it('SEC-SUBMISSION-PAYLOAD: bundled answers are rejected without finalizing', async () => {
    const a = await actor(); const attempt = await start(a.email, a.cookies);
    const res = await ctx.http.post(`/api/v1/me/attempts/${attempt.attemptId}/submission`)
      .set(authed(a.cookies)).set('Idempotency-Key', randomUUID()).send({ answers: [] });
    expect(res.status).toBe(400);
    expect(await ctx.prisma.submissions.count()).toBe(0);
  });
  it('FAILURE-EMAIL: unavailable mail provider preserves registration and queues bounded retry', async () => {
    const draft = await createDraft(ctx); const committed = await submitRegistration(draft);
    const fail = jest.spyOn(ctx.app.get<Mailer>(MAILER), 'send').mockRejectedValueOnce(new Error('synthetic email outage'));
    try {
      expect(await ctx.app.get(NotificationsService).dispatchPending()).toBe(1);
      const intent = await ctx.prisma.notification_intents.findFirstOrThrow({ where: { candidate_id: { not: null } } });
      expect(intent.status).toBe('RETRY_PENDING'); expect(intent.attempts_used).toBe(1);
      // The submitted profile is private: read it via a VERIFIED recovery grant.
      const grant = await recoverRegistration(ctx, draft);
      const view = await ctx.http.get(`/api/v1/registrations/${draft.registrationId}`).set('x-registration-token', grant.profileToken);
      expect(view.body.candidateCode).toBe(committed.body.candidateCode);
    } finally { fail.mockRestore(); }
  });
  it('FAILURE-API-RESTART: accepted answer and original deadline survive application restart', async () => {
    const a = await actor(); const attempt = await start(a.email, a.cookies);
    const before = await ctx.http.get(`/api/v1/me/attempts/${attempt.attemptId}`).set('Cookie', a.cookies.session);
    const q = before.body.form[0];
    expect((await ctx.http.put(`/api/v1/me/attempts/${attempt.attemptId}/answers/${q.deliveredQuestionId}`).set(authed(a.cookies))
      .send({ selectedOptionId: q.options[0].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: 1 })).status).toBe(200);
    await destroyTestApp(ctx); ctx = await createTestApp();
    const after = await ctx.http.get(`/api/v1/me/attempts/${attempt.attemptId}`).set('Cookie', a.cookies.session);
    expect(after.status).toBe(200);
    expect(after.body.attempt.deadlineAt).toBe(before.body.attempt.deadlineAt);
    expect(after.body.candidateState[0]).toMatchObject({ selectedOptionId: q.options[0].deliveredOptionId, answerRevision: 1 });
  });
  it('SEC-PHOTO-LIMIT: oversized photo yields a stable error and leaves no temporary file', async () => {
    const draft = await createDraft(ctx);
    const dir = join(tmpdir(), 'isng-uploads'); const before = (await readdir(dir)).sort();
    const photo = await uploadPhoto(ctx, draft, Buffer.alloc(10_000_001));
    expect(photo.status).toBe(413);
    expect(photo.body.error).toMatchObject({ code: 'PHOTO_TOO_LARGE' });
    expect((await readdir(dir)).sort()).toEqual(before);
  });
  it('SEC-BIND/SQL/TRAVERSAL: malformed identifiers are rejected before persistence', async () => {
    const draft = await createDraft(ctx);
    const bind = await ctx.http.put(`/api/v1/registrations/${draft.registrationId}/video-binding`)
      .set('x-registration-token', draft.profileToken).send({ mediaObjectId: "x' OR 1=1--" });
    expect(bind.status).toBe(400); expect(bind.body.error.code).toBe('VALIDATION_FAILED');
    expect((await ctx.http.get('/api/v1/uploads/%2e%2e%2fetc%2fpasswd').set('x-registration-token', draft.profileToken)).status).toBe(400);
  });
  it('MEDIA-CONTENT: real JPEG/WebP decode; MOV and audio-only MP4 are not introductory videos', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'release-media-'));
    try {
      for (const format of ['jpg', 'webp']) {
        const draft = await createDraft(ctx); const file = join(dir, `valid.${format}`);
        execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=c=red:s=32x32:d=1', '-frames:v', '1', '-y', file]);
        const res = await ctx.http.post(`/api/v1/registrations/${draft.registrationId}/photos`).set('x-registration-token', draft.uploadToken).attach('file', file);
        expect(res.status).toBe(201);
      }
      for (const format of ['mov', 'mp4']) {
        const draft = await createDraft(ctx); const file = join(dir, `invalid.${format}`);
        const input = format === 'mov' ? 'color=c=red:s=32x32:d=1' : 'sine=frequency=1000:duration=1';
        execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', input, '-y', file]);
        const uploaded = await ctx.http.post(`/api/v1/registrations/${draft.registrationId}/uploads`).set('x-registration-token', draft.uploadToken).attach('file', file);
        const finalized = await ctx.http.post(`/api/v1/uploads/${uploaded.body.uploadId}/finalization`).set('x-registration-token', draft.uploadToken).send();
        expect(finalized.body.state).toBe('REJECTED'); expect(finalized.body.rejectionReason).toBe('VIDEO_INVALID_FORMAT');
      }
    } finally { await rm(dir, { recursive: true, force: true }); }
  });
  it('SEC-OTP-EXPIRY: an actually expired, unconsumed OTP is denied', async () => {
    const a = await actor();
    const challenge = await ctx.prisma.auth_challenges.create({ data: { user_id: a.userId, email_normalized: a.email,
      purpose: 'EMAIL_VERIFY', verifier_hash: createHash('sha256').update('246810').digest('hex'),
      created_at: new Date(Date.now() - 3600000), expires_at: new Date(Date.now() - 600000) } });
    // F07 setup adaptation: the API now requires the exact challenge locator.
    const res = await ctx.http.post('/api/v1/auth/email-verifications').send({ challengeId: challenge.id, code: '246810' });
    expect(res.status).toBe(401);
    expect((await ctx.prisma.auth_challenges.findUniqueOrThrow({ where: { id: challenge.id } })).consumed_at).toBeNull();
  });
  it('SEC-RATE-LIMIT: local rate limiting still denies excess login requests without Redis', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 31; i++) {
      const res = await ctx.http.post('/api/v1/auth/login').send({ identifier: 'absent-rate-limit@example.com', password });
      statuses.push(res.status);
      if (res.status === 429) expect(res.body.error.code).toBe('RATE_LIMITED');
    }
    expect(statuses).toContain(429);
  });
});
