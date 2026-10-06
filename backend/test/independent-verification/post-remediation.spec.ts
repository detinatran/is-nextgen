import { createHash, randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { ChallengeService } from '../../src/identity-access/challenge.service';
import { MAILER } from '../../src/notifications/mailer/mailer.tokens';
import { authed, createDraft, createTestApp, destroyTestApp, login, provisionUser,
  recoverRegistration, resetDatabase, seedReadyPhoto, seedReadyVideo, setupExam, uploadPhoto,
  type TestContext, type SessionCookies } from '../integration/helpers/test-kit';


// Independent assertions. Expected behavior comes from frozen rules, not current implementation.
describe('independent post-remediation verification', () => {
  let ctx: TestContext;
  const password = 'Independent!Pass42';
  const replacement = 'Independent!New43';
  beforeAll(async () => { ctx = await createTestApp(); });
  afterAll(async () => { await destroyTestApp(ctx); });
  beforeEach(async () => { await resetDatabase(ctx.prisma); });
  async function user() {
    const email = `independent-${randomUUID()}@example.com`;
    return provisionUser(ctx, email, password);
  }
  async function challenge(u: Awaited<ReturnType<typeof user>>, code = '246810', purpose = 'PASSWORD_RESET', expiresMs = 600000) {
    return ctx.prisma.auth_challenges.create({ data: { user_id: u.userId, email_normalized: u.email,
      purpose, verifier_hash: createHash('sha256').update(code).digest('hex'),
      created_at: new Date(Date.now() - 60000), expires_at: new Date(Date.now() + expiresMs) } });
  }
  async function reset(id: string, code = '246810', newPassword = replacement) {
    return ctx.http.post('/api/v1/auth/password-resets').send({ challengeId: id, code, newPassword });
  }
  async function verifyPassword(id: string, value: string) {
    const row = await ctx.prisma.users.findUniqueOrThrow({ where: { id } });
    return argon2.verify(row.password_hash!, value);
  }
  async function exam() {
    const u = await user(); const session = await login(ctx, u.email, password);
    const assigned = await setupExam(ctx, { studentEmail: u.email });
    const started = await ctx.http.post(`/api/v1/me/assignments/${assigned.assignmentId}/attempts`)
      .set(authed(session.cookies)).set('Idempotency-Key', randomUUID()).send();
    expect(started.status).toBe(201);
    const id = started.body.attemptId as string;
    const view = await ctx.http.get(`/api/v1/me/attempts/${id}`).set('Cookie', session.cookies.session);
    const q = view.body.form[0] as { deliveredQuestionId: string; options: { deliveredOptionId: string }[] };
    return { ...u, id, q, cookies: session.cookies, started, view };
  }
  function save(e: Awaited<ReturnType<typeof exam>>, generation: number | undefined, cookies: SessionCookies = e.cookies) {
    return ctx.http.put(`/api/v1/me/attempts/${e.id}/answers/${e.q.deliveredQuestionId}`)
      .set(authed(cookies)).send({ selectedOptionId: e.q.options[0].deliveredOptionId,
        expectedRevision: 0, mutationId: randomUUID(), ...(generation === undefined ? {} : { writerGeneration: generation }) });
  }
  function takeover(e: Awaited<ReturnType<typeof exam>>, cookies: SessionCookies = e.cookies) {
    return ctx.http.post(`/api/v1/me/attempts/${e.id}/session-takeover`).set(authed(cookies)).send();
  }
  // F04 setup adaptation (documented): edit authority comes from the real
  // verified recovery flow, never from the initial draft capability.
  async function verifiedEditToken(d: Awaited<ReturnType<typeof createDraft>>) {
    const grant = await recoverRegistration(ctx, d);
    expect(grant.registrationId).toBe(d.registrationId);
    return grant.profileToken;
  }
  // Physical PostgreSQL lock barrier; callers are actually executing and waiting, not just scheduled.
  async function lock(table: 'attempts' | 'auth_challenges', id: string) {
    let release!: () => void; let ready!: () => void;
    const held = new Promise<void>((r) => { release = r; });
    const acquired = new Promise<void>((r) => { ready = r; });
    const transaction = ctx.prisma.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(`SELECT id FROM ${table} WHERE id=$1::uuid FOR UPDATE`, id);
      ready(); await held;
    }, { timeout: 15000 });
    await acquired;
    return async () => { release(); await transaction; };
  }
  async function waiters(fragment: string, minimum: number) {
    for (let i = 0; i < 100; i++) {
      const rows = await ctx.prisma.$queryRaw<{ n: bigint }[]>`
        SELECT count(*) AS n FROM pg_stat_activity WHERE datname=current_database()
        AND wait_event_type='Lock' AND query LIKE ${'%' + fragment + '%'}`;
      if (Number(rows[0].n) >= minimum) return;
      await new Promise((r) => setTimeout(r, 20));
    }
    throw new Error('Physical PostgreSQL lock wait was not observed');
  }

  it.each(['A', 'B'])('V-F01-0%s: identical OTP resets only the exact challenge owner', async (target) => {
    const a = await user(); const b = await user(); const ca = await challenge(a); const cb = await challenge(b);
    expect((await reset(target === 'A' ? ca.id : cb.id)).status).toBe(200);
    expect(await verifyPassword(target === 'A' ? a.userId : b.userId, replacement)).toBe(true);
    expect(await verifyPassword(target === 'A' ? b.userId : a.userId, password)).toBe(true);
    const untouched = await ctx.prisma.auth_challenges.findUniqueOrThrow({ where: { id: target === 'A' ? cb.id : ca.id } });
    expect(untouched.consumed_at).toBeNull();
  });
  it('V-F01-03/04: wrong verifier and different-owner verifier fail without changing either password', async () => {
    const a = await user(); const b = await user(); const ca = await challenge(a); await challenge(b, '135790');
    expect((await reset(ca.id, '000000')).status).toBe(401);
    expect((await reset(ca.id, '135790')).status).toBe(401);
    expect(await verifyPassword(a.userId, password)).toBe(true); expect(await verifyPassword(b.userId, password)).toBe(true);
  });
  it('V-F01-05: purpose mismatch fails without consuming proof', async () => {
    const c = await challenge(await user(), '246810', 'EMAIL_VERIFY');
    expect((await reset(c.id)).status).toBe(401);
    expect((await ctx.prisma.auth_challenges.findUniqueOrThrow({ where: { id: c.id } })).consumed_at).toBeNull();
  });
  it('V-F01-06: actually expired challenge fails', async () => {
    const c = await challenge(await user(), '246810', 'PASSWORD_RESET', -1000);
    expect((await reset(c.id)).status).toBe(401);
  });
  it('V-F01-07: replay has no second password or audit effect', async () => {
    const u = await user(); const c = await challenge(u);
    expect((await reset(c.id)).status).toBe(200);
    const before = await ctx.prisma.audit_events.count();
    expect((await reset(c.id, '246810', 'Replay!Different44')).status).toBe(401);
    expect(await verifyPassword(u.userId, replacement)).toBe(true); expect(await ctx.prisma.audit_events.count()).toBe(before);
  });
  it('V-F01-08: real blocked concurrent reset produces one effect', async () => {
    const u = await user(); const c = await challenge(u); const release = await lock('auth_challenges', c.id);
    const first = reset(c.id).then((r) => r.status); const second = reset(c.id).then((r) => r.status);
    try { await waiters('SELECT * FROM auth_challenges', 2); } finally { await release(); }
    expect((await Promise.all([first, second])).sort()).toEqual([200, 401]);
    expect(await verifyPassword(u.userId, replacement)).toBe(true);
  });
  it('V-F01-expiry-at-lock: a challenge expiring while queued cannot be consumed after expiry', async () => {
    const c = await challenge(await user(), '246810', 'PASSWORD_RESET', 800);
    const release = await lock('auth_challenges', c.id); const request = reset(c.id).then((r) => r.status);
    try { await waiters('SELECT * FROM auth_challenges', 1); await new Promise((r) => setTimeout(r, 1000)); }
    finally { await release(); }
    expect(await request).toBe(401);
  });
  it.each(['ACTIVATION', 'EMAIL_VERIFY', 'MFA', 'REGISTRATION_RECOVERY'] as const)('V-F01-other-%s: exact consume does not touch colliding proof', async (purpose) => {
    const a = await user(); const b = await user(); const ca = await challenge(a, '246810', purpose);
    const cb = await challenge(b, '246810', purpose);
    const used = await ctx.app.get(ChallengeService).consumeById(ca.id, purpose, '246810');
    expect(used.userId).toBe(a.userId);
    expect((await ctx.prisma.auth_challenges.findUniqueOrThrow({ where: { id: cb.id } })).consumed_at).toBeNull();
  });
  it('V-F01-no-locator: global OTP lookup is rejected', async () => {
    const a = await user(); const b = await user(); await challenge(a); await challenge(b);
    expect((await ctx.http.post('/api/v1/auth/password-resets').send({ token: '246810', newPassword: replacement })).status).toBe(401);
    expect(await verifyPassword(a.userId, password)).toBe(true); expect(await verifyPassword(b.userId, password)).toBe(true);
  });
  it('V-F01-09: password reset success/failure logs exclude OTP and raw passwords', async () => {
    const u = await user(); const c = await challenge(u);
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    try {
      await reset(c.id, '000000'); await reset(c.id);
      const captured = JSON.stringify([...log.mock.calls, ...error.mock.calls]);
      for (const secret of ['246810', password, replacement]) expect(captured.includes(secret)).toBe(false);
    } finally { log.mockRestore(); error.mockRestore(); }
  });

  it('V-F02-01: start and active view expose generation 1', async () => {
    const e = await exam(); expect(e.started.body.writerGeneration ?? e.view.body.writerGeneration ?? e.view.body.attempt.writerGeneration).toBe(1);
  });
  it('V-F02-02/03/04/10: takeover to 2 rejects same-cookie old generation and accepts generation 2', async () => {
    const e = await exam(); expect((await takeover(e)).body.writerGeneration).toBe(2);
    expect((await save(e, 1)).status).toBe(409); expect(await ctx.prisma.answers.count()).toBe(0);
    expect((await save(e, 2)).status).toBe(200); expect(await ctx.prisma.answers.count()).toBe(1);
  });
  it('V-F02-05: old generation review flag is rejected', async () => {
    const e = await exam(); await takeover(e);
    const r = await ctx.http.put(`/api/v1/me/attempts/${e.id}/review-flags/${e.q.deliveredQuestionId}`)
      .set(authed(e.cookies)).send({ flagged: true, expectedRevision: 0, writerGeneration: 1 });
    expect(r.status).toBe(409); expect(await ctx.prisma.review_flags.count()).toBe(0);
  });
  it('V-F02-required-answer: initial writer mutation must require generation', async () => {
    const e = await exam(); expect((await save(e, undefined)).status).toBe(400);
  });
  it('V-F02-required-flag: initial review mutation must require generation', async () => {
    const e = await exam(); const r = await ctx.http.put(`/api/v1/me/attempts/${e.id}/review-flags/${e.q.deliveredQuestionId}`)
      .set(authed(e.cookies)).send({ flagged: true, expectedRevision: 0 }); expect(r.status).toBe(400);
  });
  it('V-F02-06: stale submission rejected by authority and current generation can submit', async () => {
    const e = await exam(); await takeover(e);
    const post = (g: number) => ctx.http.post(`/api/v1/me/attempts/${e.id}/submission`)
      .set(authed(e.cookies)).set('Idempotency-Key', randomUUID()).send({ writerGeneration: g });
    const stale = await post(1); const current = await post(2);
    expect([stale.status, current.status]).toEqual([409, 200]);
  });
  it('V-F02-current-submit: current writer after takeover can submit through existing empty-body API', async () => {
    const e = await exam(); await takeover(e);
    const r = await ctx.http.post(`/api/v1/me/attempts/${e.id}/submission`)
      .set(authed(e.cookies)).set('Idempotency-Key', randomUUID()).send(); expect(r.status).toBe(200);
  });
  it('V-F02-09: different old session rejected, new session succeeds', async () => {
    const e = await exam(); const other = await login(ctx, e.email, password); await takeover(e, other.cookies);
    expect((await save(e, 2)).status).toBe(409); expect((await save(e, 2, other.cookies)).status).toBe(200);
  });
  it.each(['revoked', 'disabled'])('V-F02-07/08-%s: authority invalidated while waiting is rechecked inside the gate', async (mode) => {
    const e = await exam(); const release = await lock('attempts', e.id); const request = save(e, 1).then((r) => r.status);
    try {
      await waiters('SELECT a.* FROM attempts', 1);
      if (mode === 'disabled') await ctx.prisma.users.update({ where: { id: e.userId }, data: { status: 'DISABLED' } });
      else await ctx.prisma.auth_sessions.updateMany({ where: { user_id: e.userId }, data: { revoked_at: new Date() } });
    } finally { await release(); }
    expect([401, 403, 409]).toContain(await request); expect(await ctx.prisma.answers.count()).toBe(0);
  });
  it.each(['takeover-first', 'save-first'])('V-F02-race-%s: real PostgreSQL queue establishes serial save/takeover order', async (order) => {
    const e = await exam(); const release = await lock('attempts', e.id);
    let s!: Promise<number>; let t!: Promise<number>;
    try {
      if (order === 'takeover-first') t = takeover(e).then((r) => r.status); else s = save(e, 1).then((r) => r.status);
      await waiters('SELECT a.* FROM attempts', 1);
      if (order === 'takeover-first') s = save(e, 1).then((r) => r.status); else t = takeover(e).then((r) => r.status);
      await waiters('SELECT a.* FROM attempts', 2);
    } finally { await release(); }
    expect(await t).toBe(200); expect(await s).toBe(order === 'takeover-first' ? 409 : 200);
    expect(await ctx.prisma.answers.count()).toBe(order === 'takeover-first' ? 0 : 1);
    expect((await save(e, 1)).status).toBe(409);
  });

  it('V-F03-01: anonymous draft must not fabricate verified READ_EDIT_PROFILE authority', async () => {
    const d = await createDraft(ctx); const grants = await ctx.prisma.registration_access_grants.findMany({ where: { registration_id: d.registrationId } });
    expect(grants.filter((g) => g.scope === 'READ_EDIT_PROFILE' && g.email_verified_at !== null).length).toBe(0);
  });
  it('V-F03-02/09/10: initial upload works without User or exam session', async () => {
    const d = await createDraft(ctx); expect((await uploadPhoto(ctx, d)).status).toBe(201);
    expect(await ctx.prisma.users.count()).toBe(0); expect(await ctx.prisma.auth_sessions.count()).toBe(0);
    expect((await ctx.http.get('/api/v1/me/assignments').set('x-registration-token', d.profileToken)).status).toBe(401);
  });
  it('V-F03-03: later private edit without verified recovery must be denied', async () => {
    const d = await createDraft(ctx);
    const r = await ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', d.profileToken).send({ fullName: 'Unverified Later Edit' });
    expect([401, 403]).toContain(r.status);
  });
  it('V-F03-05/06/07: existing grants are scoped, expiring, revocable even for same-email duplicates', async () => {
    const email = `duplicate-${randomUUID()}@example.com`;
    const a = await createDraft(ctx, { email }); const b = await createDraft(ctx, { email });
    expect((await ctx.http.get(`/api/v1/registrations/${b.registrationId}`).set('x-registration-token', a.profileToken)).status).toBe(403);
    await ctx.prisma.registration_access_grants.updateMany({ where: { registration_id: a.registrationId }, data: { revoked_at: new Date() } });
    expect((await ctx.http.get(`/api/v1/registrations/${a.registrationId}`).set('x-registration-token', a.profileToken)).status).toBe(401);
    await ctx.prisma.registration_access_grants.updateMany({ where: { registration_id: b.registrationId }, data: { created_at: new Date(Date.now() - 60000), expires_at: new Date(Date.now() - 1000) } });
    expect((await ctx.http.get(`/api/v1/registrations/${b.registrationId}`).set('x-registration-token', b.profileToken)).status).toBe(401);
  });
  it('V-F03-04/08-contract: a registration recovery verification flow must actually exist', () => {
    const doc = SwaggerModule.createDocument(ctx.app, new DocumentBuilder().build());
    expect(Object.keys(doc.paths).some((p) => /registration.*(?:recovery|access.*verification)/i.test(p))).toBe(true);
  });
  it('V-F04-01: before-deadline PATCH supports expectedRevision', async () => {
    const d = await createDraft(ctx); const reg = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    const token = await verifiedEditToken(d);
    const r = await ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', token)
      .send({ fullName: 'Current Revision', expectedRevision: Number(reg.revision) }); expect(r.status).toBe(200);
  });
  it('V-F04-02: existing PATCH cannot update draft after authoritative deadline', async () => {
    const d = await createDraft(ctx); const reg = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    await ctx.prisma.competitions.update({ where: { id: reg.competition_id }, data: { registration_closes_at: new Date(Date.now() - 1000) } });
    const token = await verifiedEditToken(d);
    const r = await ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', token).send({ fullName: 'Late Edit' });
    expect([403, 409]).toContain(r.status);
  });
  it('V-F04-03: stale revision receives a state conflict, not an unknown-field validation error', async () => {
    const d = await createDraft(ctx); const token = await verifiedEditToken(d); const r = await ctx.http.patch(`/api/v1/registrations/${d.registrationId}`)
      .set('x-registration-token', token).send({ fullName: 'Stale', expectedRevision: 0 }); expect(r.status).toBe(409);
  });
  it('V-F04-04: concurrent requests with same revision produce one success', async () => {
    const d = await createDraft(ctx); const reg = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    const token = await verifiedEditToken(d);
    const patch = (name: string) => ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', token)
      .send({ fullName: name, expectedRevision: Number(reg.revision) });
    const rows = await Promise.all([patch('Concurrent A'), patch('Concurrent B')]); expect(rows.map((r) => r.status).sort()).toEqual([200, 409]);
  });
  it('V-F04-legacy-concurrent: no-revision requests cannot both silently overwrite', async () => {
    const d = await createDraft(ctx); const token = await verifiedEditToken(d); const patch = (name: string) => ctx.http.patch(`/api/v1/registrations/${d.registrationId}`)
      .set('x-registration-token', token).send({ fullName: name });
    const rows = await Promise.all([patch('Legacy A'), patch('Legacy B')]); expect(rows.filter((r) => r.status === 200).length).toBe(0);
  });
  async function submitted() {
    const d = await createDraft(ctx); await seedReadyVideo(ctx, d.registrationId); await seedReadyPhoto(ctx, d.registrationId);
    const r = await ctx.http.post(`/api/v1/registrations/${d.registrationId}/submission`).set('x-registration-token', d.profileToken).set('Idempotency-Key', randomUUID()).send();
    expect(r.status).toBe(201); return d;
  }
  it('V-F04-05/06/07/08: submitted current profile remains editable without changing submission evidence', async () => {
    const d = await submitted(); const before = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    const video = await ctx.prisma.registration_videos.findUniqueOrThrow({ where: { registration_id: d.registrationId } });
    const photo = await ctx.prisma.media_uploads.findMany({ where: { registration_id: d.registrationId, object_key: { startsWith: 'p/' } } });
    const token = await verifiedEditToken(d);
    // Setup adaptation: the PATCH contract requires expectedRevision (CAS).
    const r = await ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', token).send({ fullName: 'Post Submission Current Profile', expectedRevision: Number(before.revision) });
    const after = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    expect(after.submitted_profile).toEqual(before.submitted_profile);
    expect(await ctx.prisma.registration_videos.findUniqueOrThrow({ where: { registration_id: d.registrationId } })).toEqual(video);
    expect(await ctx.prisma.media_uploads.findMany({ where: { registration_id: d.registrationId, object_key: { startsWith: 'p/' } } })).toEqual(photo);
    expect(r.status).toBe(200);
  });
  it('V-F04-09: submitted edit after deadline denied', async () => {
    const d = await submitted(); const reg = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    await ctx.prisma.competitions.update({ where: { id: reg.competition_id }, data: { registration_closes_at: new Date(Date.now() - 1000) } });
    const token = await verifiedEditToken(d);
    const r = await ctx.http.patch(`/api/v1/registrations/${d.registrationId}`).set('x-registration-token', token).send({ fullName: 'Late Submitted' });
    expect([403, 409]).toContain(r.status);
  });
  async function admin() {
    const u = await user(); const role = await ctx.prisma.roles.findUniqueOrThrow({ where: { code: 'ADMIN' } });
    await ctx.prisma.user_roles.deleteMany({ where: { user_id: u.userId } });
    await ctx.prisma.user_roles.create({ data: { user_id: u.userId, role_id: role.id } });
    await ctx.prisma.users.update({ where: { id: u.userId }, data: { mfa_enabled: true } }); return u;
  }
  it('V-F05-01: Admin password returns explicit MFA_REQUIRED with no full session', async () => {
    const u = await admin(); const r = await login(ctx, u.email, password);
    expect(r.body.status ?? r.body.state).toBe('MFA_REQUIRED'); expect(r.cookies.session).toBe('');
    expect(await ctx.prisma.auth_sessions.count({ where: { user_id: u.userId, mfa_verified_at: null } })).toBe(0);
  });
  it('V-F05-08/09: Student normal login and disabled Admin denial', async () => {
    const s = await user(); expect((await login(ctx, s.email, password)).status).toBe(200);
    const a = await admin(); await ctx.prisma.users.update({ where: { id: a.userId }, data: { status: 'DISABLED' } });
    expect((await login(ctx, a.email, password)).status).toBe(401);
  });
  it('V-F05-02/03/04/05/06/07-contract: exact Admin MFA verification endpoint must exist', async () => {
    const r = await ctx.http.post(`/api/v1/auth/admin/mfa-challenges/${randomUUID()}/verification`).send({ code: '000000' });
    expect(r.status).not.toBe(404);
    const doc = SwaggerModule.createDocument(ctx.app, new DocumentBuilder().build());
    expect(doc.paths['/api/v1/auth/admin/mfa-challenges/{challenge}/verification']?.post).toBeDefined();
  });
  it('V-F05-11: failed mail adapter cannot yield full Admin session', async () => {
    const u = await admin(); const mailer = ctx.app.get<{ send: (...args: unknown[]) => Promise<void> }>(MAILER);
    const spy = jest.spyOn(mailer, 'send').mockRejectedValue(new Error('independent synthetic delivery failure'));
    try { await login(ctx, u.email, password); expect(await ctx.prisma.auth_sessions.count({ where: { user_id: u.userId, mfa_verified_at: null, revoked_at: null } })).toBe(0); }
    finally { spy.mockRestore(); }
  });
  it('V-contract: generated mutation contract requires generation and registration revision', () => {
    const doc = SwaggerModule.createDocument(ctx.app, new DocumentBuilder().addSecurity('cookie', { type: 'apiKey', in: 'cookie', name: 'isng_session' }).build());
    const schemas = doc.components?.schemas as Record<string, { required?: string[] }>;
    expect(schemas.SaveAnswerDto.required).toContain('writerGeneration');
    expect(schemas.ReviewFlagDto.required).toContain('writerGeneration');
    expect(schemas.UpdateRegistrationDto.required).toContain('expectedRevision');
  });
});
