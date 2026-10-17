"use client";

import { useState } from "react";
import type { Lang } from "@/lib/i18n";

type Props = { lang: Lang; className: string; invalid?: boolean; onChange?: () => void };

const YEARS = Array.from({ length: 2012 - 1970 + 1 }, (_, i) => 2012 - i);
const daysIn = (m: number, y: number) => new Date(y || 2000, m || 1, 0).getDate();
const pad = (n: number) => String(n).padStart(2, "0");
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23475266' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

const text = {
  vi: { day: "Ngày", month: "Tháng", year: "Năm" },
  en: { day: "Day", month: "Month", year: "Year" },
};

/**
 * Ngày sinh bằng 3 ô chọn theo thứ tự cố định Ngày / Tháng / Năm (không phụ thuộc ngôn ngữ máy như ô date).
 * Gửi đi qua ô ẩn name="dateOfBirth" dạng YYYY-MM-DD; chọn chưa đủ thì để trống.
 */
export default function DobSelect({ lang, className, invalid, onChange }: Props) {
  const t = text[lang];
  const [d, setD] = useState(0);
  const [m, setM] = useState(0);
  const [y, setY] = useState(0);
  const max = daysIn(m, y);
  const day = Math.min(d, max);
  const value = day && m && y ? `${y}-${pad(m)}-${pad(day)}` : "";
  const update = (fn: () => void) => {
    fn();
    onChange?.();
  };
  // Bỏ khoảng cách trên và thu lề ngang của kiểu ô chung để 3 ô vừa một hàng
  // Mũi tên tự vẽ, lề trong gọn để chữ "Ngày", "Tháng 12" không bị cắt khi khung hẹp
  const cls = `${className.replace("mt-1.5", "").replace("px-4", "")} min-w-0 appearance-none bg-[length:12px] bg-[right_0.4rem_center] bg-no-repeat pr-6 pl-2.5 sm:bg-[length:14px] sm:bg-[right_0.6rem_center] sm:pr-8 sm:pl-3.5`;
  const arrow = { backgroundImage: CHEVRON };
  return (
    <div role="group" className="mt-1.5 grid grid-cols-[1fr_1.15fr_1fr] gap-1.5 sm:max-w-md sm:grid-cols-3 sm:gap-2" aria-invalid={invalid || undefined}>
      <select aria-label={t.day} data-field="dateOfBirth" value={day || ""} onChange={(e) => update(() => setD(Number(e.target.value)))} className={cls} style={arrow}>
        <option value="" disabled>
          {t.day}
        </option>
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {pad(n)}
          </option>
        ))}
      </select>
      <select aria-label={t.month} value={m || ""} onChange={(e) => update(() => setM(Number(e.target.value)))} className={cls} style={arrow}>
        <option value="" disabled>
          {t.month}
        </option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {pad(n)}
          </option>
        ))}
      </select>
      <select aria-label={t.year} value={y || ""} onChange={(e) => update(() => setY(Number(e.target.value)))} className={cls} style={arrow}>
        <option value="" disabled>
          {t.year}
        </option>
        {YEARS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <input type="hidden" name="dateOfBirth" value={value} />
    </div>
  );
}
