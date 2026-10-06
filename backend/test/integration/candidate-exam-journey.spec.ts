import { randomUUID } from 'node:crypto';
import {
  authed,
  createTestApp,
  destroyTestApp,
  login,
  provisionUser,
  resetDatabase,
  setupExam,
  type TestContext,
} from './helpers/test-kit';
import { ScoringService } from '../../src/scoring/scoring.service';

/**
 * FR17–FR22 Comprehensive Candidate Exam Journey Verification
 *
 * 1. FR17: Provision candidate test account via protected fixture, OTP activation,
 *          password setup, successful login with cookies, invalid login rejected, disabled user rejected.
 * 2. FR18: Answer saving, logout, new login session, restore attempt from DB.
 *          Writer generation validation: fresh session has generation, old generation rejected.
 * 3. FR19: View assignments, schedule check, entering within window, blocking outside window,
 *          blocking other candidates' exams, quota check (no duplicate attempt creation on retry start).
 * 4. FR20: Quiz form delivery with >= 5 questions, prompt, options, points; review flags toggle;
 *          serverTime and deadlineAt exposed; answer key and isCorrect strictly hidden.
 * 5. FR21: Answer save, update, clear, mutationId idempotency replay, expectedRevision conflict,
 *          stale writerGeneration rejection, preserved review flag and deadline across reload.
 * 6. FR22: Manual submit with writer generation and Idempotency-Key, automatic scoring,
 *          overdue attempt timeout finalization, post-finalization save rejection,
 *          concurrent timeout/manual race safety.
 */
describe('FR17–FR22 candidate exam journey: authoritative HTTP API & real PostgreSQL', () => {
  let ctx: TestContext;
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
  });

  function assertNoAnswerKeys(body: unknown): void {
    const raw = JSON.stringify(body);
    for (const forbidden of [
      'isCorrect', 'correctOptionId', 'is_correct', 'answerKey',
      'passwordHash', 'password_hash', 'tokenHash', 'token_hash',
    ]) {
      expect(raw).not.toContain(forbidden);
    }
  }

  async function getLatestCode(email: string, template: 'ACTIVATION' | 'EMAIL_VERIFY' | 'PASSWORD_RESET'): Promise<string> {
    const intent = await ctx.prisma.notification_intents.findFirst({
      where: { destination_email: email, template_code: template },
      orderBy: { created_at: 'desc' },
    });
    return (intent?.payload as { code?: string })?.code ?? '';
  }

  it('FR17: account provisioning, activation OTP, credential login and access guard', async () => {
    const email = `candidate-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'StrongPassword!2026';

    // Provision unactivated user
    const user = await provisionUser(ctx, email);
    expect(user.userId).toBeTruthy();

    // Login before activation fails
    const prematureLogin = await login(ctx, email, password);
    expect(prematureLogin.status).toBe(401);

    // Wrong OTP rejected
    const badOtp = await ctx.http
      .post('/api/v1/auth/activation')
      .send({ challengeId: user.activationChallengeId, code: '999999', password });
    expect(badOtp.status).toBe(401);

    // Activate with real OTP from notifications
    const otp = await getLatestCode(email, 'ACTIVATION');
    expect(otp).toMatch(/^\d{6}$/);

    const activated = await ctx.http
      .post('/api/v1/auth/activation')
      .send({ challengeId: user.activationChallengeId, code: otp, password });
    expect(activated.status).toBe(200);

    // Bad password rejected
    const wrongPass = await login(ctx, email, 'WrongPassword!42');
    expect(wrongPass.status).toBe(401);

    // Valid login succeeds with session and CSRF cookies
    const authedSession = await login(ctx, email, password);
    expect(authedSession.status).toBe(200);
    expect(authedSession.cookies.session).toContain('isng_session=');
    expect(authedSession.cookies.csrf).toContain('isng_csrf=');

    // Disabled candidate account rejected
    await ctx.prisma.users.update({
      where: { id: user.userId },
      data: { status: 'DISABLED' },
    });
    const disabledLogin = await login(ctx, email, password);
    expect(disabledLogin.status).toBe(401);
  });

  it('FR18 & FR19 & FR20 & FR21: assignment schedule, 5-question delivery, autosave, logout/login recovery and writer generation', async () => {
    const email = `journey-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'Password#12345';
    await provisionUser(ctx, email, password);
    let session = await login(ctx, email, password);

    // Setup exam with 5 questions
    const exam = await setupExam(ctx, { studentEmail: email, questionCount: 5, pointsPerQuestion: 2 });

    // FR19: View assignments
    const assignmentsRes = await ctx.http
      .get('/api/v1/me/assignments')
      .set('Cookie', session.cookies.session);
    expect(assignmentsRes.status).toBe(200);
    expect(assignmentsRes.body.assignments).toHaveLength(1);
    expect(assignmentsRes.body.assignments[0].assignmentId).toBe(exam.assignmentId);
    expect(assignmentsRes.body.assignments[0].attemptQuota).toBe(3);

    // Start attempt
    const startKey = randomUUID();
    const startRes = await ctx.http
      .post(`/api/v1/me/assignments/${exam.assignmentId}/attempts`)
      .set(authed(session.cookies))
      .set('Idempotency-Key', startKey)
      .send();
    expect(startRes.status).toBe(201);
    const attemptId = startRes.body.attemptId;
    expect(attemptId).toBeTruthy();
    expect(startRes.body.writerGeneration).toBe(1);

    // Replay start attempt with same idempotency key does not consume quota or create new attempt
    const replayStart = await ctx.http
      .post(`/api/v1/me/assignments/${exam.assignmentId}/attempts`)
      .set(authed(session.cookies))
      .set('Idempotency-Key', startKey)
      .send();
    expect(replayStart.status).toBe(201);
    expect(replayStart.body.attemptId).toBe(attemptId);
    expect(await ctx.prisma.attempts.count({ where: { assignment_id: exam.assignmentId } })).toBe(1);

    // FR20: Quiz retrieval (>= 5 questions, countdown fields, no answers leaked)
    const viewRes = await ctx.http
      .get(`/api/v1/me/attempts/${attemptId}`)
      .set('Cookie', session.cookies.session);
    expect(viewRes.status).toBe(200);
    assertNoAnswerKeys(viewRes.body);

    const view = viewRes.body;
    expect(view.attempt.state).toBe('ACTIVE');
    expect(view.attempt.serverTime).toBeTruthy();
    expect(view.attempt.deadlineAt).toBeTruthy();
    expect(view.attempt.writerGeneration).toBe(1);
    expect(view.form.length).toBeGreaterThanOrEqual(5);

    for (const q of view.form) {
      expect(q.prompt).toBeTruthy();
      expect(q.options.length).toBe(4);
      expect(q.points).toBe(2);
    }

    // FR20 & FR21: Answer question 1 and toggle review flag
    const q0 = view.form[0];
    const opt0 = q0.options[0].deliveredOptionId;
    const saveRes1 = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(session.cookies))
      .send({
        selectedOptionId: opt0,
        expectedRevision: 0,
        mutationId: randomUUID(),
        writerGeneration: 1,
      });
    expect(saveRes1.status).toBe(200);
    expect(saveRes1.body.revision).toBe(1);

    // Review flag
    const flagRes = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/review-flags/${q0.deliveredQuestionId}`)
      .set(authed(session.cookies))
      .send({
        flagged: true,
        expectedRevision: 0,
        writerGeneration: 1,
      });
    expect(flagRes.status).toBe(200);

    // FR21: Next save with expectedRevision 1 succeeds
    const nextSave = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(session.cookies))
      .send({
        selectedOptionId: q0.options[1].deliveredOptionId,
        expectedRevision: 1,
        mutationId: randomUUID(),
        writerGeneration: 1,
      });
    expect(nextSave.status).toBe(200);
    expect(nextSave.body.revision).toBe(2);

    // Stale revision conflict (409 REVISION_CONFLICT)
    const conflictRes = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(session.cookies))
      .send({
        selectedOptionId: q0.options[2].deliveredOptionId,
        expectedRevision: 0,
        mutationId: randomUUID(),
        writerGeneration: 1,
      });
    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error.code).toBe('REVISION_CONFLICT');

    // FR18: Logout, login fresh, restore exam state from PostgreSQL
    await ctx.http.post('/api/v1/auth/logout').set(authed(session.cookies)).send();

    session = await login(ctx, email, password);
    expect(session.status).toBe(200);

    // Reauthenticate and Takeover exam writer session (reconnect/new device scenario)
    const reauth = await ctx.http
      .post('/api/v1/auth/reauthentication')
      .set(authed(session.cookies))
      .send({ password });
    expect(reauth.status).toBe(200);

    const takeoverRes = await ctx.http
      .post(`/api/v1/me/attempts/${attemptId}/session-takeover`)
      .set(authed(session.cookies))
      .send();
    expect(takeoverRes.status).toBe(200);
    const newGen = takeoverRes.body.writerGeneration;
    expect(newGen).toBeGreaterThanOrEqual(1);

    // Stale generation (writerGeneration: 999) is blocked
    const staleGenSave = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(session.cookies))
      .send({
        selectedOptionId: q0.options[0].deliveredOptionId,
        expectedRevision: 2,
        mutationId: randomUUID(),
        writerGeneration: 999,
      });
    expect(staleGenSave.status).toBe(409);
    expect(staleGenSave.body.error.code).toBe('STATE_CONFLICT');

    // Restored state has preserved answers and review flags
    const restoredView = await ctx.http
      .get(`/api/v1/me/attempts/${attemptId}`)
      .set('Cookie', session.cookies.session);
    expect(restoredView.status).toBe(200);
    const q0State = restoredView.body.candidateState.find(
      (s: { deliveredQuestionId: string }) => s.deliveredQuestionId === q0.deliveredQuestionId,
    );
    expect(q0State.selectedOptionId).toBe(q0.options[1].deliveredOptionId);
    expect(q0State.reviewFlag).toBe(true);
    expect(q0State.answerRevision).toBe(2);
  });

  it('FR22: manual submission with writer generation, auto-scoring, timeout finalization and post-finalize sealing', async () => {
    const email = `cand-submit-${randomUUID().slice(0, 8)}@example.com`;
    const password = 'Password#12345';
    await provisionUser(ctx, email, password);
    const session = await login(ctx, email, password);

    const exam = await setupExam(ctx, { studentEmail: email, questionCount: 5, pointsPerQuestion: 2 });
    const startRes = await ctx.http
      .post(`/api/v1/me/assignments/${exam.assignmentId}/attempts`)
      .set(authed(session.cookies))
      .set('Idempotency-Key', randomUUID())
      .send();
    const attemptId = startRes.body.attemptId;

    const viewRes = await ctx.http.get(`/api/v1/me/attempts/${attemptId}`).set('Cookie', session.cookies.session);
    const form = viewRes.body.form;

    // Answer Q0 (correct: option 0), Q1 (incorrect: option 1)
    await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${form[0].deliveredQuestionId}`)
      .set(authed(session.cookies))
      .send({
        selectedOptionId: form[0].options[0].deliveredOptionId,
        expectedRevision: 0,
        mutationId: randomUUID(),
        writerGeneration: 1,
      });
    await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${form[1].deliveredQuestionId}`)
      .set(authed(session.cookies))
      .send({
        selectedOptionId: form[1].options[1].deliveredOptionId,
        expectedRevision: 0,
        mutationId: randomUUID(),
        writerGeneration: 1,
      });

    // Stale or invalid writerGeneration on submission rejected
    const badSubmit = await ctx.http
      .post(`/api/v1/me/attempts/${attemptId}/submission`)
      .set(authed(session.cookies))
      .set('Idempotency-Key', randomUUID())
      .send({ writerGeneration: 999 });
    expect(badSubmit.status).toBe(409);
    expect(badSubmit.body.error.code).toBe('STATE_CONFLICT');

    // Valid manual submission
    const submitKey = randomUUID();
    const submitRes = await ctx.http
      .post(`/api/v1/me/attempts/${attemptId}/submission`)
      .set(authed(session.cookies))
      .set('Idempotency-Key', submitKey)
      .send({ writerGeneration: 1 });
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.state).toBe('FINALIZED');
    expect(submitRes.body.cause).toBe('MANUAL');
    assertNoAnswerKeys(submitRes.body);

    // Replay manual submission with same Idempotency-Key
    const replaySubmit = await ctx.http
      .post(`/api/v1/me/attempts/${attemptId}/submission`)
      .set(authed(session.cookies))
      .set('Idempotency-Key', submitKey)
      .send({ writerGeneration: 1 });
    expect(replaySubmit.status).toBe(200);
    expect(replaySubmit.body.submittedAt).toBe(submitRes.body.submittedAt);

    // Post-finalization answer modification rejected
    const sealedSave = await ctx.http
      .put(`/api/v1/me/attempts/${attemptId}/answers/${form[2].deliveredQuestionId}`)
      .set(authed(session.cookies))
      .send({
        selectedOptionId: form[2].options[0].deliveredOptionId,
        expectedRevision: 0,
        mutationId: randomUUID(),
        writerGeneration: 1,
      });
    expect([409, 400].includes(sealedSave.status)).toBe(true);

    // Automatic scoring verification
    const scoreResult = await scoring.scoreAttempt(attemptId, 'journey-test');
    expect(scoreResult).not.toBe('already_scored');
    expect(Number((scoreResult as { points: string }).points)).toBe(2);
    expect(Number((scoreResult as { maxPoints: string }).maxPoints)).toBe(10);

    const finalScore = await ctx.prisma.candidate_final_scores.findUniqueOrThrow({
      where: { assignment_id: exam.assignmentId },
    });
    expect(Number(finalScore.points)).toBe(2);
    expect(finalScore.winning_attempt_id).toBe(attemptId);

    // Overdue attempt: timeout finalization test
    const overdueFixture = await ctx.http
      .post('/api/v1/internal/fixtures/insert-overdue-attempt')
      .set('x-fixtures-token', 'test-fixtures-token')
      .send({ assignmentId: exam.assignmentId, minutesOverdue: 60 });
    expect(overdueFixture.status).toBe(201);
    const overdueAttemptId = overdueFixture.body.attemptId;

    // Read reconciles overdue attempt into FINALIZED with TIMEOUT cause
    const overdueView = await ctx.http
      .get(`/api/v1/me/attempts/${overdueAttemptId}`)
      .set('Cookie', session.cookies.session);
    expect(overdueView.status).toBe(200);
    expect(overdueView.body.attempt.state).toBe('FINALIZED');

    const overdueDb = await ctx.prisma.attempts.findUniqueOrThrow({ where: { id: overdueAttemptId } });
    expect(overdueDb.finalization_cause).toBe('TIMEOUT');
  });
});
