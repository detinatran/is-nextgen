export type BannerVariant = {
  src: string;
  width: number;
};

export type BannerSourceSet = {
  width: number;
  height: number;
  fallbackSrc: string;
  webp?: readonly BannerVariant[];
  jpeg?: readonly BannerVariant[];
};

export type HeroBannerConfig = {
  /** Số phiên bản theo tên file ảnh để tránh cache trình duyệt khi thay banner mới. */
  version: string;
  /** Màu nền dự phòng trùng tông banner khi ảnh đang tải. */
  bgColor: string;
  /** Ảnh chính (dùng cho mọi màn hình nếu không cấu hình riêng `mobile`). */
  desktop: BannerSourceSet;
  /** Ảnh tùy chọn dành riêng cho màn hình < 640px; bỏ trống để dùng ảnh `desktop`. */
  mobile?: BannerSourceSet;
  alt: {
    vi: string;
    en: string;
  };
};

/**
 * Cấu hình banner chính trên Hero.
 * Khi thay banner mới (kể cả khác tỷ lệ), chỉ cần thêm ảnh vào `public/images/`
 * và cập nhật `version`, `width`, `height`, `fallbackSrc`, danh sách `webp`/`jpeg` và `alt` tại đây.
 */
export const HERO_BANNER: HeroBannerConfig = {
  version: "v15",
  bgColor: "#0a1138",
  desktop: {
    width: 1958,
    height: 745,
    fallbackSrc: "/images/cover-v15-1958.jpg",
    webp: [
      { src: "/images/cover-v15-640.webp", width: 640 },
      { src: "/images/cover-v15-960.webp", width: 960 },
      { src: "/images/cover-v15-1280.webp", width: 1280 },
      { src: "/images/cover-v15-1958.webp", width: 1958 },
    ],
    jpeg: [
      { src: "/images/cover-v15-640.jpg", width: 640 },
      { src: "/images/cover-v15-960.jpg", width: 960 },
      { src: "/images/cover-v15-1280.jpg", width: 1280 },
      { src: "/images/cover-v15-1958.jpg", width: 1958 },
    ],
  },
  mobile: undefined,
  alt: {
    vi: "NextGen Manager 2026 – Cuộc thi Nhà quản trị thế hệ mới 2026 – Shaping the AI-era Leader. Đơn vị tổ chức: Trường Quốc tế – ĐHQGHN, Khoa Kinh tế và Quản lý",
    en: "NextGen Manager 2026 – The Next-Generation Manager Competition – Shaping the AI-era Leader. Organized by VNU International School, Faculty of Economics and Management",
  },
};

/** Tạo chuỗi `srcSet` từ danh sách biến thể và hàm chuẩn hóa đường dẫn asset. */
export function buildSrcSet(
  variants: readonly BannerVariant[],
  resolve: (path: string) => string,
): string {
  return variants.map((v) => `${resolve(v.src)} ${v.width}w`).join(", ");
}
