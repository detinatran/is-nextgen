"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Lang } from "@/lib/i18n";
import Icon from "./Icon";

type Props = {
  children: React.ReactNode[];
  /** Class cho mỗi slide, quyết định số slide hiển thị cùng lúc. */
  slideClassName: string;
  label: string;
  lang: Lang;
  dots?: boolean;
  arrowsClassName?: string;
};

/** Carousel cuộn ngang dùng scroll-snap; nút trái/phải và chấm chỉ vị trí. */
export default function Carousel({ children, slideClassName, label, lang, dots, arrowsClassName = "" }: Props) {
  const t = lang === "en" ? { prev: "Previous", next: "Next", page: "Page" } : { prev: "Trước", next: "Sau", page: "Trang" };
  const track = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const total = Math.max(1, Math.ceil((el.scrollWidth - 2) / el.clientWidth));
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 2;
    setPages(total);
    setPage(atEnd ? total - 1 : Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    el?.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el?.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const go = (to: number) => {
    const el = track.current;
    if (!el) return;
    const next = (to + pages) % pages;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const arrow =
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy shadow-card transition hover:bg-navy hover:text-white sm:flex";

  return (
    <div className="relative" role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={track} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
        {children.map((child, i) => (
          <div key={i} className={`shrink-0 snap-start ${slideClassName}`}>
            {child}
          </div>
        ))}
      </div>
      {pages > 1 && (
        <>
          <button type="button" className={`${arrow} -left-5 ${arrowsClassName}`} onClick={() => go(page - 1)} aria-label={t.prev}>
            <Icon name="chevronLeft" />
          </button>
          <button type="button" className={`${arrow} -right-5 ${arrowsClassName}`} onClick={() => go(page + 1)} aria-label={t.next}>
            <Icon name="chevronRight" />
          </button>
        </>
      )}
      {dots && pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`${t.page} ${i + 1}`}
              aria-current={i === page}
              className={`h-2 rounded-full transition-all ${i === page ? "w-6 bg-navy" : "w-2 bg-navy/20 hover:bg-navy/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
