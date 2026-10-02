"use client";

import { useEffect, useState } from "react";

type Parts = { d: number; h: number; m: number; s: number };

function diff(target: number): Parts | null {
  const ms = target - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const pad = (n: number) => String(n).padStart(2, "0");

const units: [keyof Parts, string][] = [
  ["d", "Ngày"],
  ["h", "Giờ"],
  ["m", "Phút"],
  ["s", "Giây"],
];

export default function Countdown({ deadline, large = false }: { deadline: string; large?: boolean }) {
  const target = new Date(deadline).getTime();
  // undefined trước khi hydrate để HTML tĩnh và client khớp nhau
  const [parts, setParts] = useState<Parts | null | undefined>(undefined);

  useEffect(() => {
    setParts(diff(target));
    const id = window.setInterval(() => setParts(diff(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (parts === null) {
    return (
      <p className={`py-4 text-center font-semibold ${large ? "text-2xl text-white" : "text-base text-gold"}`}>Đã hết hạn đăng ký</p>
    );
  }

  return (
    <div className={`grid grid-cols-4 ${large ? "gap-2 sm:gap-3" : "gap-2 sm:gap-3"}`} role="timer" aria-label="Thời gian còn lại để đăng ký">
      {units.map(([key, label]) => (
        <div
          key={key}
          className={
            large
              ? `overflow-hidden rounded-xl border bg-white/10 px-1 py-3 text-center backdrop-blur-md sm:py-4 ${key === "s" ? "border-orange/70 shadow-[0_0_24px_-4px] shadow-orange/50" : "border-white/20"}`
              : "rounded-lg border border-white/15 bg-white/[0.06] px-1 py-1.5 text-center"
          }
        >
          <div
            className={`leading-none font-bold text-white tabular-nums ${large ? "text-[1.9rem] sm:text-[2.4rem] lg:text-[2.75rem]" : "text-[1.4rem] leading-tight"}`}
          >
            {/* key theo giá trị để mỗi lần số đổi thì chạy lại hiệu ứng lật */}
            {large && parts ? (
              <span key={parts[key]} className="cd-tick inline-block">
                {key === "d" ? parts.d : pad(parts[key])}
              </span>
            ) : parts ? (
              key === "d" ? parts.d : pad(parts[key])
            ) : (
              "--"
            )}
          </div>
          <div className={large ? "mt-1.5 text-[13px] font-medium text-white/75 sm:text-sm" : "text-xs text-white/70"}>{label}</div>
        </div>
      ))}
    </div>
  );
}
