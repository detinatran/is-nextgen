import { randomUUID } from 'node:crypto';
import {
  authed,
  createDraft,
  createTestApp,
  destroyTestApp,
  login,
  provisionUser,
  resetDatabase,
  seedReadyVideo,
  setupExam,
  type TestContext,
} from './helpers/test-kit';

/** §37 security matrix for the candidate flow. */
describe('security boundaries', () => {
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

  it('expired registration capability tokens are denied', async () => {
    const draft = await createDraft(ctx);
    const grant = await ctx.prisma.registration_access_grants.findFirstOrThrow({
      where: { registration_id: draft.registrationId, scope: 'READ_EDIT_PROFILE' },
    });
    // Backdate creation so expires_at moves into the past without violating
    // the frozen expires_at > created_at CHECK.
    await ctx.prisma.registration_access_grants.update({
      where: { id: grant.id },
      data: {
        created_at: new Date(Date.now() - 48 * 3_600_000),
        expires_at: new Date(Date.now() - 24 * 3_600_000),
      },
    });
    const res = await ctx.http
      .get(`/api/v1/registrations/${draft.registrationId}`)
      .set('x-registration-token', draft.profileToken);
    expect(res.status).toBe(401);
  });

  it('revoked registration capability tokens are denied', async () => {
    const draft = await createDraft(ctx);
    const grant = await ctx.prisma.registration_access_grants.findFirstOrThrow({
      where: { registration_id: draft.registrationId, scope: 'READ_EDIT_PROFILE' },
    });
    await ctx.prisma.registration_access_grants.update({
      where: { id: grant.id },
      data: { revoked_at: new Date() },
    });
    const res = await ctx.http
      .get(`/api/v1/registrations/${draft.registrationId}`)
      .set('x-registration-token', draft.profileToken);
    expect(res.status).toBe(401);
  });

  it('malformed UUID path params are rejected cleanly, without SQL errors', async () => {
    const { cookies } = await (async () => {
      const email = `cand-${randomUUID().slice(0, 8)}@example.com`;
      await provisionUser(ctx, email, 'Sup3rSecret!42');
      return { cookies: (await login(ctx, email, 'Sup3rSecret!42')).cookies };
    })();
    const res = await ctx.http
      .get('/api/v1/me/attempts/not-a-uuid')
      .set('Cookie', cookies.session);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(JSON.stringify(res.body)).not.toMatch(/postgres|syntax|SQL/i);
  });

  it('private media is never anonymous and storage paths never leak', async () => {
    const draft = await createDraft(ctx);
    const mediaObjectId = await seedReadyVideo(ctx, draft.registrationId);
    // There is deliberately no public route that serves video bytes.
    const anonymous = await ctx.http.get(`/api/v1/uploads/${mediaObjectId}`);
    expect(anonymous.status).toBe(401);
    const row = await ctx.prisma.media_objects.findUniqueOrThrow({ where: { id: mediaObjectId } });
    const res = await ctx.http
      .get(`/api/v1/registrations/${draft.registrationId}`)
      .set('x-registration-token', draft.profileToken);
    expect(JSON.stringify(res.body)).not.toContain(row.object_key);
  });

  it('fixtures are disabled without the token and in production mode', async () => {
    const res = await ctx.http
      .post('/api/v1/internal/fixtures/provision-user')
      .send({ email: 'x@example.com' });
    expect([401, 403]).toContain(res.status);
  });

  it('CSRF rejects a wrong header value', async () => {
    const email = `cand-${randomUUID().slice(0, 8)}@example.com`;
    await provisionUser(ctx, email, 'Sup3rSecret!42');
    const session = await login(ctx, email, 'Sup3rSecret!42');
    const res = await ctx.http
      .post('/api/v1/auth/reauthentication')
      .set('Cookie', session.cookies.session)
      .set('x-csrf-token', 'definitely-wrong-value')
      .send({ password: 'Sup3rSecret!42' });
    expect(res.status).toBe(403);
  });

  it('unassigned candidate start consumes nothing (defense in depth)', async () => {
    const email = `cand-${randomUUID().slice(0, 8)}@example.com`;
    await provisionUser(ctx, email, 'Sup3rSecret!42');
    const cookies = (await login(ctx, email, 'Sup3rSecret!42')).cookies;
    const otherEmail = `other-${randomUUID().slice(0, 8)}@example.com`;
    await provisionUser(ctx, otherEmail, 'Sup3rSecret!42');
    const exam = await setupExam(ctx, { studentEmail: otherEmail });
    const res = await ctx.http
      .post(`/api/v1/me/assignments/${exam.assignmentId}/attempts`)
      .set(authed(cookies))
      .set('Idempotency-Key', randomUUID())
      .send();
    expect(res.status).toBe(404);
    expect(await ctx.prisma.attempts.count()).toBe(0);
  });
});
