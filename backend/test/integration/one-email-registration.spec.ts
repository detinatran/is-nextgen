import { randomUUID } from 'node:crypto';
import { createTestApp, destroyTestApp, resetDatabase, seedReadyPhoto, seedReadyVideo, type TestContext } from './helpers/test-kit';

/** Quy định: mỗi email chỉ đăng ký (nộp hồ sơ) một lần trong một cuộc thi. */
describe('one registration per email', () => {
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

  // Các bản nháp dùng chung một cuộc thi (createDraft tạo cuộc thi mới mỗi lần)
  async function draftIn(code: string, email: string) {
    const res = await ctx.http.post('/api/v1/registration-drafts').send({
      competitionCode: code,
      fullName: 'Nguyen Van Test',
      dateOfBirth: '2004-05-12',
      studentId: `SV${Math.floor(Math.random() * 1_000_000)}`,
      school: 'Fixture University',
      department: 'Faculty of IT',
      major: 'Software Engineering',
      email,
      phone: '0901234567',
      facebook: 'https://facebook.com/fixture',
      consent: { wordingVersion: 'DATA-V1-2026', granted: true },
      mediaUsageConsent: { wordingVersion: 'MEDIA-V1-2026', granted: true },
      eventCoverageConsent: { wordingVersion: 'EVENT-V1-2026', granted: true },
    });
    return res;
  }
  async function competition(code: string) {
    await ctx.prisma.competitions.create({
      data: { code, name: code, registration_opens_at: new Date(Date.now() - 3_600_000), registration_closes_at: new Date(Date.now() + 30 * 86_400_000) },
    });
  }
  async function submitDraft(registrationId: string, profileToken: string) {
    await seedReadyVideo(ctx, registrationId);
    await seedReadyPhoto(ctx, registrationId);
    return ctx.http
      .post(`/api/v1/registrations/${registrationId}/submission`)
      .set('x-registration-token', profileToken)
      .set('Idempotency-Key', randomUUID())
      .send();
  }

  it('allows only one submitted registration per email', async () => {
    await competition('ONE-EMAIL');
    const first = await draftIn('ONE-EMAIL', 'one@example.com');
    expect(first.status).toBe(201);
    expect((await submitDraft(first.body.registrationId, first.body.capability.profileToken)).status).toBe(201);

    // Hồ sơ mới cùng email (khác hoa/thường) bị từ chối ngay khi tạo
    const again = await draftIn('ONE-EMAIL', 'ONE@example.com');
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');

    const check = await ctx.http.post('/api/v1/competitions/ONE-EMAIL/email-availability').send({ email: 'one@example.com' });
    expect(check.status).toBe(200);
    expect(check.body).toEqual({ available: false });
    const free = await ctx.http.post('/api/v1/competitions/ONE-EMAIL/email-availability').send({ email: 'free@example.com' });
    expect(free.body).toEqual({ available: true });
  });

  it('rejects the second of two drafts with the same email at submission', async () => {
    await competition('RACE-EMAIL');
    const a = await draftIn('RACE-EMAIL', 'race@example.com');
    const b = await draftIn('RACE-EMAIL', 'race@example.com');
    expect(a.status).toBe(201);
    expect(b.status).toBe(201); // bản nháp chưa nộp không chặn nhau
    expect((await submitDraft(a.body.registrationId, a.body.capability.profileToken)).status).toBe(201);
    const second = await submitDraft(b.body.registrationId, b.body.capability.profileToken);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');
    const state = await ctx.prisma.registrations.findUniqueOrThrow({ where: { id: b.body.registrationId } });
    expect(state.state).toBe('DRAFT');
  });

});
