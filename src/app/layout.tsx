import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { site } from "@/content/site";
import { asset } from "@/lib/paths";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const description =
  "Cuộc thi đo năng lực ra quyết định và điều hành tổ chức của sinh viên, mô phỏng quy trình tuyển chọn quản trị viên tập sự. Khoa Kinh tế và Quản lý, Trường Quốc tế - ĐHQGHN.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://detinatran.github.io"),
  title: `${site.name} | ${site.viName}`,
  description,
  openGraph: {
    title: `${site.name} | ${site.viName}`,
    description,
    images: [{ url: asset("/images/og.jpg"), width: 1200, height: 675 }],
    locale: "vi_VN",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#12305e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
