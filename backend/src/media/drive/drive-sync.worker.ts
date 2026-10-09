import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { stat, unlink } from 'node:fs/promises';
import { PrismaService } from '../../database/prisma.service';
import type { AppConfig } from '../../config/configuration';
import { LocalStorageService } from '../storage/local-storage.service';
import { DriveService } from './drive.service';

const BATCH = 5;

/**
 * Chép video của hồ sơ đã nộp sang Google Drive, đối chiếu MD5 và kích thước,
 * rồi mới xoá bản trên ổ máy chủ. Lỗi thì giữ nguyên bản trên máy chủ và thử lại lượt sau.
 */
@Injectable()
export class DriveSyncWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DriveSyncWorker.name);
  private readonly storage: LocalStorageService;
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly drive: DriveService,
    private readonly config: ConfigService<AppConfig>,
  ) {
    this.storage = new LocalStorageService(config.get('mediaStorageDir', './.data/media'));
  }

  onModuleInit(): void {
    if (process.env['WORKERS_DISABLED'] === '1' || !this.drive.enabled) {
      this.logger.log('drive sync disabled');
      return;
    }
    this.timer = setInterval(() => void this.sweep(), this.config.get('driveSyncIntervalMs', 60_000));
    this.timer.unref?.();
    void this.sweep();
    this.logger.log('drive sync worker started');
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async sweep(): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    let done = 0;
    try {
      const rows = await this.prisma.$queryRaw<
        { media_object_id: string; object_key: string; mime_type: string; size_bytes: bigint; candidate_code: string | null; full_name: string | null }[]
      >`
        SELECT mo.id AS media_object_id, mo.object_key, mo.mime_type, mo.size_bytes, c.candidate_code, p.full_name
        FROM registration_videos rv
        JOIN registrations r ON r.id = rv.registration_id AND r.state = 'SUBMITTED'
        JOIN media_objects mo ON mo.id = rv.media_object_id
        JOIN candidates c ON c.id = r.candidate_id
        LEFT JOIN candidate_profiles p ON p.candidate_id = c.id
        LEFT JOIN media_drive_copies d ON d.media_object_id = mo.id
        WHERE d.media_object_id IS NULL
        ORDER BY rv.bound_at
        LIMIT ${BATCH}`;
      for (const row of rows) {
        try {
          await this.copy(row);
          done++;
        } catch (e) {
          this.logger.warn(`drive sync failed media=${row.media_object_id}: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    } catch (e) {
      this.logger.warn(`drive sync sweep error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      this.running = false;
    }
    return done;
  }

  private async copy(row: { media_object_id: string; object_key: string; mime_type: string; size_bytes: bigint; candidate_code: string | null; full_name: string | null }) {
    const path = this.storage.pathFor(row.object_key);
    const { size } = await stat(path);
    if (BigInt(size) !== row.size_bytes) throw new Error('local file size differs from the sealed record');
    const md5 = await new Promise<string>((resolve, reject) => {
      const h = createHash('md5');
      createReadStream(path)
        .on('data', (d) => h.update(d))
        .on('end', () => resolve(h.digest('hex')))
        .on('error', reject);
    });
    const name = `${row.candidate_code ?? row.media_object_id} - ${(row.full_name ?? '').replace(/[\\/:*?"<>|]/g, ' ').trim()}.mp4`;
    const file = await this.drive.upload(path, name, row.mime_type || 'video/mp4');
    if (file.md5Checksum !== md5 || Number(file.size) !== size) {
      throw new Error(`Drive copy mismatch (md5 ${file.md5Checksum} vs ${md5}, size ${file.size} vs ${size})`);
    }
    await this.prisma.media_drive_copies.create({
      data: { media_object_id: row.media_object_id, drive_file_id: file.id, drive_md5: md5, size_bytes: BigInt(size) },
    });
    if (this.config.get('driveDeleteLocal', true)) {
      await unlink(path);
      await this.prisma.media_drive_copies.update({ where: { media_object_id: row.media_object_id }, data: { local_deleted_at: new Date() } });
    }
    this.logger.log(`drive sync ok media=${row.media_object_id} bytes=${size}`);
  }
}
