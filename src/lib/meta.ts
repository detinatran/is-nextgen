import type { Metadata } from "next";
import { getContent } from "@/content";
import { type Lang, localePath } from "./i18n";
import { asset } from "./paths";

const descriptions: Record<Lang, string> = {
  vi: "Cuộc thi đo năng lực ra quyết định và điều hành tổ chức của sinh viên, mô phỏng quy trình tuyển chọn quản trị viên tập sự. Khoa Kinh tế và Quản lý, Trường Quốc tế - ĐHQGHN.",
  en: "A student competition that tests decision-making and organizational leadership by simulating a management trainee selection process. Faculty of Economics and Management, VNU International School.",
};

/** Metadata cho một trang: tiêu đề, mô tả, Open Graph và liên kết hreflang tới bản ngôn ngữ còn lại. */
export function pageMetadata(lang: Lang, path: string, title?: string): Metadata {
  const { site } = getContent(lang);
  const fullTitle = title ? `${title} | ${site.name}` : `${site.name} | ${site.viName}`;
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://nextgen.vnuis.edu.vn"),
    title: fullTitle,
    description: descriptions[lang],
    alternates: {
      canonical: asset(localePath(lang, path)),
      languages: { vi: asset(path), en: asset(localePath("en", path)), "x-default": asset(path) },
    },
    openGraph: {
      title: fullTitle,
      description: descriptions[lang],
      images: [{ url: asset("/images/og.jpg"), width: 1200, height: 675 }],
      locale: lang === "en" ? "en_US" : "vi_VN",
      type: "website",
    },
  };
}
