"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

export default function AdminShell({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex">
      {/* Fixed Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-out min-w-0 ${
          collapsed ? "lg:pl-20" : "lg:pl-64"
        } pl-0`}
      >
        <AdminHeader onMobileMenuToggle={() => setMobileOpen((prev) => !prev)} />
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
