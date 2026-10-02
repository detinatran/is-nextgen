export type Lang = "vi" | "en";

/** Đường dẫn nội bộ theo ngôn ngữ: bản tiếng Anh nằm dưới /en ("/the-le/" -> "/en/the-le/", "/#faq" -> "/en/#faq"). */
export function localePath(lang: Lang, path: string) {
  if (lang === "vi") return path;
  if (path === "/") return "/en/";
  if (path.startsWith("/#")) return `/en/${path.slice(1)}`;
  return `/en${path}`;
}

export function langFromPath(pathname: string): Lang {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "vi";
}

/** Cùng trang đó ở ngôn ngữ còn lại. */
export function switchPath(pathname: string, to: Lang) {
  const base = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  return localePath(to, base);
}
