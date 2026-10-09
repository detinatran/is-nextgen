import type { Metadata, Viewport } from "next";
import AdminShellClient from "./AdminShellClient";

export const viewport: Viewport = {
  themeColor: "#071533",
};

export const metadata: Metadata = {
  title: "Admin Dashboard | NextGen Manager Challenge 2026",
  description: "Phân hệ quản trị cuộc thi NextGen Manager Challenge 2026",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShellClient>{children}</AdminShellClient>
  );
}