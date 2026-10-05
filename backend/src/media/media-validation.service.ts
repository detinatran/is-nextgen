import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat, unlink } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AppException } from '../common/errors/app-error';

const execFileAsync = promisify(execFile);

export type MediaRejectionReason =
  | 'VIDEO_TOO_LARGE'
  | 'VIDEO_TOO_LONG'
  | 'VIDEO_INVALID_FORMAT'
  | 'VIDEO_VALIDATION_FAILED';

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

