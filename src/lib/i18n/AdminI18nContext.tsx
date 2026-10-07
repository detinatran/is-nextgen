"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { adminTranslations, type AdminTranslationKey } from "./admin-translations";

type Lang = "vi" | "en";

interface AdminI18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  toggleLang: () => void;
}

const AdminI18nContext = createContext<AdminI18nContextType | undefined>(undefined);

export function AdminI18nProvider({ children, initialLang = "vi" }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Load saved language from localStorage on mount
  useEffect(() => {
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

  const t = useCallback((key: string): string => {
    if (lang === "vi") return key;
    return adminTranslations[key as AdminTranslationKey] || key;
  }, [lang]);

  return (
    <AdminI18nContext.Provider value={{ lang, setLang, t, toggleLang }}>
      {children}
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
export function translate(key: string, lang: Lang = "vi"): string {
  if (lang === "vi") return key;
  return adminTranslations[key as AdminTranslationKey] || key;
}