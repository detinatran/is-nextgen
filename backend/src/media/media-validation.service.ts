import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat, unlink, open } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { AppException } from '../common/errors/app-error';

const execFileAsync = promisify(execFile);

const LEADING_PADDING_BOXES = new Set(['free', 'skip', 'wide', 'pdin']);
const MP4_COMPAT_BRANDS = new Set([
  'isom',
  'iso2',
  'iso3',
  'iso4',
  'iso5',
  'iso6',
  'mp41',
  'mp42',
  'avc1',
  'M4V ',
  'dash',
  'f4v ',
  'mmp4',
  'MSNV',
]);

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
      mimeType: 'image/jpeg' | 'image/png';
      checksumSha256: string;
    }
  | { status: 'REJECTED'; reason: 'PHOTO_TOO_LARGE' | 'PHOTO_INVALID_FORMAT' };

interface PhotoMagic {
  mimeType: 'image/jpeg' | 'image/png';
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
];

interface FfprobeFormat {
  format_name?: string;
  duration?: string;
}

interface FfprobeOutput {
  format?: FfprobeFormat;
  streams?: { codec_type?: string }[];
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
        ['-v', 'error', '-protocol_whitelist', 'file', '-print_format', 'json', '-show_format', '-show_streams', filePath],
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
    // ffprobe shares its MOV/MP4/3GP demuxer name. Inspect the actual ftyp box
    // (allowing small leading ISO padding boxes and hybrid qt+mp4 compatible brands)
    // and require a video stream; MIME/extension and the demuxer name are insufficient.
    if (
      !formatName.split(',').includes('mp4') ||
      !(await this.hasValidMp4Ftyp(filePath, sizeBytes)) ||
      !probe.streams?.some((s) => s.codec_type === 'video')
    ) {
      return { status: 'REJECTED', reason: 'VIDEO_INVALID_FORMAT' };
    }
    const duration = Number(probe.format?.duration);
    if (!Number.isFinite(duration) || duration <= 0) {
      return { status: 'REJECTED', reason: 'VIDEO_VALIDATION_FAILED' };
    }
    if (duration >= limits.maxDurationSeconds) {
      return { status: 'REJECTED', reason: 'VIDEO_TOO_LONG' };
    }
    const checksumSha256 = await this.sha256File(filePath);
    return { status: 'READY', sizeBytes, durationSeconds: Math.round(duration * 1000) / 1000, checksumSha256 };
  }

  private async hasValidMp4Ftyp(filePath: string, sizeBytes: number): Promise<boolean> {
    const handle = await open(filePath, 'r');
    try {
      let offset = 0;
      const head = Buffer.alloc(16);
      for (let i = 0; i < 5 && offset + 8 <= sizeBytes; i++) {
        const { bytesRead } = await handle.read(head, 0, Math.min(16, sizeBytes - offset), offset);
        if (bytesRead < 8) return false;
        let size = head.readUInt32BE(0);
        const type = head.subarray(4, 8).toString('latin1');
        let header = 8;
        if (size === 1) {
          if (bytesRead < 16) return false;
          size = Number(head.readBigUInt64BE(8));
          header = 16;
        } else if (size === 0) {
          size = sizeBytes - offset;
        }
        if (size < header || offset + size > sizeBytes) return false;
        if (type === 'ftyp') {
          if (size < header + 8 || size > 4096) return false;
          const payloadLen = size - header;
          const payload = Buffer.alloc(payloadLen);
          const r = await handle.read(payload, 0, payloadLen, offset + header);
          if (r.bytesRead < 8) return false;
          const major = payload.subarray(0, 4).toString('latin1');
          if (/^3g[p2]/.test(major)) return false;
          if (major === 'qt  ') {
            for (let at = 8; at + 4 <= payload.length; at += 4) {
              if (MP4_COMPAT_BRANDS.has(payload.subarray(at, at + 4).toString('latin1'))) {
                return true;
              }
            }
            return false;
          }
          return true;
        }
        if (!LEADING_PADDING_BOXES.has(type) || size > 65_536) return false;
        offset += size;
      }
      return false;
    } catch {
      return false;
    } finally {
      await handle.close();
    }
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
    try {
      // Decode a frame rather than accepting a forged header. Only local file
      // input is permitted; duration/output/time are bounded and stderr is private.
      await execFileAsync('ffmpeg', [
        '-v', 'error', '-xerror', '-nostdin', '-threads', '1',
        '-protocol_whitelist', 'file', '-i', filePath,
        '-map', '0:v:0', '-frames:v', '1', '-f', 'null', '-',
      ], { timeout: 30_000, maxBuffer: 1024 * 1024 });
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        throw AppException.dependencyUnavailable('Photo validation is unavailable');
      }
      return { status: 'REJECTED', reason: 'PHOTO_INVALID_FORMAT' };
    }
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
