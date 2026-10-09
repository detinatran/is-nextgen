"use client";
import { useEffect, useState } from "react";
import { asset } from "@/lib/paths";

/** Banner đầu trang: 3 key visual (sinh bằng Codex) luân phiên 5 giây/lần, chuyển mờ dần.
 *  `position` canh vị trí cắt ảnh trên màn hình lớn để chữ không bị dải logo che. */
const slides = [
  { wide: "/images/generated/hero-a.webp", mobile: "/images/banner-a.webp", position: "50% 30%" },
  { wide: "/images/generated/hero-b.webp", mobile: "/images/banner-b.webp", position: "50% 12%" },
  { wide: "/images/generated/hero-c.webp", mobile: "/images/banner-c.webp", position: "50% 42%" },
];
const INTERVAL = 5000;

export default function HeroSlides({ label }: { label: string }) {
  const [current, setCurrent] = useState(0);
  // Ảnh 2 và 3 chỉ tải sau khi trang đã hiện ảnh đầu
  const [loadRest, setLoadRest] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setLoadRest(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setCurrent((i) => (paused ? i : (i + 1) % slides.length));
    }, INTERVAL);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div className="absolute inset-0" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((s, i) =>
        i === 0 || loadRest ? (
          <picture key={s.wide}>
            <source media="(min-width: 1024px)" srcSet={asset(s.wide)} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(s.mobile)}
              alt=""
              width={1920}
              height={1080}
              fetchPriority={i === 0 ? "high" : "low"}
              style={{ objectPosition: s.position }}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-out motion-reduce:transition-none max-lg:!object-center ${i === current ? "opacity-100" : "opacity-0"}`}
            />
          </picture>
        ) : null,
      )}
      <div className="absolute bottom-[14%] left-1/2 z-10 flex -translate-x-1/2 gap-2 max-lg:bottom-3" role="tablist" aria-label={label}>
        {slides.map((s, i) => (
          <button
            key={s.wide}
            type="button"
            role="tab"
            aria-selected={i === current}
            aria-label={`${label} ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`}
          />
        ))}
      </div>
    </div>
  );
}
