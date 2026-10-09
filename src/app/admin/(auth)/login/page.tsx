"use client";

import { Suspense } from "react";
import AdminLoginPage from "@/components/admin/operations/Login";

export default function AdminLoginPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#071533] flex items-center justify-center" />}>
      <AdminLoginPage />
    </Suspense>
  );
}