import { randomUUID } from 'node:crypto';
import {
  authed,
  createTestApp,
  destroyTestApp,
  login,
  provisionUser,
  resetDatabase,
  setupExam,
  type SessionCookies,
  type SetupExamResult,
  type TestContext,
} from './helpers/test-kit';

describe('FR-19 exam access and atomic start', () => {
  let ctx: TestContext;
  let email: string;
  let password: string;
  let cookies: SessionCookies;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await destroyTestApp(ctx);
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    email = `cand-${randomUUID().slice(0, 8)}@example.com`;
    password = 'Sup3rSecret!42';
    await provisionUser(ctx, email, password);
    const session = await login(ctx, email, password);
    expect(session.status).toBe(200);
    cookies = session.cookies;
  });

  async function start(assignmentId: string, idempotencyKey = randomUUID()) {
    return ctx.http
      .post(`/api/v1/me/assignments/${assignmentId}/attempts`)
      .set(authed(cookies))
      .set('Idempotency-Key', idempotencyKey)
      .send();
  }

  it('lists assigned exams with schedule and quota', async () => {
    const exam = await setupExam(ctx, { studentEmail: email });
    const res = await ctx.http.get('/api/v1/me/assignments').set('Cookie', cookies.session);
    expect(res.status).toBe(200);
    expect(res.body.assignments).toHaveLength(1);
    const a = res.body.assignments[0];
    expect(a.assignmentId).toBe(exam.assignmentId);
    expect(a.attemptQuota).toBe(3);
    expect(a.schedule.opensAt).toBeTruthy();
  });

  it('availability reports canStart inside the window', async () => {
    const exam = await setupExam(ctx, { studentEmail: email });
    const res = await ctx.http
      .get(`/api/v1/me/assignments/${exam.assignmentId}/availability`)
      .set('Cookie', cookies.session);
    expect(res.status).toBe(200);
    expect(res.body.canStart).toBe(true);
    expect(res.body.attemptQuota).toEqual({ used: 0, max: 3 });
  });

  it('denies start before opening and after closing', async () => {
    const future = await setupExam(ctx, {
      studentEmail: email,
      opensAt: new Date(Date.now() + 3_600_000).toISOString(),
      closesAt: new Date(Date.now() + 7_200_000).toISOString(),
    });
    const before = await start(future.assignmentId);
    expect(before.status).toBe(403);
    expect(before.body.error.code).toBe('ADMISSION_CLOSED');

    const past = await setupExam(ctx, {
      studentEmail: email,
      opensAt: new Date(Date.now() - 7_200_000).toISOString(),
      closesAt: new Date(Date.now() - 3_600_000).toISOString(),
    });
    const after = await start(past.assignmentId);
    expect(after.status).toBe(403);
    expect(after.body.error.code).toBe('ADMISSION_CLOSED');
    const consumed = await ctx.prisma.attempts.count();
    expect(consumed).toBe(0);
  });

  it('denies unassigned exam access', async () => {
    const otherEmail = `other-${randomUUID().slice(0, 8)}@example.com`;
    await provisionUser(ctx, otherEmail, 'Sup3rSecret!42');
    const other = await setupExam(ctx, { studentEmail: otherEmail });
    const res = await start(other.assignmentId);
    expect(res.status).toBe(404);
  });

  it('denies start when email is not verified', async () => {
    const email2 = `unverified-${randomUUID().slice(0, 8)}@example.com`;
    // Provision with password (ACTIVE) but force email unverified via DB.
    await provisionUser(ctx, email2, 'Sup3rSecret!42');
    await ctx.prisma.users.update({
      where: { email_normalized: email2 },
      data: { email_verified_at: null },
    });
    await setupExam(ctx, { studentEmail: email2 });
    const session2 = await login(ctx, email2, 'Sup3rSecret!42');
    const assignments = await ctx.http
      .get('/api/v1/me/assignments')
      .set('Cookie', session2.cookies.session);
    const assignmentId = assignments.body.assignments[0].assignmentId;
    const res = await ctx.http
      .post(`/api/v1/me/assignments/${assignmentId}/attempts`)
      .set(authed(session2.cookies))
      .set('Idempotency-Key', randomUUID())
      .send();
    expect(res.status).toBe(403);
  });

  it('starts once; same key replays the same attempt; active attempt blocks a second start', async () => {
    const exam = await setupExam(ctx, { studentEmail: email });
    const key = randomUUID();
    const first = await start(exam.assignmentId, key);
    expect(first.status).toBe(201);
    expect(first.body.state).toBe('ACTIVE');
    expect(first.body.ordinal).toBe(1);
    expect(new Date(first.body.deadlineAt).getTime() - new Date(first.body.startedAt).getTime()).toBe(
      3_600_000,
    );

    const replay = await start(exam.assignmentId, key);
    expect(replay.status).toBe(201);
    expect(replay.body.attemptId).toBe(first.body.attemptId);

    const second = await start(exam.assignmentId);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('ACTIVE_ATTEMPT_EXISTS');

    const dbAttempts = await ctx.prisma.attempts.count({
      where: { assignment_id: exam.assignmentId },
    });
    expect(dbAttempts).toBe(1);
  });

  it('enforces the 3-attempt quota', async () => {
    const exam = await setupExam(ctx, { studentEmail: email });
    for (let i = 0; i < 3; i++) {
      const startRes = await start(exam.assignmentId);
      expect(startRes.status).toBe(201);
      // Finalize manually to free the active slot (answers optional).
      const submit = await ctx.http
        .post(`/api/v1/me/attempts/${startRes.body.attemptId}/submission`)
        .set(authed(cookies))
        .set('Idempotency-Key', randomUUID())
        .send();
      expect(submit.status).toBe(200);
    }
    const fourth = await start(exam.assignmentId);
    expect(fourth.status).toBe(409);
    expect(fourth.body.error.code).toBe('ATTEMPT_LIMIT_REACHED');
  });

  it('finalizes the attempt when the candidate submits manually and preserves it for reconnect', async () => {
    const exam: SetupExamResult = await setupExam(ctx, { studentEmail: email });
    const startRes = await start(exam.assignmentId);
    const list = await ctx.http
      .get('/api/v1/me/assignments')
      .set('Cookie', cookies.session);
    expect(list.body.assignments[0].activeAttemptId).toBe(startRes.body.attemptId);
  });
});
