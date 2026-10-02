"use client";

import Link from "next/link";
import { type Lang, localePath } from "@/lib/i18n";
import Eyebrow from "@/components/Eyebrow";

interface Props {
  lang: Lang;
  eyebrow: string;
  title: string;
  lead?: string;
  action?: React.ReactNode;
}

export default function AdminPageHero({ lang, eyebrow, title, lead, action }: Props) {
  const t = lang === "en"
    ? { home: "Home", back: "Back" }
    : { home: "Trang chủ", back: "Quay lại" };

  return (
    <section className="band-fallback relative overflow-hidden bg-cover bg-center pt-16 pb-10 text-white">
      <div className="container-x relative">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-white/75">
          <Link href={localePath(lang, "/admin")} className="hover:text-white">
            {t.home}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/90">{title}</span>
        </nav>
        <Eyebrow light>{eyebrow}</Eyebrow>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">{title}</h1>
        {lead && <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-white/85">{lead}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </section>
  );
}