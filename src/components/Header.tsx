"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getContent } from "@/content";
import { langFromPath, localePath } from "@/lib/i18n";
import { asset } from "@/lib/paths";
import Icon from "./Icon";
import LangSwitch from "./LangSwitch";

/** Theo dõi section đang hiển thị để gạch chân mục menu tương ứng (chỉ trên trang chủ). */
function useActiveSection(enabled: boolean, ids: string[]) {
  const [active, setActive] = useState("top");
  useEffect(() => {
    if (!enabled) return;
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
  return active;
}

export default function Header() {
  const pathname = usePathname();
  const lang = langFromPath(pathname);
  const { nav, site } = getContent(lang);
  const home = localePath(lang, "/");
  const onHome = pathname === home || pathname === home.slice(0, -1);
  const activeSection = useActiveSection(
    onHome,
    nav.map((n) => n.id),
  );
  const t = lang === "en" ? { register: "Register now", open: "Open menu", close: "Close menu", main: "Main navigation", mobile: "Mobile navigation" } : { register: "Đăng ký ngay", open: "Mở menu", close: "Đóng menu", main: "Điều hướng chính", mobile: "Điều hướng di động" };
  const href = (path: string) => localePath(lang, path);
  const [open, setOpen] = useState(false);
  // Trang chủ: menu trong suốt nằm trên ảnh hero, có nền khi cuộn xuống hoặc mở menu
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const solid = !onHome || scrolled || open;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (item: (typeof nav)[number]) =>
    onHome ? item.id === activeSection : pathname.startsWith(href(`/${item.id}`));

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-[77rem] lg:px-8">
        <div
          className={`flex h-16 items-center justify-between gap-4 border border-t-0 px-4 transition-all duration-300 sm:px-6 lg:rounded-b-2xl ${
            solid
              ? "border-white/10 bg-navy/85 shadow-xl shadow-navy-deep/20 backdrop-blur-md"
              : "border-white/10 bg-navy/85 shadow-xl shadow-navy-deep/20 backdrop-blur-md lg:border-transparent lg:bg-transparent lg:shadow-none lg:backdrop-blur-none"
          }`}
        >
          <Link href={href("/#top")} className="flex min-w-0 items-center" onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/images/logo-white-2026.png")} alt={site.name} className="h-10 w-auto sm:h-12" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label={t.main}>
            {nav.map((item) => (
              <Link
                key={item.href}
                href={href(item.href)}
                aria-current={isActive(item) ? "true" : undefined}
                className={`relative px-3 py-2 text-sm transition after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-orange after:transition-transform ${
                  isActive(item) ? "font-semibold text-white after:scale-x-100" : "text-white/75 after:scale-x-0 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LangSwitch />
            <Link href={href("/dang-ky/")} className="btn-primary hidden px-5 py-2 sm:inline-flex">
              {t.register} <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 lg:hidden"
              aria-label={open ? t.close : t.open}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              <Icon name={open ? "x" : "menu"} className="h-6 w-6" strokeWidth={2} />
            </button>
          </div>
        </div>

        {open && (
          <nav
            id="mobile-nav"
            className="border-x border-b border-white/10 bg-navy/95 px-4 pb-4 backdrop-blur-md sm:px-6 lg:hidden"
            aria-label={t.mobile}
          >
            {nav.map((item) => (
              <Link
                key={item.href}
                href={href(item.href)}
                className={`block border-b border-white/5 py-3 text-base ${isActive(item) ? "font-semibold text-orange-soft" : "text-white/85"}`}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href={href("/dang-ky/")} className="btn-primary mt-4 w-full" onClick={() => setOpen(false)}>
              {t.register} <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
