"use client";
import type { Lang } from "@/lib/i18n";
import { formatDeadline, useRegistrationWindow } from "@/lib/registrationWindow";

/** Hạn chót đăng ký theo hệ thống; chưa tải được thì hiện nhãn mặc định trong nội dung site. */
export default function DeadlineLabel({ lang, fallback }: { lang: Lang; fallback: string }) {
  const w = useRegistrationWindow();
  if (!w) return <>{fallback}</>;
  return <>{formatDeadline(w.closesAt, lang)}{lang === "en" ? " (GMT+7)" : ""}</>;
}
