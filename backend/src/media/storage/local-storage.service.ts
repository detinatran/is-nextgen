import { Injectable } from '@nestjs/common';
import { copyFile, mkdir, rm, unlink } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { AppException } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import type { StorageAdapter } from './storage-adapter';

/**
 * Private local storage. Object keys are server-generated random UUID paths;
 * bytes are never web-served and the absolute filesystem path never leaves
 * the process. Sealed objects are never overwritten (exclusive copy).
 */
@Injectable()
export class LocalStorageService implements StorageAdapter {
  constructor(private readonly storageDir: string) {}

  async store(tmpPath: string, objectKey: string): Promise<void> {
    this.assertObjectKey(objectKey);
    const dest = this.pathFor(objectKey);
    // Create the object's full parent chain (object keys are `v/<uuid>`).
    await mkdir(dirname(dest), { recursive: true });
    try {
      await copyFile(tmpPath, dest, fsConstants.COPYFILE_EXCL);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'EEXIST') {
        throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Storage object key collision');
      }
      throw AppException.dependencyUnavailable(`Storage write failed: ${String(e)}`);
    }
    await unlink(tmpPath).catch(() => undefined);
  }

  pathFor(objectKey: string): string {
    this.assertObjectKey(objectKey);
    return resolve(join(this.storageDir, objectKey));
  }

  async delete(objectKey: string): Promise<void> {
    this.assertObjectKey(objectKey);
    await rm(this.pathFor(objectKey), { force: true });
  }

  private assertObjectKey(objectKey: string): void {
    if (!/^v\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(objectKey)) {
      throw AppException.validation('Invalid object key');
    }
  }
}
