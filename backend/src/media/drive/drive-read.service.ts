import { Injectable } from '@nestjs/common';

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://www.googleapis.com/drive/v3';

/**
 * Đọc video thí sinh từ Google Drive của nextgen@vnuis.edu.vn.
 * Backend trang chính (nhánh candidate) chép video sang Drive rồi xoá bản trên máy chủ
 * (bảng media_drive_copies); admin cần đọc lại từ Drive để phát. Chỉ đọc, không ghi.
 */
@Injectable()
export class DriveReadService {
  private token?: { value: string; expiresAt: number };
  private readonly clientId = process.env.GOOGLE_DRIVE_CLIENT_ID ?? '';
  private readonly clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET ?? '';
  private readonly refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN ?? '';

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
    if (!res.ok) throw Object.assign(new Error(`Drive token refresh failed: HTTP ${res.status}`), { status: 503 });
    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return body.access_token;
  }

  /** Một đoạn file (Range) để trình duyệt phát và tua video. */
  async download(fileId: string, start: number, end: number): Promise<Response> {
    const res = await fetch(`${API}/files/${encodeURIComponent(fileId)}?alt=media`, {
      headers: { Authorization: `Bearer ${await this.accessToken()}`, Range: `bytes=${start}-${end}` },
    });
    if (!res.ok || !res.body) throw Object.assign(new Error(`Drive download failed: HTTP ${res.status}`), { status: res.status });
    return res;
  }
}
