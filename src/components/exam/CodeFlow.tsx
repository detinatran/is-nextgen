"use client";

import Link from "next/link";
import { useState } from "react";
import { ApiCallError, apiCall } from "@/lib/examApi";

/**
 * Kích hoạt tài khoản (mode="activate") hoặc đặt lại mật khẩu (mode="reset"):
 * bước 1 nhập email để nhận mã 6 số, bước 2 nhập mã + mật khẩu mới.
 */
const copy = {
  activate: {
    title: "Kích hoạt tài khoản thi",
    lead: "Nhập email bạn đã dùng khi đăng ký. Hệ thống gửi mã kích hoạt 6 số (hiệu lực 15 phút).",
    request: "/auth/activation-requests",
    confirm: "/auth/activation",
    passwordField: "password",
    done: "Đã kích hoạt tài khoản. Bạn có thể đăng nhập để vào thi.",
  },
  reset: {
    title: "Quên mật khẩu",
    lead: "Nhập email tài khoản thi. Hệ thống gửi mã đặt lại mật khẩu 6 số (hiệu lực 15 phút).",
    request: "/auth/password-reset-requests",
    confirm: "/auth/password-resets",
    passwordField: "newPassword",
    done: "Đã đặt lại mật khẩu. Bạn có thể đăng nhập lại.",
  },
};

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-mist/50 px-4 py-3 text-base text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

export default function CodeFlow({ mode }: { mode: "activate" | "reset" }) {
  const t = copy[mode];
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [challengeId, setChallengeId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(e?: React.FormEvent) {
    e?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiCall<{ challengeId: string }>(t.request, { method: "POST", body: JSON.stringify({ email: email.trim() }) });
      setChallengeId(res.challengeId);
      setStep("code");
    } catch (err) {
      setError(err instanceof ApiCallError && err.status === 429 ? "Bạn thao tác quá nhanh, vui lòng đợi một phút." : "Không gửi được yêu cầu, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password"));
    if (password !== String(data.get("password2"))) return setError("Hai lần nhập mật khẩu không khớp.");
    if (!/^(?=.*[A-Za-z])(?=.*\d).{10,128}$/.test(password)) return setError("Mật khẩu cần ít nhất 10 ký tự, gồm cả chữ và số.");
    setBusy(true);
    setError("");
    try {
      await apiCall(t.confirm, {
        method: "POST",
        body: JSON.stringify({ challengeId, code: String(data.get("code")).trim(), [t.passwordField]: password }),
      });
      setStep("done");
    } catch (err) {
      setError(
        err instanceof ApiCallError && (err.status === 401 || err.status === 404)
          ? "Mã không đúng hoặc đã hết hạn. Hãy kiểm tra lại hoặc gửi mã mới."
          : err instanceof ApiCallError && err.code === "STATE_CONFLICT"
            ? "Tài khoản này đã được kích hoạt. Bạn hãy đăng nhập hoặc dùng Quên mật khẩu."
            : "Không thực hiện được, vui lòng thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card mx-auto max-w-md p-6 sm:p-8">
      <h2 className="text-xl font-bold text-navy">{t.title}</h2>
      {step === "email" && (
        <form onSubmit={request} className="mt-4">
          <p className="text-[15px] text-muted">{t.lead}</p>
          <label className="mt-5 block">
            <span className="text-[15px] font-semibold text-navy">Email</span>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={field} />
          </label>
          <button disabled={busy} className="btn-primary mt-5 w-full py-3.5 disabled:opacity-60">
            {busy ? "Đang gửi..." : "Gửi mã"}
          </button>
        </form>
      )}
      {step === "code" && (
        <form onSubmit={confirm} className="mt-4 space-y-4">
          <p className="text-[15px] text-muted">
            Nếu email <strong className="text-navy">{email}</strong> có tài khoản thi, mã 6 số đã được gửi tới hộp thư (kiểm tra cả mục Spam).
          </p>
          <label className="block">
            <span className="text-[15px] font-semibold text-navy">Mã 6 số</span>
            <input name="code" required inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" className={`${field} text-center text-lg tracking-[0.4em]`} />
          </label>
          <label className="block">
            <span className="text-[15px] font-semibold text-navy">Mật khẩu mới</span>
            <input name="password" type="password" required minLength={10} autoComplete="new-password" className={field} />
            <span className="mt-1 block text-[13px] text-muted">Ít nhất 10 ký tự, gồm cả chữ và số.</span>
          </label>
          <label className="block">
            <span className="text-[15px] font-semibold text-navy">Nhập lại mật khẩu</span>
            <input name="password2" type="password" required autoComplete="new-password" className={field} />
          </label>
          <button disabled={busy} className="btn-primary w-full py-3.5 disabled:opacity-60">
            {busy ? "Đang xử lý..." : mode === "activate" ? "Kích hoạt" : "Đặt lại mật khẩu"}
          </button>
          <button type="button" onClick={() => request()} disabled={busy} className="w-full text-sm font-semibold text-brand hover:underline">
            Gửi lại mã
          </button>
        </form>
      )}
      {step === "done" && (
        <div className="mt-4">
          <p className="text-[15px] text-ink" role="status">
            {t.done}
          </p>
          <Link href="/thi/" className="btn-primary mt-5 w-full py-3.5">
            Đăng nhập
          </Link>
        </div>
      )}
      {error && (
        <p className="mt-4 text-sm font-medium text-orange-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
