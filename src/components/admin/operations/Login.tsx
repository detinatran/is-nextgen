"use client";

import React, { useState, useEffect, useRef } from "react";
import { FormEvent, useRef as useReactRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import AdminButton from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";
import { useToastHelpers } from "@/components/admin/ui/Toast";
import { adminApi, adminAsset } from "@/lib/admin/api";

export default function AdminLoginPage() {
  const { t } = useAdminI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: showError } = useToastHelpers();
  const [step, setStep] = useState<"CREDENTIALS" | "MFA">("CREDENTIALS");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; mfa?: string }>({});
  const [challengeId, setChallengeId] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<{
    email: HTMLInputElement | null;
    password: HTMLInputElement | null;
    mfa: HTMLInputElement | null;
  }>({ email: null, password: null, mfa: null });

  // Entrance animation
  useGSAP(
    () => {
      const ctx = gsap.context(() => {
        gsap.set([brandRef.current, cardRef.current], { opacity: 0 });

        // Brand side animation
        if (brandRef.current) {
          gsap.to(brandRef.current, {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power3.out",
          });

          gsap.fromTo(
            brandRef.current?.querySelectorAll(".brand-stagger > *") || [],
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power3.out",
              stagger: 0.1,
              delay: 0.2,
            }
          );
        }

        // Card side animation
        if (cardRef.current) {
          gsap.to(cardRef.current, {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: "power3.out",
            delay: 0.15,
          });

          gsap.fromTo(
            cardRef.current?.querySelectorAll(".card-stagger > *") || [],
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.5,
              ease: "power3.out",
              stagger: 0.08,
              delay: 0.35,
            }
          );
        }

        // Floating orbs animation
        gsap.to(".floating-orb", {
          y: -20,
          x: 15,
          rotation: 360,
          duration: 20,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });
      }, cardRef);

      return () => ctx.revert();
    },
    { scope: cardRef }
  );

  // Step transition animation
  useGSAP(
    () => {
      if (!formRef.current) return;
      const ctx = gsap.context(() => {
        gsap.fromTo(
          formRef.current!,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
        );
      }, formRef);
      return () => ctx.revert();
    },
    { scope: formRef, dependencies: [step] }
  );

  // Auto-focus first input on step change
  useEffect(() => {
    if (step === "CREDENTIALS") {
      inputRefs.current.email?.focus();
    } else {
      setTimeout(() => inputRefs.current.mfa?.focus(), 100);
    }
  }, [step]);

  const validateEmail = (value: string): string | undefined => {
    if (!value.trim()) return t("Vui lòng nhập email quản trị viên.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return t("Định dạng email không hợp lệ.");
    const validDomains = ["vnuis.edu.vn", "vnu.edu.vn", "is-nextgen.edu.vn", "vnu-is.edu.vn"];
    const domain = value.split("@")[1]?.toLowerCase();
    if (domain && !validDomains.includes(domain)) {
      return t("Chỉ chấp nhận email miền @vnuis.edu.vn hoặc @vnu.edu.vn.");
    }
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return t("Vui lòng nhập mật khẩu.");
    if (value.length < 8) return t("Mật khẩu phải có ít nhất 8 ký tự.");
    return undefined;
  };

  const validateMfa = (value: string): string | undefined => {
    if (!value.trim()) return t("Vui lòng nhập mã OTP 6 số.");
    if (!/^\d{6}$/.test(value)) return t("Mã OTP phải là 6 chữ số.");
    return undefined;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    const err = validateEmail(value);
    setErrors((prev) => ({ ...prev, email: err }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    const err = validatePassword(value);
    setErrors((prev) => ({ ...prev, password: err }));
  };

  const handleMfaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setMfaCode(value);
    const err = validateMfa(value);
    setErrors((prev) => ({ ...prev, mfa: err }));
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    if (emailErr || passwordErr) {
      setErrors({ email: emailErr, password: passwordErr });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await adminApi<{
        status?: string;
        challengeId?: string;
      }>("auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: email, password }),
      });

      setIsLoading(false);

      if (result.status === "MFA_REQUIRED" && result.challengeId) {
        setChallengeId(result.challengeId);
        setStep("MFA");
      } else {
        await adminApi("auth/logout", { method: "POST" });
        showError(t("Tài khoản này không có quyền quản trị."));
        setErrors({ email: t("Tài khoản này không có quyền quản trị.") });
      }
    } catch (e) {
      setIsLoading(false);
      showError(t("Email hoặc mật khẩu không chính xác."));
      setErrors({ email: t("Email hoặc mật khẩu không chính xác.") });
    }
  };

  const handleMfaSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const mfaErr = validateMfa(mfaCode);
    if (mfaErr) {
      setErrors((prev) => ({ ...prev, mfa: mfaErr }));
      return;
    }

    if (!challengeId) return;

    setIsLoading(true);
    setErrors((prev) => ({ ...prev, mfa: undefined }));

    try {
      await adminApi(`auth/admin/mfa-challenges/${challengeId}/verification`, {
        method: "POST",
        body: JSON.stringify({ code: mfaCode }),
      });

      await adminApi("admin/session");
      setIsLoading(false);

      const requested = searchParams.get("redirect") || "/admin";
      const target =
        /^\/admin(?:\/|$)/.test(requested) &&
        !requested.includes("\\") &&
        !requested.startsWith("/admin/login")
          ? requested
          : "/admin";

      router.push(target);
      router.refresh();
    } catch (e) {
      setIsLoading(false);
      showError(t("Mã xác thực 2 bước (OTP) không đúng hoặc đã hết hạn."));
      setErrors({ mfa: t("Mã OTP không đúng hoặc đã hết hạn.") });
    }
  };

  const handleBackToLogin = () => {
    setStep("CREDENTIALS");
    setMfaCode("");
    setChallengeId(null);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-[#071533] relative overflow-hidden flex">
      {/* ============ BACKGROUND DECORATIVE ELEMENTS ============ */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Large glow orbs */}
        <div
          className="floating-orb absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-[#1F5BE0]/15 rounded-full blur-3xl"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="floating-orb absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="floating-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-sky-400/10 rounded-full blur-3xl"
          style={{ animationDelay: "-10s" }}
        />

        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-5" aria-hidden="true">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      {/* ============ LEFT SIDE - BRANDING ============ */}
      <div
        ref={brandRef}
        className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 lg:p-24 z-10"
      >
        <div className="brand-stagger w-full max-w-lg text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="relative inline-flex items-center justify-center mb-6">
              <div
                className="absolute inset-0 bg-gradient-to-br from-[#1F5BE0] to-[#0B1F4D] rounded-2xl blur-2xl opacity-30 animate-pulse"
                aria-hidden="true"
              />
              <img
                src={adminAsset("/images/logo.png")}
                alt="IS-NEXTGEN"
                className="relative w-24 h-24 object-contain drop-shadow-[0_8px_32px_rgba(31,91,224,0.4)]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
              <svg
                className="w-24 h-24 text-[#1F5BE0] hidden drop-shadow-[0_8px_32px_rgba(31,91,224,0.4)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M3 12c0-1.2 4.03-6 9-6s9 4.8 9 6"
                />
              </svg>
            </div>

            {/* Tagline */}
            <p className="text-[#8CC1FF] text-sm font-medium tracking-widest uppercase mb-2">
              {t("Mùa I: The Manager in the AI Era")}
            </p>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            <span className="block">{t("IS-NEXTGEN")}</span>
            <span className="block text-[#F5B83D]">{t("MANAGER")}</span>
            <span className="block text-[#8CC1FF] text-2xl lg:text-3xl font-semibold mt-1">
              {t("CHALLENGE 2026")}
            </span>
          </h1>

          {/* Description */}
          <p className="text-slate-300/90 text-base lg:text-lg leading-relaxed mb-10 max-w-md mx-auto">
            {t("Hệ thống quản trị cuộc thi tìm kiếm tài năng quản trị thế hệ mới. Được thiết kế cho Ban Tổ Chức để điều phối vòng thi, chấm điểm và công bố kết quả minh bạch.")}
          </p>

          {/* Stats badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-[#F5B83D] font-bold text-lg">40</span>
              <span className="text-slate-400 text-sm">{t("Vòng 2")}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-[#10B981] font-bold text-lg">16</span>
              <span className="text-slate-400 text-sm">{t("Chung kết")}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm">
              <span className="text-[#1F5BE0] font-bold text-lg">12</span>
              <span className="text-slate-400 text-sm">{t("Top đội")}</span>
            </div>
          </div>

          {/* Organizer info */}
          <div className="flex flex-col items-center gap-1 text-slate-500 text-sm">
            <p className="font-medium text-slate-300">{t("Đơn vị tổ chức:")}</p>
            <p className="font-semibold text-white">{t("Khoa Kinh tế và Quản lý")}</p>
            <p>{t("Trường Quốc tế - ĐHQG Hà Nội (VNU-IS)")}</p>
          </div>
        </div>
      </div>

      {/* ============ RIGHT SIDE - LOGIN FORM ============ */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12 z-10">
        <div
          ref={cardRef}
          className="w-full max-w-md bg-white rounded-2xl shadow-[0_25px_50px_-12px_rgba(7,21,51,0.4)] border border-slate-100/90 p-8 lg:p-10 animate-in duration-500"
        >
          <div className="card-stagger">
            {/* Close button for mobile (optional) */}
            <div className="lg:hidden mb-4 flex justify-end">
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label={t("Đóng")}
                onClick={() => router.back()}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#071533] tracking-tight">
                {t("Chào mừng trở lại")}
              </h2>
              <p className="text-slate-500 text-sm mt-1.5">
                {t("Đăng nhập để truy cập hệ thống quản trị")}
              </p>
            </div>

            {/* Form */}
            <form ref={formRef} onSubmit={step === "CREDENTIALS" ? handleLoginSubmit : handleMfaSubmit} className="space-y-5">
              {step === "CREDENTIALS" ? (
                <>
                  {/* Email Field */}
                  <AdminInput
                    ref={(el) => { inputRefs.current.email = el; }}
                    label={t("Email Quản trị viên")}
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="nextgen@vnuis.edu.vn"
                    error={errors.email}
                    leftIcon={
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    }
                  />

                  {/* Password Field */}
                  <AdminInput
                    ref={(el) => { inputRefs.current.password = el; }}
                    label={t("Mật khẩu")}
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="••••••••"
                    error={errors.password}
                    leftIcon={
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    }
                  />

                  {/* Submit Button */}
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
                </>
              ) : (
                <>
                  {/* MFA Step Header */}
                  <div className="text-center mb-2">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-[#1F5BE0] flex items-center justify-center mx-auto mb-3 border border-sky-100">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">{t("Xác thực OTP 2 bước (MFA)")}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {t("Nhập mã 6 số từ ứng dụng Authenticator hoặc email của bạn")}
                    </p>
                  </div>

                  {/* MFA Input */}
                  <AdminInput
                    ref={(el) => { inputRefs.current.mfa = el; }}
                    placeholder="000000"
                    maxLength={6}
                    value={mfaCode}
                    onChange={handleMfaChange}
                    error={errors.mfa}
                    className="text-center font-sans tabular-nums tracking-tight text-xl font-bold text-slate-900"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
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
                      onClick={handleBackToLogin}
                      disabled={isLoading}
                    >
                      {t("← Quay lại đăng nhập")}
                    </AdminButton>
                  </div>
                </>
              )}
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                {t("Hệ thống quản trị IS-NextGen Manager Challenge 2026. Mọi truy cập đều được ghi log kiểm toán (Audit Evidence).")}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {t("Phiên bản")} 1.0.0 • {t("Môi trường")} {process.env.NODE_ENV === "production" ? "Production" : "Development"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}