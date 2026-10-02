import type { Lang } from "@/lib/i18n";
import * as en from "./site.en";
import * as vi from "./site";

// Bản tiếng Anh phải có đúng cấu trúc như bản tiếng Việt
const content: Record<Lang, typeof vi> = { vi, en };

export function getContent(lang: Lang) {
  return content[lang];
}
