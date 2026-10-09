"use client";

import { ClipboardEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";
import AdminLangSwitch from "@/components/admin/ui/AdminLangSwitch";
import { adminApi, adminAsset } from "@/lib/admin/api";
import { Icon } from "@/components/admin/ui/kit";

const DOMAINS = ["vnuis.edu.vn", "vnu.edu.vn", "is-nextgen.edu.vn", "vnu-is.edu.vn"];
const RESEND_SECONDS = 30;

export default function AdminLoginPage() {
  const { t } = useAdminI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"CREDENTIALS" | "MFA">("CREDENTIALS");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [resent, setResent] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "CREDENTIALS") emailRef.current?.focus();
    else digitRefs.current[0]?.focus();
  }, [step]);
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendIn]);

  const emailError = !email.trim()
    ? t("Vui lòng nhập email quản trị viên.")
    : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? t("Định dạng email không hợp lệ.")
      : !DOMAINS.includes(email.trim().split("@")[1]?.toLowerCase() ?? "")
        ? t("Chỉ chấp nhận email miền @vnuis.edu.vn hoặc @vnu.edu.vn.")
        : "";
  const passwordError = !password ? t("Vui lòng nhập mật khẩu.") : password.length < 8 ? t("Mật khẩu phải có ít nhất 8 ký tự.") : "";

  async function requestChallenge() {
    const result = await adminApi<{ status?: string; challengeId?: string }>("auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: email.trim(), password }),
    });
    if (result.status === "MFA_REQUIRED" && result.challengeId) return result.challengeId;
    await adminApi("auth/logout", { method: "POST" }).catch(() => undefined);
    throw new Error("NOT_ADMIN");
  }

  async function submitCredentials(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setFormError("");
    if (emailError || passwordError) return;
    setLoading(true);
    try {
      setChallengeId(await requestChallenge());
      setCode("");
      setOtpError("");
      setResendIn(RESEND_SECONDS);
      setStep("MFA");
    } catch (err) {
      setFormError((err as Error).message === "NOT_ADMIN" ? t("Tài khoản này không có quyền quản trị.") : t("Email hoặc mật khẩu không chính xác."));
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setOtpError("");
    setResent(false);
    setLoading(true);
    try {
      setChallengeId(await requestChallenge());
      setResendIn(RESEND_SECONDS);
      setResent(true);
    } catch {
      setOtpError(t("Không gửi lại được mã. Vui lòng đăng nhập lại."));
    } finally {
      setLoading(false);
    }
  }

  async function submitCode(e?: FormEvent) {
    e?.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setOtpError(t("Mã OTP phải là 6 chữ số."));
      return;
    }
    if (!challengeId) return;
    setLoading(true);
    setOtpError("");
    try {
      await adminApi(`auth/admin/mfa-challenges/${challengeId}/verification`, { method: "POST", body: JSON.stringify({ code }) });
      await adminApi("admin/session");
      const requested = searchParams.get("redirect") || "/admin";
      const target = /^\/admin(?:\/|$)/.test(requested) && !requested.includes("\\") && !requested.startsWith("/admin/login") ? requested : "/admin";
      router.push(target);
      router.refresh();
    } catch {
      // Giữ nguyên mã đã nhập để người dùng sửa từng ô
      setOtpError(t("Mã OTP không đúng hoặc đã hết hạn."));
      setLoading(false);
    }
  }

  const digits = Array.from({ length: 6 }, (_, i) => code[i] ?? "");
  const focusDigit = (i: number) => digitRefs.current[Math.max(0, Math.min(5, i))]?.focus();
  function fill(from: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) return;
    const arr = digits.slice();
    for (let k = 0; k < clean.length && from + k < 6; k++) arr[from + k] = clean[k];
    setCode(arr.join("").replace(/\s/g, ""));
    setOtpError("");
    focusDigit(from + clean.length);
  }
  function onDigitChange(i: number, raw: string) {
    const v = raw.replace(/\D/g, "");
    // Ô đang có số: giữ chữ số mới gõ; tự điền (one-time-code) hoặc dán: điền nhiều ô
    if (v.length === 2 && digits[i]) fill(i, v[0] === digits[i] ? v[1] : v[0]);
    else fill(i, v);
  }
  function onDigitKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = digits.slice();
      if (arr[i]) arr[i] = "";
      else if (i > 0) {
        arr[i - 1] = "";
        focusDigit(i - 1);
      }
      setCode(arr.join(""));
    } else if (e.key === "ArrowLeft") focusDigit(i - 1);
    else if (e.key === "ArrowRight") focusDigit(i + 1);
  }
  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    fill(i, e.clipboardData.getData("text"));
  };

  const input =
    "h-[42px] w-full rounded-lg border bg-white px-3 text-sm text-adm-text placeholder:text-adm-muted transition focus:outline-none focus:ring-2";
  const fieldState = (bad: boolean) => (bad ? "border-adm-error focus:ring-adm-error/20" : "border-adm-border focus:border-adm-primary focus:ring-adm-primary/20");

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#071533]">
      {/* Nền: toà nhà trường về đêm + lớp phủ để chữ dễ đọc */}
      <img src={adminAsset("/images/admin/login-bg.webp")} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-[70%_center]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#071533] via-[#071533]/85 to-[#071533]/20" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-t from-[#071533]/80 via-transparent to-[#071533]/40" aria-hidden />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-5 py-6 sm:px-10 sm:py-8 lg:px-14">
        <header className="flex items-center justify-between gap-6">
          <img src={adminAsset("/images/logo-white-2026.png")} alt="NextGen Manager Challenge 2026" className="h-10 w-auto sm:h-14" />
          <div className="flex items-center gap-6">
            <p className="hidden text-right text-xs font-semibold tracking-[0.2em] text-white/85 uppercase md:block">
              <span className="block">“{t("Tài năng hôm nay")}</span>
              <span className="block">{t("kiến tạo ngày mai")}”</span>
              <span className="mt-2 ml-auto block h-0.5 w-10 rounded-full bg-adm-gold" />
            </p>
            <AdminLangSwitch />
          </div>
        </header>

        <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1.1fr_minmax(0,440px)] lg:gap-16">
          <div className="hidden max-w-xl lg:block">
            <p className="text-sm font-semibold tracking-[0.18em] text-[#8CC1FF] uppercase">{t("Mùa I: The Manager in the AI Era")}</p>
            <h1 className="mt-4 text-5xl leading-[1.05] font-extrabold tracking-tight text-white xl:text-6xl">
              <span className="block">NEXTGEN</span>
              <span className="block text-adm-gold">MANAGER</span>
              <span className="mt-2 block text-3xl font-bold text-[#8CC1FF] xl:text-4xl">CHALLENGE 2026</span>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-white/75">
              {t("Hệ thống quản trị cuộc thi: điều phối hồ sơ, ca thi, giám sát và chấm điểm minh bạch.")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                ["40", t("vào Vòng 2"), "text-amber-400"],
                ["16", t("vào Chung kết"), "text-emerald-400"],
                ["3", t("vòng thi"), "text-sky-400"],
              ].map(([n, label, color]) => (
                <div key={label} className="flex items-baseline gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 backdrop-blur-sm">
                  <span className={`text-2xl font-extrabold tabular-nums ${color}`}>{n}</span>
                  <span className="text-sm font-medium text-white/80">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-12 text-sm leading-relaxed">
              <p className="text-white/60">{t("Đơn vị tổ chức:")}</p>
              <p className="font-semibold text-white">{t("Khoa Kinh tế và Quản lý")}</p>
              <p className="text-white/60">{t("Trường Quốc tế - ĐHQG Hà Nội")}</p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[440px] rounded-3xl bg-white p-7 shadow-2xl shadow-black/30 sm:p-9">
            {step === "CREDENTIALS" ? (
              <form onSubmit={submitCredentials} noValidate className="space-y-5">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-adm-text">{t("Chào mừng trở lại")}</h2>
                  <p className="mt-1 text-sm text-adm-sub">{t("Đăng nhập để truy cập hệ thống quản trị. Bước tiếp theo là mã xác thực gửi qua email.")}</p>
                </div>
                {formError && (
                  <div role="alert" className="flex gap-2 rounded-lg border border-red-200 bg-red-50/70 px-3 py-2.5 text-[13px] text-[#991B1B]">
                    <Icon name="alert" className="mt-0.5" /> {formError}
                  </div>
                )}
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-medium text-adm-text">{t("Email")}</span>
                  <input
                    ref={emailRef}
                    type="email"
                    autoComplete="username"
                    placeholder="ten@vnuis.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={submitted && !!emailError}
                    aria-describedby="email-error"
                    className={`${input} ${fieldState(submitted && !!emailError)}`}
                  />
                  {submitted && emailError && (
                    <span id="email-error" className="mt-1 block text-xs text-adm-error">
                      {emailError}
                    </span>
                  )}
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-adm-text">
                    {t("Mật khẩu")}
                    <a href="/thi/quen-mat-khau/" className="font-normal text-adm-primary hover:underline">
                      {t("Quên mật khẩu?")}
                    </a>
                  </span>
                  <span className="relative block">
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={submitted && !!passwordError}
                      aria-describedby="password-error"
                      className={`${input} pr-11 ${fieldState(submitted && !!passwordError)}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1.5 text-adm-muted hover:bg-slate-100 hover:text-adm-sub"
                      aria-label={showPassword ? t("Ẩn mật khẩu") : t("Hiện mật khẩu")}
                    >
                      <Icon name={showPassword ? "eyeOff" : "eye"} />
                    </button>
                  </span>
                  {submitted && passwordError && (
                    <span id="password-error" className="mt-1 block text-xs text-adm-error">
                      {passwordError}
                    </span>
                  )}
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-adm-primary text-sm font-semibold text-white transition hover:bg-adm-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-primary/40 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent motion-reduce:animate-none" aria-hidden />}
                  {loading ? t("Đang kiểm tra…") : t("Tiếp tục")}
                </button>
              </form>
            ) : (
              <form onSubmit={submitCode} noValidate className="space-y-5">
                <button type="button" onClick={() => setStep("CREDENTIALS")} className="-ml-1 inline-flex items-center gap-1.5 rounded-md px-1 text-[13px] text-adm-sub hover:text-adm-text">
                  <Icon name="arrowLeft" /> {t("Quay lại")}
                </button>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-adm-text">{t("Xác thực 2 bước")}</h2>
                  <p className="mt-1 text-sm text-adm-sub">
                    {t("Nhập mã 6 số đã gửi tới")} <strong className="font-medium text-adm-text">{email.trim()}</strong>
                  </p>
                </div>
                <fieldset>
                  <legend className="sr-only">{t("Mã xác thực 6 số")}</legend>
                  <div className="grid grid-cols-6 gap-2">
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          digitRefs.current[i] = el;
                        }}
                        value={d}
                        onChange={(e) => onDigitChange(i, e.target.value)}
                        onKeyDown={(e) => onDigitKey(i, e)}
                        onPaste={(e) => onPaste(i, e)}
                        onFocus={(e) => e.target.select()}
                        inputMode="numeric"
                        autoComplete={i === 0 ? "one-time-code" : "off"}
                        aria-label={`${t("Số thứ")} ${i + 1}`}
                        aria-invalid={!!otpError}
                        className={`h-12 w-full rounded-lg border bg-white text-center text-xl font-semibold text-adm-text tabular-nums transition focus:outline-none focus:ring-2 ${fieldState(!!otpError)}`}
                      />
                    ))}
                  </div>
                </fieldset>
                {otpError && (
                  <p role="alert" className="text-[13px] text-adm-error">
                    {otpError}
                  </p>
                )}
                {resent && !otpError && (
                  <p role="status" className="text-[13px] text-adm-success">
                    {t("Đã gửi mã mới. Mã cũ không còn hiệu lực.")}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-adm-primary text-sm font-semibold text-white transition hover:bg-adm-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-primary/40 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent motion-reduce:animate-none" aria-hidden />}
                  {loading ? t("Đang xác thực…") : t("Xác nhận")}
                </button>
                <p className="text-center text-[13px] text-adm-sub">
                  {t("Không nhận được mã?")}{" "}
                  {resendIn > 0 ? (
                    <span className="tabular-nums">
                      {t("Gửi lại sau")} {resendIn}s
                    </span>
                  ) : (
                    <button type="button" onClick={() => void resend()} disabled={loading} className="font-medium text-adm-primary hover:underline disabled:opacity-50">
                      {t("Gửi lại mã")}
                    </button>
                  )}
                </p>
              </form>
            )}
            <p className="mt-8 border-t border-slate-100 pt-5 text-center text-xs text-adm-muted">{t("Mọi truy cập trang quản trị đều được ghi nhật ký kiểm toán.")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
