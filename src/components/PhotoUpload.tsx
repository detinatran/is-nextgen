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
};

const text = {
  vi: {
    label: "Ảnh cá nhân *",
    hint: "01 ảnh chân dung rõ mặt, dùng cho truyền thông của Cuộc thi.",
    notImage: "Vui lòng chọn file ảnh (JPG, PNG...).",
    tooBig: `Ảnh lớn hơn ${MAX_PHOTO_MB} MB. Hãy chọn ảnh nhỏ hơn.`,
    drop: "Kéo thả ảnh vào đây hoặc bấm để chọn",
    formats: `JPG, PNG, HEIC · tối đa ${MAX_PHOTO_MB} MB`,
    remove: "Bỏ ảnh đã chọn",
    pick: "Chọn ảnh cá nhân",
  },
  en: {
    label: "Personal photo *",
    hint: "01 clear portrait photo, used for the competition's communications.",
    notImage: "Please choose an image file (JPG, PNG...).",
    tooBig: `The photo is larger than ${MAX_PHOTO_MB} MB. Please choose a smaller one.`,
    drop: "Drag and drop your photo here, or click to choose",
    formats: `JPG, PNG, HEIC · up to ${MAX_PHOTO_MB} MB`,
    remove: "Remove selected photo",
    pick: "Choose personal photo",
  },
};

export default function PhotoUpload({ lang, file, onChange, progress }: Props) {
  const t = text[lang];
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(f: File | undefined) {
    setError("");
    if (!f) return;
    if (!f.type.startsWith("image/")) return reject(t.notImage);
    if (f.size > MAX_PHOTO_MB * 1024 * 1024) return reject(t.tooBig);
    onChange(f);
  }

  function reject(message: string) {
    setError(message);
    onChange(null);
    if (input.current) input.current.value = "";
  }

  function clear() {
    onChange(null);
    if (input.current) input.current.value = "";
  }

  const uploading = progress !== null;

  return (
    <div className="sm:col-span-2">
      <span className="block text-[15px] font-semibold text-navy">{t.label}</span>
      <p className="mt-1 text-sm text-muted">{t.hint}</p>
      {/* Ô input thật phủ lên vùng chọn để giữ validation "required" của trình duyệt */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0]);
        }}
        className={`relative mt-2 rounded-xl border-2 border-dashed transition ${file ? "border-line bg-white" : "border-line bg-mist/50 hover:border-orange/50"}`}
      >
        {file ? (
          <div className="flex items-center gap-4 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {preview && <img src={preview} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-semibold text-navy">{file.name}</p>
              <p className="text-sm text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
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
          <div className="pointer-events-none flex flex-col items-center px-4 py-6 text-center">
            <Icon name="users" className="h-6 w-6 text-orange-ink" strokeWidth={2} />
            <p className="mt-2 text-[15px] font-semibold text-navy">{t.drop}</p>
            <p className="mt-1 text-sm text-muted">{t.formats}</p>
          </div>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
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
