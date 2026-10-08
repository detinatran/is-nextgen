"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

interface NavGroup {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
  }[];
}

export default function AdminSidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const { t } = useAdminI18n();
  const pathname = usePathname();
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  const navGroups: NavGroup[] = [
    {
      title: t("TỔNG QUAN"),
      items: [
        {
          label: t("Dashboard"),
          href: "/admin",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: t("QUẢN LÝ THÍ SINH"),
      items: [
        {
          label: t("Hồ sơ đăng ký"),
          href: "/admin/candidates",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },

      ],
    },
    {
      title: t("NGÂN HÀNG ĐỀ THI"),
      items: [
        {
          label: t("Ngân hàng câu hỏi"),
          href: "/admin/questions",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          label: t("Import câu hỏi"),
          href: "/admin/questions/import",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          ),
        },
      ],
    },
    {
      title: t("KỲ THI & GIÁM SÁT"),
      items: [
        {
          label: t("Lịch thi & Ca thi"),
          href: "/admin/exams/schedules",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          label: t("Phân ca thí sinh"),
          href: "/admin/exams/assignments",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
        },
        {
          label: t("Phòng giám sát"),
          href: "/admin/exams/monitor",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ),
          badge: "LIVE",
        },
      ],
    },
    {
      title: t("ĐIỂM SỐ & RUBRICS"),
      items: [
        {
          label: t("Bảng điểm Vòng 1"),
          href: "/admin/scoring/round-1",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          label: t("Chấm điểm Rubric"),
          href: "/admin/scoring/manual",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          ),
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 z-40 h-screen bg-[#071533] border-r border-slate-800/80 transition-all duration-300 ease-out flex flex-col",
        collapsed ? "w-[var(--sidebar-width-icon)]" : "w-[var(--sidebar-width)]",
        "lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}
      aria-hidden={!mobileOpen}
      style={{
        '--sidebar-width': '16rem',
        '--sidebar-width-icon': '5rem',
      } as React.CSSProperties}
    >
      {/* Mobile Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[-1] lg:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#071533] relative transition-all duration-300 ease-out">
        <Link
          href="/admin"
          className="flex items-center justify-center w-full transition-all duration-300 ease-out"
        >
          {/* Logo - Always centered */}
          <div className="flex items-center justify-center w-full">
            <img
              src="/images/logo_min.png"
              alt="IS-NEXTGEN"
              className={cn(
                "size-8 shrink-0 object-contain transition-all duration-300 ease-out",
                collapsed ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none absolute"
              )}
            />

            {/* Expanded Brand Text - Only visible when not collapsed */}
            {!collapsed && (
              <div className="brand-text flex flex-col min-w-0 whitespace-nowrap ml-3 opacity-100 w-auto transition-all duration-300 ease-out">
                <span className="font-bold text-white text-sm tracking-wide whitespace-nowrap">
                  IS-NEXTGEN
                </span>
                <span className="text-[10px] text-amber-400 font-medium tracking-widest uppercase whitespace-nowrap">
                  Admin Manager
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* Mobile Close Button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={t("Đóng menu")}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Premium Toggle Button - Fixed on right edge of sidebar, vertical center */}
        <button
          ref={toggleBtnRef}
          onClick={onToggle}
          className={cn(
            "hidden lg:flex absolute right-[-12px] top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-slate-700/50 shadow-md items-center justify-center cursor-pointer transition-all duration-200",
            collapsed ? "bg-[#0B1F4D] hover:bg-[#16357A]" : "bg-slate-50 hover:bg-slate-100"
          )}
          title={collapsed ? t("Mở rộng sidebar") : t("Thu gọn sidebar")}
          aria-label={collapsed ? t("Mở rộng sidebar") : t("Thu gọn sidebar")}
        >
          <svg
            className={cn(
              "w-4 h-4 transition-transform duration-300 ease-out",
              collapsed ? "rotate-180 text-white" : "text-slate-600"
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 no-scrollbar">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {/* Group Title - Hidden when collapsed, but maintain vertical spacing */}
            <div className={cn(
              "group-title px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2 whitespace-nowrap transition-all duration-300 ease-out",
              collapsed ? "opacity-0 h-0 overflow-hidden m-0 p-0" : "opacity-100 h-auto"
            )}>
              {!collapsed && group.title}
            </div>

            {group.items.map((item) => {
              // Determine if this item is a parent of any other item in the same group
              const isParent = group.items.some(
                (other) => other.href !== item.href && other.href.startsWith(item.href + "/")
              );

              // Normalize pathname for comparison (handle trailing slashes)
              const currentPath = pathname?.replace(/\/$/, "") || "";
              const itemPath = item.href.replace(/\/$/, "");

              const isActive =
                itemPath === "/admin"
                  ? currentPath === "/admin"
                  : isParent
                  ? currentPath === itemPath
                  : currentPath === itemPath || currentPath.startsWith(itemPath + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onMobileClose?.()}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center transition-all duration-200 rounded-lg text-xs sm:text-sm font-medium",
                    isActive
                      ? "bg-[#16357A] text-white font-semibold shadow-[0_0_0_1px_rgba(31,91,224,0.3)]"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white",
                    collapsed
                      ? "justify-center px-0 gap-0 h-10"
                      : "justify-start px-3 gap-3 h-10"
                  )}
                  aria-label={collapsed ? item.label : undefined}
                >
                  {/* Icon Wrapper - Fixed size, always centered */}
                  <span className={cn(
                    "flex size-5 shrink-0 items-center justify-center",
                    isActive ? "text-white" : "text-slate-400"
                  )}>
                    {item.icon}
                  </span>

                  {/* Menu Item Text - Only render when not collapsed */}
                  {!collapsed && (
                    <span className="nav-text flex-1 min-w-0 truncate whitespace-nowrap">
                      {item.label}
                    </span>
                  )}

                  {/* Badge - Only render when not collapsed */}
                  {!collapsed && item.badge && (
                    <span className="nav-badge shrink-0 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer User Info */}
      <div className="p-3 border-t border-slate-800/80 bg-[#06122C]">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-300 ease-out",
          collapsed ? "justify-center px-0" : "px-2"
        )}>
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-[#1F5BE0]/40">
            AD
          </div>
          {!collapsed && (
            <div className="user-info flex-1 min-w-0 whitespace-nowrap">
              <p className="text-xs font-semibold text-white truncate whitespace-nowrap">{t("Ban Tổ Chức")}</p>
              <p className="text-[11px] text-slate-400 truncate whitespace-nowrap">admin@is-nextgen.edu.vn</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}