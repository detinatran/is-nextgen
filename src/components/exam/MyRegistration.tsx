"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, uploadVideo, type SubmitStep } from "@/lib/api";
import { ApiCallError, apiCall } from "@/lib/examApi";
import type { Lang } from "@/lib/i18n";
import Icon from "../Icon";
import VideoUpload from "../VideoUpload";

type Mine = {
  registrationId: string;
  candidateCode: string | null;
  fullName: string;
  video: { submittedAt: string; durationSeconds: number } | null;
  videoDeadline: string;
  canUploadVideo: boolean;
};

const copy = {
  vi: {
    title: "Hồ sơ của bạn",
    code: "Mã thí sinh",
    video: "Video giới thiệu",
    done: (d: string) => `Đã nộp (${d})`,
    missing: "Chưa nộp",
    deadline: (d: string) => `Hạn nộp video: ${d}`,
    expired: "Đã hết hạn nộp video.",
    send: "Nộp video",
    uploading: "Đang tải video...",
    checking: "Đang kiểm tra video...",
    sent: "Đã nhận video của bạn. Cảm ơn bạn!",
    sealed: "Video đã nộp không thay đổi được.",
    errors: {
      VIDEO_TOO_LONG: "Video dài quá 2 phút. Hãy cắt ngắn rồi gửi lại.",
      VIDEO_TOO_LARGE: "Video vượt dung lượng cho phép.",
      VIDEO_INVALID_FORMAT: "Video phải là file MP4.",
      VIDEO_VALIDATION_FAILED: "Không đọc được video. Hãy xuất lại file MP4 rồi thử lại.",
      UPLOAD_INCOMPLETE: "Video chưa tải lên xong. Vui lòng thử lại.",
      DEADLINE_PASSED: "Đã hết hạn nộp video.",
      STATE_CONFLICT: "Hồ sơ đã có video.",
      NETWORK: "Không tải được video lên. Kiểm tra kết nối mạng và thử lại.",
    } as Record<string, string>,
    failed: "Không nộp được video, vui lòng thử lại.",
  },
  en: {
    title: "Your application",
    code: "Candidate code",
    video: "Intro video",
    done: (d: string) => `Submitted (${d})`,
    missing: "Not submitted",
    deadline: (d: string) => `Video deadline: ${d}`,
    expired: "The video deadline has passed.",
    send: "Submit video",
    uploading: "Uploading video...",
    checking: "Checking your video...",
    sent: "We have received your video. Thank you!",
    sealed: "A submitted video cannot be changed.",
    errors: {
      VIDEO_TOO_LONG: "The video is longer than 2 minutes. Please trim it and try again.",
      VIDEO_TOO_LARGE: "The video is larger than allowed.",
      VIDEO_INVALID_FORMAT: "The video must be an MP4 file.",
      VIDEO_VALIDATION_FAILED: "We could not read the video. Please export it again as MP4.",
      UPLOAD_INCOMPLETE: "The video did not finish uploading. Please try again.",
      DEADLINE_PASSED: "The video deadline has passed.",
      STATE_CONFLICT: "Your application already has a video.",
      NETWORK: "Could not upload your video. Check your connection and try again.",
    } as Record<string, string>,
    failed: "Could not submit your video, please try again.",
  },
};

const fmt = (iso: string, lang: Lang) =>
  new Date(iso).toLocaleString(lang === "en" ? "en-GB" : "vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/** Hồ sơ đăng ký của thí sinh đang đăng nhập; chưa có video thì cho nộp bổ sung trước hạn. */
export default function MyRegistration({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [mine, setMine] = useState<Mine | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<SubmitStep | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    try {
      setMine(await apiCall<Mine>("/me/registration"));
    } catch {
      setMine(null);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!mine) return null;

  async function submit() {
    if (!file || !mine) return;
    setError("");
    setStep("video");
    setProgress(0);
    try {
      const cap = await apiCall<{ registrationId: string; uploadToken: string }>("/me/registration/video-capability", { method: "POST" });
      await uploadVideo(cap.registrationId, cap.uploadToken, file, setStep, setProgress);
      setSent(true);
      setFile(null);
      await load();
    } catch (err) {
      const code = err instanceof ApiError || err instanceof ApiCallError ? err.code : "";
      setError(t.errors[code] ?? t.failed);
    } finally {
      setStep(null);
      setProgress(null);
    }
  }

  const busy = step !== null;
  const expired = !mine.video && !mine.canUploadVideo;

  return (
    <section className="card mb-6 p-6 sm:p-8">
      <h2 className="text-xl font-bold text-navy">{t.title}</h2>
      <dl className="mt-4 grid gap-3 text-[15px] sm:grid-cols-2">
        <div className="rounded-2xl bg-mist p-4">
          <dt className="text-[13px] font-semibold text-muted">{t.code}</dt>
          <dd className="mt-1 text-lg font-bold tracking-wider text-navy">{mine.candidateCode ?? "—"}</dd>
        </div>
        <div className="rounded-2xl bg-mist p-4">
          <dt className="text-[13px] font-semibold text-muted">{t.video}</dt>
          <dd className={`mt-1 flex items-center gap-2 text-lg font-bold ${mine.video ? "text-[#15803d]" : "text-orange-ink"}`}>
            <Icon name={mine.video ? "check" : "clock"} className="h-5 w-5" strokeWidth={2.2} />
            {mine.video ? t.done(fmt(mine.video.submittedAt, lang)) : t.missing}
          </dd>
          {!mine.video && <p className="mt-1 text-[13px] text-muted">{expired ? t.expired : t.deadline(fmt(mine.videoDeadline, lang))}</p>}
        </div>
      </dl>

      {sent && (
        <p className="mt-4 rounded-xl bg-[#ecfdf3] px-4 py-3 text-[15px] font-medium text-[#15803d]" role="status">
          {t.sent}
        </p>
      )}

      {mine.canUploadVideo && (
        <div className="mt-6">
          <VideoUpload
            lang={lang}
            mp4Only
            optional={false}
            note={`${t.deadline(fmt(mine.videoDeadline, lang))}. ${t.sealed}`}
            file={file}
            onChange={setFile}
            progress={step === "video" ? progress : null}
          />
          <button type="button" onClick={submit} disabled={!file || busy} className="btn-primary mt-4 w-full py-3.5 disabled:opacity-60 sm:w-auto sm:px-10">
            {step === "checking" ? t.checking : busy ? `${t.uploading} ${Math.round((progress ?? 0) * 100)}%` : t.send}
          </button>
          {error && (
            <p className="mt-3 text-sm font-medium text-orange-ink" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
