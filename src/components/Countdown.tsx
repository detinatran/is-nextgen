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

export default function Countdown({ deadline }: { deadline: string }) {
  const target = new Date(deadline).getTime();
  // undefined trước khi hydrate để HTML tĩnh và client khớp nhau
  const [parts, setParts] = useState<Parts | null | undefined>(undefined);

  useEffect(() => {
    setParts(diff(target));
    const id = window.setInterval(() => setParts(diff(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (parts === null) {
    return <p className="py-4 text-center text-base font-semibold text-gold">Đã hết hạn đăng ký</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer" aria-label="Thời gian còn lại để đăng ký">
      {units.map(([key, label]) => (
        <div key={key} className="rounded-lg border border-white/15 bg-white/[0.06] px-1 py-1.5 text-center">
          <div className="text-[1.4rem] leading-tight font-bold text-white tabular-nums">
            {parts ? (key === "d" ? parts.d : pad(parts[key])) : "--"}
          </div>
          <div className="text-xs text-white/70">{label}</div>
        </div>
      ))}
    </div>
  );
}
