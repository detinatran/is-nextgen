"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";

export default function AdminLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"CREDENTIALS" | "MFA">("CREDENTIALS");
  const [email, setEmail] = useState("admin@is-nextgen.edu.vn");
  const [password, setPassword] = useState("••••••••••••");
  const [mfaCode, setMfaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate Server Authentication
    setTimeout(() => {
      setIsLoading(false);
      if (email.includes("@")) {
        // Switch to MFA step (Admin 2FA required)
        setStep("MFA");
      } else {
        setError("Email hoặc mật khẩu không chính xác.");
      }
    }, 600);
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    setTimeout(() => {
      setIsLoading(false);
      if (mfaCode.length === 6 || mfaCode === "123456" || !mfaCode) {
        // Success -> redirect to admin dashboard
        router.push("/admin");
      } else {
        setError("Mã xác thực 2 bước (OTP) không đúng hoặc đã hết hạn.");
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
          <div className="w-12 h-12 rounded-xl bg-[#1F5BE0] flex items-center justify-center text-white font-extrabold text-2xl mx-auto shadow-md mb-3">
            N
          </div>
          <h2 className="text-xl font-extrabold text-[#0B1F4D] tracking-tight">
            IS-NEXTGEN MANAGER
          </h2>
          <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">
            Khu vực Quản trị Hệ thống (Admin)
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {step === "CREDENTIALS" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <AdminInput
              label="Email Quản trị viên"
              type="email"
              required
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
              label="Mật khẩu"
              type="password"
              required
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
                Tiếp tục (Xác thực 2 bước)
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
              <h3 className="text-sm font-bold text-slate-800">Xác thực OTP 2 bước (MFA)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Nhập mã 6 số từ ứng dụng Authenticator hoặc email của bạn
              </p>
            </div>

            <AdminInput
              placeholder="123456"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              className="text-center font-mono text-xl tracking-widest font-bold"
              autoFocus
            />

            <div className="space-y-2">
              <AdminButton
                type="submit"
                variant="brand"
                size="md"
                className="w-full"
                isLoading={isLoading}
              >
                Đăng nhập vào Dashboard
              </AdminButton>
              <AdminButton
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setStep("CREDENTIALS")}
              >
                ← Quay lại đăng nhập
              </AdminButton>
            </div>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Hệ thống quản trị IS-NextGen Manager Challenge 2026. Mọi truy cập đều được ghi log kiểm toán (Audit Evidence).
          </p>
        </div>
      </div>
    </div>
  );
}
