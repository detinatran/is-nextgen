import { randomUUID } from 'node:crypto';

export interface StorageAdapter {
  /** Moves the uploaded temp file into private storage under a random object key. */
  store(tmpPath: string, objectKey: string): Promise<void>;
  /** Absolute private path for the object key; never exposed through the API. */
  pathFor(objectKey: string): string;
  delete(objectKey: string): Promise<void>;
}

export function newObjectKey(): string {
  return `v/${randomUUID()}`;
}
