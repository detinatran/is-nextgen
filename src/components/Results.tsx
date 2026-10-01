"use client";

import { useEffect, useState } from "react";
import { loadResults, type ResultItem, type ResultStatus } from "@/lib/results";

const badge: Record<ResultStatus, { text: string; className: string }> = {
  published: { text: "Đã công bố", className: "bg-emerald-100 text-emerald-800" },
  soon: { text: "Sắp công bố", className: "bg-amber-100 text-amber-800" },
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
    return <p className="text-sm text-muted">Chưa tải được kết quả. Vui lòng thử lại sau.</p>;
  }

  if (!items) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-mist" />
        ))}
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const b = badge[item.status];
        const linked = item.status === "published" && item.link;
        return (
          <li
            key={item.round + item.title}
            className="card grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-[7rem_1fr_auto]"
          >
            <span className="text-sm font-bold tracking-wider text-orange-ink uppercase">{item.round}</span>
            <span className="text-sm text-ink sm:text-[15px]">{item.title}</span>
            <span className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1 sm:justify-end">
              <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${b.className}`}>{b.text}</span>
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
