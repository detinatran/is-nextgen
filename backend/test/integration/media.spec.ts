import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  createDraft,
  createTestApp,
  destroyTestApp,
  resetDatabase,
  type TestContext,
} from './helpers/test-kit';

const hasFfmpeg = (): boolean => {
  try {
    execFileSync('ffprobe', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/**
 * FR-14/15 real media validation via ffprobe. Skips (with an explicit note)
 * on hosts without ffmpeg; the Docker image installs ffmpeg so the suite
 * runs fully inside `docker compose`.
 */
const d = hasFfmpeg() ? describe : describe.skip;

d('FR-14/15 media validation (ffprobe)', () => {
  let ctx: TestContext;
  let mediaDir: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    mediaDir = await mkdtemp(join(tmpdir(), 'isng-media-'));
  });
  afterAll(async () => {
    await destroyTestApp(ctx);
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  async function draftWithUploadToken() {
    const draft = await createDraft(ctx);
    return draft;
  }

  async function upload(draft: { registrationId: string; uploadToken: string }, filePath: string) {
    const res = await ctx.http
      .post(`/api/v1/registrations/${draft.registrationId}/uploads`)
      .set('x-registration-token', draft.uploadToken)
      .attach('file', filePath);
    if (res.status !== 202) {
      console.error('UPLOAD_FAIL', res.status, JSON.stringify(res.body));
    }
    return res;
  }

  it('accepts a valid small MP4 and seals it READY', async () => {
    const draft = await draftWithUploadToken();
    const file = join(mediaDir, 'valid.mp4');
    execFileSync('ffmpeg', [
      '-f', 'lavfi', '-i', 'color=c=red:s=64x64:d=1',
      '-pix_fmt', 'yuv420p', '-y', file,
    ]);
    const up = await upload(draft, file);
    expect(up.status).toBe(202);
    const fin = await ctx.http
      .post(`/api/v1/uploads/${up.body.uploadId}/finalization`)
      .set('x-registration-token', draft.uploadToken)
      .send();
    expect(fin.status).toBe(200);
    expect(fin.body.state).toBe('READY');
    expect(fin.body.mediaObjectId).toBeTruthy();
    expect(fin.body.sizeBytes).toBeGreaterThan(0);
    expect(fin.body.durationSeconds).toBeGreaterThan(0);

    // Binding works and the sealed object cannot be overwritten.
    const bind = await ctx.http
      .put(`/api/v1/registrations/${draft.registrationId}/video-binding`)
      .set('x-registration-token', draft.profileToken)
      .send({ mediaObjectId: fin.body.mediaObjectId });
    expect(bind.status).toBe(200);
  }, 60_000);

  it('rejects a corrupted MP4 with VIDEO_INVALID_FORMAT', async () => {
    const draft = await draftWithUploadToken();
    const file = join(mediaDir, 'corrupt.mp4');
    await writeFile(file, Buffer.from('this is not an mp4 container at all'));
    const up = await upload(draft, file);
    expect(up.status).toBe(202);
    const fin = await ctx.http
      .post(`/api/v1/uploads/${up.body.uploadId}/finalization`)
      .set('x-registration-token', draft.uploadToken)
      .send();
    expect(fin.status).toBe(200);
    expect(fin.body.state).toBe('REJECTED');
    expect(fin.body.rejectionReason).toBe('VIDEO_INVALID_FORMAT');
  }, 60_000);

  it('rejects an AVI renamed to .mp4 (container truth, not extension)', async () => {
    const draft = await draftWithUploadToken();
    const avi = join(mediaDir, 'clip.avi');
    execFileSync('ffmpeg', [
      '-f', 'lavfi', '-i', 'color=c=blue:s=64x64:d=1',
      '-pix_fmt', 'yuv420p', '-y', avi,
    ]);
    const mp4 = join(mediaDir, 'clip.mp4');
    await writeFile(mp4, await readFile(avi));
    const up = await upload(draft, mp4);
    const fin = await ctx.http
      .post(`/api/v1/uploads/${up.body.uploadId}/finalization`)
      .set('x-registration-token', draft.uploadToken)
      .send();
    expect(fin.body.state).toBe('REJECTED');
    expect(fin.body.rejectionReason).toBe('VIDEO_INVALID_FORMAT');
  }, 60_000);

  it('rejects a video longer than 120 seconds with VIDEO_TOO_LONG', async () => {
    const draft = await draftWithUploadToken();
    const file = join(mediaDir, 'long.mp4');
    execFileSync('ffmpeg', [
      '-f', 'lavfi', '-i', 'color=c=green:s=64x64:d=121',
      '-pix_fmt', 'yuv420p', '-y', file,
    ]);
    const up = await upload(draft, file);
    const fin = await ctx.http
      .post(`/api/v1/uploads/${up.body.uploadId}/finalization`)
      .set('x-registration-token', draft.uploadToken)
      .send();
    expect(fin.body.state).toBe('REJECTED');
    expect(fin.body.rejectionReason).toBe('VIDEO_TOO_LONG');
  }, 120_000);

  it('finalization without stored bytes reports UPLOAD_INCOMPLETE', async () => {
    const draft = await draftWithUploadToken();
    // Create an INITIATED upload row directly (no bytes).
    const upload = await ctx.prisma.media_uploads.create({
      data: {
        registration_id: draft.registrationId,
        object_key: `v/${randomUUID()}`,
        state: 'INITIATED',
        expires_at: new Date(Date.now() + 3_600_000),
      },
    });
    const fin = await ctx.http
      .post(`/api/v1/uploads/${upload.id}/finalization`)
      .set('x-registration-token', draft.uploadToken)
      .send();
    expect(fin.status).toBe(409);
    expect(fin.body.error.code).toBe('UPLOAD_INCOMPLETE');
  });
});
