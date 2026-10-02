"use client";

import { useRef, useState } from "react";
import { MAX_VIDEO_MB, MAX_VIDEO_SECONDS, readVideoDuration } from "@/lib/upload";
import type { Lang } from "@/lib/i18n";
import Icon from "./Icon";

type Props = {
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
    tooBig: `Video lớn hơn ${MAX_VIDEO_MB} MB. Hãy nén hoặc giảm độ phân giải rồi thử lại.`,
    tooLong: (d: string) => `Video dài ${d}, vượt quá ${MAX_VIDEO_SECONDS} giây.`,
    label: `Video giới thiệu (tối đa ${MAX_VIDEO_SECONDS} giây) *`,
    hint: "Giới thiệu bản thân và trả lời câu hỏi tình huống do Ban Tổ chức công bố.",
    remove: "Bỏ video đã chọn",
    drop: "Kéo thả video vào đây hoặc bấm để chọn",
    formats: `MP4, MOV, WebM · tối đa ${MAX_VIDEO_MB} MB`,
    pick: "Chọn video giới thiệu",
  },
  en: {
    notVideo: "Please choose a video file (mp4, mov...).",
    tooBig: `The video is larger than ${MAX_VIDEO_MB} MB. Compress it or lower the resolution, then try again.`,
    tooLong: (d: string) => `The video is ${d} long, over the ${MAX_VIDEO_SECONDS}-second limit.`,
    label: `Intro video (max ${MAX_VIDEO_SECONDS} seconds) *`,
    hint: "Introduce yourself and answer the case question announced by the Organizing Committee.",
    remove: "Remove selected video",
    drop: "Drag and drop your video here, or click to choose",
    formats: `MP4, MOV, WebM · up to ${MAX_VIDEO_MB} MB`,
    pick: "Choose intro video",
  },
};

export default function VideoUpload({ lang, file, onChange, progress }: Props) {
  const t = text[lang];
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  async function pick(f: File | undefined) {
    setError("");
    if (!f) return;
    if (!f.type.startsWith("video/")) return reject(t.notVideo);
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) return reject(t.tooBig);
    const d = await readVideoDuration(f);
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
        {file ? (
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
            <p className="mt-1 text-sm text-muted">{t.formats}</p>
          </div>
        )}
        <input
          ref={input}
          type="file"
          accept="video/*"
          required={!file}
          onChange={(e) => pick(e.target.files?.[0])}
          className={`absolute inset-0 cursor-pointer opacity-0 ${file ? "pointer-events-none" : ""}`}
          aria-label={t.pick}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-orange-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
