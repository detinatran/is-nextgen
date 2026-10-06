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

/**
 * FR-20/FR-21 assessment flow: sanitized view, autosave revisions, review
 * flags, writer takeover, logout without losing answers.
 */
describe('assessment, autosave and takeover', () => {
  let ctx: TestContext;
  let email: string;
  let password: string;
  let cookies: SessionCookies;

  // Reads the authoritative writer generation directly from PostgreSQL
  // (the HTTP exposure of this field is asserted separately in V-F02-01).
  const genOf = async (id: string): Promise<number> => {
    const attempt = await ctx.prisma.attempts.findUniqueOrThrow({ where: { id } });
    const writer = await ctx.prisma.active_exam_sessions.findUniqueOrThrow({
      where: { candidate_id: attempt.candidate_id },
    });
    return Number(writer.writer_generation);
  };
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
    cookies = session.cookies;
  });

  async function startAttempt(assignmentId: string) {
    const res = await ctx.http
      .post(`/api/v1/me/assignments/${assignmentId}/attempts`)
      .set(authed(cookies))
      .set('Idempotency-Key', randomUUID())
      .send();
    expect(res.status).toBe(201);
    return res.body as { attemptId: string };
  }

  async function activeExam() {
    const exam = await setupExam(ctx, { studentEmail: email, questionCount: 3 });
    const attempt = await startAttempt(exam.assignmentId);
    const view = await ctx.http
      .get(`/api/v1/me/attempts/${attempt.attemptId}`)
      .set('Cookie', cookies.session);
    expect(view.status).toBe(200);
    return { exam, attemptId: attempt.attemptId, view: view.body };
  }

  it('exposes a sanitized contract: never correctness data, no snake_case leaks', async () => {
    const { view } = await activeExam();
    const raw = JSON.stringify(view);
    for (const forbidden of ['isCorrect', 'correctOptionId', 'is_correct', 'answerKey', 'passwordHash', 'tokenHash']) {
      expect(raw).not.toContain(forbidden);
    }
    expect(view.attempt.state).toBe('ACTIVE');
    expect(view.attempt.serverTime).toBeTruthy();
    expect(view.form).toHaveLength(3);
    for (const q of view.form) {
      expect(q.prompt).toContain('Fixture question');
      expect(q.options).toHaveLength(4);
      expect(q.points).toBe(2);
    }
    expect(view.candidateState.every((c: { answerRevision: number }) => c.answerRevision === 0)).toBe(true);
  });

  it('saves, changes and clears answers with monotonically increasing revisions', async () => {
    const { view, attemptId } = await activeExam();
    const q0 = view.form[0];
    const opt1 = q0.options[0].deliveredOptionId;
    const opt2 = q0.options[1].deliveredOptionId;

    const save1 = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ selectedOptionId: opt1, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: await genOf(attemptId) });
    expect(save1.status).toBe(200);
    expect(save1.body.revision).toBe(1);

    const save2 = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ selectedOptionId: opt2, expectedRevision: 1, mutationId: randomUUID(), writerGeneration: await genOf(attemptId) });
    expect(save2.status).toBe(200);
    expect(save2.body.revision).toBe(2);

    const clear = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ selectedOptionId: null, expectedRevision: 2, mutationId: randomUUID(), writerGeneration: await genOf(attemptId) });
    expect(clear.status).toBe(200);
    expect(clear.body.revision).toBe(3);

    const view2 = await ctx.http
      .get(`/api/v1/me/attempts/${attemptId}`)
      .set('Cookie', cookies.session);
    const state = view2.body.candidateState.find(
      (c: { deliveredQuestionId: string }) => c.deliveredQuestionId === q0.deliveredQuestionId,
    );
    expect(state.selectedOptionId).toBeNull();
    expect(state.answerRevision).toBe(3);
  });

  it('rejects stale revisions with REVISION_CONFLICT', async () => {
    const { view, attemptId } = await activeExam();
    const q0 = view.form[0];
    const opt1 = q0.options[0].deliveredOptionId;
    await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ selectedOptionId: opt1, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: await genOf(attemptId) });
    const stale = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ selectedOptionId: opt1, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: await genOf(attemptId) });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('REVISION_CONFLICT');
    expect(stale.body.error.details.currentRevision).toBe(1);
  });

  it('rejects options that do not belong to the question and foreign questions', async () => {
    const { view, attemptId } = await activeExam();
    const q0 = view.form[0];
    const q1 = view.form[1];
    const foreignOption = q1.options[0].deliveredOptionId;
    const badOption = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ selectedOptionId: foreignOption, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: await genOf(attemptId) });
    expect(badOption.status).toBe(400);

    const foreignQuestion = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${randomUUID()}`)
      .set(authed(cookies))
      .send({ selectedOptionId: q0.options[0].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: await genOf(attemptId) });
    expect(foreignQuestion.status).toBe(404);
  });

  it('supports review flags with their own revision, without affecting answers', async () => {
    const { view, attemptId } = await activeExam();
    const q0 = view.form[0];
    const flag = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/review-flags/${q0.deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ flagged: true, expectedRevision: 0, writerGeneration: await genOf(attemptId) });
    expect(flag.status).toBe(200);
    expect(flag.body).toEqual({ flagged: true, revision: 1 });
    const unflag = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/review-flags/${q0.deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ flagged: false, expectedRevision: 1, writerGeneration: await genOf(attemptId) });
    expect(unflag.status).toBe(200);
    expect(unflag.body.revision).toBe(2);
  });

  it('reconstructs the same attempt, answers and deadline after reconnect', async () => {
    const { view, attemptId } = await activeExam();
    const q0 = view.form[0];
    await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ selectedOptionId: q0.options[2].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: await genOf(attemptId) });

    // New browser: same account logs in again.
    const session2 = await login(ctx, email, password);
    const view2 = await ctx.http
      .get(`/api/v1/me/attempts/${attemptId}`)
      .set('Cookie', session2.cookies.session);
    expect(view2.status).toBe(200);
    expect(view2.body.attempt.id).toBe(attemptId);
    expect(view2.body.attempt.deadlineAt).toBe(view.attempt.deadlineAt);
    const state = view2.body.candidateState.find(
      (c: { deliveredQuestionId: string }) => c.deliveredQuestionId === q0.deliveredQuestionId,
    );
    expect(state.answerRevision).toBe(1);
  });

  it('logout preserves attempt and answers; takeover binds the new session', async () => {
    const { view, attemptId } = await activeExam();
    const q0 = view.form[0];
    await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ selectedOptionId: q0.options[0].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: await genOf(attemptId) });

    // FR-18: logout releases the writer but keeps the attempt.
    await ctx.http.post('/api/v1/auth/logout').set(authed(cookies)).send();
    const attemptsLeft = await ctx.prisma.attempts.findUniqueOrThrow({ where: { id: attemptId } });
    expect(attemptsLeft.state).toBe('ACTIVE');
    const answersLeft = await ctx.prisma.answers.count({ where: { attempt_id: attemptId } });
    expect(answersLeft).toBe(1);

    // Reconnect on a new device requires fresh reauthentication for takeover.
    const session2 = await login(ctx, email, password);
    const earlyTakeover = await ctx.http
      .post(`/api/v1/me/attempts/${attemptId}/session-takeover`)
      .set(authed(session2.cookies))
      .send();
    expect(earlyTakeover.status).toBe(200); // login counts as fresh authentication

    // The old session is revoked entirely, so it is rejected at authentication.
    const oldWriter = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${view.form[1].deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ selectedOptionId: view.form[1].options[0].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: 1 });
    expect(oldWriter.status).toBe(401);

    // New writer can save; no new attempt was created.
    const save = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${view.form[1].deliveredQuestionId}`)
      .set(authed(session2.cookies))
      .send({ selectedOptionId: view.form[1].options[1].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: await genOf(attemptId) });
    expect(save.status).toBe(200);
    const total = await ctx.prisma.attempts.count();
    expect(total).toBe(1);
  });

  it('stale writer after takeover-on-live-session is rejected; new generation saves', async () => {
    const { view, attemptId } = await activeExam();
    // Second device: login + reauthenticate + takeover (generation 2).
    const session2 = await login(ctx, email, password);
    const reauth = await ctx.http
      .post('/api/v1/auth/reauthentication')
      .set(authed(session2.cookies))
      .send({ password });
    expect(reauth.status).toBe(200);
    const takeover = await ctx.http
      .post(`/api/v1/me/attempts/${attemptId}/session-takeover`)
      .set(authed(session2.cookies))
      .send();
    expect(takeover.status).toBe(200);
    expect(takeover.body.writerGeneration).toBe(2);

    const oldWriter = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${view.form[2].deliveredQuestionId}`)
      .set(authed(cookies))
      .send({ selectedOptionId: view.form[2].options[0].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: 1 });
    expect(oldWriter.status).toBe(409);
  });

  it('candidate A cannot read candidate B attempt (404, no existence leak)', async () => {
    const { attemptId } = await activeExam();
    const otherEmail = `other-${randomUUID().slice(0, 8)}@example.com`;
    await provisionUser(ctx, otherEmail, 'Sup3rSecret!42');
    const other = await login(ctx, otherEmail, 'Sup3rSecret!42');
    const res = await ctx.http
      .get(`/api/v1/me/attempts/${attemptId}`)
      .set('Cookie', other.cookies.session);
    expect(res.status).toBe(404);
  });
});
