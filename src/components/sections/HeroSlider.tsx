"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import type { Lang } from "@/lib/i18n";
import { asset } from "@/lib/paths";

export type NewsSlide = {
  id: string;
  href: string;
  external: boolean;
  image: string;
  imageAlt: string;
  source: string;
  sourceRole?: string;
  date: string;
  title: string;
  summary: string;
};

const INTERVAL_MS = 6500;

const text = {
  vi: { label: "Tin nổi bật", press: "Báo chí nói về NextGen Manager", read: "Đọc bài viết", prev: "Slide trước", next: "Slide sau", goTo: (n: number) => `Chuyển tới slide ${n}` },
  en: { label: "Highlights", press: "NextGen Manager in the press", read: "Read the article", prev: "Previous slide", next: "Next slide", goTo: (n: number) => `Go to slide ${n}` },
};

/**
 * Trang bìa dạng slideshow (như trang chủ VNU): slide đầu là banner cuộc thi (children),
 * tiếp theo là các bài báo truyền thông. Tự chuyển, dừng khi rê chuột/đang thao tác, vuốt được trên điện thoại.
 */
export default function HeroSlider({ lang, banner, news }: { lang: Lang; banner: React.ReactNode; news: NewsSlide[] }) {
  const t = text[lang];
  const count = news.length + 1;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || reduced || count < 2) return;
    const id = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [index, paused, reduced, count, go]);

  return (
    <div
      data-tour="hero"
      role="region"
      aria-roledescription="carousel"
      aria-label={t.label}
      className="group/slider relative aspect-[16/9] overflow-hidden bg-[#0d0f0c]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(index - 1);
        if (e.key === "ArrowRight") go(index + 1);
      }}
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {/* Slide 1: banner cuộc thi */}
      <Slide active={index === 0} label={`1 / ${count}`}>
        {banner}
      </Slide>

      {/* Các slide bài báo */}
      {news.map((n, i) => {
        const active = index === i + 1;
        const LinkTag = n.external ? "a" : Link;
        const linkProps = n.external ? { href: n.href, target: "_blank", rel: "noopener noreferrer" } : { href: n.href };
        return (
          <Slide key={n.id} active={active} label={`${i + 2} / ${count}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset(n.image)}
              alt={n.imageAlt}
              loading="lazy"
              className={`absolute inset-0 h-full w-full object-cover ${active && !reduced ? "hero-zoom" : ""}`}
            />
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-navy-deep via-navy-deep/55 to-navy-deep/5" />
            <div aria-hidden className="absolute inset-0 bg-linear-to-r from-navy-deep/70 via-navy-deep/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 pb-9 sm:pb-12 lg:pb-16">
              <div className="container-x">
                <div className={`max-w-3xl transition duration-700 ${active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}>
                  <p className="hidden text-[13px] font-semibold tracking-[0.16em] text-gold uppercase sm:block">{t.press}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] sm:mt-3 sm:text-xs">
                    <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-semibold text-white ring-1 ring-white/25 backdrop-blur sm:px-3 sm:py-1">{n.source}</span>
                    {n.sourceRole && <span className="hidden rounded-full bg-orange/90 px-2.5 py-0.5 font-semibold text-white sm:inline">{n.sourceRole}</span>}
                    <span className="text-white/75">{n.date}</span>
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-[15px] leading-snug font-bold text-white sm:mt-3 sm:line-clamp-3 sm:text-2xl lg:text-[2.1rem] lg:leading-tight">
                    {/* Cả slide bấm được nhờ lớp phủ của link tiêu đề */}
                    <LinkTag {...linkProps} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none" tabIndex={active ? 0 : -1}>
                      {n.title}
                    </LinkTag>
                  </h2>
                  <p className="mt-3 hidden line-clamp-2 max-w-2xl text-[15px] leading-relaxed text-white/85 md:block lg:text-base">{n.summary}</p>
                  <span className="relative mt-5 hidden items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow-lg transition group-hover/slider:gap-3 md:inline-flex">
                    {t.read} <Icon name="arrowRight" className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          </Slide>
        );
      })}

      {/* Nút trái/phải */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label={t.prev}
            className="absolute top-1/2 left-3 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 ring-1 ring-white/30 backdrop-blur transition group-hover/slider:opacity-100 hover:bg-black/50 focus-visible:opacity-100 sm:flex lg:left-6"
          >
            <Icon name="chevronLeft" className="h-6 w-6" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label={t.next}
            className="absolute top-1/2 right-3 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white opacity-0 ring-1 ring-white/30 backdrop-blur transition group-hover/slider:opacity-100 hover:bg-black/50 focus-visible:opacity-100 sm:flex lg:right-6"
          >
            <Icon name="chevronRight" className="h-6 w-6" strokeWidth={2} />
          </button>

          {/* Chấm chỉ slide, chấm đang xem có thanh tiến trình */}
          <div className="absolute inset-x-0 bottom-2.5 z-20 flex justify-center gap-1.5 sm:bottom-4 sm:gap-2">
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={t.goTo(i + 1)}
                aria-current={i === index ? "true" : undefined}
                className={`relative h-1.5 overflow-hidden rounded-full bg-white/40 transition-all sm:h-2 ${i === index ? "w-8 sm:w-12" : "w-1.5 hover:bg-white/70 sm:w-2"}`}
              >
                {i === index && (
                  <span
                    key={`${index}-${paused}`}
                    className={`absolute inset-y-0 left-0 rounded-full bg-white ${paused || reduced ? "w-full" : "hero-progress"}`}
                    style={{ animationDuration: `${INTERVAL_MS}ms` }}
                  />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Slide({ active, label, children }: { active: boolean; label: string; children: React.ReactNode }) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      aria-hidden={!active || undefined}
      inert={!active || undefined}
      className={`absolute inset-0 transition-opacity duration-700 ease-out ${active ? "z-10 opacity-100" : "z-0 opacity-0"}`}
    >
      {children}
    </div>
  );
}
