"use client";

import { useEffect, useState } from "react";
import { loadResults, type ResultItem, type ResultStatus } from "@/lib/results";

const badge: Record<ResultStatus, { text: string; className: string }> = {
  published: { text: "Đã công bố", className: "bg-emerald-100 text-emerald-800" },
  soon: { text: "Sắp công bố", className: "bg-gold-soft text-[#7a5410]" },
  upcoming: { text: "Chưa diễn ra", className: "bg-slate-200 text-slate-600" },
};

export default function Results() {
  const [items, setItems] = useState<ResultItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadResults()
      .then(setItems)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="mt-8 text-sm text-muted">Chưa tải được kết quả. Vui lòng thử lại sau.</p>;
  }

  if (!items) {
    return (
      <div className="mt-8 space-y-2" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse bg-cream" />
        ))}
      </div>
    );
  }

  return (
    <ul className="mt-8 space-y-2">
      {items.map((item) => {
        const b = badge[item.status];
        const linked = item.status === "published" && item.link;
        return (
          <li
            key={item.round + item.title}
            className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 bg-cream px-5 py-4 sm:grid-cols-[7rem_1fr_auto]"
          >
            <span className="font-mono text-xs font-medium tracking-wider text-navy uppercase">{item.round}</span>
            <span className="text-sm text-ink sm:text-[15px]">{item.title}</span>
            <span className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1 sm:justify-end">
              <span className={`px-2.5 py-1 text-xs font-semibold ${b.className}`}>{b.text}</span>
              {linked ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-navy underline underline-offset-4 hover:text-orange"
                >
                  Xem danh sách
                </a>
              ) : (
                <span className="text-sm text-muted">{item.date}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
