import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://nextgen.vnuis.edu.vn";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
