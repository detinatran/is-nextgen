"use client";
import { FormEvent, useState } from "react";
import { adminApi } from "@/lib/admin/api";

export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState(""),
    [password, setPassword] = useState("");
  const [challenge, setChallenge] = useState(""),
    [code, setCode] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!challenge) {
        const result = await adminApi<{
          status?: string;
          challengeId?: string;
        }>("auth/login", {
          method: "POST",
          body: JSON.stringify({ identifier, password }),
        });
        if (result.status === "MFA_REQUIRED" && result.challengeId) {
          setChallenge(result.challengeId);
          setPassword("");
          return;
        }
        await adminApi("auth/logout", { method: "POST" });
        throw new Error("Tài khoản này không có quyền quản trị.");
      }
      await adminApi(`auth/admin/mfa-challenges/${challenge}/verification`, {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      await adminApi("admin/session");
      const requested =
        new URLSearchParams(window.location.search).get("redirect") || "/admin";
      const target =
        /^\/admin(?:\/|$)/.test(requested) &&
        !requested.includes("\\") &&
        !requested.startsWith("/admin/login")
          ? requested
          : "/admin";
      window.location.assign(target);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0B1F4D] to-[#1F5BE0]">
      <section className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl">
        <p className="text-blue-600 font-semibold text-sm">
          IS-NEXTGEN · ADMIN
        </p>
        <h1 className="text-2xl font-bold mt-3 mb-2">
          {challenge ? "Xác thực đăng nhập" : "Đăng nhập quản trị"}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          {challenge
            ? "Nhập mã 6 số đã gửi đến email quản trị của bạn."
            : "Sử dụng tài khoản được Ban Tổ Chức cấp."}
        </p>
        <form onSubmit={submit} className="space-y-4">
          {!challenge ? (
            <>
              <label className="block text-sm font-medium">
                Email
                <input
                  className="mt-2 w-full border rounded-xl px-3 py-3"
                  type="email"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium">
                Mật khẩu
                <input
                  className="mt-2 w-full border rounded-xl px-3 py-3"
                  type="password"
                  required
                  maxLength={128}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            </>
          ) : (
            <label className="block text-sm font-medium">
              Mã xác thực
              <input
                className="mt-2 w-full border rounded-xl px-3 py-3 tracking-widest"
                required
                pattern="[0-9]{6}"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              />
            </label>
          )}
          {error && (
            <p
              role="alert"
              className="text-sm text-red-700 bg-red-50 rounded-xl p-3"
            >
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="w-full bg-blue-600 text-white rounded-xl py-3 font-semibold disabled:opacity-50"
          >
            {busy ? "Đang xử lý…" : challenge ? "Xác thực" : "Đăng nhập"}
          </button>
          {challenge && (
            <button
              type="button"
              disabled={busy}
              className="w-full text-sm text-slate-600"
              onClick={() => {
                setChallenge("");
                setCode("");
                setError("");
              }}
            >
              Quay lại đăng nhập
            </button>
          )}
        </form>
      </section>
    </main>
  );
}
