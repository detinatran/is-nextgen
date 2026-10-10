"use client";

import { useEffect, useState } from "react";
import { asset } from "@/lib/paths";

type Props = {
  images: string[];
  className?: string;
  imgClassName?: string;
  /** Thời gian mỗi ảnh (ms). */
  interval?: number;
};

/** Trình chiếu ảnh chuyển mờ dần; một ảnh thì hiện tĩnh. Không tự chạy khi người dùng bật giảm chuyển động. */
export default function Slideshow({ images, className = "", imgClassName = "", interval = 4000 }: Props) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % images.length), interval);
    return () => window.clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className={`relative overflow-hidden bg-mist ${className}`}>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={asset(src)}
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === active ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      ))}
      {images.length > 1 && (
        <span aria-hidden className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-navy/35 px-2 py-1 backdrop-blur-sm">
          {images.map((src, i) => (
            <span key={src} className={`h-1.5 rounded-full bg-white transition-all duration-500 ${i === active ? "w-4" : "w-1.5 opacity-60"}`} />
          ))}
        </span>
      )}
    </div>
  );
}
