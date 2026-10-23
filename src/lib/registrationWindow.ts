"use client";
import { useEffect, useState } from "react";
import { apiBase, competitionCode } from "./api";

// skewMs: giờ máy chủ trừ giờ máy người dùng, để không phụ thuộc đồng hồ máy bị đặt sai
export type RegistrationWindow = { name: string; opensAt: string; closesAt: string; serverTime: string; skewMs: number };

let cached: Promise<RegistrationWindow | null> | null = null;

/** Khung giờ đăng ký lấy từ hệ thống (BTC đổi hạn trong cơ sở dữ liệu là site tự theo); lỗi mạng thì trả null để dùng giá trị mặc định. */
export function fetchRegistrationWindow(): Promise<RegistrationWindow | null> {
  // Luôn truy vấn khung giờ từ hệ thống (cùng tên miền /api/v1 hoặc NEXT_PUBLIC_API_URL)
  cached ??= fetch(`${apiBase}/api/v1/competitions/${encodeURIComponent(competitionCode)}/registration-window`)
    .then((r) => (r.ok ? (r.json() as Promise<Omit<RegistrationWindow, "skewMs">>) : null))
    .then((w) => {
      if (!w) {
        cached = null;
        return null;
      }
      return { ...w, skewMs: new Date(w.serverTime).getTime() - Date.now() };
    })
    .catch(() => {
      cached = null;
      return null;
    });
  return cached;
}

/** Giờ hiện tại theo máy chủ (nếu đã tải được khung giờ), ngược lại theo máy người dùng. */
export function serverNow(w: RegistrationWindow | null): number {
  return Date.now() + (w?.skewMs ?? 0);
}

export function useRegistrationWindow(): RegistrationWindow | null {
  const [w, setW] = useState<RegistrationWindow | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchRegistrationWindow().then((v) => alive && setW(v));
    return () => {
      alive = false;
    };
  }, []);
  return w;
}

/** "23:59, 31/10/2026" theo giờ Việt Nam */
export function formatDeadline(iso: string, lang: "vi" | "en" = "vi"): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false });
  const date = d.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });
  return `${time}, ${date}`;
}
