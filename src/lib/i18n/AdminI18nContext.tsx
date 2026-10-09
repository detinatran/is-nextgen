"use client";

import { createContext, Fragment, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { adminTranslations, type AdminTranslationKey } from "./admin-translations";
import { setTrLang } from "./tr";

type Lang = "vi" | "en";

interface AdminI18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  toggleLang: () => void;
  isReady: boolean; // SSR hydration ready
}

const AdminI18nContext = createContext<AdminI18nContextType | undefined>(undefined);

export function AdminI18nProvider({ children, initialLang = "vi" }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [isReady, setIsReady] = useState(false);

  // Load saved language from localStorage on mount (client-side only)
  useEffect(() => {
    setIsReady(true);
    try {
      const saved = localStorage.getItem("admin-lang") as Lang | null;
      if (saved && (saved === "vi" || saved === "en")) {
        setLangState(saved);
      }
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem("admin-lang", newLang);
    } catch {
      // ignore localStorage errors
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "vi" ? "en" : "vi");
  }, [lang, setLang]);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    if (lang === "vi") {
      if (!params) return key;
      // Apply interpolation to Vietnamese key
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
        key
      );
    }
    const translation = adminTranslations[key as AdminTranslationKey];
    if (!translation) {
      // Development warning for missing translations
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] Missing translation key: "${key}"`);
      }
      return key; // fallback to Vietnamese key
    }
    // Apply interpolation to English translation
    if (!params) return translation;
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
      translation
    );
  }, [lang]);

  // tr() đọc ngôn ngữ toàn cục: đặt trước khi các component con render, và dựng lại cây khi đổi ngôn ngữ
  setTrLang(lang);
  return (
    <AdminI18nContext.Provider value={{ lang, setLang, t, toggleLang, isReady }}>
      <Fragment key={lang}>{children}</Fragment>
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n(): AdminI18nContextType {
  const context = useContext(AdminI18nContext);
  if (!context) {
    throw new Error("useAdminI18n must be used within an AdminI18nProvider");
  }
  return context;
}

// Helper function for components that can't use hooks
export function translate(key: string, lang: Lang = "vi", params?: Record<string, string | number>): string {
  if (lang === "vi") {
    if (!params) return key;
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
      key
    );
  }
  const translation = adminTranslations[key as AdminTranslationKey];
  if (!translation && process.env.NODE_ENV === "development") {
    console.warn(`[i18n] Missing translation key: "${key}"`);
  }
  if (!translation) return key;
  if (!params) return translation;
  return Object.entries(params).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    translation
  );
}