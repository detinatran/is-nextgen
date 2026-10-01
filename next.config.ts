import type { NextConfig } from "next";

// Đặt NEXT_PUBLIC_BASE_PATH=/is-nextgen khi deploy lên GitHub Pages (project page).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
