"use client";
import { useEffect, useState } from "react";
import { apiBase, competitionCode } from "./api";

export type RegistrationWindow = { name: string; opensAt: string; closesAt: string; serverTime: string };

let cached: Promise<RegistrationWindow | null> | null = null;

/** Khung giờ đăng ký lấy từ hệ thống (BTC đổi hạn trong cơ sở dữ liệu là site tự theo); lỗi mạng thì trả null để dùng giá trị mặc định. */
export function fetchRegistrationWindow(): Promise<RegistrationWindow | null> {
  if (!apiBase) return Promise.resolve(null);
  cached ??= fetch(`${apiBase}/api/v1/competitions/${encodeURIComponent(competitionCode)}/registration-window`)
    .then((r) => (r.ok ? (r.json() as Promise<RegistrationWindow>) : null))
    .catch(() => null);
  return cached;
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

/** "23:59, 01/11/2026" theo giờ Việt Nam */
export function formatDeadline(iso: string, lang: "vi" | "en" = "vi"): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false });
  const date = d.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-GB", { timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit", year: "numeric" });
  return `${time}, ${date}`;
}
