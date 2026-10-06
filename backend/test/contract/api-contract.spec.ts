import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  authed,
  createTestApp,
  createDraft,
  destroyTestApp,
  login,
  provisionUser,
  resetDatabase,
  seedReadyVideo,
  setupExam,
  uploadPhoto,
  type TestContext,
} from '../integration/helpers/test-kit';

const FIXTURE_DIR = join(__dirname, '..', 'fixtures', 'api');

/**
 * §33/§40 API contract tests. Real HTTP responses are captured as sanitized
 * JSON fixtures under test/fixtures/api so the Next.js frontend can build
 * against the exact contract without any database knowledge.
 */
describe('frontend API contract', () => {
  let ctx: TestContext;
  beforeAll(async () => {
    ctx = await createTestApp();
    mkdirSync(FIXTURE_DIR, { recursive: true });
  });
  afterAll(async () => {
    await destroyTestApp(ctx);
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  function snapshot(name: string, body: unknown): void {
    writeFileSync(join(FIXTURE_DIR, name), JSON.stringify(body, null, 2), 'utf8');
  }

  function assertNoForbiddenFields(body: unknown): void {
    const raw = JSON.stringify(body);
    for (const forbidden of [
      'isCorrect', 'correctOptionId', 'is_correct', 'answerKey',
      'passwordHash', 'password_hash', 'tokenHash', 'token_hash',
      'verifierHash', 'verifier_hash', 'objectKey', 'object_key',
    ]) {
      expect(raw).not.toContain(forbidden);
    }
  }

  it('captures photo validation and the explicit communication-consent contract', async () => {
    const config = await ctx.http.get('/api/v1/registration-form-config');
    expect(config.status).toBe(200);
    expect(config.body.consents.mediaUsage).toMatchObject({ purpose: 'MEDIA_USAGE', selectionRequired: true,
      defaultSelection: null, withdrawalContactEmail: 'nextgen@vnuis.edu.vn',
      retention: { anchor: 'OFFICIAL_COMPETITION_END', period: 'P1Y' } });
    expect(config.body.consents.mediaUsage.choices).toEqual([
      { decision: 'AGREE', granted: true }, { decision: 'DISAGREE', granted: false },
    ]);
    snapshot('registration-form-config.json', config.body);
    const draft = await createDraft(ctx, {
      mediaUsageConsent: { wordingVersion: 'MEDIA-V1-2026', granted: false },
      eventCoverageConsent: undefined,
    });
    const valid = await uploadPhoto(ctx, draft); expect(valid.status).toBe(201);
    assertNoForbiddenFields(valid.body); snapshot('media-photo-ready.json', valid.body);
    const invalid = await uploadPhoto(ctx, draft, Buffer.from('not an image'));
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toMatchObject({ code: 'PHOTO_INVALID_FORMAT' });
    assertNoForbiddenFields(invalid.body); snapshot('media-validation-error.json', invalid.body);
    const view = await ctx.http.get(`/api/v1/registrations/${draft.registrationId}`).set('x-registration-token', draft.profileToken);
    expect(view.body.favoriteCandidateEligible).toBe(false);
    expect(view.body.consents.map((c: { purpose: string }) => c.purpose).sort()).toEqual(['DATA_PROCESSING', 'MEDIA_USAGE']);
    assertNoForbiddenFields(view.body); snapshot('registration-draft-profile.json', view.body);
    snapshot('communication-consent-declined.json', {
      consents: view.body.consents, favoriteCandidateEligible: view.body.favoriteCandidateEligible,
    });
  });

  it('captures the full candidate journey as sanitized fixtures', async () => {
    // 1) Registration draft + photo + video + submission.
    const draft = await createDraft(ctx);
    const photo = await uploadPhoto(ctx, draft);
    expect(photo.status).toBe(201);
    await seedReadyVideo(ctx, draft.registrationId);
    const submit = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/submission`)
      .set('x-registration-token', draft.profileToken)
      .set('Idempotency-Key', randomUUID())
      .send();
    expect(submit.status).toBe(201);
    assertNoForbiddenFields(submit.body);
    snapshot('registration-submitted.json', submit.body);

    // 2) Candidate account + login.
    const email = `cand-${randomUUID().slice(0, 8)}@example.com`;
    await provisionUser(ctx, email, 'Sup3rSecret!42');
    const session = await login(ctx, email, 'Sup3rSecret!42');
    expect(session.status).toBe(200);
    assertNoForbiddenFields(session.body);
    snapshot('login-success.json', {
      user: session.body.user,
      setsCookies: ['isng_session (HttpOnly, SameSite=Lax)', 'isng_csrf (readable)'],
      csrfHeader: 'x-csrf-token',
    });

    // 3) Assignment view.
    const exam = await setupExam(ctx, { studentEmail: email, questionCount: 3 });
    const assignments = await ctx.http.get('/api/v1/me/assignments').set('Cookie', session.cookies.session);
    expect(assignments.status).toBe(200);
    assertNoForbiddenFields(assignments.body);
    snapshot('assignments.json', assignments.body);

    // 4) Start + attempt view.
    const start = await ctx.http
      .post(`/api/v1/me/assignments/${exam.assignmentId}/attempts`)
      .set(authed(session.cookies))
      .set('Idempotency-Key', randomUUID())
      .send();
    expect(start.status).toBe(201);
    snapshot('attempt-started.json', start.body);
    const view = await ctx.http
      .get(`/api/v1/me/attempts/${start.body.attemptId}`)
      .set('Cookie', session.cookies.session);
    expect(view.status).toBe(200);
    assertNoForbiddenFields(view.body);
    snapshot('attempt-active.json', view.body);

    // 5) Autosave + conflict shape.
    const q0 = view.body.form[0];
    const saved = await ctx.http
      .put(`/api/v1/me/attempts/${start.body.attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(session.cookies))
      .send({ selectedOptionId: q0.options[0].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: 1 });
    expect(saved.status).toBe(200);
    snapshot('answer-saved.json', saved.body);

    const conflict = await ctx.http
      .put(`/api/v1/me/attempts/${start.body.attemptId}/answers/${q0.deliveredQuestionId}`)
      .set(authed(session.cookies))
      .send({ selectedOptionId: q0.options[1].deliveredOptionId, expectedRevision: 0, mutationId: randomUUID(), writerGeneration: 1 });
    expect(conflict.status).toBe(409);
    snapshot('error-revision-conflict.json', conflict.body);

    // 6) Manual submission (finalized contract).
    const submitted = await ctx.http
      .post(`/api/v1/me/attempts/${start.body.attemptId}/submission`)
      .set(authed(session.cookies))
      .set('Idempotency-Key', randomUUID())
      .send();
    expect(submitted.status).toBe(200);
    assertNoForbiddenFields(submitted.body);
    snapshot('attempt-finalized.json', submitted.body);

    // Fixtures must exist and contain no secrets.
    for (const f of [
      'registration-submitted.json', 'login-success.json', 'assignments.json',
      'attempt-started.json', 'attempt-active.json', 'answer-saved.json',
      'error-revision-conflict.json', 'attempt-finalized.json',
    ]) {
      expect(existsSync(join(FIXTURE_DIR, f))).toBe(true);
      expect(readFileSync(join(FIXTURE_DIR, f), 'utf8')).not.toMatch(/password|token_hash|secret/i);
    }
  });
});
