import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { open } from 'node:fs/promises';
import type { AppConfig } from '../../config/configuration';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';
// Resumable upload: mỗi phần phải là bội số của 256 KiB
const CHUNK_BYTES = 32 * 1024 * 1024;

export interface DriveFile {
  id: string;
  md5Checksum: string;
  size: string;
}

/**
 * Google Drive của tài khoản BTC (OAuth, scope drive.file): chỉ thấy và quản lý
 * file do chính backend tạo. Dùng để giữ bản chính video thí sinh ngoài máy chủ.
 */
@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);
  private token?: { value: string; expiresAt: number };
  private folderId?: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly refreshToken: string;
  private readonly folderName: string;

  constructor(config: ConfigService<AppConfig>) {
    this.clientId = config.get<string>('driveClientId') ?? '';
    this.clientSecret = config.get<string>('driveClientSecret') ?? '';
    this.refreshToken = config.get<string>('driveRefreshToken') ?? '';
    this.folderName = config.get<string>('driveFolderName') || 'NextGen Manager 2026 - Video thí sinh';
  }

  get enabled(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.refreshToken);
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) throw new Error(`Drive token refresh failed: HTTP ${res.status}`);
    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return body.access_token;
  }

  private async api(path: string, init: RequestInit = {}, base = API): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${await this.accessToken()}`);
    return fetch(`${base}${path}`, { ...init, headers });
  }

  /** Thư mục chứa video (tạo nếu chưa có). drive.file chỉ tìm thấy thư mục do backend tạo. */
  async folder(): Promise<string> {
    if (this.folderId) return this.folderId;
    const name = this.folderName;
    const q = `mimeType='application/vnd.google-apps.folder' and name='${name.replace(/'/g, "\\'")}' and trashed=false`;
    const found = await this.api(`/files?${new URLSearchParams({ q, fields: 'files(id)', spaces: 'drive' })}`);
    if (!found.ok) throw new Error(`Drive folder lookup failed: HTTP ${found.status}`);
    const existing = ((await found.json()) as { files: { id: string }[] }).files[0];
    if (existing) return (this.folderId = existing.id);
    const created = await this.api('/files?fields=id', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' }),
    });
    if (!created.ok) throw new Error(`Drive folder create failed: HTTP ${created.status}`);
    this.folderId = ((await created.json()) as { id: string }).id;
    this.logger.log(`drive folder created id=${this.folderId}`);
    return this.folderId;
  }

  /** Tải file lên bằng resumable upload, từng phần 32 MB, không nạp cả file vào RAM. */
  async upload(localPath: string, name: string, mimeType: string): Promise<DriveFile> {
    const handle = await open(localPath, 'r');
    try {
      const { size } = await handle.stat();
      const init = await this.api(
        '/files?uploadType=resumable&fields=id,md5Checksum,size',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'X-Upload-Content-Type': mimeType,
            'X-Upload-Content-Length': String(size),
          },
          body: JSON.stringify({ name, mimeType, parents: [await this.folder()] }),
        },
        UPLOAD_API,
      );
      const session = init.headers.get('location');
      if (!init.ok || !session) throw new Error(`Drive upload session failed: HTTP ${init.status}`);

      let offset = 0;
      const buf = Buffer.alloc(Math.min(CHUNK_BYTES, Math.max(size, 1)));
      while (true) {
        const n = size === 0 ? 0 : (await handle.read(buf, 0, Math.min(CHUNK_BYTES, size - offset), offset)).bytesRead;
        const last = offset + n >= size;
        const res = await fetch(session, {
          method: 'PUT',
          headers: {
            'Content-Length': String(n),
            'Content-Range': size === 0 ? 'bytes */0' : `bytes ${offset}-${offset + n - 1}/${size}`,
          },
          body: buf.subarray(0, n),
        });
        if (res.status === 308) {
          // Google báo đã nhận tới byte nào; tiếp tục từ đó
          const range = res.headers.get('range');
          offset = range ? Number(range.split('-')[1]) + 1 : offset + n;
          continue;
        }
        if (!res.ok) throw new Error(`Drive upload chunk failed: HTTP ${res.status}`);
        if (!last) throw new Error('Drive finished the upload before all bytes were sent');
        return (await res.json()) as DriveFile;
      }
    } finally {
      await handle.close();
    }
  }

  /** Luồng tải một đoạn file (hỗ trợ Range) để trang quản trị phát video. */
  async download(fileId: string, start: number, end: number): Promise<Response> {
    const res = await this.api(`/files/${encodeURIComponent(fileId)}?alt=media`, { headers: { Range: `bytes=${start}-${end}` } });
    if (!res.ok || !res.body) throw new Error(`Drive download failed: HTTP ${res.status}`);
    return res;
  }
}
