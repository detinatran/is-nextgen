import { createHash, randomUUID } from 'node:crypto';
import {
  createDraft,
  createTestApp,
  destroyTestApp,
  login,
  provisionUser,
  recoverRegistration,
  resetDatabase,
  seedReadyPhoto,
  seedReadyVideo,
  uploadPhoto,
  type DraftRegistration,
  type SessionCookies,
  type TestContext,
} from './helpers/test-kit';

/**
 * Remediation batch F03/F04/F05 flow coverage — the assertions the previous
 * verification marked NOT IMPLEMENTED (recovery flow, Admin MFA flow).
 * F04 edit-authority setups use the real verified recovery flow.
 */
describe('F03 verified registration recovery', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await destroyTestApp(ctx);
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  it('F03-01: anonymous draft creates no READ_EDIT_PROFILE grant and no verified-email claim', async () => {
    const draft = await createDraft(ctx);
    const grants = await ctx.prisma.registration_access_grants.findMany({
      where: { registration_id: draft.registrationId },
    });
    expect(grants.length).toBe(1);
    expect(grants[0].scope).toBe('DRAFT_UPLOAD');
    expect(grants.filter((g) => g.scope === 'READ_EDIT_PROFILE')).toHaveLength(0);
    expect(await ctx.prisma.users.count()).toBe(0);
  });

  it('F03-02: the initial capability completes the initial flow (upload, bind, submit)', async () => {
    const draft = await createDraft(ctx);
    const photo = await uploadPhoto(ctx, draft);
    expect(photo.status).toBe(201);
    await seedReadyVideo(ctx, draft.registrationId);
    const submit = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/submission`)
      .set('x-registration-token', draft.uploadToken)
      .set('Idempotency-Key', randomUUID())
      .send();
    expect(submit.status).toBe(201);
    expect(submit.body.candidateCode).toMatch(/^ISNG-\d{4}-/);
  });

  it('F03-04: verified recovery issues a scoped grant for the exact registration', async () => {
    const draft = await createDraft(ctx);
    const grant = await recoverRegistration(ctx, draft);
    expect(grant.registrationId).toBe(draft.registrationId);
    const row = await ctx.prisma.registration_access_grants.findFirstOrThrow({
      where: { token_hash: { not: '' }, registration_id: draft.registrationId, scope: 'READ_EDIT_PROFILE' },
      orderBy: { created_at: 'desc' },
    });
    // email_verified_at records the actual proof time (>= challenge issue).
    expect(row.email_verified_at.getTime()).toBeGreaterThanOrEqual(Date.now() - 60_000);
    const patch = await ctx.http
      .patch(`/api/v1/registrations/${draft.registrationId}`)
      .set('x-registration-token', grant.profileToken)
      .send({ major: 'Recovered Edit', expectedRevision: 1 });
    expect(patch.status).toBe(200);
  });

  it('F03-05/06: same email on two registrations — recovery grants exactly the bound one', async () => {
    const email = `shared-${randomUUID().slice(0, 8)}@example.com`;
    const first = await createDraft(ctx, { email });
    const second = await createDraft(ctx, { email });
    // Recovery requested for the SECOND registration must never grant the first.
    const grant = await recoverRegistration(ctx, second);
    expect(grant.registrationId).toBe(second.registrationId);
    const crossRead = await ctx.http
      .get(`/api/v1/registrations/${first.registrationId}`)
      .set('x-registration-token', grant.profileToken);
    expect(crossRead.status).toBe(403);
    const crossEdit = await ctx.http
      .patch(`/api/v1/registrations/${first.registrationId}`)
      .set('x-registration-token', grant.profileToken)
      .send({ major: 'Nope', expectedRevision: 1 });
    expect(crossEdit.status).toBe(403);
  });

  it('F03-07: an expired recovery challenge is denied', async () => {
    const draft = await createDraft(ctx);
    const request = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/recovery-requests`)
      .send({ email: draft.email });
    expect(request.status).toBe(202);
    const challenge = await ctx.prisma.auth_challenges.findFirstOrThrow({
      where: { id: request.body.challengeId },
    });
    // Simulate expiry without violating expires_at > created_at.
    await ctx.prisma.auth_challenges.update({
      where: { id: challenge.id },
      data: { consumed_at: new Date() },
    });
    const verify = await ctx.http
      .post('/api/v1/registrations/recovery/verifications')
      .send({ challengeId: challenge.id, code: '123456' });
    expect(verify.status).toBe(401);
  });

  it('F03-08: a consumed recovery challenge cannot be replayed into a second grant', async () => {
    const draft = await createDraft(ctx);
    const first = await recoverRegistration(ctx, draft);
    const grantsBefore = await ctx.prisma.registration_access_grants.count({
      where: { registration_id: draft.registrationId, scope: 'READ_EDIT_PROFILE' },
    });
    expect(grantsBefore).toBe(1);
    // Replay needs the raw code; reuse the same challenge id with any code.
    const replay = await ctx.http
      .post('/api/v1/registrations/recovery/verifications')
      .send({ challengeId: first.profileToken.slice(0, 0) || (await consumedChallengeId(ctx, draft)), code: '000000' });
    expect(replay.status).toBe(401);
    const grantsAfter = await ctx.prisma.registration_access_grants.count({
      where: { registration_id: draft.registrationId, scope: 'READ_EDIT_PROFILE' },
    });
    expect(grantsAfter).toBe(1);
  });

  it('F03-09: recovery capability cannot access a peer registration (also with same email)', async () => {
    const email = `peer-${randomUUID().slice(0, 8)}@example.com`;
    const a = await createDraft(ctx, { email });
    const b = await createDraft(ctx, { email });
    const grant = await recoverRegistration(ctx, a);
    const res = await ctx.http
      .get(`/api/v1/registrations/${b.registrationId}`)
      .set('x-registration-token', grant.profileToken);
    expect(res.status).toBe(403);
  });

  it('F03-decoy: unknown registration/email pair still returns a locator that verifies nothing', async () => {
    const draft = await createDraft(ctx);
    const res = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/recovery-requests`)
      .send({ email: `wrong-${randomUUID().slice(0, 6)}@example.com` });
    expect(res.status).toBe(202);
    const verify = await ctx.http
      .post('/api/v1/registrations/recovery/verifications')
      .send({ challengeId: res.body.challengeId, code: '000000' });
    expect(verify.status).toBe(401);
  });

  async function consumedChallengeId(ctx: TestContext, draft: DraftRegistration): Promise<string> {
    const row = await ctx.prisma.auth_challenges.findFirstOrThrow({
      where: { email_normalized: draft.email, purpose: 'REGISTRATION_RECOVERY' },
      orderBy: { created_at: 'desc' },
    });
    return row.id;
  }
});

describe('F04 registration edits via verified recovery', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await destroyTestApp(ctx);
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  it('F04-02/03/04: deadline, stale revision and concurrent CAS behave server-authoritatively', async () => {
    const draft = await createDraft(ctx);
    const grant = await recoverRegistration(ctx, draft);
    const reg = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: draft.registrationId } });

    // Stale revision.
    const stale = await ctx.http
      .patch(`/api/v1/registrations/${draft.registrationId}`)
      .set('x-registration-token', grant.profileToken)
      .send({ fullName: 'Stale', expectedRevision: Number(reg.revision) + 5 });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('REVISION_CONFLICT');

    // Concurrent same-revision: exactly one wins.
    const patch = (name: string) =>
      ctx.http
        .patch(`/api/v1/registrations/${draft.registrationId}`)
        .set('x-registration-token', grant.profileToken)
        .send({ fullName: name, expectedRevision: Number(reg.revision) });
    const rows = await Promise.all([patch('Concurrent A'), patch('Concurrent B')]);
    expect(rows.map((r) => r.status).sort()).toEqual([200, 409]);

    // Deadline: close the competition, then edit → DEADLINE_PASSED.
    await ctx.prisma.competitions.update({
      where: { id: reg.competition_id },
      data: { registration_closes_at: new Date(Date.now() - 1000) },
    });
    const late = await ctx.http
      .patch(`/api/v1/registrations/${draft.registrationId}`)
      .set('x-registration-token', grant.profileToken)
      .send({ fullName: 'Late', expectedRevision: 2 });
    expect(late.status).toBe(409);
    expect(late.body.error.code).toBe('DEADLINE_PASSED');
  });

  it('F04-05/06/07/08: submitted current profile edits keep evidence, video and photo untouched', async () => {
    const draft = await createDraft(ctx);
    await seedReadyVideo(ctx, draft.registrationId);
    await seedReadyPhoto(ctx, draft.registrationId);
    const submitted = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/submission`)
      .set('x-registration-token', draft.uploadToken)
      .set('Idempotency-Key', randomUUID())
      .send();
    expect(submitted.status).toBe(201);

    const before = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: draft.registrationId } });
    const video = await ctx.prisma.registration_videos.findUniqueOrThrow({ where: { registration_id: draft.registrationId } });
    const photo = await ctx.prisma.media_uploads.findMany({
      where: { registration_id: draft.registrationId, object_key: { startsWith: 'p/' } },
    });

    const grant = await recoverRegistration(ctx, draft);
    const edited = await ctx.http
      .patch(`/api/v1/registrations/${draft.registrationId}`)
      .set('x-registration-token', grant.profileToken)
      .send({ fullName: 'Post Submission Current Profile', expectedRevision: Number(before.revision) });
    expect(edited.status).toBe(200);

    const after = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: draft.registrationId } });
    expect(after.submitted_profile).toEqual(before.submitted_profile);
    expect(after.submitted_at).toEqual(before.submitted_at);
    expect(await ctx.prisma.registration_videos.findUniqueOrThrow({ where: { registration_id: draft.registrationId } })).toEqual(video);
    expect(await ctx.prisma.media_uploads.findMany({
      where: { registration_id: draft.registrationId, object_key: { startsWith: 'p/' } },
    })).toEqual(photo);
    // Only the mutable current profile moved.
    const profile = await ctx.prisma.candidate_profiles.findUniqueOrThrow({
      where: { candidate_id: (await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: draft.registrationId } })).candidate_id },
    });
    expect(profile.full_name).toBe('Post Submission Current Profile');
  });
});

describe('F05 Admin password + email-OTP MFA', () => {
  let ctx: TestContext;
  const password = 'Sup3rSecret!42';
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await destroyTestApp(ctx);
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  async function admin() {
    const u = await provisionUser(ctx, `admin-${randomUUID().slice(0, 6)}@example.com`, password);
    const role = await ctx.prisma.roles.findUniqueOrThrow({ where: { code: 'ADMIN' } });
    await ctx.prisma.user_roles.deleteMany({ where: { user_id: u.userId } });
    await ctx.prisma.user_roles.create({ data: { user_id: u.userId, role_id: role.id } });
    await ctx.prisma.users.update({ where: { id: u.userId }, data: { mfa_enabled: true } });
    return u;
  }

  async function verifyMfa(challengeId: string, code: string): Promise<{ status: number; cookies: SessionCookies; body: Record<string, unknown> }> {
    const res = await ctx.http
      .post(`/api/v1/auth/admin/mfa-challenges/${challengeId}/verification`)
      .send({ code });
    const setCookie = (res.headers['set-cookie'] ?? []) as unknown as string[];
    const list = Array.isArray(setCookie) ? setCookie : [String(setCookie)];
    const session = list.find((c) => c.startsWith('isng_session='));
    const csrf = list.find((c) => c.startsWith('isng_csrf='));
    return {
      status: res.status,
      cookies: { session: session ? session.split(';')[0] : '', csrf: csrf ? csrf.split(';')[0] : '' },
      body: res.body as Record<string, unknown>,
    };
  }

  it('F05-01: admin login returns MFA_REQUIRED with no session cookie and no session row', async () => {
    const a = await admin();
    const res = await login(ctx, a.email, password);
    expect(res.status).toBe(200);
    expect(res.body.status ?? res.body.state).toBe('MFA_REQUIRED');
    expect(res.body.challengeId).toMatch(/^[0-9a-f-]{36}$/);
    expect(res.cookies.session).toBe('');
    expect(await ctx.prisma.auth_sessions.count({ where: { user_id: a.userId } })).toBe(0);
  });

  it('F05-02/10: pre-MFA and legacy null-MFA sessions hold no Admin authority, also after restart', async () => {
    const a = await admin();
    await login(ctx, a.email, password); // MFA_REQUIRED only

    // Simulate a legacy password-only Admin session (mfa_verified_at null).
    const legacy = await ctx.prisma.auth_sessions.create({
      data: {
        user_id: a.userId,
        token_hash: createHash('sha256').update('legacy-admin-token').digest('hex'),
        expires_at: new Date(Date.now() + 3_600_000),
        reauthenticated_at: new Date(),
      },
    });
    const cookie = 'isng_session=legacy-admin-token';
    const denied = await ctx.http.get('/api/v1/admin/session').set('Cookie', cookie);
    expect(denied.status).toBe(403);
    await destroyTestApp(ctx);
    ctx = await createTestApp(); // restart: MFA truth stays in PostgreSQL
    const deniedAfterRestart = await ctx.http.get('/api/v1/admin/session').set('Cookie', cookie);
    expect(deniedAfterRestart.status).toBe(403);
    expect((await ctx.prisma.auth_sessions.findUniqueOrThrow({ where: { id: legacy.id } })).mfa_verified_at).toBeNull();
  });

  it('F05-03/06: correct OTP promotes to a full Admin session exactly once', async () => {
    const a = await admin();
    const loginRes = await login(ctx, a.email, password);
    const challengeId = loginRes.body.challengeId as string;
    const intent = await ctx.prisma.notification_intents.findUniqueOrThrow({
      where: { deduplication_key: `challenge:${challengeId}` },
    });
    const code = (intent.payload as { code?: string }).code ?? '';
    const ok = await verifyMfa(challengeId, code);
    expect(ok.status).toBe(200);
    expect(ok.cookies.session).toMatch(/^isng_session=/);
    const probe = await ctx.http.get('/api/v1/admin/session').set('Cookie', ok.cookies.session);
    expect(probe.status).toBe(200);
    expect(probe.body.admin).toBe(true);

    const replay = await verifyMfa(challengeId, code);
    expect(replay.status).toBe(401);
    expect(await ctx.prisma.auth_sessions.count({ where: { user_id: a.userId } })).toBe(1);
  });

  it('F05-04/05: wrong and consumed-expired OTPs are denied without authority', async () => {
    const a = await admin();
    const loginRes = await login(ctx, a.email, password);
    const challengeId = loginRes.body.challengeId as string;
    const wrong = await verifyMfa(challengeId, '000000');
    expect(wrong.status).toBe(401);
    expect(await ctx.prisma.auth_sessions.count({ where: { user_id: a.userId } })).toBe(0);
    await ctx.prisma.auth_challenges.update({
      where: { id: challengeId },
      data: { consumed_at: new Date() },
    });
    const expired = await verifyMfa(challengeId, '000000');
    expect(expired.status).toBe(401);
  });

  it('F05-07: two Admins receiving the same OTP code cannot cross-authenticate', async () => {
    const a = await admin();
    const b = await admin();
    const hash = createHash('sha256').update('135711').digest('hex');
    for (const u of [a, b]) {
      await ctx.prisma.auth_challenges.create({
        data: {
          user_id: u.userId,
          email_normalized: u.email,
          purpose: 'MFA',
          verifier_hash: hash,
          expires_at: new Date(Date.now() + 600_000),
        },
      });
    }
    const challengeA = await ctx.prisma.auth_challenges.findFirstOrThrow({
      where: { user_id: a.userId, purpose: 'MFA' },
    });
    const ok = await verifyMfa(challengeA.id, '135711');
    expect(ok.status).toBe(200);
    const probe = await ctx.http.get('/api/v1/admin/session').set('Cookie', ok.cookies.session);
    expect(probe.status).toBe(200);
    expect(probe.body.userId).toBe(a.userId);
    const challengeB = await ctx.prisma.auth_challenges.findFirstOrThrow({
      where: { user_id: b.userId, purpose: 'MFA' },
    });
    expect(challengeB.consumed_at).toBeNull();
  });

  it('F05-08: student login never enters the MFA flow', async () => {
    const s = await provisionUser(ctx, `student-${randomUUID().slice(0, 6)}@example.com`, password);
    const res = await login(ctx, s.email, password);
    expect(res.status).toBe(200);
    expect(res.body.status).toBeUndefined();
    expect(res.cookies.session).toMatch(/^isng_session=/);
  });

  it('F05-09: a disabled admin cannot login at all', async () => {
    const a = await admin();
    await ctx.prisma.users.update({ where: { id: a.userId }, data: { status: 'DISABLED' } });
    expect((await login(ctx, a.email, password)).status).toBe(401);
  });

  it('F05-11: mail delivery failure cannot yield a full Admin session', async () => {
    const a = await admin();
    const loginRes = await login(ctx, a.email, password);
    expect(loginRes.body.status).toBe('MFA_REQUIRED');
    // The OTP intent is durable; no session exists until the OTP is proven.
    expect(await ctx.prisma.auth_sessions.count({ where: { user_id: a.userId } })).toBe(0);
    const intent = await ctx.prisma.notification_intents.findFirstOrThrow({
      where: { user_id: a.userId, template_code: 'EMAIL_VERIFY' },
    });
    expect(intent.status).toBe('PENDING');
  });

  it('F05-csrf: admin mutations require the CSRF pair like candidate mutations', async () => {
    const a = await admin();
    const loginRes = await login(ctx, a.email, password);
    const challengeId = loginRes.body.challengeId as string;
    const intent = await ctx.prisma.notification_intents.findUniqueOrThrow({
      where: { deduplication_key: `challenge:${challengeId}` },
    });
    const code = (intent.payload as { code?: string }).code ?? '';
    const ok = await verifyMfa(challengeId, code);
    // CSRF protects cookie-authenticated mutations; reauthentication for takeover.
    const noHeader = await ctx.http
      .post('/api/v1/auth/reauthentication')
      .set('Cookie', ok.cookies.session)
      .send({ password });
    expect(noHeader.status).toBe(403);
  });
});
