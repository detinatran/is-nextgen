"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import type { Lang } from "@/lib/i18n";
import RootDocument from "@/components/RootDocument";

interface Props {
  children: React.ReactNode;
  lang: Lang;
  pageTitle: string;
}

export default function AdminShell({ children, lang, pageTitle }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RootDocument lang={lang}>
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-64 min-h-screen">
        <AdminTopbar pageTitle={pageTitle} lang={lang} />
        <main id="admin-content" className="container-x py-8 lg:py-10">
          {children}
        </main>
      </div>
    </RootDocument>
  );
}