const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Thêm basePath cho đường dẫn tới file trong public/ (cần khi deploy GitHub Pages). */
export function asset(path: string) {
  return `${basePath}${path}`;
}
