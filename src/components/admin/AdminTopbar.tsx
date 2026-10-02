"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Icon, { type IconName } from "@/components/Icon";
import { type Lang, localePath, switchPath } from "@/lib/i18n";
import { asset } from "@/lib/paths";

interface Props {
  pageTitle: string;
  lang: Lang;
}

const user = {
  name: "Admin IS-NextGen",
  initials: "AD",
  email: "admin@nextgen.vnuis.edu.vn",
};

const notifications = [
  { id: 1, title: "Đơn đăng ký mới", body: "Nguyễn Văn A vừa nộp hồ sơ", time: "2 phút trước", unread: true },
  { id: 2, title: "Hết hạn Vòng 1", body: "Vòng Đơn kết thúc sau 3 ngày", time: "1 giờ trước", unread: true },
  { id: 3, title: "Cập nhật hệ thống", body: "Phiên bản mới đã được triển khai", time: "5 giờ trước", unread: false },
];

function Dropdown({ trigger, children, align = "right" }: { trigger: React.ReactNode; children: React.ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-muted hover:text-ink hover:bg-mist transition"
        aria-expanded={open}
        aria-haspopup="true"
      >
        {trigger}
      </button>
      {open && (
        <div
          className={`absolute top-full mt-2 z-50 w-56 card py-2 shadow-lg shadow-navy-deep/20 ring-1 ring-line ${
            align === "right" ? "right-0" : "left-0"
          }`}
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function AdminTopbar({ pageTitle, lang }: Props) {
  const [search, setSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const t = lang === "en"
    ? {
        dashboard: "Dashboard",
        search: "Search...",
        notifications: "Notifications",
        markAllRead: "Mark all as read",
        noNotifications: "No notifications",
        viewAll: "View all",
        profile: "Profile",
        settings: "Settings",
        logout: "Sign out",
        language: "Language",
        vietnamese: "Vietnamese",
        english: "English",
      }
    : {
        dashboard: "Bảng điều khiển",
        search: "Tìm kiếm...",
        notifications: "Thông báo",
        markAllRead: "Đánh dấu đã đọc hết",
        noNotifications: "Không có thông báo",
        viewAll: "Xem tất cả",
        profile: "Hồ sơ",
        settings: "Cài đặt",
        logout: "Đăng xuất",
        language: "Ngôn ngữ",
        vietnamese: "Tiếng Việt",
        english: "English",
      };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-line">
      <div className="container-x h-full flex items-center justify-between gap-4">
        {/* Left: Mobile menu toggle + Page title */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-mist transition"
            onClick={() => setMobileMenuOpen(true)}
            aria-label={t.dashboard}
          >
            <Icon name="menu" className="h-6 w-6" />
          </button>
          <h1 className="h2-section text-navy">{pageTitle}</h1>
        </div>

        {/* Center: Search (desktop only) */}
        <div className="hidden lg:flex lg:flex-1 lg:max-w-xl lg:mx-8">
          <div className="relative w-full">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted" aria-hidden="true" />
            <input
              type="search"
              placeholder={t.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-line bg-mist/50 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
              aria-label={t.search}
            />
          </div>
        </div>

        {/* Right: Notifications, Language, User */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Dropdown
            trigger={<Icon name="bell" className="h-5 w-5 text-muted" />}
            align="right"
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-line">
              <p className="font-semibold text-navy">{t.notifications}</p>
              {unreadCount > 0 && (
                <button className="text-[13px] font-medium text-brand hover:text-brand/80" onClick={() => {}}>
                  {t.markAllRead}
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="px-4 py-4 text-center text-sm text-muted">{t.noNotifications}</p>
            ) : (
              <>
                {notifications.map((notif) => (
                  <button
                    key={notif.id}
                    className={`w-full px-4 py-3 text-left text-sm transition ${
                      notif.unread ? "bg-mist/50" : "hover:bg-mist/30"
                    }`}
                    role="menuitem"
                  >
                    <p className={`font-medium ${notif.unread ? "text-ink" : "text-muted"}`}>{notif.title}</p>
                    <p className="mt-0.5 text-muted">{notif.body}</p>
                    <p className="mt-1 text-[11px] text-muted">{notif.time}</p>
                  </button>
                ))}
                <hr className="my-2 border-line" />
                <button className="w-full px-4 py-2 text-center text-sm font-medium text-brand hover:text-brand/80" role="menuitem">
                  {t.viewAll}
                </button>
              </>
            )}
          </Dropdown>

          {/* Language Switcher */}
          <Dropdown
            trigger={
              <span className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-ink hover:bg-mist transition">
                {lang === "vi" ? "VN" : "EN"}
                <Icon name="chevronDown" className="h-4 w-4 text-muted" />
              </span>
            }
            align="right"
          >
            <button
              className={`w-full px-4 py-2 text-left text-sm transition ${lang === "vi" ? "bg-brand/10 text-brand" : "hover:bg-mist"}`}
              role="menuitem"
              onClick={() => window.location.href = switchPath(window.location.pathname, "vi")}
            >
              {t.vietnamese}
            </button>
            <button
              className={`w-full px-4 py-2 text-left text-sm transition ${lang === "en" ? "bg-brand/10 text-brand" : "hover:bg-mist"}`}
              role="menuitem"
              onClick={() => window.location.href = switchPath(window.location.pathname, "en")}
            >
              {t.english}
            </button>
          </Dropdown>

          {/* User Menu */}
          <Dropdown
            trigger={
              <div className="flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-mist transition">
                <div className="h-8 w-8 rounded-full bg-brand flex items-center justify-center text-white font-semibold text-sm">
                  {user.initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-ink">{user.name}</span>
                <Icon name="chevronDown" className="h-4 w-4 text-muted" />
              </div>
            }
            align="right"
          >
            <div className="px-4 py-3 border-b border-line">
              <p className="font-semibold text-ink">{user.name}</p>
              <p className="text-sm text-muted truncate">{user.email}</p>
            </div>
            <Link
              href={localePath(lang, "/admin/settings/account")}
              className="block px-4 py-2 text-sm text-ink hover:bg-mist"
              role="menuitem"
            >
              <Icon name="users" className="inline h-4 w-4 mr-2" /> {t.profile}
            </Link>
            <Link
              href={localePath(lang, "/admin/settings")}
              className="block px-4 py-2 text-sm text-ink hover:bg-mist"
              role="menuitem"
            >
              <Icon name="target" className="inline h-4 w-4 mr-2" /> {t.settings}
            </Link>
            <hr className="my-2 border-line" />
            <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red/5" role="menuitem">
              <Icon name="x" className="inline h-4 w-4 mr-2" /> {t.logout}
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
}