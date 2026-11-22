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
      className="group/slider relative w-full max-w-full"
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
      {/* Khung chứa slide: co giãn theo slide đang active để hỗ trợ mọi tỷ lệ banner không bị tràn ngang */}
      <div className="relative w-full overflow-hidden bg-navy-deep">
        {/* Slide 1: banner cuộc thi */}
        <Slide active={index === 0} label={`1 / ${count}`}>
          {banner}
        </Slide>

        {/* Các slide bài báo */}
        {news.map((n, i) => {
          const active = index === i + 1;
          const LinkTag = n.external ? "a" : Link;
          const linkProps = n.external
            ? { href: n.href, target: "_blank", rel: "noopener noreferrer" }
            : { href: n.href };
          return (
            <Slide key={n.id} active={active} label={`${i + 2} / ${count}`}>
              {/* Nền: navy + ảnh bài làm mờ để hoà màu (máy tính); điện thoại dùng ảnh tràn khung */}
              <div aria-hidden className="absolute inset-0 bg-navy-deep" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset(n.image)}
                alt=""
                aria-hidden
                loading="lazy"
                className="absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-30 blur-2xl lg:block"
              />
              <div
                aria-hidden
                className="absolute inset-0 hidden bg-[radial-gradient(ellipse_at_12%_25%,rgb(245_184_61/0.16),transparent_55%),radial-gradient(ellipse_at_90%_85%,rgb(31_91_224/0.35),transparent_60%)] lg:block"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset(n.image)}
                alt={n.imageAlt}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover lg:hidden ${active && !reduced ? "hero-zoom" : ""}`}
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-linear-to-t from-navy-deep via-navy-deep/65 to-navy-deep/15 lg:hidden"
              />

              <div className="relative z-10 flex min-h-[300px] items-end sm:min-h-[360px] lg:min-h-[420px] lg:items-center xl:min-h-[460px]">
                <div className="mx-auto grid w-full max-w-[77rem] items-center gap-6 px-4 py-7 sm:px-14 sm:py-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10 lg:px-16 lg:py-12 xl:gap-14">
                  <div
                    className={`min-w-0 transition duration-700 ${active ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                  >
                    <p className="hidden items-center gap-3 text-xs font-semibold tracking-[0.16em] text-gold uppercase sm:flex sm:text-[13px]">
                      <span aria-hidden className="h-px w-8 bg-current" />
                      {t.press}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] sm:mt-3 sm:text-xs">
                      <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-semibold text-white ring-1 ring-white/25 backdrop-blur sm:px-3 sm:py-1">
                        {n.source}
                      </span>
                      {n.sourceRole && (
                        <span className="hidden rounded-full bg-orange px-2.5 py-0.5 font-semibold text-white sm:inline">
                          {n.sourceRole}
                        </span>
                      )}
                      <span className="text-white/70">{n.date}</span>
                    </div>
                    <h2 className="mt-2 line-clamp-3 text-base leading-snug font-bold text-balance text-white sm:mt-3 sm:text-2xl lg:line-clamp-4 lg:text-[1.75rem] lg:leading-[1.22] xl:text-[2.15rem]">
                      {/* Cả slide bấm được nhờ lớp phủ của link tiêu đề */}
                      <LinkTag
                        {...linkProps}
                        className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                        tabIndex={active ? 0 : -1}
                      >
                        {n.title}
                      </LinkTag>
                    </h2>
                    <p className="mt-3 hidden line-clamp-2 text-sm leading-relaxed text-white/80 lg:block lg:text-[15px]">
                      {n.summary}
                    </p>
                    <span className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-navy shadow-lg transition group-hover/slider:gap-3 group-hover/slider:bg-gold sm:mt-5 sm:px-5 sm:py-2.5 sm:text-sm lg:mt-6">
                      {t.read} <Icon name="arrowRight" className="h-4 w-4" />
                    </span>
                  </div>
                  {/* Ảnh bài trong khung bo góc, viền vàng lệch phía sau */}
                  <div
                    className={`relative hidden min-w-0 transition duration-700 lg:block ${active ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"}`}
                  >
                    <div
                      aria-hidden
                      className="absolute -right-3 -bottom-3 h-full w-full rounded-2xl border-2 border-gold/40"
                    />
                    <div className="relative aspect-[16/10] max-h-[320px] w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/50 ring-1 ring-white/15 xl:max-h-[350px]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset(n.image)}
                        alt={n.imageAlt}
                        loading="lazy"
                        className={`h-full w-full object-cover ${active && !reduced ? "hero-zoom" : ""}`}
                      />
                    </div>
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
              className="absolute top-1/2 left-2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white opacity-0 ring-1 ring-white/30 backdrop-blur transition group-hover/slider:opacity-100 hover:bg-black/55 focus-visible:opacity-100 sm:flex lg:left-3 lg:h-11 lg:w-11"
            >
              <Icon name="chevronLeft" className="h-6 w-6" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={t.next}
              className="absolute top-1/2 right-2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white opacity-0 ring-1 ring-white/30 backdrop-blur transition group-hover/slider:opacity-100 hover:bg-black/55 focus-visible:opacity-100 sm:flex lg:right-3 lg:h-11 lg:w-11"
            >
              <Icon name="chevronRight" className="h-6 w-6" strokeWidth={2} />
            </button>
          </>
        )}
      </div>

      {/* Chấm chỉ slide đặt bên dưới khung để không che chữ, logo hay timeline trên banner */}
      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5 sm:gap-2">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={t.goTo(i + 1)}
              aria-current={i === index ? "true" : undefined}
              className={`relative h-1.5 overflow-hidden rounded-full bg-navy/20 transition-all sm:h-2 ${i === index ? "w-8 sm:w-12" : "w-1.5 hover:bg-navy/40 sm:w-2"}`}
            >
              {i === index && (
                <span
                  key={`${index}-${paused}`}
                  className={`absolute inset-y-0 left-0 rounded-full bg-navy ${paused || reduced ? "w-full" : "hero-progress"}`}
                  style={{ animationDuration: `${INTERVAL_MS}ms` }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Slide({
  active,
  label,
  children,
}: {
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      aria-hidden={!active || undefined}
      inert={!active || undefined}
      className={`transition-opacity duration-700 ease-out ${active ? "relative z-10 opacity-100" : "pointer-events-none absolute inset-0 z-0 opacity-0"}`}
    >
      {children}
    </div>
  );
}
