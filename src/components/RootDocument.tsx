import type { Viewport } from "next";
import { Be_Vietnam_Pro, Dancing_Script } from "next/font/google";
import type { Lang } from "@/lib/i18n";
import "@/app/globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const dancing = Dancing_Script({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
  variable: "--font-dancing",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0b1f4d",
};

/** Thẻ <html> dùng chung cho hai layout gốc (tiếng Việt và tiếng Anh). */
export default function RootDocument({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return (
    <html lang={lang} className={`${beVietnam.variable} ${dancing.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      {/* Tiện ích trình duyệt (Grammarly...) chèn thuộc tính vào body */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
