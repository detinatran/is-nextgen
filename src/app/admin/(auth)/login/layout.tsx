import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Đăng nhập Admin | IS-NextGen Manager Challenge 2026",
  description: "Đăng nhập vào hệ thống quản trị",
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${beVietnam.variable} min-h-screen bg-slate-50 flex items-center justify-center p-4`}>
      {children}
    </div>
  );
}