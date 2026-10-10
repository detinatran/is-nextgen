"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import type { Lang } from "@/lib/i18n";

export type TimelineItem = {
  /** Ngày diễn ra, dạng YYYY-MM-DD (giờ Việt Nam). */
  day: string;
  kind: "register" | "round" | "event" | "result";
  time?: string;
  title: string;
  body: string;
};

const kindStyle = {
  register: { bar: "bg-navy", pill: "bg-navy/8 text-navy" },
  round: { bar: "bg-orange", pill: "bg-orange text-white" },
  event: { bar: "bg-brand", pill: "bg-brand/10 text-brand" },
  result: { bar: "bg-gold", pill: "bg-gold/20 text-[#8a5a00]" },
};

const text = {
  vi: {
    kind: { register: "Đăng ký", round: "Vòng thi", event: "Sự kiện", result: "Kết quả" },
    weekday: ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"],
    month: (m: number) => `Tháng ${m}`,
    today: "Hôm nay",
    next: "Sắp diễn ra",
  },
  en: {
    kind: { register: "Registration", round: "Round", event: "Event", result: "Results" },
    weekday: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    month: (m: number) => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1],
    today: "Today",
    next: "Up next",
  },
};

const endOfDay = (day: string) => new Date(`${day}T23:59:59+07:00`).getTime();
const startOfDay = (day: string) => new Date(`${day}T00:00:00+07:00`).getTime();

/** Lịch trình đầy đủ: ngày in to, nhãn loại mốc, giờ; mốc sắp tới được làm nổi (tính ở client theo ngày xem). */
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

  return (
    <ol className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5">
      {items.map((it, i) => {
        const [y, m, d] = it.day.split("-").map(Number);
        const weekday = t.weekday[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
        const s = kindStyle[it.kind];
        const isNext = i === next;
        const isPast = next === -1 ? false : i < next;
        return (
          <li
            key={it.day + it.title}
            className={`relative flex gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:block sm:p-5 ${isNext ? "ring-2 ring-orange" : "ring-1 ring-line"} ${isPast ? "opacity-60" : ""}`}
          >
            <span aria-hidden className={`absolute inset-y-0 left-0 w-1.5 sm:inset-x-0 sm:top-0 sm:bottom-auto sm:h-1.5 sm:w-auto ${s.bar}`} />
            <p className="flex w-20 shrink-0 flex-col sm:w-auto sm:flex-row sm:items-end sm:gap-2.5">
              <span className="text-[2.6rem] leading-none font-extrabold tracking-tight text-navy tabular-nums sm:text-5xl">{String(d).padStart(2, "0")}</span>
              <span className="mt-1 text-[13px] leading-tight sm:mt-0 sm:pb-0.5">
                <span className="block font-bold text-orange-ink uppercase">{t.month(m)}</span>
                <span className="block text-muted">{weekday}</span>
              </span>
            </p>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:mt-4">
                {isNext && (
                  <span className="rounded-full bg-orange px-2.5 py-0.5 text-[12px] font-semibold text-white shadow-md shadow-orange/30">{today ? t.today : t.next}</span>
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${s.pill}`}>{t.kind[it.kind]}</span>
                {it.time && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap text-navy">
                    <Icon name="clock" className="h-3.5 w-3.5" strokeWidth={2.2} />
                    {it.time}
                  </span>
                )}
              </div>
              <h3 className="mt-2 text-[16px] leading-snug font-bold text-navy">{it.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{it.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
