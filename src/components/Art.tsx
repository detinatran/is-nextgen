"use client";

import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/paths";

type Props = {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  /** Hiện khi file chưa được sinh ra; mặc định không hiện gì. */
  fallback?: React.ReactNode;
};

/** Ảnh trang trí (dải sóng, hoạ tiết, icon 3D) có phương án dự phòng khi file chưa có. */
export default function Art({ src, className = "", style, fallback = null }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} src={asset(src)} alt="" aria-hidden decoding="async" onError={() => setFailed(true)} className={className} style={style} />
  );
}
