"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/paths";

type Props = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Khi ảnh chưa có: "pattern" hiện hoạ tiết thương hiệu, "hide" ẩn hẳn khung ảnh, hoặc một nội dung thay thế. */
  fallback?: "pattern" | "hide" | React.ReactNode;
  priority?: boolean;
  children?: React.ReactNode;
};

/** Ảnh minh hoạ có phương án dự phòng khi file chưa được sinh ra. */
export default function Photo({ src, alt, className = "", imgClassName = "", fallback = "pattern", priority, children }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  // Ảnh có thể lỗi trước khi React hydrate (onError bị lỡ), nên kiểm tra lại khi mount.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed && fallback === "hide") return null;
  if (failed && fallback !== "pattern") return <>{fallback}</>;

  return (
    <div className={`relative overflow-hidden ${failed ? "photo-fallback" : "bg-mist"} ${className}`}>
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={asset(src)}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className={`absolute inset-0 h-full w-full object-cover text-transparent ${imgClassName}`}
        />
      )}
      {children}
    </div>
  );
}
