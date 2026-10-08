"use client";

import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { langFromPath } from "@/lib/i18n";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";
import { useRef, useEffect } from "react";

export default function AdminLangSwitch() {
  const pathname = usePathname();
  const initialLang = langFromPath(pathname);
  const { lang, setLang, t } = useAdminI18n();
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with initial language on mount
  useEffect(() => {
    const saved = localStorage.getItem("admin-lang") as "vi" | "en" | null;
    if (saved && saved !== lang) {
      setLang(saved);
    }
  }, [lang, setLang]);

  // Click handler to switch language (no URL change for admin routes)
  const handleSwitch = (to: "vi" | "en") => {
    setLang(to);
  };

  // Subtle animation when language changes
  useGSAP(
    () => {
      if (!containerRef.current) return;
      const ctx = gsap.context(() => {
        const activeEl = containerRef.current?.querySelector(".lang-active");
        const inactiveEl = containerRef.current?.querySelector(".lang-inactive");
        if (!activeEl || !inactiveEl) return;

        gsap.fromTo(
          [activeEl, inactiveEl],
          { opacity: 0, scale: 0.9 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: "back.out(1.5)",
            stagger: 0.05,
          }
        );
      }, containerRef);
      return () => ctx.revert();
    },
    { scope: containerRef, dependencies: [lang] }
  );

  return (
    <div
      ref={containerRef}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium transition-all hover:border-slate-300 hover:shadow-sm"
      role="group"
      aria-label={t("Chuyển đổi ngôn ngữ")}
    >
      <button
        onClick={() => handleSwitch("vi")}
        type="button"
        className={`relative px-2 py-1 rounded-md transition-all duration-200 ${
          lang === "vi"
            ? "lang-active text-[#0B1F4D] font-bold opacity-100 bg-[#1F5BE0]/10"
            : "lang-inactive text-slate-400 opacity-70 hover:text-slate-600 hover:opacity-100"
        }`}
        aria-pressed={lang === "vi"}
        aria-label="Chuyển sang Tiếng Việt"
      >
        VI
      </button>
      <span className="text-slate-300 select-none" aria-hidden="true">
        /
      </span>
      <button
        onClick={() => handleSwitch("en")}
        type="button"
        className={`relative px-2 py-1 rounded-md transition-all duration-200 ${
          lang === "en"
            ? "lang-active text-[#0B1F4D] font-bold opacity-100 bg-[#1F5BE0]/10"
            : "lang-inactive text-slate-400 opacity-70 hover:text-slate-600 hover:opacity-100"
        }`}
        aria-pressed={lang === "en"}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}