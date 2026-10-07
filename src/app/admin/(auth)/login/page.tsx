"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";
import { useToastHelpers } from "@/components/admin/ui/Toast";

export default function AdminLoginPage() {
  const { t } = useAdminI18n();
  const router = useRouter();
  const { error: showError } = useToastHelpers();
  const [step, setStep] = useState<"CREDENTIALS" | "MFA">("CREDENTIALS");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate Server Authentication - TODO: Replace with real API call
    setTimeout(() => {
      setIsLoading(false);
      // Mock validation: check against known admin emails
      const validAdmins = ["admin@is-nextgen.edu.vn", "admin@vnu-is.edu.vn", "organizer@is-nextgen.edu.vn"];
      if (validAdmins.includes(email.trim().toLowerCase()) && password.length >= 8) {
        // Switch to MFA step (Admin 2FA required)
        setStep("MFA");
      } else {
        showError(t("Email hoặc mật khẩu không chính xác."));
      }
    }, 600);
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Mock validation: only accept specific test code
      if (mfaCode === "123456") {
        // Success -> redirect to admin dashboard
        // TODO: Set real session cookie via API
        router.push("/admin");
        router.refresh();
      } else {
        showError(t("Mã xác thực 2 bước (OTP) không đúng hoặc đã hết hạn."));
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#071533] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#1F5BE0]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 relative z-10 animate-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <img
            src="/images/logo.png"
            alt="IS-NEXTGEN"
            className="w-16 h-16 mx-auto object-contain mb-3"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
          <svg
            className="w-16 h-16 mx-auto text-[#1F5BE0] hidden"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-xl font-extrabold text-[#0B1F4D] tracking-tight">
            IS-NEXTGEN MANAGER
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">
            {t("Khu vực Quản trị Hệ thống (Admin)")}
          </p>
        </div>

        {step === "CREDENTIALS" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <AdminInput
              label={t("Email Quản trị viên")}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@is-nextgen.edu.vn"
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <AdminInput
              label={t("Mật khẩu")}
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <div className="pt-2">
              <AdminButton
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isLoading}
              >
                {t("Tiếp tục (Xác thực 2 bước)")}
              </AdminButton>
            </div>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-5">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-sky-50 text-[#1F5BE0] flex items-center justify-center mx-auto mb-2 border border-sky-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800">{t("Xác thực OTP 2 bước (MFA)")}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {t("Nhập mã 6 số từ ứng dụng Authenticator hoặc email của bạn")}
              </p>
            </div>

            <AdminInput
              placeholder="123456"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              className="text-center font-sans tabular-nums tracking-tight text-xl font-bold"
              autoFocus
              autoComplete="one-time-code"
            />

            <div className="space-y-2">
              <AdminButton
                type="submit"
                variant="brand"
                size="md"
                className="w-full"
                isLoading={isLoading}
              >
                {t("Đăng nhập vào Dashboard")}
              </AdminButton>
              <AdminButton
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setStep("CREDENTIALS")}
              >
                {t("← Quay lại đăng nhập")}
              </AdminButton>
            </div>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            {t("Hệ thống quản trị IS-NextGen Manager Challenge 2026. Mọi truy cập đều được ghi log kiểm toán (Audit Evidence).")}
          </p>
        </div>
      </div>
    </div>
  );
}
