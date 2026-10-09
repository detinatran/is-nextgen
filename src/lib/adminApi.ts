// Gọi API quản trị (cookie phiên isng_session + CSRF double-submit isng_csrf → x-csrf-token).
import { apiBase } from "./api";

// API của trang quản trị cũ nằm dưới /admin-legacy (admin mới dùng /admin); /admin/session dùng chung
export const adminUrl = (path: string) =>
  `${apiBase}/api/v1${path.startsWith("/admin/") && !path.startsWith("/admin/session") ? path.replace(/^\/admin\//, "/admin-legacy/") : path}`;

function csrf() {
  return document.cookie.match(/(?:^|; )isng_csrf=([^;]+)/)?.[1] ?? "";
}

export class AdminError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function adminCall<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");
  if (init.method && init.method !== "GET") headers.set("x-csrf-token", decodeURIComponent(csrf()));
  const res = await fetch(adminUrl(path), { ...init, headers, credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminError(res.status, data?.error?.code ?? `HTTP_${res.status}`, data?.error?.message ?? res.statusText);
  return data as T;
}

export type AdminRow = {
  registrationId: string;
  candidateCode: string | null;
  state: string;
  submittedAt: string | null;
  createdAt: string;
  fullName: string;
  dateOfBirth: string | null;
  studentId: string | null;
  school: string | null;
  department: string | null;
  major: string | null;
  email: string;
  phone: string | null;
  facebook: string | null;
  mediaConsent: boolean | null;
  duplicateFlagged: boolean;
  hasPhoto: boolean;
  hasVideo: boolean;
  videoSizeBytes: number | null;
  videoDurationSeconds: number | null;
};

export type AdminList = {
  items: AdminRow[];
  total: number;
  page: number;
  pageSize: number;
  schools: { school: string; total: number }[];
};
