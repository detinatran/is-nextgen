import type { Metadata } from "next";
import { AdminI18nProvider } from "@/lib/i18n/AdminI18nContext";
import { ToastProvider } from "@/components/admin/ui/Toast";

export const metadata: Metadata = {
  title: "Admin Login | NextGen Manager Challenge 2026",
  description: "Login to the administration system",
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminI18nProvider>
      <ToastProvider>{children}</ToastProvider>
    </AdminI18nProvider>
  );
}
