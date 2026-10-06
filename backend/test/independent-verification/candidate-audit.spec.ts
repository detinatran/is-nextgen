import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createDraft, createTestApp, destroyTestApp, resetDatabase, uploadPhoto, TINY_PNG,
  type TestContext, type DraftRegistration } from '../integration/helpers/test-kit';

const FIXTURE_MEDIA_DIR = existsSync('/tmp/candidate-media/valid.mp4')
  ? '/tmp/candidate-media'
  : join(__dirname, '../fixtures/candidate-media');

describe('candidate website audit: current user criteria', () => {
  let ctx: TestContext;
  beforeEach(async () => { ctx = await createTestApp(); await resetDatabase(ctx.prisma); });
  afterEach(async () => { await destroyTestApp(ctx); });
  async function payload() {
    const d = await createDraft(ctx);
    const r = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    const competition = await ctx.prisma.competitions.findUniqueOrThrow({ where: { id: r.competition_id } });
    return { competitionCode: competition.code, fullName: 'Synthetic Audit Candidate', dateOfBirth: '2004-05-12',
      studentId: 'AUDIT1', school: 'Synthetic University', department: 'Synthetic Faculty', major: 'Synthetic Major',
      email: `audit-${randomUUID()}@example.com`, phone: '0901234567', facebook: 'https://facebook.com/synthetic',
      consent: { granted: true, wordingVersion: 'DATA-V1-2026' }, mediaUsageConsent: { granted: false, wordingVersion: 'MEDIA-V1-2026' } };
  }
  it.each([
    ['blank required fields', { fullName: '   ', studentId: '   ', school: '   ', department: '   ', major: '   ' }],
    ['phone without digits', { phone: '------' }],
    ['invalid Facebook URL', { facebook: 'not-a-link' }],
    ['future date of birth', { dateOfBirth: '2099-01-01' }],
  ])('WEB-VALIDATION: rejects %s before saving', async (_name, patch) => {
    const data = { ...(await payload()), ...patch };
    const before = await ctx.prisma.registrations.count();
    const res = await ctx.http.post('/api/v1/registration-drafts').send(data);
    expect({ denied: res.status === 400, addedRows: (await ctx.prisma.registrations.count()) - before })
      .toEqual({ denied: true, addedRows: 0 });
  });
  it('WEB-PHOTO-POLICY: JPG/PNG-only rejects a real WebP', async () => {
    const d = await createDraft(ctx);
    const r = await ctx.http.post(`/api/v1/registrations/${d.registrationId}/photos`)
      .set('x-registration-token', d.uploadToken).attach('file', join(FIXTURE_MEDIA_DIR, 'photo.webp'));
    expect([400, 413, 415].includes(r.status)).toBe(true);
  });
  it('WEB-PHOTO-BOUNDARY: strict below 10MB rejects exactly 10000000 bytes', async () => {
    const d = await createDraft(ctx); const data = Buffer.alloc(10_000_000); TINY_PNG.copy(data);
    const r = await uploadPhoto(ctx, d, data);
    expect([400, 413, 415].includes(r.status)).toBe(true);
  });
  async function video(d: DraftRegistration, name: string) {
    const u = await ctx.http.post(`/api/v1/registrations/${d.registrationId}/uploads`)
      .set('x-registration-token', d.uploadToken).attach('file', readFileSync(join(FIXTURE_MEDIA_DIR, name)), { filename: name, contentType: 'video/mp4' });
    expect(u.status).toBe(202);
    return ctx.http.post(`/api/v1/uploads/${u.body.uploadId}/finalization`).set('x-registration-token', d.uploadToken).send();
  }
  it('WEB-VIDEO-VALID-NEAR: near boundary 118 seconds succeeds READY', async () => {
    const d = await createDraft(ctx); const r = await video(d, 'near120.mp4');
    expect(r.body.state).toBe('READY'); expect(r.body.durationSeconds).toBe(118);
  });
  it('WEB-VIDEO-CORRUPT: unparsable container rejected', async () => {
    const d = await createDraft(ctx); const r = await video(d, 'corrupt.mp4');
    expect(r.body.state).toBe('REJECTED'); expect(r.body.rejectionReason).toBe('VIDEO_INVALID_FORMAT');
  });
  it('WEB-VIDEO-BOUNDARY: strict below 120 seconds rejects exactly 120', async () => {
    const d = await createDraft(ctx); const r = await video(d, 'exact120.mp4');
    expect(r.body.state).toBe('REJECTED');
    expect(r.body.rejectionReason).toBe('VIDEO_TOO_LONG');
  });
  it('WEB-VIDEO-OVER: server rejects 120.5 seconds despite client tolerance', async () => {
    const d = await createDraft(ctx); const r = await video(d, 'over120.mp4');
    expect(r.body.state).toBe('REJECTED'); expect(r.body.rejectionReason).toBe('VIDEO_TOO_LONG');
  });
  it('WEB-FR16: real photo/video/binding/commit confirmation succeeds and receipt replay is stable', async () => {
    const d = await createDraft(ctx); expect((await uploadPhoto(ctx, d)).status).toBe(201);
    const v = await video(d, 'valid.mp4'); expect(v.body.state).toBe('READY');
    const b = await ctx.http.put(`/api/v1/registrations/${d.registrationId}/video-binding`).set('x-registration-token', d.uploadToken)
      .send({ mediaObjectId: v.body.mediaObjectId }); expect(b.status).toBe(200);
    const key = randomUUID(); const submit = () => ctx.http.post(`/api/v1/registrations/${d.registrationId}/submission`)
      .set('x-registration-token', d.uploadToken).set('Idempotency-Key', key).send();
    const a = await submit(); expect(a.status).toBe(201); expect(a.body.candidateCode).toMatch(/^ISNG-/);
    const stored = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: d.registrationId } });
    const candidate = await ctx.prisma.candidates.findUniqueOrThrow({ where: { id: stored.candidate_id } });
    expect(stored.state).toBe('SUBMITTED'); expect(candidate.candidate_code).toBe(a.body.candidateCode);
    const replay = await submit(); expect(replay.status).toBe(201); expect(replay.body.candidateCode).toBe(a.body.candidateCode);
  });
});
