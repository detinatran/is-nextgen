"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";
import { loadResults, type ResultItem, type ResultStatus } from "@/lib/results";

const badgeClass: Record<ResultStatus, string> = {
  published: "bg-emerald-100 text-emerald-800",
  soon: "bg-amber-100 text-amber-800",
  upcoming: "bg-slate-200 text-slate-600",
};
const text = {
  vi: { status: { published: "Đã công bố", soon: "Sắp công bố", upcoming: "Chưa diễn ra" }, error: "Chưa tải được kết quả. Vui lòng thử lại sau.", view: "Xem danh sách" },
  en: { status: { published: "Published", soon: "Coming soon", upcoming: "Not started" }, error: "Could not load results. Please try again later.", view: "View list" },
};

export default function Results({ lang }: { lang: Lang }) {
  const t = text[lang];
  const [items, setItems] = useState<ResultItem[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadResults()
      .then(setItems)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <p className="text-sm text-muted">{t.error}</p>;
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
        const linked = item.status === "published" && item.link;
        const en = lang === "en";
        return (
          <li
            key={item.round + item.title}
            className="card grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-2 px-5 py-4 sm:grid-cols-[7rem_1fr_auto]"
          >
            <span className="text-sm font-bold tracking-wider text-orange-ink uppercase">{(en && item.roundEn) || item.round}</span>
            <span className="text-sm text-ink sm:text-[15px]">{(en && item.titleEn) || item.title}</span>
            <span className="col-span-2 flex flex-wrap items-center gap-3 sm:col-span-1 sm:justify-end">
              <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${badgeClass[item.status]}`}>{t.status[item.status]}</span>
              {linked ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-navy underline underline-offset-4 hover:text-orange"
                >
                  {t.view}
                </a>
              ) : (
                <span className="text-sm text-muted">{(en && item.dateEn) || item.date}</span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
