import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import AdminShellClient from "./AdminShellClient";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#071533",
};

export const metadata: Metadata = {
  title: "Admin Dashboard | IS-NextGen Manager Challenge 2026",
  description: "Phân hệ quản trị cuộc thi IS-NextGen Manager Challenge 2026",
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