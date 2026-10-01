"use client";

import { useEffect, useState } from "react";
import { nav, site } from "@/content/site";
import { asset } from "@/lib/paths";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? "bg-navy-deep/95 shadow-lg shadow-black/15 backdrop-blur" : "bg-navy-deep"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <a href="#top" className="flex min-w-0 items-center gap-3" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/images/crest.png")} alt="Trường Quốc tế - ĐHQGHN" className="h-10 w-auto shrink-0" />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-extrabold tracking-wide text-white">{site.shortName}</span>
            <span className="block truncate text-[11px] text-white/65">{site.organizer}</span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Điều hướng chính">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="text-sm text-white/80 transition hover:text-gold">
              {item.label}
            </a>
          ))}
          <a href="#dang-ky" className="btn-gold px-5 py-2.5">
            Đăng ký dự thi
          </a>
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center text-white lg:hidden"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-white/10 lg:hidden" aria-label="Điều hướng di động">
          <div className="container-x flex flex-col py-3">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="py-3 text-base text-white/85 hover:text-gold"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a href="#dang-ky" className="btn-gold mt-2 mb-2" onClick={() => setOpen(false)}>
              Đăng ký dự thi
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
