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
  type TestContext,
} from './helpers/test-kit';
import { AttemptFinalizationService } from '../../src/attempts/finalization.service';

/**
 * §32 service-level concurrency tests. The DB invariants are already proven
 * by CT-01..CT-04; here the same guarantees must hold through the service
 * layer with real competing requests.
 */
describe('concurrency: competing writers on real PostgreSQL', () => {
  let ctx: TestContext;
  let finalization: AttemptFinalizationService;

  beforeAll(async () => {
    ctx = await createTestApp();
    finalization = ctx.app.get(AttemptFinalizationService);
  });
  afterAll(async () => {
    await destroyTestApp(ctx);
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  async function candidate() {
    const email = `cand-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'Sup3rSecret!42';
    await provisionUser(ctx, email, password);
    const session = await login(ctx, email, password);
    return { email, cookies: session.cookies as SessionCookies };
  }

  async function start(c: SessionCookies, assignmentId: string, key = randomUUID()) {
    return ctx.http
      .post(`/api/v1/me/assignments/${assignmentId}/attempts`)
      .set(authed(c))
      .set('Idempotency-Key', key)
      .send();
  }

  it('C1: double HTTP start with the same key consumes exactly one attempt', async () => {
    const { cookies } = await candidate();
    const own = await setupExamFor(cookies);

    const key = randomUUID();
    const [a, b] = await Promise.all([start(cookies, own, key), start(cookies, own, key)]);
    const outcomes = [a.status, b.status];
    expect(outcomes).toContain(201);
    expect(outcomes.every((s) => s === 201 || s === 409)).toBe(true);
    if (a.status === 201 && b.status === 201) {
      expect(a.body.attemptId).toBe(b.body.attemptId);
    }
    expect(await ctx.prisma.attempts.count({ where: { assignment_id: own } })).toBe(1);
  });

  it('C2: competing starts across assignments consume at most one active attempt', async () => {
    const { cookies } = await candidate();
    const exam1 = await setupExamFor(cookies);
    const exam2 = await setupExamFor(cookies);

    const [a, b] = await Promise.all([
      start(cookies, exam1),
      start(cookies, exam2),
    ]);
    expect([a.status, b.status]).toContain(201);
    expect([a.status, b.status]).toContain(409);
    for (const res of [a, b]) {
      if (res.status === 409) expect(res.body.error.code).toBe('ACTIVE_ATTEMPT_EXISTS');
    }
    expect(await ctx.prisma.attempts.count()).toBe(1);
    expect(await ctx.prisma.attempts.count({ where: { state: 'ACTIVE' } })).toBe(1);
  });

  it('C3: save vs submit race keeps the attempt consistent and answers authoritative', async () => {
    const { cookies } = await candidate();
    const assignment = await setupExamFor(cookies);
    const started = await start(cookies, assignment);
    const attemptId = started.body.attemptId as string;
    const view = await ctx.http.get(`/api/v1/me/attempts/${attemptId}`).set('Cookie', cookies.session);
    const q = view.body.form[0];

    const [save, submit] = await Promise.all([
      ctx.http
        .put(`/api/v1/me/attempts/${attemptId}/answers/${q.deliveredQuestionId}`)
        .set(authed(cookies))
        .send({ selectedOptionId: q.options[0].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID() }),
      ctx.http
        .post(`/api/v1/me/attempts/${attemptId}/submission`)
        .set(authed(cookies))
        .set('Idempotency-Key', randomUUID())
        .send(),
    ]);

    const attempt = await ctx.prisma.attempts.findUniqueOrThrow({ where: { id: attemptId } });
    expect(attempt.state).toBe('FINALIZED');
    expect(await ctx.prisma.submissions.count({ where: { attempt_id: attemptId } })).toBe(1);
    // The save either committed before finalization or was rejected after it.
    const answers = await ctx.prisma.answers.findMany({ where: { attempt_id: attemptId } });
    if (save.status === 200) {
      expect(answers).toHaveLength(1);
      expect(submit.status).toBe(200);
    } else {
      expect(save.status).toBe(409);
    }
  });

  it('C4: save vs timeout race can never persist an answer past the deadline', async () => {
    const { cookies } = await candidate();
    const assignment = await setupExamFor(cookies);
    const fixture = await ctx.http
      .post('/api/v1/internal/fixtures/insert-overdue-attempt')
      .set('x-fixtures-token', 'test-fixtures-token')
      .send({ assignmentId: assignment, minutesOverdue: 20 });
    const attemptId = fixture.body.attemptId as string;
    const q = await ctx.prisma.delivered_questions.findFirstOrThrow({ where: { attempt_id: attemptId } });
    const o = await ctx.prisma.delivered_options.findFirstOrThrow({ where: { delivered_question_id: q.id } });

    const [save, timeout] = await Promise.all([
      ctx.http
        .put(`/api/v1/me/attempts/${attemptId}/answers/${q.id}`)
        .set(authed(cookies))
        .send({ selectedOptionId: o.id, expectedRevision: 0, mutationId: randomUUID() }),
      finalization.finalizeOverdueAttempt(attemptId, 'c4-test'),
    ]);

    const attempt = await ctx.prisma.attempts.findUniqueOrThrow({ where: { id: attemptId } });
    expect(attempt.state).toBe('FINALIZED');
    expect(attempt.finalization_cause).toBe('TIMEOUT');
    expect(save.status).toBe(409);
    expect(await ctx.prisma.answers.count({ where: { attempt_id: attemptId } })).toBe(0);
    expect(timeout).not.toBeNull();
  });

  it('C5: writer takeover invalidates the old writer under race', async () => {
    const { email, cookies } = await candidate();
    const assignment = await setupExamFor(cookies);
    const started = await start(cookies, assignment);
    const attemptId = started.body.attemptId as string;
    const view = await ctx.http.get(`/api/v1/me/attempts/${attemptId}`).set('Cookie', cookies.session);
    const q = view.body.form[0];

    // Second device: fresh reauthentication + takeover, racing an old-writer save.
    const session2 = await login(ctx, email, 'Sup3rSecret!42');
    await ctx.http.post('/api/v1/auth/reauthentication').set(authed(session2.cookies)).send({ password: 'Sup3rSecret!42' });

    const [oldSave, takeover] = await Promise.all([
      ctx.http
        .put(`/api/v1/me/attempts/${attemptId}/answers/${q.deliveredQuestionId}`)
        .set(authed(cookies))
        .send({ selectedOptionId: q.options[0].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID() }),
      ctx.http.post(`/api/v1/me/attempts/${attemptId}/session-takeover`).set(authed(session2.cookies)).send(),
    ]);

    expect(takeover.status).toBe(200);
    expect(takeover.body.writerGeneration).toBe(2);
    const writer = await ctx.prisma.active_exam_sessions.findUniqueOrThrow({
      where: { candidate_id: (await ctx.prisma.attempts.findUniqueOrThrow({ where: { id: attemptId } })).candidate_id },
    });
    expect(writer.writer_generation).toBe(2n);
    // The old writer's save either committed before the takeover or was rejected.
    expect(oldSave.status === 200 || oldSave.status === 409).toBe(true);
    expect(await ctx.prisma.attempts.count()).toBe(1);
  });

  /** setup-exam assigns to a real candidate user; create one per candidate helper. */
  async function setupExamFor(cookies: SessionCookies): Promise<string> {
    // Resolve the logged-in user's email from the session store.
    const token = cookies.session.split('=')[1];
    const { createHash } = await import('node:crypto');
    const session = await ctx.prisma.auth_sessions.findUnique({
      where: { token_hash: createHash('sha256').update(token).digest('hex') },
    });
    const user = await ctx.prisma.users.findUniqueOrThrow({ where: { id: session!.user_id } });
    const exam = await setupExam(ctx, { studentEmail: user.email });
    return exam.assignmentId;
  }
});
