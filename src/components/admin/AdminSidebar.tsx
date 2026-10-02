"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon, { type IconName } from "@/components/Icon";
import { asset } from "@/lib/paths";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "Tổng quan", icon: "fileChart" },
  { href: "/admin/registrations", label: "Đơn đăng ký", icon: "fileText" },
  { href: "/admin/competitions", label: "Cuộc thi", icon: "trophy" },
  { href: "/admin/users", label: "Người dùng", icon: "users" },
  { href: "/admin/settings", label: "Cài đặt", icon: "target" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <Link href="/admin" className="flex items-center gap-2" onClick={onClose}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset("/images/logo-white.png")} alt="IS-NextGen" className="h-7 w-auto" />
            <span className="rounded-full bg-brand/30 px-2 py-0.5 text-[11px] font-bold tracking-wider text-sky uppercase">
              Admin
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Đóng menu"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="px-3 pb-2 text-[11px] font-bold tracking-wider text-white/50 uppercase">
            Quản trị hệ thống
          </p>
          <nav className="space-y-1" aria-label="Menu quản trị">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-brand text-white shadow-lg shadow-brand/30"
                      : "text-white/75 hover:bg-navy-soft hover:text-white"
                  }`}
                >
                  <Icon
                    name={item.icon}
                    className={`h-5 w-5 shrink-0 ${active ? "text-white" : "text-white/60"}`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="border-t border-white/10 p-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-white/60 transition hover:bg-white/5 hover:text-white"
        >
          <Icon name="globe" className="h-4 w-4" />
          <span>Xem Landing Page</span>
          <Icon name="arrowRight" className="ml-auto h-3 w-3" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar cố định */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-navy text-white lg:block">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-navy-deep/70 backdrop-blur-sm transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-white/10 bg-navy text-white shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
