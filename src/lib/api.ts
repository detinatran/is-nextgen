// Gửi hồ sơ đăng ký tới backend NestJS (thư mục backend/), theo đúng quy trình của API:
// tạo bản nháp → tải ảnh → tải video → chờ kiểm tra video → gắn video → nộp.

export const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
const competitionCode = process.env.NEXT_PUBLIC_COMPETITION_CODE || "ISNG-2026";

// Phiên bản lời cam kết thí sinh đã đọc; phải khớp registration-form.service.ts của backend
const WORDING = { dataProcessing: "DATA-V1-2026", mediaUsage: "MEDIA-V1-2026" };

export type Profile = {
  fullName: string;
  dateOfBirth: string;
  studentId: string;
  school: string;
  department: string;
  major: string;
  email: string;
  phone: string;
  facebook: string;
};

export type SubmitStep = "draft" | "photo" | "video" | "checking" | "submit";

export type SubmitResult = { candidateCode: string; favoriteCandidateEligible: boolean };

/** Lỗi từ backend: giữ mã máy (VIDEO_TOO_LONG...) để form hiển thị thông báo phù hợp. */
export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.token) headers.set("x-registration-token", init.token);
  if (init.body && typeof init.body === "string") headers.set("Content-Type", "application/json");
  const res = await fetch(`${apiBase}/api/v1${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data?.error?.code ?? `HTTP_${res.status}`, data?.error?.message ?? res.statusText);
  return data as T;
}

/** Tải file dạng multipart có báo tiến trình (fetch chưa hỗ trợ tiến trình upload). */
function upload<T>(path: string, file: File, token: string, onProgress: (ratio: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${apiBase}/api/v1${path}`);
    xhr.setRequestHeader("x-registration-token", token);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      let data: { error?: { code?: string; message?: string } } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
      else reject(new ApiError(data?.error?.code ?? `HTTP_${xhr.status}`, data?.error?.message ?? "Upload failed"));
    };
    xhr.onerror = () => reject(new ApiError("NETWORK", "Network error"));
    const body = new FormData();
    body.append("file", file);
    xhr.send(body);
  });
}

type UploadStatus = { uploadId: string; state: string; rejectionReason?: string; mediaObjectId?: string };

export async function submitRegistration(input: {
  profile: Profile;
  dataProcessing: boolean;
  mediaUsage: boolean;
  photo: File;
  video: File;
  onStep: (step: SubmitStep) => void;
  onProgress: (ratio: number) => void;
}): Promise<SubmitResult> {
  const { profile, photo, video, onStep, onProgress } = input;

  onStep("draft");
  const draft = await call<{ registrationId: string; capability: { uploadToken: string } }>("/registration-drafts", {
    method: "POST",
    body: JSON.stringify({
      competitionCode,
      ...profile,
      consent: { wordingVersion: WORDING.dataProcessing, granted: input.dataProcessing },
      mediaUsageConsent: { wordingVersion: WORDING.mediaUsage, granted: input.mediaUsage },
    }),
  });
  const id = draft.registrationId;
  const token = draft.capability.uploadToken;

  onStep("photo");
  onProgress(0);
  await upload(`/registrations/${id}/photos`, photo, token, onProgress);

  onStep("video");
  onProgress(0);
  const started = await upload<UploadStatus>(`/registrations/${id}/uploads`, video, token, onProgress);

  // Backend kiểm tra định dạng và độ dài video; chờ tới khi READY hoặc bị từ chối
  onStep("checking");
  let status = await call<UploadStatus>(`/uploads/${started.uploadId}/finalization`, { method: "POST", token });
  for (let i = 0; i < 60 && status.state !== "READY" && status.state !== "REJECTED"; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    status = await call<UploadStatus>(`/uploads/${started.uploadId}`, { token });
  }
  if (status.state !== "READY" || !status.mediaObjectId) {
    throw new ApiError(status.rejectionReason ?? "VIDEO_VALIDATION_FAILED", "Video was rejected");
  }
  await call(`/registrations/${id}/video-binding`, {
    method: "PUT",
    token,
    body: JSON.stringify({ mediaObjectId: status.mediaObjectId }),
  });

  onStep("submit");
  return call<SubmitResult>(`/registrations/${id}/submission`, {
    method: "POST",
    token,
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
}
