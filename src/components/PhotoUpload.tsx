"use client";

import { useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { MAX_PHOTO_MB } from "@/lib/upload";
import Icon from "./Icon";

type Props = {
  lang: Lang;
  file: File | null;
  onChange: (file: File | null) => void;
  /** 0..1 khi đang tải lên, null khi chưa tải */
  progress: number | null;
  /** Lỗi do form báo, ví dụ chưa chọn ảnh */
  formError?: string;
};

// Backend kiểm tra ảnh bằng magic bytes (JPEG: FF D8 FF, PNG: 89 50 4E 47 0D 0A 1A 0A)
const PHOTO_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";

async function isJpegOrPng(file: Blob): Promise<boolean> {
  if (file.size < 8) return false;
  const b = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const isJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const isPng =
    b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
    b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a;
  return isJpeg || isPng;
}

const text = {
  vi: {
    label: "Ảnh cá nhân *",
    hint: "01 ảnh chân dung rõ mặt, dùng cho truyền thông của Cuộc thi.",
    notImage: "Vui lòng chọn ảnh JPG hoặc PNG.",
    tooBig: `Ảnh lớn hơn ${MAX_PHOTO_MB} MB. Hãy chọn ảnh nhỏ hơn.`,
    drop: "Kéo thả ảnh vào đây hoặc bấm để chọn",
    formats: `JPG, PNG · tối đa ${MAX_PHOTO_MB} MB`,
    remove: "Bỏ ảnh đã chọn",
    pick: "Chọn ảnh cá nhân",
  },
  en: {
    label: "Personal photo *",
    hint: "01 clear portrait photo, used for the competition's communications.",
    notImage: "Please choose a JPG or PNG image.",
    tooBig: `The photo is larger than ${MAX_PHOTO_MB} MB. Please choose a smaller one.`,
    drop: "Drag and drop your photo here, or click to choose",
    formats: `JPG, PNG · up to ${MAX_PHOTO_MB} MB`,
    remove: "Remove selected photo",
    pick: "Choose personal photo",
  },
};

export default function PhotoUpload({ lang, file, onChange, progress, formError }: Props) {
  const t = text[lang];
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function pick(f: File | undefined) {
    setError("");
    if (!f) return;
    if (f.size > MAX_PHOTO_MB * 1_000_000) return reject(t.tooBig);
    if (!(await isJpegOrPng(f).catch(() => false))) return reject(t.notImage);
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
    if (input.current) input.current.value = "";
  }

  const uploading = progress !== null;

  return (
    <div className="sm:col-span-2" data-field="photo">
      <span className="block text-[15px] font-semibold text-navy">{t.label}</span>
      <p className="mt-1 text-sm text-muted">{t.hint}</p>
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!uploading) setDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer) e.dataTransfer.dropEffect = uploading ? "none" : "copy";
          if (!uploading) setDragging(true);
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
          if (uploading) return;
          const dropped = e.dataTransfer?.files?.[0];
          if (dropped) void pick(dropped);
        }}
        className={`relative mt-2 rounded-xl border-2 border-dashed transition ${
          dragging ? "border-orange bg-cream" : file ? "border-line bg-white" : "border-line bg-mist/50 hover:border-orange/50"
        }`}
      >
        {file ? (
          <div className="flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview && <img src={preview} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-navy">{file.name}</p>
              <p className="text-sm text-muted">{file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`}</p>
              {uploading && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full bg-orange transition-[width]" style={{ width: `${progress * 100}%` }} />
                </div>
              )}
            </div>
            {!uploading && (
              <button type="button" onClick={clear} className="rounded-full p-2 text-muted hover:bg-mist hover:text-navy" aria-label={t.remove}>
                <Icon name="x" className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="flex w-full cursor-pointer flex-col items-center rounded-xl px-4 py-6 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
            aria-label={t.pick}
          >
            <Icon name="users" className="h-6 w-6 text-orange-ink" strokeWidth={2} />
            <p className="mt-2 text-[15px] font-semibold text-navy">{t.drop}</p>
            <p className="mt-1 text-sm text-muted">{t.formats}</p>
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept={PHOTO_ACCEPT}
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
