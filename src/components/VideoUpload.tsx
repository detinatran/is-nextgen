"use client";

import { useRef, useState } from "react";
import { MAX_VIDEO_MB, MAX_VIDEO_SECONDS, readVideoDuration } from "@/lib/upload";
import type { Lang } from "@/lib/i18n";
import Icon from "./Icon";

type Props = {
  /** Backend chỉ nhận MP4; Apps Script nhận mọi định dạng video */
  mp4Only?: boolean;
  /** Báo cho form biết đang kiểm tra video (chưa cho sang bước sau) */
  onCheckingChange?: (checking: boolean) => void;
  /** Lỗi do form báo, ví dụ chưa chọn video */
  formError?: string;
  lang: Lang;
  file: File | null;
  onChange: (file: File | null) => void;
  /** 0..1 khi đang tải lên, null khi chưa tải */
  progress: number | null;
};

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

const text = {
  vi: {
    notVideo: "Vui lòng chọn file video (mp4, mov...).",
    notMp4: "Vui lòng chọn video định dạng MP4.",
    tooBig: `Video lớn hơn ${MAX_VIDEO_MB} MB. Hãy nén hoặc giảm độ phân giải rồi thử lại.`,
    tooLong: (d: string) => `Video dài ${d}, vượt quá ${MAX_VIDEO_SECONDS / 60} phút.`,
    label: `Video giới thiệu (tối đa ${MAX_VIDEO_SECONDS / 60} phút) *`,
    hint: "Giới thiệu bản thân và trả lời câu hỏi tình huống do Ban Tổ chức công bố.",
    remove: "Bỏ video đã chọn",
    drop: "Kéo thả video vào đây hoặc bấm để chọn",
    formats: `MP4, MOV, WebM · tối đa ${MAX_VIDEO_MB} MB`,
    formatsMp4: `MP4 · tối đa ${MAX_VIDEO_MB} MB`,
    checking: "Đang kiểm tra video...",
    unknownDuration: `Trình duyệt chưa đọc được độ dài video. Hệ thống sẽ kiểm tra khi nộp (tối đa ${MAX_VIDEO_SECONDS / 60} phút).`,
    pick: "Chọn video giới thiệu",
  },
  en: {
    notVideo: "Please choose a video file (mp4, mov...).",
    notMp4: "Please choose an MP4 video.",
    tooBig: `The video is larger than ${MAX_VIDEO_MB} MB. Compress it or lower the resolution, then try again.`,
    tooLong: (d: string) => `The video is ${d} long, over the ${MAX_VIDEO_SECONDS / 60}-minute limit.`,
    label: `Intro video (max ${MAX_VIDEO_SECONDS / 60} minutes) *`,
    hint: "Introduce yourself and answer the case question announced by the Organizing Committee.",
    remove: "Remove selected video",
    drop: "Drag and drop your video here, or click to choose",
    formats: `MP4, MOV, WebM · up to ${MAX_VIDEO_MB} MB`,
    formatsMp4: `MP4 · up to ${MAX_VIDEO_MB} MB`,
    checking: "Checking your video...",
    unknownDuration: `Your browser could not read the video length. It will be checked on submission (max ${MAX_VIDEO_SECONDS / 60} minutes).`,
    pick: "Choose intro video",
  },
};

export default function VideoUpload({ lang, file, onChange, progress, mp4Only = false, onCheckingChange, formError }: Props) {
  const t = text[lang];
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [checking, setChecking] = useState(false);

  async function pick(f: File | undefined) {
    setError("");
    if (!f) return;
    if (mp4Only ? f.type !== "video/mp4" : !f.type.startsWith("video/")) return reject(mp4Only ? t.notMp4 : t.notVideo);
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) return reject(t.tooBig);
    onChange(null);
    setChecking(true);
    onCheckingChange?.(true);
    const d = await readVideoDuration(f);
    setChecking(false);
    onCheckingChange?.(false);
    // Cho phép lệch 1 giây do cách làm tròn của từng thiết bị
    if (d !== null && d > MAX_VIDEO_SECONDS + 1) return reject(t.tooLong(formatTime(d)));
    setDuration(d);
    onChange(f);
  }

  function reject(message: string) {
    setError(message);
    onChange(null);
    if (input.current) input.current.value = "";
  }

  function clear() {
    onChange(null);
    setDuration(null);
    if (input.current) input.current.value = "";
  }

  const uploading = progress !== null;

  return (
    <div className="sm:col-span-2">
      <span className="block text-[15px] font-semibold text-navy">{t.label}</span>
      <p className="mt-1 text-sm text-muted">{t.hint}</p>

      {/* Ô input thật nằm phủ lên vùng kéo thả để giữ được validation "required" của trình duyệt */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={`relative mt-2 rounded-xl border-2 border-dashed transition ${
          dragging ? "border-orange bg-cream" : file ? "border-line bg-white" : "border-line bg-mist/50 hover:border-orange/50"
        }`}
      >
        {checking ? (
          <div className="flex items-center justify-center gap-3 px-4 py-8 text-[15px] font-semibold text-navy" role="status">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-orange border-t-transparent" aria-hidden />
            {t.checking}
          </div>
        ) : file ? (
          <div className="flex items-center gap-4 p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cream text-orange-ink">
              <Icon name="play" className="ml-0.5 h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-navy">{file.name}</p>
              <p className="text-sm text-muted">
                {formatSize(file.size)}
                {duration !== null && ` · ${formatTime(duration)}`}
              </p>
              {duration === null && !uploading && <p className="mt-1 text-[13px] text-muted">{t.unknownDuration}</p>}
              {uploading && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-orange transition-[width]" style={{ width: `${progress * 100}%` }} />
                </div>
              )}
            </div>
            {uploading ? (
              <span className="text-sm font-semibold text-orange-ink tabular-nums">{Math.round(progress * 100)}%</span>
            ) : (
              <button type="button" onClick={clear} className="rounded-full p-2 text-muted hover:bg-mist hover:text-navy" aria-label={t.remove}>
                <Icon name="x" className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="pointer-events-none flex flex-col items-center px-4 py-8 text-center">
            <Icon name="arrowUp" className="h-6 w-6 text-orange-ink" strokeWidth={2} />
            <p className="mt-2 text-[15px] font-semibold text-navy">{t.drop}</p>
            <p className="mt-1 text-sm text-muted">{mp4Only ? t.formatsMp4 : t.formats}</p>
          </div>
        )}
        <input
          ref={input}
          type="file"
          accept={mp4Only ? "video/mp4" : "video/*"}
          required={!file}
          onChange={(e) => pick(e.target.files?.[0])}
          className={`absolute inset-0 cursor-pointer opacity-0 ${file || checking ? "pointer-events-none" : ""}`}
          aria-label={t.pick}
        />
      </div>
      {(error || formError) && (
        <p className="mt-2 text-sm font-medium text-orange-ink" role="alert">
          {error || formError}
        </p>
      )}
    </div>
  );
}
