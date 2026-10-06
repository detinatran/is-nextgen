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
import { ScoringService } from '../../src/scoring/scoring.service';

/**
 * FR-22 submission (manual + timeout) and §21 automatic scoring.
 * Workers are disabled in tests; the scoring service is invoked directly
 * to prove the worker contract, plus one worker-loop integration check.
 */
describe('submission, timeout finalization and automatic scoring', () => {
  let ctx: TestContext;
  let email: string;
  let password: string;
  let cookies: SessionCookies;
  let scoring: ScoringService;

  beforeAll(async () => {
    ctx = await createTestApp();
    const { ScoringService: S } = await import('../../src/scoring/scoring.service');
    scoring = ctx.app.get(S);
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

  async function activeExam(questionCount = 3) {
    const exam = await setupExam(ctx, { studentEmail: email, questionCount });
    const attempt = await startAttempt(exam.assignmentId);
    const view = await ctx.http
      .get(`/api/v1/me/attempts/${attempt.attemptId}`)
      .set('Cookie', cookies.session);
    return { exam, attemptId: attempt.attemptId, view: view.body };
  }

  async function answerQuestion(attemptId: string, q: { deliveredQuestionId: string; options: { deliveredOptionId: string }[] }, optionIndex: number, expectedRevision = 0) {
    // Fresh attempts expose writer generation 1; takeover never occurs in this suite.
    return ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q.deliveredQuestionId}`)
      .set(authed(cookies))
      .send({
        selectedOptionId: q.options[optionIndex].deliveredOptionId,
        expectedRevision,
        mutationId: randomUUID(),
        writerGeneration: 1,
      });
  }

  async function submit(attemptId: string, key = randomUUID()) {
    return ctx.http
      .post(`/api/v1/me/attempts/${attemptId}/submission`)
      .set(authed(cookies))
      .set('Idempotency-Key', key)
      .send();
  }

  it('manual submit finalizes, rejects answer payload changes, and replays idempotently', async () => {
    const { attemptId, view } = await activeExam();
    await answerQuestion(attemptId, view.form[0], 0); // correct
    await answerQuestion(attemptId, view.form[1], 1); // incorrect
    const key = randomUUID();

    const first = await submit(attemptId, key);
    expect(first.status).toBe(200);
    expect(first.body.state).toBe('FINALIZED');
    expect(first.body.cause).toBe('MANUAL');

    const replay = await submit(attemptId, key);
    expect(replay.status).toBe(200);
    expect(replay.body.submittedAt).toBe(first.body.submittedAt);

    const savedAnswers = await ctx.prisma.answers.findMany({ where: { attempt_id: attemptId } });
    expect(savedAnswers).toHaveLength(2);

    // Post-finalize save is rejected by service AND DB trigger.
    const lateSave = await answerQuestion(attemptId, view.form[2], 0);
    expect(lateSave.status).toBe(409);

    // Exactly one immutable submission row exists.
    const submissions = await ctx.prisma.submissions.findMany({ where: { attempt_id: attemptId } });
    expect(submissions).toHaveLength(1);
    expect(submissions[0].cause).toBe('MANUAL');
  });

  it('scores automatically: correct → points, incorrect/unanswered → 0', async () => {
    const { exam, attemptId, view } = await activeExam(3);
    await answerQuestion(attemptId, view.form[0], 0); // correct (2 points)
    await answerQuestion(attemptId, view.form[1], 1); // incorrect (0)
    // question 3 unanswered (0)
    await submit(attemptId);

    const result = await scoring.scoreAttempt(attemptId, 'test');
    expect(result).not.toBe('already_scored');
    expect(Number((result as { points: string }).points)).toBe(2);
    expect(Number((result as { maxPoints: string }).maxPoints)).toBe(6);

    const score = await ctx.prisma.attempt_scores.findUniqueOrThrow({
      where: { attempt_id: attemptId },
    });
    expect(Number(score.points)).toBe(2);
    expect(Number(score.max_points)).toBe(6);

    // Final score projection = MAX over finalized attempts.
    const finalScore = await ctx.prisma.candidate_final_scores.findUniqueOrThrow({
      where: { assignment_id: exam.assignmentId },
    });
    expect(Number(finalScore.points)).toBe(2);
    expect(finalScore.winning_attempt_id).toBe(attemptId);
  });

  it('retry-safe scoring never double-creates scores', async () => {
    const { attemptId } = await activeExam(2);
    await submit(attemptId);
    const first = await scoring.scoreAttempt(attemptId, 'test');
    const second = await scoring.scoreAttempt(attemptId, 'test-retry');
    expect(first).not.toBe('already_scored');
    expect(second).toBe('already_scored');
    expect(await ctx.prisma.attempt_scores.count({ where: { attempt_id: attemptId } })).toBe(1);
  });

  it('final score is the MAX across up to three attempts', async () => {
    const setup = await setupExam(ctx, { studentEmail: email, questionCount: 3 });
    const scores = [[0, 0, 0], [0, 1, 1], [0, 0, 0]]; // attempt2 answers 2 correct = 4 points
    for (const answers of scores) {
      const attempt = await startAttempt(setup.assignmentId);
      const view = await ctx.http
        .get(`/api/v1/me/attempts/${attempt.attemptId}`)
        .set('Cookie', cookies.session);
      for (let i = 0; i < answers.length; i++) {
        if (answers[i] === 1) await answerQuestion(attempt.attemptId, view.body.form[i], 0);
      }
      const res = await submit(attempt.attemptId);
      expect(res.status).toBe(200);
    }
    await scoring.scoreAttempt((await ctx.prisma.attempts.findMany({ where: { assignment_id: setup.assignmentId } }))[0].id, 'test');
    for (const a of await ctx.prisma.attempts.findMany({ where: { assignment_id: setup.assignmentId } })) {
      await scoring.scoreAttempt(a.id, 'test');
    }
    const finalScore = await ctx.prisma.candidate_final_scores.findUniqueOrThrow({
      where: { assignment_id: setup.assignmentId },
    });
    expect(Number(finalScore.points)).toBe(4);
  });

  it('timeout finalization: overdue active attempts finalize with cause TIMEOUT on read', async () => {
    const setup = await setupExam(ctx, { studentEmail: email, questionCount: 2 });
    // Insert an overdue attempt directly (attempt rows are insert-only by design).
    const fixture = await ctx.http
      .post('/api/v1/internal/fixtures/insert-overdue-attempt')
      .set('x-fixtures-token', 'test-fixtures-token')
      .send({ assignmentId: setup.assignmentId, minutesOverdue: 30 });
    expect(fixture.status).toBe(201);
    const overdueAttemptId = fixture.body.attemptId;

    // Candidate cannot save past the deadline.
    const view = await ctx.http
      .get(`/api/v1/me/attempts/${overdueAttemptId}`)
      .set('Cookie', cookies.session);
    // The GET itself reconciles the overdue attempt into FINALIZED.
    expect(view.body.attempt.state).toBe('FINALIZED');

    const attempt = await ctx.prisma.attempts.findUniqueOrThrow({ where: { id: overdueAttemptId } });
    expect(attempt.finalization_cause).toBe('TIMEOUT');
    const submission = await ctx.prisma.submissions.findUniqueOrThrow({
      where: { attempt_id: overdueAttemptId },
    });
    expect(submission.cause).toBe('TIMEOUT');
    expect(await ctx.prisma.active_exam_sessions.count({ where: { attempt_id: overdueAttemptId } })).toBe(0);
  });

  it('answers at the deadline boundary never bypass autosave cutoff', async () => {
    const setup = await setupExam(ctx, { studentEmail: email, questionCount: 2 });
    const fixture = await ctx.http
      .post('/api/v1/internal/fixtures/insert-overdue-attempt')
      .set('x-fixtures-token', 'test-fixtures-token')
      .send({ assignmentId: setup.assignmentId, minutesOverdue: 5 });
    const overdueAttemptId = fixture.body.attemptId;
    // No prior GET: the read boundary would reconcile the attempt to FINALIZED.
    // A direct save must be rejected by the deadline gate (DEADLINE_PASSED).
    const anyQuestion = await ctx.prisma.delivered_questions.findFirstOrThrow({
      where: { attempt_id: overdueAttemptId },
    });
    const anyOption = await ctx.prisma.delivered_options.findFirstOrThrow({
      where: { delivered_question_id: anyQuestion.id },
    });
    const save = await ctx.http
      .put(`/api/v1/me/attempts/${overdueAttemptId}/answers/${anyQuestion.id}`)
      .set(authed(cookies))
      .send({ selectedOptionId: anyOption.id, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: 1 });
    expect(save.status).toBe(409);
    expect(save.body.error.code).toBe('DEADLINE_PASSED');
  });

  it('worker loop consumes SCORING intents end to end', async () => {
    const { attemptId } = await activeExam(2);
    await submit(attemptId);
    const intents = await ctx.prisma.async_intents.findMany({ where: { kind: 'SCORING' } });
    expect(intents).toHaveLength(1);
    expect(intents[0].status).toBe('PENDING');
    await scoring.processPendingScoring('worker-test');
    const processed = await ctx.prisma.async_intents.findUniqueOrThrow({
      where: { id: intents[0].id },
    });
    expect(processed.status).toBe('SUCCEEDED');
  });
});
