"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminLangSwitch from "@/components/admin/ui/AdminLangSwitch";
import { Icon, useConfirm } from "@/components/admin/ui/kit";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";
import { adminApi } from "@/lib/admin/api";

/** Nhóm và tên trang cho breadcrumb */
const pages: { path: string; group: string; title: string }[] = [
  { path: "/admin/candidates/duplicate-reviews", group: "Quản lý thí sinh", title: "Kiểm tra trùng lặp" },
  { path: "/admin/candidates", group: "Quản lý thí sinh", title: "Hồ sơ đăng ký" },
  { path: "/admin/questions/import", group: "Ngân hàng đề thi", title: "Import câu hỏi" },
  { path: "/admin/questions", group: "Ngân hàng đề thi", title: "Ngân hàng câu hỏi" },
  { path: "/admin/exams/schedules", group: "Kỳ thi & giám sát", title: "Lịch thi & Ca thi" },
  { path: "/admin/exams/assignments", group: "Kỳ thi & giám sát", title: "Phân ca thí sinh" },
  { path: "/admin/exams/monitor", group: "Kỳ thi & giám sát", title: "Phòng giám sát" },
  { path: "/admin/scoring/round-1", group: "Điểm số & Rubrics", title: "Bảng điểm Vòng 1" },
  { path: "/admin/scoring/manual", group: "Điểm số & Rubrics", title: "Chấm điểm Rubric" },
];

export default function AdminHeader({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const { t } = useAdminI18n();
  const confirm = useConfirm();
  const pathname = usePathname();
  const path = pathname.replace(/\/+$/, "") || "/admin";
  const page = pages.find((p) => path === p.path || path.startsWith(p.path + "/"));
  const [online, setOnline] = useState(true);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Trạng thái kết nối: kiểm tra phiên quản trị mỗi 60 giây
  useEffect(() => {
    let alive = true;
    const check = () =>
      adminApi("admin/session")
        .then(() => alive && setOnline(true))
        .catch(() => alive && setOnline(false));
    void check();
    const id = setInterval(check, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [menu]);

  async function logout() {
    setMenu(false);
    const r = await confirm({ title: t("Đăng xuất khỏi Admin"), description: t("Bạn có chắc chắn muốn đăng xuất khỏi trang Quản trị?"), confirmText: t("Đăng xuất") });
    if (!r.ok) return;
    try {
      await adminApi("auth/logout", { method: "POST" });
    } finally {
      window.location.assign("/admin/login");
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-adm-border bg-white/95 px-4 backdrop-blur sm:px-8">
      <button
        onClick={onMobileMenuToggle}
        className="-ml-1 rounded-md p-2 text-adm-sub hover:bg-slate-100 hover:text-adm-text lg:hidden"
        aria-label={t("Mở menu quản trị")}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex items-center gap-2 truncate text-sm">
          <li className={page ? "hidden text-adm-sub sm:block" : "font-semibold text-adm-text"}>
            {page ? (
              <Link href="/admin" className="hover:text-adm-text">
                {t("Quản trị")}
              </Link>
            ) : (
              t("Tổng quan")
            )}
          </li>
          {page && (
            <>
              <li className="hidden text-adm-muted sm:block" aria-hidden>
                /
              </li>
              <li className="hidden text-adm-sub md:block">{t(page.group)}</li>
              <li className="hidden text-adm-muted md:block" aria-hidden>
                /
              </li>
              <li className="truncate font-semibold text-adm-text" aria-current="page">
                {t(page.title)}
              </li>
            </>
          )}
        </ol>
      </nav>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <AdminLangSwitch />
        <span className="hidden items-center gap-1.5 text-xs text-adm-sub md:flex" title={online ? t("Kết nối máy chủ bình thường") : t("Không kết nối được máy chủ")}>
          <span className={`h-2 w-2 rounded-full ${online ? "bg-adm-success" : "bg-adm-error"}`} aria-hidden />
          {online ? t("Trực tuyến") : t("Mất kết nối")}
        </span>
        <span className="hidden h-6 w-px bg-adm-border md:block" aria-hidden />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menu}
            className="flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-primary/40"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-adm-navy text-xs font-semibold text-white">AD</span>
            <span className="hidden text-sm font-medium text-adm-text sm:block">{t("Ban Tổ chức")}</span>
            <Icon name="chevronDown" className="h-4 w-4 text-adm-muted" />
          </button>
          {menu && (
            <div role="menu" className="absolute top-full right-0 mt-1 w-56 overflow-hidden rounded-lg border border-adm-border bg-white py-1 shadow-lg shadow-slate-900/5">
              <div className="border-b border-adm-border px-3 py-2">
                <p className="text-sm font-semibold text-adm-text">{t("Ban Tổ chức")}</p>
                <p className="text-xs text-adm-sub">{t("Quản trị viên")}</p>
              </div>
              <a role="menuitem" href="/" target="_blank" rel="noopener" className="block px-3 py-2 text-[13px] text-adm-text hover:bg-slate-50">
                {t("Mở trang công khai")}
              </a>
              <button role="menuitem" type="button" onClick={() => void logout()} className="block w-full px-3 py-2 text-left text-[13px] text-adm-error hover:bg-red-50">
                {t("Đăng xuất")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
