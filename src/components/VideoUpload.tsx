"use client";

import { useRef, useState } from "react";
import { checkMp4 } from "@/lib/mp4";
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
  /** Không bắt buộc: bỏ dấu *, cho phép để trống, hiện ghi chú nộp bổ sung sau */
  optional?: boolean;
  /** Ghi chú riêng thay cho gợi ý mặc định (ví dụ hạn nộp bổ sung) */
  note?: string;
};

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const formatTime = (s: number) => {
  const total = Math.floor(s);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};

const text = {
  vi: {
    notVideo: "Vui lòng chọn file video (mp4, mov...).",
    notMp4: "Vui lòng chọn video định dạng MP4 (nếu quay bằng iPhone/MOV, hãy xuất sang MP4 rồi chọn lại).",
    corrupt: "File video bị lỗi hoặc chưa tải về đầy đủ. Hãy kiểm tra video phát được trên máy rồi chọn lại.",
    noVideo: "File này không có hình video. Hãy chọn đúng video giới thiệu.",
    tooBig: `Video lớn hơn ${MAX_VIDEO_MB} MB. Hãy nén hoặc giảm độ phân giải rồi thử lại.`,
    tooLong: (d: string) => `Video dài ${d}, cần ngắn hơn ${MAX_VIDEO_SECONDS / 60} phút (tối đa 01:59).`,
    label: `Video giới thiệu (dưới ${MAX_VIDEO_SECONDS / 60} phút) *`,
    labelOptional: `Video giới thiệu (dưới ${MAX_VIDEO_SECONDS / 60} phút) · không bắt buộc`,
    later: "Chưa có video? Bạn vẫn nộp đăng ký được, rồi đăng nhập tài khoản thí sinh để nộp bổ sung trước hạn của vòng thi.",
    hint: "Video cá nhân dưới 02 phút, chủ đề tự chọn.",
    remove: "Bỏ video đã chọn",
    drop: "Kéo thả video vào đây hoặc bấm để chọn",
    formats: `MP4, MOV, WebM · tối đa ${MAX_VIDEO_MB} MB`,
    formatsMp4: `MP4 · tối đa ${MAX_VIDEO_MB} MB`,
    checking: "Đang kiểm tra video...",
    unknownDuration: `Trình duyệt chưa đọc được độ dài video. Hệ thống sẽ kiểm tra khi nộp (dưới ${MAX_VIDEO_SECONDS / 60} phút).`,
    pick: "Chọn video giới thiệu",
  },
  en: {
    notVideo: "Please choose a video file (mp4, mov...).",
    notMp4: "Please choose an MP4 video (if recorded as MOV on iPhone/Mac, export it as MP4 first).",
    corrupt: "This video file is damaged or incomplete. Make sure it plays on your device, then choose it again.",
    noVideo: "This file has no video track. Please choose your intro video.",
    tooBig: `The video is larger than ${MAX_VIDEO_MB} MB. Compress it or lower the resolution, then try again.`,
    tooLong: (d: string) => `The video is ${d} long; it must be under ${MAX_VIDEO_SECONDS / 60} minutes (max 01:59).`,
    label: `Intro video (under ${MAX_VIDEO_SECONDS / 60} minutes) *`,
    labelOptional: `Intro video (under ${MAX_VIDEO_SECONDS / 60} minutes) · optional`,
    later: "No video yet? You can still register now, then log in to your candidate account to upload it before the round deadline.",
    hint: "A personal video under 02 minutes on a topic of your choice.",
    remove: "Remove selected video",
    drop: "Drag and drop your video here, or click to choose",
    formats: `MP4, MOV, WebM · up to ${MAX_VIDEO_MB} MB`,
    formatsMp4: `MP4 · up to ${MAX_VIDEO_MB} MB`,
    checking: "Checking your video...",
    unknownDuration: `Your browser could not read the video length. It will be checked on submission (under ${MAX_VIDEO_SECONDS / 60} minutes).`,
    pick: "Choose intro video",
  },
};

export default function VideoUpload({ lang, file, onChange, progress, mp4Only = false, onCheckingChange, formError, optional = false, note }: Props) {
  const t = text[lang];
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [checking, setChecking] = useState(false);

  async function pick(f: File | undefined) {
    setError("");
    if (!f) return;
    if (!mp4Only && !f.type.startsWith("video/") && !/\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(f.name)) {
      return reject(t.notVideo);
    }
    if (f.size > MAX_VIDEO_MB * 1024 * 1024) return reject(t.tooBig);
    onChange(null);
    setChecking(true);
    onCheckingChange?.(true);
    let d: number | null = null;
    if (mp4Only) {
      // Đọc thẳng cấu trúc nhị phân MP4: không phụ thuộc MIME của hệ điều hành hay codec trình duyệt
      const info = await checkMp4(f).catch(() => ({ ok: false as const, reason: "CORRUPT" as const }));
      if (!info.ok) {
        setChecking(false);
        onCheckingChange?.(false);
        return reject(info.reason === "NOT_MP4" ? t.notMp4 : info.reason === "NO_VIDEO" ? t.noVideo : t.corrupt);
      }
      d = info.duration;
    }
    if (d === null) d = await readVideoDuration(f);
    setChecking(false);
    onCheckingChange?.(false);
    // Server nhận video ngắn hơn hẳn 120 giây (đúng 2:00 cũng bị từ chối)
    if (d !== null && d >= MAX_VIDEO_SECONDS) return reject(t.tooLong(formatTime(d)));
    setDuration(d);
    onChange(f);
  }

  function reject(message: string) {
    setError(message);
    onChange(null);
    if (input.current) input.current.value = "";
  }

  function clear() {
    setError("");
    onChange(null);
    setDuration(null);
    if (input.current) input.current.value = "";
  }

  const uploading = progress !== null;

  return (
    <div className="sm:col-span-2" data-field="video">
      <span className="block text-[15px] font-semibold text-navy">{optional ? t.labelOptional : t.label}</span>
      <p className="mt-1 text-sm text-muted">{t.hint}</p>
      {(note || optional) && <p className="mt-1 text-sm font-medium text-orange-ink">{note ?? t.later}</p>}

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!uploading && !checking) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer) e.dataTransfer.dropEffect = uploading || checking ? "none" : "copy";
          if (!uploading && !checking) setDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragging(false);
          if (uploading || checking) return;
          const dropped = e.dataTransfer?.files?.[0];
          if (dropped) void pick(dropped);
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
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center rounded-xl px-4 py-8 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
            aria-label={t.pick}
          >
            <Icon name="arrowUp" className="h-6 w-6 text-orange-ink" strokeWidth={2} />
            <p className="mt-2 text-[15px] font-semibold text-navy">{t.drop}</p>
            <p className="mt-1 text-sm text-muted">{mp4Only ? t.formatsMp4 : t.formats}</p>
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept={mp4Only ? "video/mp4,.mp4,video/x-m4v" : "video/*,.mp4,.mov,.webm"}
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            e.target.value = "";
            void pick(picked);
          }}
          className="sr-only"
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
