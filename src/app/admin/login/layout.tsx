import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "@/app/globals.css";

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
    <html lang="vi" className={`${beVietnam.variable} js`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}