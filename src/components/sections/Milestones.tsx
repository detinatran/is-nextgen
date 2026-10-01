"use client";

import { useEffect, useState } from "react";
import Eyebrow from "@/components/Eyebrow";
import Icon from "@/components/Icon";
import { milestones } from "@/content/site";
import { asset } from "@/lib/paths";

const tone = {
  orange: "from-[#ffc078] to-[#f08a2a] shadow-orange/40",
  blue: "from-[#6aa8ff] to-brand shadow-brand/40",
  red: "from-[#ff8a5c] to-[#e2452b] shadow-orange/40",
  gold: "from-[#ffd36b] to-[#e09b1a] shadow-gold/40",
};
const color = { orange: "bg-[#f5a54a]", blue: "bg-sky", red: "bg-[#ff6b5a]", gold: "bg-gold" };

/** Chỉ số giai đoạn đang diễn ra; tính ở client để trang tĩnh luôn đúng theo ngày xem. */
function useCurrentStage() {
  const [current, setCurrent] = useState(-1);
  useEffect(() => {
    const now = Date.now();
    setCurrent(milestones.findIndex((m) => now <= new Date(m.until).getTime()));
  }, []);
  return current;
}

export default function Milestones() {
  const current = useCurrentStage();
  return (
    <section
      id="lo-trinh"
      className="band-fallback relative overflow-hidden bg-cover bg-center py-16 text-white lg:py-20"
      style={{
        backgroundImage: `linear-gradient(90deg, rgb(7 21 51 / 0.9), rgb(7 21 51 / 0.62) 55%, rgb(7 21 51 / 0.35)), url(${asset("/images/generated/timeline-bg.webp")})`,
      }}
    >
      <div className="container-x relative">
        <div className="reveal">
          <Eyebrow light>Lộ trình cuộc thi</Eyebrow>
          <h2 className="mt-4 text-[1.9rem] leading-[1.18] font-bold sm:text-[2.5rem]">Các mốc thời gian quan trọng</h2>
        </div>

        <ol className="tl reveal no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pt-2 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {milestones.map((m, i) => {
            const isCurrent = i === current;
            const isPast = current === -1 || i < current;
            return (
              <li key={m.title} className="group w-60 shrink-0 snap-start lg:w-auto" style={{ "--i": i } as React.CSSProperties}>
                <div className="flex items-center gap-3 pr-4">
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${tone[m.tone]} shadow-lg ring-4 ring-white/10 transition duration-300 group-hover:-translate-y-1 group-hover:scale-110 group-hover:ring-white/25`}
                  >
                    <Icon name={m.icon} className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold whitespace-nowrap">{m.date}</p>
                    <p className={`text-sm ${isCurrent ? "font-semibold text-gold" : "text-white/80"}`}>
                      {m.title}
                      {isCurrent && <span className="ml-2 rounded-full bg-gold/20 px-2 py-0.5 text-xs">Đang diễn ra</span>}
                    </p>
                  </div>
                </div>

                {/* Đường nối và chấm mốc */}
                <div className="relative mt-6 h-1">
                  <div className="absolute inset-0 bg-white/10" />
                  <div
                    className={`tl-line absolute inset-0 ${color[m.tone]} ${isPast || isCurrent ? "opacity-100" : "opacity-50"} ${i === 0 ? "rounded-l-full" : ""} ${i === milestones.length - 1 ? "rounded-r-full" : ""}`}
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
