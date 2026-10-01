"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/paths";

type Props = {
  src: string;
  alt: string;
  className?: string;
  label?: string;
};

/** Ảnh minh hoạ; nếu file chưa tồn tại thì hiện hoạ tiết thương hiệu thay thế. */
export default function Photo({ src, alt, className = "", label }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  // Ảnh có thể lỗi trước khi React hydrate (onError bị lỡ), nên kiểm tra lại khi mount.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <div className={`photo-fallback relative overflow-hidden ${className}`}>
      {failed ? (
        label && (
          <span className="eyebrow absolute bottom-4 left-4 text-white/70" aria-hidden>
            {label}
          </span>
        )
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={asset(src)}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover text-transparent"
        />
      )}
    </div>
  );
}
