"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

export type TimelineItem = {
  /** Ngày diễn ra, dạng YYYY-MM-DD (giờ Việt Nam). */
  day: string;
  kind: "register" | "round" | "event" | "result";
  time?: string;
  title: string;
  body: string;
};

// Mỗi loại mốc chỉ nhận diện bằng một chấm màu, chú giải ở đầu bảng
const dotColor = {
  register: "bg-navy/60",
  round: "bg-orange",
  event: "bg-brand",
  result: "bg-gold",
};

const text = {
  vi: {
    kind: { round: "Vòng thi", event: "Sự kiện", result: "Kết quả", register: "Đăng ký" },
    weekday: ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"],
    date: (d: number, m: number) => `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`,
    today: "Hôm nay",
    next: "Sắp diễn ra",
  },
  en: {
    kind: { round: "Round", event: "Event", result: "Results", register: "Registration" },
    weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    date: (d: number, m: number) => `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]} ${d}`,
    today: "Today",
    next: "Up next",
  },
};

const endOfDay = (day: string) => new Date(`${day}T23:59:59+07:00`).getTime();
const startOfDay = (day: string) => new Date(`${day}T00:00:00+07:00`).getTime();

/** Lịch trình dạng dòng thời gian trong một bảng: chấm màu theo loại mốc, mốc sắp tới được đánh dấu (tính ở client theo ngày xem). */
export default function Timeline({ items, lang }: { items: TimelineItem[]; lang: Lang }) {
  const t = text[lang];
  const [next, setNext] = useState(-1);
  const [today, setToday] = useState(false);

  useEffect(() => {
    const now = Date.now();
    const i = items.findIndex((it) => now <= endOfDay(it.day));
    setNext(i);
    setToday(i !== -1 && now >= startOfDay(items[i].day));
  }, [items]);

  // Hai cột từ lg: cột trái các mốc đầu, cột phải các mốc sau
  const rows = Math.ceil(items.length / 2);

  return (
    <div className="rounded-3xl bg-white/90 p-6 shadow-card ring-1 ring-line backdrop-blur-sm sm:p-8 lg:px-12 lg:py-9">
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 border-b border-line pb-4 text-[12px] font-semibold text-muted">
        {(["round", "event", "result", "register"] as const).map((k) => (
          <li key={k} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`h-2 w-2 rounded-full ${dotColor[k]}`} />
            {t.kind[k]}
          </li>
        ))}
      </ul>

      <ol className="mt-6 lg:grid lg:grid-flow-col lg:gap-x-16" style={{ gridTemplateRows: `repeat(${rows}, auto)` }}>
        {items.map((it, i) => {
          const [y, m, d] = it.day.split("-").map(Number);
          const weekday = t.weekday[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
          const isNext = i === next;
          const isPast = next === -1 ? false : i < next;
          const lastAll = i === items.length - 1;
          const lastCol = i === rows - 1;
          return (
            <li key={it.day + it.title} className={`flex gap-4 ${isPast ? "opacity-55" : ""}`}>
              {/* Cột ngày */}
              <p className="w-14 shrink-0 pt-px text-right">
                <span className="block text-[17px] leading-tight font-extrabold tracking-tight text-navy tabular-nums">{t.date(d, m)}</span>
                <span className="mt-0.5 block text-[11px] text-muted">{weekday}</span>
              </p>

              {/* Chấm và đường nối */}
              <span className="flex shrink-0 flex-col items-center">
                <span className="relative mt-1.5 flex h-3 w-3 items-center justify-center">
                  {isNext && <span aria-hidden className="absolute inset-0 animate-ping rounded-full bg-orange/50" />}
                  <span aria-hidden className={`relative h-2.5 w-2.5 rounded-full ${dotColor[it.kind]} ${isNext ? "ring-[3px] ring-orange/25" : ""}`} />
                </span>
                <span aria-hidden className={`mt-1.5 w-px flex-1 bg-line ${lastAll ? "hidden" : ""} ${lastCol ? "lg:hidden" : ""}`} />
              </span>

              {/* Nội dung */}
              <div className={`min-w-0 flex-1 pb-7 ${lastAll ? "pb-0" : ""} ${lastCol ? "lg:pb-0" : ""}`}>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <h3 className="text-[15.5px] leading-snug font-bold text-navy">{it.title}</h3>
                  {it.time && <span className="text-[13px] font-medium whitespace-nowrap text-muted">· {it.time}</span>}
                  {isNext && (
                    <span className="rounded-full bg-orange/10 px-2 py-px text-[11px] font-bold text-orange-ink">{today ? t.today : t.next}</span>
                  )}
                </div>
                <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted">{it.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
