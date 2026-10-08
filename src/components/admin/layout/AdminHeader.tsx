"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import AdminLangSwitch from "@/components/admin/ui/AdminLangSwitch";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminPopconfirm from "@/components/admin/ui/AdminPopconfirm";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";
import { adminApi } from '@/lib/admin/api';

export default function AdminHeader({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle?: () => void;
}) {
  const { t } = useAdminI18n();
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const breadcrumbRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  const getPageTitle = (path: string) => {
    if (path === "/admin") return t("Tổng quan hệ thống");
    if (path.includes("/candidates/duplicate-reviews")) return t("Rà soát hồ sơ trùng lặp");
    if (path.includes("/candidates")) return t("Quản lý hồ sơ thí sinh");
    if (path.includes("/questions/import")) return t("Import ngân hàng câu hỏi");
    if (path.includes("/questions")) return t("Ngân hàng câu hỏi trắc nghiệm");
    if (path.includes("/exams/schedules")) return t("Quản lý ca thi Vòng 1");
    if (path.includes("/exams/assignments")) return t("Phân bổ ca thi thí sinh");
    if (path.includes("/exams/monitor")) return t("Phòng giám sát thi trực tuyến");
    if (path.includes("/scoring/round-1")) return t("Bảng điểm trắc nghiệm Vòng 1");
    if (path.includes("/scoring/manual")) return t("Chấm điểm Rubric Vòng 2 & Chung kết");
    return t("Quản trị hệ thống");
  };

  // Entrance animation
  useGSAP(
    () => {
      if (!headerRef.current) return;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          [breadcrumbRef.current, titleRef.current],
          { opacity: 0, y: -10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            stagger: 0.1,
          }
        );

        gsap.fromTo(
          actionsRef.current ? Array.from(actionsRef.current.children) : [],
          { opacity: 0, x: 20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.4,
            ease: "power3.out",
            stagger: 0.06,
            delay: 0.1,
          }
        );
      }, headerRef);
      return () => ctx.revert();
    },
    { scope: headerRef, dependencies: [pathname] }
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between transition-all duration-300 ease-out shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
    >
      {/* Mobile Hamburger Button */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 -ml-2 mr-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
        aria-label={t("Mở menu quản trị")}
        title={t("Mở menu")}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Left: Breadcrumbs & Title */}
      <div className="flex flex-col min-w-0 flex-1">
        <div
          ref={breadcrumbRef}
          className="flex items-center gap-2 text-[11px] font-medium text-slate-400 truncate"
        >
          <Link
            href="/admin"
            className="hover:text-[#1F5BE0] transition-colors whitespace-nowrap flex-shrink-0"
          >
            {t("Admin")}
          </Link>
          <span className="flex-shrink-0">/</span>
          <span className="text-slate-600 font-semibold truncate">{getPageTitle(pathname)}</span>
        </div>
        <h1
          ref={titleRef}
          className="text-base sm:text-lg font-bold text-[#0B1F4D] tracking-tight truncate mt-0.5"
        >
          {getPageTitle(pathname)}
        </h1>
      </div>

      {/* Right: Actions & Status */}
      <div
        ref={actionsRef}
        className="flex items-center gap-3 sm:gap-4 flex-shrink-0"
      >
        {/* Language Switcher */}
        <AdminLangSwitch />

        {/* Live Proctor Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-medium shadow-[0_1px_2px_rgba(16,185,129,0.08)]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{t("Hệ thống trực tuyến")}</span>
        </div>

        {/* Quick Switcher: Landing Page ↔ Admin */}
        <Link
          href="/"
          target="_blank"
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-medium shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:bg-slate-100 hover:border-slate-300 transition-all duration-200 hover:scale-105 group"
          title={t("Xem trang công khai (Landing Page)")}
        >
          <svg className="w-4 h-4 text-slate-400 group-hover:text-[#1F5BE0] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-1.343 3-3V5a3 3 0 00-3-3H9" />
          </svg>
          <span>{t("Trang chủ")}</span>
        </Link>

        {/* Divider */}
        <div className="hidden lg:block h-6 w-px bg-slate-200" />

        {/* Admin Profile & Logout */}
        <div className="flex items-center gap-2.5">
          <div className="flex flex-col text-right hidden sm:block">
            <span className="text-xs font-bold text-slate-800">{t("Ban Tổ Chức")}</span>
          </div>
          <AdminPopconfirm
            title={t("Đăng xuất khỏi Admin")}
            description={t("Bạn có chắc chắn muốn đăng xuất khỏi trang Quản trị?")}
            confirmVariant="danger"
            confirmText={t("Đăng xuất")}
            onConfirm={async () => {
              try { await adminApi('auth/logout', { method: 'POST' }); window.location.assign('/admin/login'); }
              catch (error) { window.alert((error as Error).message); }
            }}
            triggerVariant="ghost"
            triggerSize="sm"
          >
            {(open) => (
              <span
                className={`p-2 text-rose-600 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${open ? "bg-rose-50" : "hover:bg-rose-50"}`}
                title={t("Đăng xuất")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </span>
            )}
          </AdminPopconfirm>
        </div>
      </div>
    </header>
  );
}
