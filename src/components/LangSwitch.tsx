"use client";

import { usePathname } from "next/navigation";
import { langFromPath, switchPath } from "@/lib/i18n";
import { asset } from "@/lib/paths";
import Icon from "./Icon";

/** Nút đổi Tiếng Việt / English, giữ nguyên trang và mục đang xem. */
export default function LangSwitch({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const lang = langFromPath(pathname);
  const to = lang === "vi" ? "en" : "vi";
  const href = asset(switchPath(pathname, to));

  return (
    <a
      href={href}
      hrefLang={to}
      lang={to}
      // Giữ #mục đang xem khi chuyển ngôn ngữ
      onClick={(e) => {
        if (!window.location.hash) return;
        e.preventDefault();
        window.location.href = href + window.location.hash;
      }}
      aria-label={to === "en" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1.5 text-[13px] font-semibold text-white transition hover:border-white hover:bg-white/10 ${className}`}
    >
      <Icon name="globe" className="h-4 w-4" />
      <span className={lang === "vi" ? "text-white" : "text-white/55"}>VI</span>
      <span aria-hidden className="text-white/40">
        /
      </span>
      <span className={lang === "en" ? "text-white" : "text-white/55"}>EN</span>
    </a>
  );
}
