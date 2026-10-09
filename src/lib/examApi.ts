// API thi Vòng 1 cho thí sinh (cookie phiên + CSRF, dùng chung adminCall).
export { adminCall as apiCall, AdminError as ApiCallError } from "./adminApi";

export type Assignment = {
  assignmentId: string;
  exam: { id: string; round: number; name: string; durationSeconds: number };
  schedule: { opensAt: string; closesAt: string; capacity: number };
  attemptsUsed: number;
  attemptQuota: number;
  activeAttemptId: string | null;
  finalScore: { points: string | number; winningAttemptId: string } | null;
};

export type Availability = {
  assignmentId: string;
  canStart: boolean;
  reasons: string[];
  schedule: { opensAt: string; closesAt: string };
  attemptQuota: { used: number; max: number };
  serverTime: string;
};

export type AttemptView = {
  attempt: { id: string; ordinal: number; state: "ACTIVE" | "FINALIZED"; startedAt: string; deadlineAt: string; serverTime: string; writerGeneration: number | null };
  form: { deliveredQuestionId: string; position: number; prompt: string; points: number; options: { deliveredOptionId: string; position: number; text: string }[] }[];
  candidateState: { deliveredQuestionId: string; selectedOptionId: string | null; answerRevision: number; reviewFlag: boolean; flagRevision: number }[];
};

export const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16));

export const idempotencyKey = () => uuid().replace(/-/g, "");

export const fmtTime = (iso: string, lang: "vi" | "en" = "vi") =>
  new Date(iso).toLocaleString(lang === "en" ? "en-GB" : "vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
