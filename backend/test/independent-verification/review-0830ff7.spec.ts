import { createHash, randomUUID } from 'node:crypto';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MAILER } from '../../src/notifications/mailer/mailer.tokens';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { authed, createDraft, createTestApp, destroyTestApp, login, provisionUser,
  recoverRegistration, resetDatabase, seedReadyPhoto, seedReadyVideo, setupExam,
  type TestContext, type DraftRegistration, type SessionCookies } from '../integration/helpers/test-kit';

// Additional independent assertions: frozen requirements, not remediation's PASS claims.
describe('independent verification of 0830ff7', () => {
  let ctx: TestContext;
  const password = 'ReviewV2!Password42';
  // Isolate each case's real rate-limit storage; keep production guards enabled.
  beforeEach(async () => { ctx = await createTestApp(); await resetDatabase(ctx.prisma); });
  afterEach(async () => { await destroyTestApp(ctx); });
  async function admin() {
    const u = await provisionUser(ctx, `v2-${randomUUID()}@example.com`, password);
    const role = await ctx.prisma.roles.findUniqueOrThrow({ where: { code: 'ADMIN' } });
    await ctx.prisma.user_roles.deleteMany({ where: { user_id: u.userId } });
    await ctx.prisma.user_roles.create({ data: { user_id: u.userId, role_id: role.id } });
    await ctx.prisma.users.update({ where: { id: u.userId }, data: { mfa_enabled: true } });
    return u;
  }
  async function emailedCode(id: string) {
    const n = await ctx.prisma.notification_intents.findUniqueOrThrow({ where: { deduplication_key: `challenge:${id}` } });
    return (n.payload as { code: string }).code;
  }
  async function mfa(id: string, code: string) {
    return ctx.http.post(`/api/v1/auth/admin/mfa-challenges/${id}/verification`).send({ code });
  }
  function cookies(response: { headers: Record<string, unknown> }): SessionCookies {
    const list = (response.headers['set-cookie'] ?? []) as string[];
    return { session: (list.find((s) => s.startsWith('isng_session=')) ?? '').split(';')[0],
      csrf: (list.find((s) => s.startsWith('isng_csrf=')) ?? '').split(';')[0] };
  }
  async function recovery(d: DraftRegistration) {
    const r = await ctx.http.post(`/api/v1/registrations/${d.registrationId}/recovery-requests`).send({ email: d.email });
    expect(r.status).toBe(202); const id = r.body.challengeId as string;
    return { id, code: await emailedCode(id) };
  }
  async function consumeRecovery(id: string, code: string) {
    return ctx.http.post('/api/v1/registrations/recovery/verifications').send({ challengeId: id, code });
  }
  async function submitDraft(d: DraftRegistration) {
    await seedReadyPhoto(ctx, d.registrationId); await seedReadyVideo(ctx, d.registrationId);
    const r = await ctx.http.post(`/api/v1/registrations/${d.registrationId}/submission`)
      .set('x-registration-token', d.uploadToken).set('Idempotency-Key', randomUUID()).send();
    expect(r.status).toBe(201);
  }
  async function rowBarrier(table: 'attempts' | 'registrations', id: string) {
    let release!: () => void; let signal!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    const ready = new Promise<void>((r) => { signal = r; });
    const tx = ctx.prisma.$transaction(async (t) => {
      await t.$queryRawUnsafe(`SELECT id FROM ${table} WHERE id=$1::uuid FOR UPDATE`, id); signal(); await held;
    }, { timeout: 15000 });
    await ready; return async () => { release(); await tx; };
  }
  async function lockWait(fragment: string, n: number) {
    for (let i = 0; i < 100; i++) {
      const [row] = await ctx.prisma.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM pg_stat_activity
        WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE ${'%' + fragment + '%'}`;
      if (Number(row.n) >= n) return;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error('Required real PostgreSQL lock wait was not observed');
  }

  it('V2-F02: same-cookie old logical submission without generation cannot finalize after takeover', async () => {
    const u = await provisionUser(ctx, `student-${randomUUID()}@example.com`, password);
    const s = await login(ctx, u.email, password); const e = await setupExam(ctx, { studentEmail: u.email });
    const start = await ctx.http.post(`/api/v1/me/assignments/${e.assignmentId}/attempts`)
      .set(authed(s.cookies)).set('Idempotency-Key', randomUUID()).send(); expect(start.status).toBe(201);
    const id = start.body.attemptId as string;
    expect((await ctx.http.post(`/api/v1/me/attempts/${id}/session-takeover`).set(authed(s.cookies)).send()).body.writerGeneration).toBe(2);
    const r = await ctx.http.post(`/api/v1/me/attempts/${id}/submission`).set(authed(s.cookies))
      .set('Idempotency-Key', randomUUID()).send();
    const [submissionCount, attempt] = await Promise.all([
      ctx.prisma.submissions.count({ where: { attempt_id: id } }), ctx.prisma.attempts.findUniqueOrThrow({ where: { id } }),
    ]);
    expect({ rejected: [400, 401, 403, 409].includes(r.status), submissionCount, state: attempt.state })
      .toEqual({ rejected: true, submissionCount: 0, state: 'ACTIVE' });
  });
  it('V2-F03-01: anonymous initial capability must not write email-verification evidence in any scope', async () => {
    const d = await createDraft(ctx); const grants = await ctx.prisma.registration_access_grants.findMany({
      where: { registration_id: d.registrationId }, select: { email_verified_at: true },
    });
    expect(grants.some((g) => g.email_verified_at !== null)).toBe(false);
  });
  it('V2-F03-private-read: unverified initial token cannot read subsequently edited submitted profile', async () => {
    const d = await createDraft(ctx); await submitDraft(d); const grant = await recoverRegistration(ctx, d);
    const reg = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    const edit = await ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', grant.profileToken)
      .send({ fullName: 'Verified Owner Later Profile', expectedRevision: Number(reg.revision) }); expect(edit.status).toBe(200);
    const r = await ctx.http.get(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', d.uploadToken);
    expect({ denied: [401, 403].includes(r.status), exposesLaterProfile: r.body.profile?.fullName === 'Verified Owner Later Profile' })
      .toEqual({ denied: true, exposesLaterProfile: false });
  });
  it('V2-F03-initial-video-binding: initial upload capability can bind its own sealed video', async () => {
    const d = await createDraft(ctx); const mediaObjectId = await seedReadyVideo(ctx, d.registrationId);
    await ctx.prisma.registration_videos.deleteMany({ where: { registration_id: d.registrationId } });
    const r = await ctx.http.put(`/api/v1/registrations/${d.registrationId}/video-binding`)
      .set('x-registration-token', d.uploadToken).send({ mediaObjectId });
    expect(r.status).toBe(200);
    expect(await ctx.prisma.registration_videos.count({ where: { registration_id: d.registrationId, media_object_id: mediaObjectId } })).toBe(1);
  });
  it('V2-F03-expiry: genuinely expired recovery proof with correct OTP grants nothing', async () => {
    const d = await createDraft(ctx); const c = await recovery(d);
    await ctx.prisma.auth_challenges.update({ where: { id: c.id }, data: { created_at: new Date(Date.now() - 60000), expires_at: new Date(Date.now() - 1000) } });
    expect((await consumeRecovery(c.id, c.code)).status).toBe(401);
    expect(await ctx.prisma.registration_access_grants.count({ where: { registration_id: d.registrationId, scope: 'READ_EDIT_PROFILE' } })).toBe(0);
  });
  it('V2-F03-resource: same-email distinct-resource verifiers cannot be exchanged', async () => {
    const email = `duplicate-${randomUUID()}@example.com`; const a = await createDraft(ctx, { email }); const b = await createDraft(ctx, { email });
    const ca = await recovery(a); const cb = await recovery(b);
    await ctx.prisma.auth_challenges.update({ where: { id: ca.id }, data: { verifier_hash: createHash('sha256').update('112233').digest('hex') } });
    await ctx.prisma.auth_challenges.update({ where: { id: cb.id }, data: { verifier_hash: createHash('sha256').update('445566').digest('hex') } });
    expect((await consumeRecovery(ca.id, '445566')).status).toBe(401);
    const r = await consumeRecovery(cb.id, '445566'); expect(r.status).toBe(200); expect(r.body.registrationId).toBe(b.registrationId);
    expect((await ctx.http.get(`/api/v1/registrations/${a.registrationId}`).set('x-registration-token', r.body.profileToken)).status).toBe(403);
    expect(await ctx.prisma.users.count()).toBe(0); expect(await ctx.prisma.auth_sessions.count()).toBe(0);
  });
  it('V2-F03-replay: recovery replay with exact original OTP produces no second grant', async () => {
    const d = await createDraft(ctx); const c = await recovery(d); expect((await consumeRecovery(c.id, c.code)).status).toBe(200);
    expect((await consumeRecovery(c.id, c.code)).status).toBe(401);
    expect(await ctx.prisma.registration_access_grants.count({ where: { registration_id: d.registrationId, scope: 'READ_EDIT_PROFILE' } })).toBe(1);
  });
  it.each(['expired', 'revoked'])('V2-F03-grant-%s: verified edit grant fails closed before request', async (state) => {
    const d = await createDraft(ctx); const g = await recoverRegistration(ctx, d);
    await ctx.prisma.registration_access_grants.updateMany({ where: { registration_id: d.registrationId, scope: 'READ_EDIT_PROFILE' },
      data: state === 'revoked' ? { revoked_at: new Date() } : { created_at: new Date(Date.now() - 60000), expires_at: new Date(Date.now() - 1000) } });
    const r = await ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', g.profileToken)
      .send({ fullName: 'Invalid Grant Edit', expectedRevision: 1 });
    expect(r.status).toBe(401);
    expect(Number((await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } })).revision)).toBe(1);
  });
  it('V2-F04-CAS: two physically queued registration updates with one revision yield one commit', async () => {
    const d = await createDraft(ctx); const g = await recoverRegistration(ctx, d); const release = await rowBarrier('registrations', d.registrationId);
    const send = (name: string) => ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', g.profileToken)
      .send({ fullName: name, expectedRevision: 1 }).then((r) => r.status);
    const a = send('Queued Profile A'); const b = send('Queued Profile B');
    try { await lockWait('SELECT * FROM registrations', 2); } finally { await release(); }
    expect((await Promise.all([a, b])).sort()).toEqual([200, 409]);
    expect(Number((await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } })).revision)).toBe(2);
  });
  it('V2-F04-revoked-grant: revocation committed while edit waits must prevent the edit', async () => {
    const d = await createDraft(ctx); const g = await recoverRegistration(ctx, d); const release = await rowBarrier('registrations', d.registrationId);
    const pending = ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', g.profileToken)
      .send({ fullName: 'Revoked Grant Edit', expectedRevision: 1 }).then((r) => r.status);
    try { await lockWait('SELECT * FROM registrations', 1); await ctx.prisma.registration_access_grants.updateMany({
      where: { registration_id: d.registrationId, scope: 'READ_EDIT_PROFILE' }, data: { revoked_at: new Date() },
    }); } finally { await release(); }
    const status = await pending; const reg = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    expect({ denied: [401, 403, 409].includes(status), revision: Number(reg.revision) }).toEqual({ denied: true, revision: 1 });
  });
  it('V2-F04-deadline-at-lock: queued edit past deadline cannot commit', async () => {
    const d = await createDraft(ctx); const g = await recoverRegistration(ctx, d); const reg = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    await ctx.prisma.competitions.update({ where: { id: reg.competition_id }, data: { registration_closes_at: new Date(Date.now() + 800) } });
    const release = await rowBarrier('registrations', d.registrationId);
    const pending = ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', g.profileToken)
      .send({ fullName: 'Late Queued Edit', expectedRevision: 1 }).then((r) => r.status);
    try { await lockWait('SELECT * FROM registrations', 1); await new Promise((r) => setTimeout(r, 1000)); } finally { await release(); }
    expect(await pending).toBe(409);
  });
  it('V2-F04-submitted-deadline: correct revision and verified grant cannot edit submitted profile after close', async () => {
    const d = await createDraft(ctx); await submitDraft(d); const g = await recoverRegistration(ctx, d);
    const before = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    await ctx.prisma.competitions.update({ where: { id: before.competition_id }, data: { registration_closes_at: new Date(Date.now() - 1000) } });
    const r = await ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', g.profileToken)
      .send({ fullName: 'Late Submitted Profile', expectedRevision: Number(before.revision) });
    expect(r.status).toBe(409);
    expect(r.body.error.code).toBe('DEADLINE_PASSED');
    const after = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    expect(after.revision).toBe(before.revision); expect(after.submitted_profile).toEqual(before.submitted_profile);
  });
  it('V2-F05-pre-MFA: password challenge and legacy session cannot access Admin probe', async () => {
    const u = await admin(); const r = await login(ctx, u.email, password); expect(r.body.status).toBe('MFA_REQUIRED'); expect(r.cookies.session).toBe('');
    expect((await ctx.http.get('/api/v1/admin/session')).status).toBe(401);
    const token = 'synthetic-v2-legacy-session'; await ctx.prisma.auth_sessions.create({ data: { user_id: u.userId,
      token_hash: createHash('sha256').update(token).digest('hex'), expires_at: new Date(Date.now() + 60000) } });
    expect((await ctx.http.get('/api/v1/admin/session').set('Cookie', `isng_session=${token}`)).status).toBe(403);
  });
  it('V2-F05-expiry: genuinely expired MFA proof with exact correct OTP creates no session', async () => {
    const u = await admin(); const r = await login(ctx, u.email, password); const id = r.body.challengeId as string; const code = await emailedCode(id);
    await ctx.prisma.auth_challenges.update({ where: { id }, data: { created_at: new Date(Date.now() - 60000), expires_at: new Date(Date.now() - 1000) } });
    expect((await mfa(id, code)).status).toBe(401); expect(await ctx.prisma.auth_sessions.count()).toBe(0);
  });
  it('V2-F05-wrong-purpose: email-verification proof cannot create Admin session', async () => {
    const u = await admin(); const c = await ctx.prisma.auth_challenges.create({ data: { user_id: u.userId, email_normalized: u.email,
      purpose: 'EMAIL_VERIFY', verifier_hash: createHash('sha256').update('112233').digest('hex'), expires_at: new Date(Date.now() + 60000) } });
    expect((await mfa(c.id, '112233')).status).toBe(401); expect(await ctx.prisma.auth_sessions.count()).toBe(0);
  });
  it.each(['A', 'B'])('V2-F05-identical-%s: identical OTP creates only exact challenge owner session', async (target) => {
    const a = await admin(); const b = await admin(); const challenges = [];
    for (const u of [a, b]) challenges.push(await ctx.prisma.auth_challenges.create({ data: { user_id: u.userId, email_normalized: u.email,
      purpose: 'MFA', verifier_hash: createHash('sha256').update('112233').digest('hex'), expires_at: new Date(Date.now() + 60000) } }));
    const index = target === 'A' ? 0 : 1; const r = await mfa(challenges[index].id, '112233'); expect(r.status).toBe(200);
    const owner = index === 0 ? a : b; const other = index === 0 ? b : a;
    expect((await ctx.http.get('/api/v1/admin/session').set('Cookie', cookies(r).session)).body.userId).toBe(owner.userId);
    expect(await ctx.prisma.auth_sessions.count({ where: { user_id: other.userId } })).toBe(0);
  });
  it('V2-F05-replay-and-restart: verified MFA survives app restart; replay yields no extra session', async () => {
    const u = await admin(); const initial = await login(ctx, u.email, password); const id = initial.body.challengeId as string; const code = await emailedCode(id);
    const valid = await mfa(id, code); expect(valid.status).toBe(200); const session = cookies(valid);
    expect((await mfa(id, code)).status).toBe(401); expect(await ctx.prisma.auth_sessions.count()).toBe(1);
    expect((await ctx.prisma.auth_sessions.findFirstOrThrow({ where: { user_id: u.userId } })).mfa_verified_at).not.toBeNull();
    await destroyTestApp(ctx); ctx = await createTestApp();
    expect((await ctx.http.get('/api/v1/admin/session').set('Cookie', session.session)).status).toBe(200);
    expect((await ctx.http.post('/api/v1/auth/reauthentication').set('Cookie', session.session).send({ password })).status).toBe(403);
    expect((await ctx.http.post('/api/v1/auth/reauthentication').set(authed(session)).set('x-csrf-token', 'invalid').send({ password })).status).toBe(403);
    expect((await ctx.http.post('/api/v1/auth/reauthentication').set(authed(session)).send({ password })).status).toBe(200);
  });
  it('V2-F05-disabled-after-challenge: valid OTP cannot promote disabled Admin', async () => {
    const u = await admin(); const r = await login(ctx, u.email, password); const id = r.body.challengeId as string; const code = await emailedCode(id);
    await ctx.prisma.users.update({ where: { id: u.userId }, data: { status: 'DISABLED' } });
    expect((await mfa(id, code)).status).toBe(401); expect(await ctx.prisma.auth_sessions.count()).toBe(0);
  });
  it('V2-F05-mail-failure: actual failing adapter dispatch leaves challenge pending retry and no full session', async () => {
    const u = await admin(); const r = await login(ctx, u.email, password); const id = r.body.challengeId as string;
    const mailer = ctx.app.get<{ send: (...args: unknown[]) => Promise<void> }>(MAILER);
    const spy = jest.spyOn(mailer, 'send').mockRejectedValue(new Error('Synthetic v2 mail failure'));
    try {
      await ctx.app.get(NotificationsService).dispatchPending(); expect(spy).toHaveBeenCalled();
      expect((await ctx.prisma.notification_intents.findUniqueOrThrow({ where: { deduplication_key: `challenge:${id}` } })).status).toBe('RETRY_PENDING');
      expect(await ctx.prisma.auth_sessions.count()).toBe(0);
    } finally { spy.mockRestore(); }
  });
  it('V2-contract-submission: submission Swagger must require writerGeneration', () => {
    const doc = SwaggerModule.createDocument(ctx.app, new DocumentBuilder().build());
    const s = doc.components?.schemas as Record<string, { required?: string[] }>;
    expect(s.SubmissionDto.required).toContain('writerGeneration');
  });
  it('V2-contract-login: login schema must represent MFA_REQUIRED and concrete session fields', () => {
    const doc = SwaggerModule.createDocument(ctx.app, new DocumentBuilder().build());
    const schema = doc.paths['/api/v1/auth/login'].post?.responses['200'] as { content?: { 'application/json'?: { schema?: { oneOf?: unknown[] } } } };
    expect(schema.content?.['application/json']?.schema?.oneOf?.length).toBe(2);
  });
  it('V2-contract-recovery: successful verification documents exact grant response', () => {
    const doc = SwaggerModule.createDocument(ctx.app, new DocumentBuilder().build());
    const response = doc.paths['/api/v1/registrations/recovery/verifications'].post?.responses['200'] as { content?: unknown };
    expect(response.content).toBeDefined();
  });
});
