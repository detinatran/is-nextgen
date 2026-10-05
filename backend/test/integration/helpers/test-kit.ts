import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/database/prisma.service';
import { assertDisposableTestDatabase } from '../assert-disposable-database';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  http: ReturnType<typeof request>;
}

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: ['error', 'warn'] });
  app.use(cookieParser());
  app.use((req: Request & { correlationId?: string }, _res: Response, next: NextFunction) => {
    (req as Request & { correlationId?: string }).correlationId = randomUUID();
    next();
  });
  app.setGlobalPrefix('api/v1');
  await app.init();
  const prisma = app.get(PrismaService);
  return { app, prisma, http: request(app.getHttpServer()) };
}

export async function destroyTestApp(ctx: TestContext): Promise<void> {
  await ctx.app.close();
}

const SEED_STATEMENTS: string[] = [
  `INSERT INTO roles(code,description) VALUES
 ('ADMIN','Privileged user; permission and domain assignment checks still required'),
 ('STUDENT','Provisioned candidate user; own resources only')
ON CONFLICT(code) DO NOTHING`,
  `INSERT INTO permissions(code,description) VALUES
 ('candidate.read','Read candidates within authorized scope'), ('candidate.manage','Manage candidate profiles'),
 ('account.manage','Provision, disable and recover users'),
 ('question.read','Read private question bank'), ('question.manage','Author/import question versions'), ('question.publish','Freeze question versions'),
 ('exam.manage','Manage exam configuration and schedules'), ('assignment.manage','Assign/reschedule candidates'), ('exam.monitor','Monitor exams'),
 ('reviewer.score','Score assigned manual cases'), ('reviewer.assign','Assign distinct reviewers'),
 ('result.review','Review calculated results'), ('result.approve','Approve reviewed revision'), ('result.publish','Publish/supersede/withdraw approved results'),
 ('content.manage','Manage competition content'), ('content.approve','Approve exact content version'), ('content.publish','Publish approved content'),
 ('media.view','View private media within domain scope'), ('media.download','Download private media with audit'),
 ('export.execute','Execute scoped private exports'), ('audit.read','Read authorized audit evidence'), ('data.delete','Request coordinated deletion'),
 ('self.profile','Read/edit own profile before deadline'), ('self.exam','Access own assigned exam and attempt')
ON CONFLICT(code) DO NOTHING`,
  `INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (r.code='ADMIN' AND p.code NOT LIKE 'self.%') OR (r.code='STUDENT' AND p.code LIKE 'self.%')
ON CONFLICT(role_id,permission_id) DO NOTHING`,
];

/** Disposes all business rows; keeps the frozen schema and Prisma bookkeeping. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  const expected = assertDisposableTestDatabase();
  const [actual] = await prisma.$queryRaw<{ name: string }[]>`SELECT current_database() AS name`;
  if (actual.name !== expected) throw new Error('Test database identity mismatch; refusing to truncate');
  const tables = (await prisma.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`)) as Array<{ tablename: string }>;
  const names = tables.map((t) => `"${t.tablename}"`).join(', ');
  if (names) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`);
  }
  // Prepared statements are single-command; run the seed statements one by one.
  for (const statement of SEED_STATEMENTS) {
    await prisma.$executeRawUnsafe(statement);
  }
}

export const FIXTURE_TOKEN_HEADER = 'x-fixtures-token';
export const FIXTURE_TOKEN = 'test-fixtures-token';

export interface ProvisionedUser {
  userId: string;
  candidateId: string;
  activationCode: string;
  email: string;
}

export async function provisionUser(
  ctx: TestContext,
  email: string,
  password?: string,
): Promise<ProvisionedUser> {
  const res = await ctx.http
    .post('/api/v1/internal/fixtures/provision-user')
    .set(FIXTURE_TOKEN_HEADER, FIXTURE_TOKEN)
    .send({ email, ...(password ? { password } : {}) });
  if (res.status !== 201) throw new Error(`provision failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { ...res.body, email };
}

export interface SetupExamResult {
  competitionId: string;
  examId: string;
  scheduleId: string;
  blueprintVersionId: string;
  assignmentId: string;
  questionVersionIds: string[];
}

export async function setupExam(
  ctx: TestContext,
  opts: {
    competitionCode?: string;
    studentEmail: string;
    opensAt?: string;
    closesAt?: string;
    questionCount?: number;
    pointsPerQuestion?: number;
    round?: number;
    capacity?: number;
  },
): Promise<SetupExamResult> {
  const now = Date.now();
  const res = await ctx.http
    .post('/api/v1/internal/fixtures/setup-exam')
    .set(FIXTURE_TOKEN_HEADER, FIXTURE_TOKEN)
    .send({
      competitionCode: opts.competitionCode ?? `C-${randomUUID().slice(0, 8)}`,
      studentEmail: opts.studentEmail,
      opensAt: opts.opensAt ?? new Date(now - 3_600_000).toISOString(),
      closesAt: opts.closesAt ?? new Date(now + 3_600_000).toISOString(),
      questionCount: opts.questionCount ?? 3,
      pointsPerQuestion: opts.pointsPerQuestion ?? 2,
      round: opts.round,
      capacity: opts.capacity,
    });
  if (res.status !== 201) throw new Error(`setup-exam failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

export interface DraftRegistration {
  registrationId: string;
  profileToken: string;
  uploadToken: string;
}

export async function createDraft(
  ctx: TestContext,
  overrides: Record<string, unknown> = {},
): Promise<DraftRegistration> {
  const competitionCode =
    (overrides['competitionCode'] as string | undefined) ?? `C-${randomUUID().slice(0, 8)}`;
  await ctx.prisma.competitions.create({
    data: {
      code: competitionCode,
      name: `Competition ${competitionCode}`,
      registration_opens_at: new Date(Date.now() - 3_600_000),
      registration_closes_at: new Date(Date.now() + 30 * 86_400_000),
    },
  });
  const payload = {
    competitionCode,
    fullName: 'Nguyen Van Test',
    dateOfBirth: '2004-05-12',
    studentId: `SV${Math.floor(Math.random() * 1_000_000)}`,
    school: 'Fixture University',
    department: 'Faculty of IT',
    major: 'Software Engineering',
    email: overrides['email'] ?? `draft-${randomUUID().slice(0, 8)}@example.com`,
    phone: '0901234567',
    facebook: 'https://facebook.com/fixture',
    consent: { wordingVersion: 'DATA-V1-2026', granted: true },
    mediaUsageConsent: { wordingVersion: 'MEDIA-V1-2026', granted: true },
    eventCoverageConsent: { wordingVersion: 'EVENT-V1-2026', granted: true },
    ...overrides,
  };
  const res = await ctx.http.post('/api/v1/registration-drafts').send(payload);
  if (res.status !== 201) throw new Error(`draft failed: ${res.status} ${JSON.stringify(res.body)}`);
  return {
    registrationId: res.body.registrationId,
    profileToken: res.body.capability.profileToken,
    uploadToken: res.body.capability.uploadToken,
  };
}

/** Minimal valid PNG (1x1 transparent pixel) used as a personal photo fixture. */
export const TINY_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489' +
    '0000000d49444154789c63f8cfc0f01f00050001ff89993d1d0000000049454e44ae426082',
  'hex',
);

/** Real photo upload through the API (magic-byte validation, works on any host). */
export async function uploadPhoto(
  ctx: TestContext,
  draft: DraftRegistration,
  file: Buffer = TINY_PNG,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const res = await ctx.http
    .post(`/api/v1/registrations/${draft.registrationId}/photos`)
    .set('x-registration-token', draft.uploadToken)
    .attach('file', file, { filename: 'photo.png', contentType: 'image/png' });
  return { status: res.status, body: res.body as Record<string, unknown> };
}

/** DB-level photo fixture for tests that do not exercise the upload path. */
export async function seedReadyPhoto(ctx: TestContext, registrationId: string): Promise<string> {
  const upload = await ctx.prisma.media_uploads.create({
    data: {
      registration_id: registrationId,
      object_key: `p/${randomUUID()}`,
      state: 'READY',
      expires_at: new Date(Date.now() + 48 * 3_600_000),
    },
  });
  return upload.id;
}

/**
 * DB-level media fixture: simulates a validated READY video without ffprobe,
 * so submission flows are testable in environments without ffmpeg.
 */
export async function seedReadyVideo(ctx: TestContext, registrationId: string): Promise<string> {
  const objectKey = `v/${randomUUID()}`;
  const upload = await ctx.prisma.media_uploads.create({
    data: {
      registration_id: registrationId,
      object_key: objectKey,
      state: 'READY',
      expires_at: new Date(Date.now() + 48 * 3_600_000),
    },
  });
  const mediaObject = await ctx.prisma.media_objects.create({
    data: {
      upload_id: upload.id,
      registration_id: registrationId,
      object_key: objectKey,
      checksum_sha256: randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, ''),
      mime_type: 'video/mp4',
      size_bytes: 123_456,
      duration_seconds: '42.000',
      is_private: true,
      validated_at: new Date(),
      sealed_at: new Date(),
    },
  });
  await ctx.prisma.registration_videos.create({
    data: { registration_id: registrationId, media_object_id: mediaObject.id },
  });
  return mediaObject.id;
}

export interface SessionCookies {
  session: string;
  csrf: string;
}

export async function login(
  ctx: TestContext,
  identifier: string,
  password: string,
): Promise<{ status: number; cookies: SessionCookies; rawCookies: string[]; body: Record<string, unknown> }> {
  const res = await ctx.http.post('/api/v1/auth/login').send({ identifier, password });
  const setCookie = (res.headers['set-cookie'] ?? []) as unknown as string[];
  const list = Array.isArray(setCookie) ? setCookie : [String(setCookie)];
  const session = list.find((c: string) => c.startsWith('isng_session='));
  const csrf = list.find((c: string) => c.startsWith('isng_csrf='));
  return {
    status: res.status,
    cookies: {
      session: session ? session.split(';')[0] : '',
      csrf: csrf ? csrf.split(';')[0] : '',
    },
    rawCookies: list as string[],
    body: res.body as Record<string, unknown>,
  };
}

export function cookieHeader(cookies: SessionCookies): string {
  return `${cookies.session}; ${cookies.csrf}`;
}

export function csrfOf(cookies: SessionCookies): string {
  return cookies.csrf.split('=')[1] ?? '';
}

export const authed = (cookies: SessionCookies) => ({
  Cookie: cookieHeader(cookies),
  'x-csrf-token': csrfOf(cookies),
});
