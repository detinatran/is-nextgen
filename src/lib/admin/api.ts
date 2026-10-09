import { tr } from "@/lib/i18n/tr";
// Khi chạy dưới nextgen.vnuis.edu.vn/admin, API của admin đi qua /admin/api/v1 (nginx chuyển tới backend admin);
// chạy local không đặt biến thì giữ /api/v1 như cũ.
export const ADMIN_API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_BASE ?? "/api/v1";
/** Ảnh trong public/ của app admin (dưới /admin khi deploy chung tên miền với trang chính). */
export const adminAsset = (path: string) => `${process.env.NEXT_PUBLIC_ADMIN_ASSET_BASE ?? ""}${path}`;

export async function adminApi<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  // Ưu tiên cookie CSRF riêng của admin; cookie isng_csrf có thể là của phiên thí sinh cùng tên miền
  const readCookie = (name: string) =>
    document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  const csrf = typeof document !== "undefined" ? (readCookie("isng_admin_csrf") ?? readCookie("isng_csrf")) : undefined;
  if (csrf) headers.set("x-csrf-token", decodeURIComponent(csrf));
  const response = await fetch(`${ADMIN_API_BASE}/${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (
      [401, 403].includes(response.status) &&
      path.startsWith("admin/") &&
      typeof window !== "undefined"
    )
      window.location.assign("/admin/login");
    const issues = body?.error?.details?.issues;
    throw new Error(
      Array.isArray(issues)
        ? issues.join("; ")
        : body?.error?.message ? tr(body.error.message) : tr("Yêu cầu thất bại ({0})", response.status),
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export async function downloadAdmin(path: string, name: string) {
  const response = await fetch(`${ADMIN_API_BASE}/admin/${path}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message ?? tr("Không thể tải tệp"));
  }
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export type RegistrationItem = {
  id: string;
  candidateCode: string | null;
  userId: string | null;
  fullName: string;
  studentId: string | null;
  school: string | null;
  department: string | null;
  major: string | null;
  email: string;
  phone: string | null;
  facebook: string | null;
  dateOfBirth: string | null;
  registrationId: string | null;
  state: string | null;
  submittedAt: string | null;
  videoId: string | null;
  accountStatus: string | null;
  deleted: boolean;
};
export type QuestionItem = {
  id: string;
  questionId: string;
  version: number;
  prompt: string;
  difficulty: string;
  archived: boolean;
  pool: string;
  options: { text: string; isCorrect: boolean }[];
};
export type ScheduleItem = {
  id: string;
  name: string;
  competitionId: string;
  opensAt: string;
  closesAt: string;
  capacity: number;
  durationSeconds: number;
  assigned: number;
  blueprintId: string | null;
};
export type AssignmentItem = {
  id: string;
  candidateId: string;
  candidateCode: string;
  fullName: string;
  school: string;
  scheduleId: string;
  scheduleName: string;
  competitionId: string;
  status: string;
  attemptId: string | null;
  startedAt: string | null;
  finalizedAt: string | null;
  answered: number;
  points: string | null;
  maxPoints: string | null;
  focusLost?: number | string;
  rank?: number | null;
  percent?: number | null;
  top40?: boolean;
  tieAtCutoff?: boolean;
};
export type ScorePolicy = {
  label: string;
  maxScore: number;
  criteria: { code: string; weight: number; max: number }[];
};
export type PolicyItem = {
  id: string;
  competition_id: string;
  round: number;
  version: number;
  config: ScorePolicy;
};
export type Configuration = {
  competitions: { id: string; name: string }[];
  pools: { id: string; name: string }[];
  teams: { id: string; competition_id: string; team_code: string }[];
  policies: PolicyItem[];
};
export type ImportResult = {
  rows: unknown[];
  errors: { row: number; message: string }[];
  committed: boolean;
  summary?: {
    code: string;
    subjectType: string;
    judges: number;
    points: number;
  }[];
};

export const viTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Asia/Ho_Chi_Minh",
      }).format(new Date(value))
    : "—";
export const examStatus = (value: string) =>
  ({ NOT_STARTED: tr("Chưa vào"), IN_PROGRESS: tr("Đang làm"), SUBMITTED: tr("Đã nộp") })[
    value
  ] ?? value;
