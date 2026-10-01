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

export default function Countdown({ deadline }: { deadline: string }) {
  const target = new Date(deadline).getTime();
  // null trước khi hydrate để tránh lệch giữa HTML tĩnh và client
  const [parts, setParts] = useState<Parts | null | undefined>(undefined);

  useEffect(() => {
    setParts(diff(target));
    const id = window.setInterval(() => setParts(diff(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (parts === null) {
    return <p className="font-mono text-sm text-gold">Đã hết hạn đăng ký</p>;
  }

  const units: [keyof Parts, string][] = [
    ["d", "ngày"],
    ["h", "giờ"],
    ["m", "phút"],
    ["s", "giây"],
  ];

  return (
    <div className="flex gap-2" role="timer" aria-label="Thời gian còn lại để đăng ký">
      {units.map(([key, label]) => (
        <div key={key} className="min-w-16 border border-white/15 bg-white/5 px-3 py-2 text-center">
          <div className="font-mono text-2xl font-medium text-white tabular-nums">
            {parts ? (key === "d" ? parts.d : pad(parts[key])) : "--"}
          </div>
          <div className="text-[11px] tracking-wide text-white/60 uppercase">{label}</div>
        </div>
      ))}
    </div>
  );
}
