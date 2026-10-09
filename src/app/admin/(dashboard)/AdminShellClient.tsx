"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminHeader from "@/components/admin/layout/AdminHeader";
import { AdminI18nProvider } from "@/lib/i18n/AdminI18nContext";
import { ToastProvider } from "@/components/admin/ui/Toast";
import { ConfirmProvider } from "@/components/admin/ui/kit";

export default function AdminShellClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoginPage = pathname === "/admin/login";

  // Auto close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <AdminI18nProvider initialLang="vi">
      <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-screen bg-adm-bg text-adm-text flex overflow-x-clip">
          {/* Fixed Sidebar */}
          <AdminSidebar
            collapsed={collapsed}
            onToggle={() => setCollapsed((prev) => !prev)}
            mobileOpen={mobileOpen}
            onMobileClose={() => setMobileOpen(false)}
          />

          {/* Main Content Area */}
          <div
            className={`flex-1 flex flex-col transition-[padding] duration-200 ease-out motion-reduce:transition-none min-w-0 ${
              collapsed ? "lg:pl-[72px]" : "lg:pl-[248px]"
            } pl-0`}
          >
            <AdminHeader onMobileMenuToggle={() => setMobileOpen((prev) => !prev)} />
            <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 py-6 sm:px-8 sm:py-7">
              {children}
            </main>
          </div>
        </div>
      </ConfirmProvider>
      </ToastProvider>
    </AdminI18nProvider>
  );
}
