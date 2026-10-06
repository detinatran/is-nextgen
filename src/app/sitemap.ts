import type { MetadataRoute } from "next";
import { localePath } from "@/lib/i18n";

export const dynamic = "force-static";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://nextgen.vnuis.edu.vn";
const pages = ["/", "/the-le/", "/dang-ky/", "/ket-qua/"];

/** Mỗi trang có bản tiếng Việt và tiếng Anh, khai báo liên kết hreflang qua lại. */
export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((path) => {
    const languages = { vi: `${site}${path}`, en: `${site}${localePath("en", path)}` };
    return (["vi", "en"] as const).map((lang) => ({
      url: languages[lang],
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
      alternates: { languages },
    }));
  });
}
