import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat, unlink, open } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AppException } from '../common/errors/app-error';

const execFileAsync = promisify(execFile);

export type MediaRejectionReason =
  | 'VIDEO_TOO_LARGE'
  | 'VIDEO_TOO_LONG'
  | 'VIDEO_INVALID_FORMAT'
  | 'VIDEO_VALIDATION_FAILED'
  | 'PHOTO_TOO_LARGE'
  | 'PHOTO_INVALID_FORMAT';

export type MediaValidationOutcome =
  | {
      status: 'READY';
      sizeBytes: number;
      durationSeconds: number;
      checksumSha256: string;
    }
  | {
      status: 'REJECTED';
      reason: MediaRejectionReason;
    };

export type PhotoValidationOutcome =
  | {
      status: 'READY';
      sizeBytes: number;
      mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
      checksumSha256: string;
    }
  | { status: 'REJECTED'; reason: 'PHOTO_TOO_LARGE' | 'PHOTO_INVALID_FORMAT' };

interface PhotoMagic {
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
  test: (b: Buffer) => boolean;
}

const PHOTO_MAGICS: PhotoMagic[] = [
  // JPEG: FF D8 FF
  { mimeType: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  {
    mimeType: 'image/png',
    test: (b) =>
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  // WEBP: RIFF....WEBP
  {
    mimeType: 'image/webp',
    test: (b) =>
      b.subarray(0, 4).toString('latin1') === 'RIFF' &&
      b.subarray(8, 12).toString('latin1') === 'WEBP',
  },
];

interface FfprobeFormat {
  format_name?: string;
  duration?: string;
}

interface FfprobeOutput {
  format?: FfprobeFormat;
}

/**
 * Real server-side media validation with ffprobe (inside Docker).
 * Never trusts extension, browser MIME, browser duration or client size.
 * ffprobe is invoked via execFile — no shell interpolation of any path.
 */
@Injectable()
export class MediaValidationService {
  async validate(
    filePath: string,
    limits: { maxBytes: number; maxDurationSeconds: number },
  ): Promise<MediaValidationOutcome> {
    let sizeBytes: number;
    try {
      sizeBytes = (await stat(filePath)).size;
    } catch {
      return { status: 'REJECTED', reason: 'VIDEO_VALIDATION_FAILED' };
    }
    if (sizeBytes > limits.maxBytes) return { status: 'REJECTED', reason: 'VIDEO_TOO_LARGE' };
    if (sizeBytes < 1) return { status: 'REJECTED', reason: 'VIDEO_VALIDATION_FAILED' };

    let probe: FfprobeOutput;
    try {
      const { stdout } = await execFileAsync(
        'ffprobe',
        ['-v', 'error', '-print_format', 'json', '-show_format', filePath],
        { timeout: 30_000, maxBuffer: 1024 * 1024 },
      );
      probe = JSON.parse(stdout) as FfprobeOutput;
    } catch (e) {
      const err = e as NodeJS.ErrnoException & { code?: string | number };
      if (err.code === 'ENOENT') {
        throw AppException.dependencyUnavailable('ffprobe is not available in this environment');
      }
      // Non-zero ffprobe exit: unparsable/corrupt container.
      return { status: 'REJECTED', reason: 'VIDEO_INVALID_FORMAT' };
    }

    const formatName = probe.format?.format_name ?? '';
    if (!formatName.split(',').includes('mp4')) {
      return { status: 'REJECTED', reason: 'VIDEO_INVALID_FORMAT' };
    }
    const duration = Number(probe.format?.duration);
    if (!Number.isFinite(duration) || duration <= 0) {
      return { status: 'REJECTED', reason: 'VIDEO_VALIDATION_FAILED' };
    }
    if (duration > limits.maxDurationSeconds) {
      return { status: 'REJECTED', reason: 'VIDEO_TOO_LONG' };
    }
    const checksumSha256 = await this.sha256File(filePath);
    return { status: 'READY', sizeBytes, durationSeconds: Math.round(duration * 1000) / 1000, checksumSha256 };
  }

  /**
   * Personal photo validation for PR usage: content sniffing by magic bytes
   * (never the extension or browser MIME), exact size from the filesystem.
   */
  async validatePhoto(
    filePath: string,
    limits: { maxBytes: number },
  ): Promise<PhotoValidationOutcome> {
    let sizeBytes: number;
    let header: Buffer;
    try {
      sizeBytes = (await stat(filePath)).size;
      const handle = await open(filePath, 'r');
      try {
        const buf = Buffer.alloc(16);
        await handle.read(buf, 0, 16, 0);
        header = buf;
      } finally {
        await handle.close();
      }
    } catch {
      return { status: 'REJECTED', reason: 'PHOTO_INVALID_FORMAT' };
    }
    if (sizeBytes > limits.maxBytes) return { status: 'REJECTED', reason: 'PHOTO_TOO_LARGE' };
    if (sizeBytes < 1) return { status: 'REJECTED', reason: 'PHOTO_INVALID_FORMAT' };
    const magic = PHOTO_MAGICS.find((m) => m.test(header));
    if (!magic) return { status: 'REJECTED', reason: 'PHOTO_INVALID_FORMAT' };
    const checksumSha256 = await this.sha256File(filePath);
    return { status: 'READY', sizeBytes, mimeType: magic.mimeType, checksumSha256 };
  }

  async cleanupTemp(tmpPath: string | undefined): Promise<void> {
    if (tmpPath) await unlink(tmpPath).catch(() => undefined);
  }

  private sha256File(filePath: string): Promise<string> {
    return new Promise((resolvePromise, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolvePromise(hash.digest('hex')));
    });
  }
}

