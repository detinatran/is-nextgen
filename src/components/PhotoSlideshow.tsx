"use client";

import { useEffect, useState } from "react";
import { asset } from "@/lib/paths";

type Props = { images: string[]; alt: string; className?: string; imgClassName?: string; interval?: number };

/** Nhiều ảnh trong cùng một khung: chuyển mờ dần lần lượt, dừng khi người xem bật giảm chuyển động. */
export default function PhotoSlideshow({ images, alt, className = "", imgClassName = "", interval = 3500 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % images.length), interval);
    return () => window.clearInterval(id);
  }, [images.length, interval]);

  return (
    <div className={`relative overflow-hidden bg-mist ${className}`}>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={asset(src)}
          alt={i === index ? alt : ""}
          aria-hidden={i !== index || undefined}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${i === index ? "opacity-100" : "opacity-0"} ${imgClassName}`}
        />
      ))}
      {images.length > 1 && (
        <div aria-hidden className="absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
          {images.map((src, i) => (
            <span key={src} className={`h-1 rounded-full bg-white shadow transition-all ${i === index ? "w-3" : "w-1 opacity-60"}`} />
          ))}
        </div>
      )}
    </div>
  );
}
