import { randomUUID } from 'node:crypto';
import { createDraft, createTestApp, destroyTestApp, resetDatabase, seedReadyVideo, type TestContext } from './helpers/test-kit';

describe('FR-13/FR-16 registration + confirmation', () => {
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

  it('creates an anonymous draft and returns scoped capability tokens', async () => {
    const draft = await createDraft(ctx);
    expect(draft.registrationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(draft.profileToken).toBeTruthy();
    expect(draft.uploadToken).toBeTruthy();
  });

  it('rejects invalid profile data (bad email, bad DOB)', async () => {
    const res = await ctx.http.post('/api/v1/registration-drafts').send({
      competitionCode: 'CX',
      fullName: 'A',
      dateOfBirth: 'not-a-date',
      studentId: '1',
      school: 's',
      department: 'd',
      major: 'm',
      email: 'not-an-email',
      phone: '0901234567',
      facebook: 'fb',
      consent: { wordingVersion: 'V1', granted: true },
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('rejects missing consent', async () => {
    const res = await ctx.http.post('/api/v1/registration-drafts').send({
      competitionCode: 'CX',
      fullName: 'A',
      dateOfBirth: '2004-01-01',
      studentId: '1',
      school: 's',
      department: 'd',
      major: 'm',
      email: 'a@b.co',
      phone: '0901234567',
      facebook: 'fb',
      consent: { wordingVersion: 'V1', granted: false },
    });
    expect(res.status).toBe(400);
  });

  it('reads and updates the draft only with the profile capability', async () => {
    const draft = await createDraft(ctx);

    const anonymous = await ctx.http.get(`/api/v1/registrations/${draft.registrationId}`);
    expect(anonymous.status).toBe(401);

    const wrongToken = await ctx.http
      .get(`/api/v1/registrations/${draft.registrationId}`)
      .set('x-registration-token', 'wrong-token-value-1234');
    expect(wrongToken.status).toBe(401);

    const got = await ctx.http
      .get(`/api/v1/registrations/${draft.registrationId}`)
      .set('x-registration-token', draft.profileToken);
    expect(got.status).toBe(200);
    expect(got.body.profile.fullName).toBe('Nguyen Van Test');
    expect(got.body.status).toBe('DRAFT');

    const uploadTokenRead = await ctx.http
      .get(`/api/v1/registrations/${draft.registrationId}`)
      .set('x-registration-token', draft.uploadToken);
    expect(uploadTokenRead.status).toBe(403); // wrong scope

    const patched = await ctx.http
      .patch(`/api/v1/registrations/${draft.registrationId}`)
      .set('x-registration-token', draft.profileToken)
      .send({ major: 'Data Science' });
    expect(patched.status).toBe(200);
    expect(patched.body.profile.major).toBe('Data Science');
  });

  it('refuses submission without a READY bound video', async () => {
    const draft = await createDraft(ctx);
    const res = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/submission`)
      .set('x-registration-token', draft.profileToken)
      .set('Idempotency-Key', randomUUID())
      .send();
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('STATE_CONFLICT');
  });

  it('submits authoritatively with video, issues candidate code, replays idempotently', async () => {
    const draft = await createDraft(ctx);
    await seedReadyVideo(ctx, draft.registrationId);
    const key = randomUUID();

    const first = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/submission`)
      .set('x-registration-token', draft.profileToken)
      .set('Idempotency-Key', key)
      .send();
    expect(first.status).toBe(201);
    expect(first.body.status).toBe('SUBMITTED');
    expect(first.body.candidateCode).toMatch(/^ISNG-\d{4}-[0-9A-F]{8}$/);
    expect(first.body.nextSteps.length).toBeGreaterThan(0);

    // Lost-response replay: same key → same committed outcome.
    const replay = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/submission`)
      .set('x-registration-token', draft.profileToken)
      .set('Idempotency-Key', key)
      .send();
    expect(replay.status).toBe(201);
    expect(replay.body.candidateCode).toBe(first.body.candidateCode);

    // Evidence is sealed: submitted profile is present, state immutable.
    const db = await ctx.prisma.registrations.findUniqueOrThrow({
      where: { id: draft.registrationId },
    });
    expect(db.state).toBe('SUBMITTED');
    expect(db.submitted_profile).toBeTruthy();

    // Notification intent recorded in the same transaction.
    const intent = await ctx.prisma.notification_intents.findUnique({
      where: { deduplication_key: `reg-confirmed:${draft.registrationId}` },
    });
    expect(intent).toBeTruthy();
  });

  it('refuses a second submission attempt under a new key', async () => {
    const draft = await createDraft(ctx);
    await seedReadyVideo(ctx, draft.registrationId);
    const first = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/submission`)
      .set('x-registration-token', draft.profileToken)
      .set('Idempotency-Key', randomUUID())
      .send();
    expect(first.status).toBe(201);
    const second = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/submission`)
      .set('x-registration-token', draft.profileToken)
      .set('Idempotency-Key', randomUUID())
      .send();
    expect(second.status).toBe(201); // committed truth returned, not a duplicate write
    expect(second.body.candidateCode).toBe(first.body.candidateCode);
    const attempts = await ctx.prisma.registrations.count({ where: { id: draft.registrationId } });
    expect(attempts).toBe(1);
  });

  it('requires an Idempotency-Key for submission', async () => {
    const draft = await createDraft(ctx);
    await seedReadyVideo(ctx, draft.registrationId);
    const res = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/submission`)
      .set('x-registration-token', draft.profileToken)
      .send();
    expect(res.status).toBe(400);
  });

  it('flags duplicate signals for review without rejecting', async () => {
    await createDraft(ctx, { email: 'dup@example.com', studentId: 'DUP1' });
    const draft2 = await createDraft(ctx, { email: 'dup@example.com', studentId: 'OTHER' });
    const review = await ctx.prisma.duplicate_review_registrations.findMany({
      where: { registration_id: draft2.registrationId },
    });
    expect(review.length).toBe(1);
    const state = await ctx.prisma.registrations.findUniqueOrThrow({
      where: { id: draft2.registrationId },
    });
    expect(state.state).toBe('DRAFT'); // not rejected
  });
});
