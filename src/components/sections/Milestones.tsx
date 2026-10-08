"use client";

import { useEffect, useState } from "react";
import Art from "@/components/Art";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { getContent } from "@/content";
import type { Lang } from "@/lib/i18n";

const tone = {
  orange: "from-[#ffc078] to-[#f08a2a] shadow-orange/30",
  blue: "from-[#6aa8ff] to-brand shadow-brand/30",
  red: "from-[#ff8a5c] to-[#e2452b] shadow-orange/30",
  gold: "from-[#ffd36b] to-[#e09b1a] shadow-gold/30",
};
const color = { orange: "bg-[#f5a54a]", blue: "bg-[#6aa8ff]", red: "bg-[#ff7a5c]", gold: "bg-gold" };

/** Chỉ số giai đoạn đang diễn ra; tính ở client để trang tĩnh luôn đúng theo ngày xem. */
function useCurrentStage(untils: string[]) {
  const [current, setCurrent] = useState(-1);
  useEffect(() => {
    const now = Date.now();
    setCurrent(untils.findIndex((u) => now <= new Date(u).getTime()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return current;
}

export default function Milestones({ lang }: { lang: Lang }) {
  const { milestones } = getContent(lang);
  const en = lang === "en";
  const current = useCurrentStage(milestones.map((m) => m.until));
  return (
    <section id="lo-trinh" className="relative overflow-hidden bg-linear-to-b from-white via-[#eef4fd] to-white py-16 lg:py-24">
      <Art src="/images/generated/deco-blue-waves.webp" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40" />
      <div data-tour="milestones" className="container-x relative">
        <div className="reveal">
          <Eyebrow>{en ? "Competition roadmap" : "Lộ trình cuộc thi"}</Eyebrow>
          <h2 className="h2-section mt-4">{en ? "Key dates" : "Các mốc thời gian quan trọng"}</h2>
        </div>

        <ol className="tl reveal no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pt-4 pb-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:overflow-visible lg:px-0">
          {milestones.map((m, i) => {
            const isCurrent = i === current;
            const isPast = current === -1 || i < current;
            return (
              <li key={m.title} className="group w-64 shrink-0 snap-start lg:w-auto" style={{ "--i": i } as React.CSSProperties}>
                <div
                  className={`relative flex items-center gap-3 rounded-2xl border bg-white/85 p-3 pr-4 backdrop-blur-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-card ${isCurrent ? "border-orange/40 shadow-card" : "border-line"}`}
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${tone[m.tone]} text-white shadow-lg transition duration-300 group-hover:scale-110`}
                  >
                    <Icon name={m.icon} className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold whitespace-nowrap text-navy">{m.date}</p>
                    <p className={`text-sm ${isCurrent ? "font-semibold text-orange-ink" : "text-muted"}`}>
                      {m.title}
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-orange px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white shadow-md shadow-orange/30">
                      {en ? "In progress" : "Đang diễn ra"}
                    </span>
                  )}
                </div>

                {/* Đường nối và chấm mốc */}
                <div className="relative mt-6 h-1">
                  <div className="absolute inset-0 rounded-full bg-navy/10" />
                  <div
                    className={`tl-line absolute inset-0 ${color[m.tone]} ${isPast || isCurrent ? "opacity-100" : "opacity-40"} ${i === 0 ? "rounded-l-full" : ""} ${i === milestones.length - 1 ? "rounded-r-full" : ""}`}
                  />
                  <span className={`tl-dot absolute top-1/2 left-5 h-4 w-4 rounded-full border-[3px] border-white ${color[m.tone]} shadow`}>
                    {isCurrent && <span aria-hidden className={`tl-pulse absolute inset-0 rounded-full ${color[m.tone]}`} />}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
