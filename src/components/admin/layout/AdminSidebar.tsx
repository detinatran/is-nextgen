"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface NavGroup {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
  }[];
}

export default function AdminSidebar({ collapsed: collapsedProp, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(collapsedProp ?? false);
  const sidebarRef = useRef<HTMLElement>(null);
  const navItemsRef = useRef<Array<HTMLAnchorElement | null>>([]);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);

  const navGroups: NavGroup[] = [
    {
      title: "TỔNG QUAN",
      items: [
        {
          label: "Dashboard",
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
      title: "QUẢN LÝ THÍ SINH",
      items: [
        {
          label: "Hồ sơ đăng ký",
          href: "/admin/candidates",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          ),
        },
        {
          label: "Duyệt trùng lặp",
          href: "/admin/candidates/duplicate-reviews",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: "NGÂN HÀNG ĐỀ THI",
      items: [
        {
          label: "Ngân hàng câu hỏi",
          href: "/admin/questions",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
        {
          label: "Import câu hỏi",
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
      title: "KỲ THI & GIÁM SÁT",
      items: [
        {
          label: "Lịch thi & Ca thi",
          href: "/admin/exams/schedules",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          label: "Phân ca thí sinh",
          href: "/admin/exams/assignments",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
        },
        {
          label: "Phòng giám sát Live",
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
      title: "ĐIỂM SỐ & RUBRICS",
      items: [
        {
          label: "Bảng điểm Vòng 1",
          href: "/admin/scoring/round-1",
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
        },
        {
          label: "Chấm điểm Rubric",
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

  // Collapse/Expand animation with GSAP
  useGSAP(
    () => {
      if (!sidebarRef.current) return;
      const ctx = gsap.context(() => {
        const sidebar = sidebarRef.current!;
        // Filter out nulls and assert non-null for GSAP
        const items = navItemsRef.current.filter((el): el is HTMLAnchorElement => el !== null);

        const getNavText = () => items.map((item) => item.querySelector(".nav-text")).filter((el): el is Element => el !== null);
        const getNavBadge = () => items.map((item) => item.querySelector(".nav-badge")).filter((el): el is Element => el !== null);
        const getGroupTitle = () => items.map((item) => item.querySelector(".group-title")).filter((el): el is Element => el !== null);
        const brandText = sidebar.querySelector(".brand-text");
        const userInfo = sidebar.querySelector(".user-info");

        const navTexts = getNavText();
        const navBadges = getNavBadge();
        const groupTitles = getGroupTitle();

        if (collapsed) {
          // Collapse animation
          gsap.to(sidebar, {
            width: "5rem", // w-20 = 80px = 5rem
            duration: 0.35,
            ease: "power3.inOut",
          });

          // Hide text labels with stagger
          if (navTexts.length) {
            gsap.to(navTexts, {
              opacity: 0,
              width: 0,
              overflow: "hidden",
              duration: 0.15,
              stagger: 0.02,
              ease: "power2.in",
            });
          }

          if (navBadges.length) {
            gsap.to(navBadges, {
              opacity: 0,
              scale: 0.5,
              duration: 0.15,
              stagger: 0.02,
              ease: "power2.in",
            });
          }

          if (brandText) {
            gsap.to(brandText, {
              opacity: 0,
              width: 0,
              overflow: "hidden",
              duration: 0.15,
              ease: "power2.in",
            });
          }

          if (userInfo) {
            gsap.to(userInfo, {
              opacity: 0,
              width: 0,
              overflow: "hidden",
              duration: 0.15,
              ease: "power2.in",
            });
          }

          if (groupTitles.length) {
            gsap.to(groupTitles, {
              opacity: 0,
              height: 0,
              overflow: "hidden",
              duration: 0.15,
              ease: "power2.in",
            });
          }
        } else {
          // Expand animation
          gsap.to(sidebar, {
            width: "16rem", // w-64 = 256px = 16rem
            duration: 0.45,
            ease: "power3.out",
          });

          // Show text labels with stagger
          if (navTexts.length) {
            gsap.fromTo(
              navTexts,
              { opacity: 0, width: 0, overflow: "hidden" },
              {
                opacity: 1,
                width: "auto",
                duration: 0.25,
                stagger: 0.03,
                ease: "power2.out",
                delay: 0.15,
              }
            );
          }

          if (navBadges.length) {
            gsap.fromTo(
              navBadges,
              { opacity: 0, scale: 0.5 },
              {
                opacity: 1,
                scale: 1,
                duration: 0.25,
                stagger: 0.03,
                ease: "back.out(1.5)",
                delay: 0.15,
              }
            );
          }

          if (brandText) {
            gsap.fromTo(
              brandText,
              { opacity: 0, width: 0, overflow: "hidden" },
              {
                opacity: 1,
                width: "auto",
                duration: 0.25,
                ease: "power2.out",
                delay: 0.1,
              }
            );
          }

          if (userInfo) {
            gsap.fromTo(
              userInfo,
              { opacity: 0, width: 0, overflow: "hidden" },
              {
                opacity: 1,
                width: "auto",
                duration: 0.25,
                ease: "power2.out",
                delay: 0.1,
              }
            );
          }

          if (groupTitles.length) {
            gsap.fromTo(
              groupTitles,
              { opacity: 0, height: 0, overflow: "hidden" },
              {
                opacity: 1,
                height: "auto",
                duration: 0.25,
                stagger: 0.02,
                ease: "power2.out",
                delay: 0.1,
              }
            );
          }
        }
      }, sidebarRef);
      return () => ctx.revert();
    },
    { scope: sidebarRef, dependencies: [collapsed] }
  );

  // Entrance animation for sidebar items on mount
  useGSAP(
    () => {
      if (!sidebarRef.current) return;
      const ctx = gsap.context(() => {
        const items = navItemsRef.current.filter((el): el is HTMLAnchorElement => el !== null);
        if (items.length > 0) {
          gsap.fromTo(
            items,
            { opacity: 0, x: -20 },
            {
              opacity: 1,
              x: 0,
              duration: 0.5,
              ease: "power3.out",
              stagger: 0.04,
              delay: 0.2,
            }
          );
        }
      }, sidebarRef);
      return () => ctx.revert();
    },
    { scope: sidebarRef, dependencies: [] }
  );

  const handleToggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    onToggle?.();
  };

  return (
    <aside
      ref={sidebarRef}
      className={`fixed top-0 left-0 z-40 h-screen bg-[#071533] border-r border-slate-800/80 transition-all duration-300 flex flex-col ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#071533] relative">
        <Link href="/admin" className="flex items-center gap-3 overflow-hidden flex-1 justify-center">
          {!collapsed && (
            <div className="brand-text flex flex-col min-w-0 overflow-hidden whitespace-nowrap">
              <span className="font-bold text-white text-sm tracking-wide">IS-NEXTGEN</span>
              <span className="text-[10px] text-amber-400 font-medium tracking-widest uppercase">
                Admin Manager
              </span>
            </div>
          )}
          {collapsed && (
            <div className="brand-logo-min transition-all duration-300 flex justify-center items-center">
              <img
                src="/images/logo_min.png"
                alt="IS-NEXTGEN"
                className="w-8 h-8 object-contain"
              />
            </div>
          )}
        </Link>
        {/* Premium Toggle Button - Fixed on right edge of sidebar */}
        <button
          ref={toggleBtnRef}
          onClick={handleToggle}
          className={`absolute right-[-12px] top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-slate-700/50 shadow-md flex items-center justify-center cursor-pointer transition-all duration-200 ${
            collapsed ? "bg-[#0B1F4D] hover:bg-[#16357A]" : "bg-slate-50 hover:bg-slate-100"
          }`}
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${
              collapsed ? "rotate-180 text-white" : "text-slate-600"
            }`}
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
            {!collapsed && (
              <h4 className="group-title px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2 overflow-hidden">
                {group.title}
              </h4>
            )}
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

              const navItemRef = (el: HTMLAnchorElement | null) => {
                navItemsRef.current = navItemsRef.current.filter(Boolean);
                if (el) navItemsRef.current.push(el);
              };

              return (
                <Link
                  key={item.href}
                  ref={navItemRef}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#16357A] text-white font-semibold shadow-[0_0_0_1px_rgba(31,91,224,0.3)]"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  } ${collapsed ? "justify-center px-2" : ""}`}
                >
                  <span className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="nav-text flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className="nav-badge text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold whitespace-nowrap shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer User Info */}
      <div className="p-3 border-t border-slate-800/80 bg-[#06122C]">
        <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`}>
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0 ring-2 ring-[#1F5BE0]/40">
            AD
          </div>
          {!collapsed && (
            <div className="user-info flex-1 min-w-0 overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Ban Tổ Chức</p>
              <p className="text-[11px] text-slate-400 truncate">admin@is-nextgen.edu.vn</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}