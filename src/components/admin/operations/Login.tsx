"use client";

import React, { useState, useEffect, useRef } from "react";
import { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import AdminButton from "@/components/admin/ui/AdminButton";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";
import { useToastHelpers } from "@/components/admin/ui/Toast";
import { adminApi, adminAsset } from "@/lib/admin/api";
import { Icon } from "@/components/admin/ui/kit";

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
  const [showPassword, setShowPassword] = useState(false);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const digits = Array.from({ length: 6 }, (_, i) => mfaCode[i] ?? "");
  const setDigit = (i: number, raw: string) => {
    const clean = raw.replace(/\D/g, "");
    if (clean.length > 1) {
      // Dán cả mã: điền lần lượt các ô
      const next = (mfaCode.slice(0, i) + clean).slice(0, 6);
      handleMfaChange({ target: { value: next } } as React.ChangeEvent<HTMLInputElement>);
      digitRefs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    const arr = digits.slice();
    arr[i] = clean;
    const next = arr.join("").slice(0, 6);
    handleMfaChange({ target: { value: next } } as React.ChangeEvent<HTMLInputElement>);
    if (clean && i < 5) digitRefs.current[i + 1]?.focus();
  };
  const inputBox =
    "h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-[15px] text-slate-800 placeholder:text-slate-400 transition focus:outline-none focus:ring-4";
  const ok = "border-slate-200 focus:border-[#1F5BE0] focus:ring-blue-500/10";
  const bad = "border-rose-300 focus:border-rose-400 focus:ring-rose-500/10";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071533]">
      {/* Nền: toà nhà trường về đêm + lớp phủ để chữ bên trái dễ đọc */}
      <img src={adminAsset("/images/admin/login-bg.webp")} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#071533] via-[#071533]/85 to-[#071533]/20" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071533]/80 via-transparent to-[#071533]/40" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-14">
        <header className="flex items-start justify-between gap-6">
          <img src={adminAsset("/images/logo-white-2026.png")} alt="NextGen Manager" className="h-12 w-auto sm:h-16" />
          <p className="hidden text-right text-xs font-semibold tracking-[0.2em] text-white/85 uppercase sm:block">
            <span className="block">“{t("Tài năng hôm nay")}</span>
            <span className="block">{t("kiến tạo ngày mai")}”</span>
            <span className="mt-2 ml-auto block h-0.5 w-10 rounded-full bg-amber-400" />
          </p>
        </header>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.1fr_minmax(0,440px)] lg:gap-16">
          <div ref={brandRef} className="hidden lg:block">
            <div className="brand-stagger max-w-xl">
              <p className="text-sm font-semibold tracking-[0.18em] text-[#8CC1FF] uppercase">{t("Mùa I: The Manager in the AI Era")}</p>
              <h1 className="mt-4 text-5xl leading-[1.05] font-extrabold tracking-tight text-white xl:text-6xl">
                <span className="block">{t("NEXTGEN")}</span>
                <span className="block text-[#F5B83D]">{t("MANAGER")}</span>
                <span className="mt-2 block text-3xl font-bold text-[#8CC1FF] xl:text-4xl">{t("CHALLENGE 2026")}</span>
              </h1>
              <p className="mt-6 text-base leading-relaxed text-white/75">
                {t("Hệ thống quản trị cuộc thi tìm kiếm tài năng quản trị thế hệ mới. Được thiết kế cho Ban Tổ Chức để điều phối vòng thi, chấm điểm và công bố kết quả minh bạch.")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                {[
                  ["40", t("Vòng 2"), "text-amber-400"],
                  ["16", t("Chung kết"), "text-emerald-400"],
                  ["12", t("Top đội"), "text-sky-400"],
                ].map(([n, label, color]) => (
                  <div key={label} className="flex items-baseline gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 backdrop-blur-sm">
                    <span className={`text-2xl font-extrabold ${color}`}>{n}</span>
                    <span className="text-sm font-medium text-white/80">{label}</span>
                  </div>
                ))}
              </div>
              <div className="mt-12 text-sm leading-relaxed">
                <p className="text-white/60">{t("Đơn vị tổ chức:")}</p>
                <p className="font-semibold text-white">{t("Khoa Kinh tế và Quản lý")}</p>
                <p className="text-white/60">{t("Trường Quốc tế - ĐHQG Hà Nội (VNU-IS)")}</p>
              </div>
            </div>
          </div>

          <div ref={cardRef} className="w-full">
            <div className="card-stagger rounded-3xl bg-white p-7 shadow-2xl shadow-black/30 sm:p-9">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-[#0B1F4D]">{t("Chào mừng trở lại")}</h2>
                <p className="mt-1 text-sm text-slate-500">{t("Đăng nhập để truy cập hệ thống quản trị")}</p>
              </div>

              {step === "CREDENTIALS" ? (
                <form ref={formRef} onSubmit={handleLoginSubmit} noValidate className="mt-7 space-y-5">
                  <label className="block">
                    <span className="mb-1.5 flex justify-between text-sm font-semibold text-slate-700">
                      {t("Email Quản trị viên")} <span className="text-rose-500">*</span>
                    </span>
                    <span className="relative block">
                      <Icon name="mail" className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                      <input
                        ref={(el) => { inputRefs.current.email = el; }}
                        type="email"
                        autoComplete="username"
                        placeholder="nextgen@vnuis.edu.vn"
                        value={email}
                        onChange={handleEmailChange}
                        aria-invalid={!!errors.email}
                        className={`${inputBox} ${errors.email ? bad : ok}`}
                      />
                    </span>
                    {errors.email && <span className="mt-1.5 block text-xs font-medium text-rose-600">{errors.email}</span>}
                  </label>
                  <label className="block">
                    <span className="mb-1.5 flex justify-between text-sm font-semibold text-slate-700">
                      {t("Mật khẩu")} <span className="text-rose-500">*</span>
                    </span>
                    <span className="relative block">
                      <Icon name="lock" className="pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                      <input
                        ref={(el) => { inputRefs.current.password = el; }}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={password}
                        onChange={handlePasswordChange}
                        aria-invalid={!!errors.password}
                        className={`${inputBox} pr-12 ${errors.password ? bad : ok}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        aria-label={showPassword ? t("Ẩn mật khẩu") : t("Hiện mật khẩu")}
                      >
                        <Icon name={showPassword ? "eyeOff" : "eye"} className="h-[18px] w-[18px]" />
                      </button>
                    </span>
                    {errors.password && <span className="mt-1.5 block text-xs font-medium text-rose-600">{errors.password}</span>}
                  </label>
                  <div className="flex justify-end">
                    <a href="/thi/quen-mat-khau/" className="text-sm font-semibold text-[#1F5BE0] hover:underline">
                      {t("Quên mật khẩu?")}
                    </a>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0B1F4D] text-[15px] font-semibold text-white shadow-lg shadow-[#0B1F4D]/25 transition hover:bg-[#13306f] disabled:opacity-60"
                  >
                    {isLoading ? t("Đang kiểm tra...") : t("Tiếp tục (Xác thực 2 bước)")}
                    {!isLoading && <Icon name="arrowRight" className="h-4 w-4" />}
                  </button>
                </form>
              ) : (
                <form ref={formRef} onSubmit={handleMfaSubmit} noValidate className="mt-6 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-[#1F5BE0] ring-8 ring-blue-50/50">
                    <Icon name="shield" className="h-7 w-7" />
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-[#0B1F4D]">{t("Xác thực OTP 2 bước (MFA)")}</h3>
                  <p className="mt-1 text-sm text-slate-500">{t("Nhập mã 6 số được gửi tới email quản trị của bạn")}</p>
                  <div className="mt-6 grid grid-cols-6 gap-2 sm:gap-3">
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          digitRefs.current[i] = el;
                          if (i === 0) inputRefs.current.mfa = el;
                        }}
                        value={d}
                        onChange={(e) => setDigit(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Backspace" && !d && i > 0) digitRefs.current[i - 1]?.focus();
                        }}
                        inputMode="numeric"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        maxLength={6}
                        aria-label={`${t("Số thứ")} ${i + 1}`}
                        className={`h-14 w-full rounded-xl border text-center text-2xl font-bold text-[#1F5BE0] tabular-nums transition focus:outline-none focus:ring-4 ${errors.mfa ? bad : ok}`}
                      />
                    ))}
                  </div>
                  {errors.mfa && <p className="mt-2 text-xs font-medium text-rose-600">{errors.mfa}</p>}
                  <button
                    type="submit"
                    disabled={isLoading || mfaCode.length !== 6}
                    className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1F5BE0] text-[15px] font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-[#184bc0] disabled:opacity-60"
                  >
                    {isLoading ? t("Đang xác thực...") : t("Đăng nhập vào Dashboard")}
                    {!isLoading && <Icon name="arrowRight" className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={handleBackToLogin} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F5BE0] hover:underline">
                    <Icon name="arrowLeft" className="h-4 w-4" /> {t("Quay lại đăng nhập")}
                  </button>
                </form>
              )}

              <div className="mt-8 border-t border-slate-100 pt-5 text-center text-xs leading-relaxed text-slate-400">
                <p>{t("Hệ thống quản trị NextGen Manager Challenge 2026. Mọi truy cập đều được ghi log kiểm toán (Audit Evidence).")}</p>
                <p className="mt-1">{t("Phiên bản 1.0.0 • Môi trường Production")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
