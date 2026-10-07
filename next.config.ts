import type { NextConfig } from "next";

// Đặt NEXT_PUBLIC_BASE_PATH=/is-nextgen khi deploy lên GitHub Pages (project page).
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  async rewrites() {
    const backend = (process.env.BACKEND_URL || 'http://127.0.0.1:3001').replace(/\/$/, '');
    return [{ source: '/api/v1/:path*', destination: `${backend}/api/v1/:path*` }];
  },
};

export default nextConfig;
