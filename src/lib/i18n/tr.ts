import { adminTranslations } from "./admin-translations";

/**
 * Dịch chuỗi tiếng Việt của trang quản trị theo ngôn ngữ đang chọn (dùng được cả ngoài hook).
 * Khoá là chính câu tiếng Việt; tham số vị trí {0}, {1}… được thay bằng args.
 * AdminI18nProvider cập nhật ngôn ngữ và dựng lại giao diện khi đổi VI/EN.
 */
let current: "vi" | "en" = "vi";

export function setTrLang(lang: "vi" | "en") {
  current = lang;
}

export function tr(vi: string, ...args: (string | number | null | undefined)[]): string {
  let s = vi;
  if (current === "en") {
    const en = adminTranslations[vi];
    if (en !== undefined) s = en;
    else if (process.env.NODE_ENV === "development") console.warn(`[i18n] Missing translation: "${vi}"`);
  }
  return args.length ? s.replace(/\{(\d+)\}/g, (_, i: string) => String(args[Number(i)] ?? "")) : s;
}
