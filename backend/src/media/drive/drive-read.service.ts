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

  private async accessToken(signal?: AbortSignal): Promise<string> {
    if (this.token && this.token.expiresAt > Date.now() + 60_000) return this.token.value;
    const timeout = AbortSignal.timeout(15_000);
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (!res.ok) {
      await res.body?.cancel().catch(() => undefined);
      throw Object.assign(new Error(`Drive token refresh failed: HTTP ${res.status}`), { status: 503 });
    }
    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
    return body.access_token;
  }

  /** Một đoạn file (Range) để trình duyệt phát và tua video. */
  async download(fileId: string, start: number, end: number, signal?: AbortSignal): Promise<Response> {
    if (signal?.aborted) {
      throw signal.reason ?? new DOMException('Aborted', 'AbortError');
    }
    const ac = new AbortController();
    const forward = () => ac.abort(signal?.reason);
    signal?.addEventListener('abort', forward, { once: true });
    // Chỉ giới hạn thời gian chờ phản hồi header, không ngắt luồng phát video dài sau khi đã nhận body
    const headerTimer = setTimeout(() => ac.abort(new Error('Drive header timeout')), 30_000);
    headerTimer.unref?.();
    try {
      const token = await this.accessToken(ac.signal);
      const res = await fetch(`${API}/files/${encodeURIComponent(fileId)}?alt=media`, {
        headers: { Authorization: `Bearer ${token}`, Range: `bytes=${start}-${end}` },
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        await res.body?.cancel().catch(() => undefined);
        throw Object.assign(new Error(`Drive download failed: HTTP ${res.status}`), { status: res.status });
      }
      return res;
    } catch (e) {
      signal?.removeEventListener('abort', forward);
      throw e;
    } finally {
      clearTimeout(headerTimer);
    }
  }
}
