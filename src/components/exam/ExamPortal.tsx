"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiCallError, apiCall, fmtTime, idempotencyKey, type Assignment, type Availability } from "@/lib/examApi";
import Icon from "../Icon";

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-mist/50 px-4 py-3 text-base text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

const REASONS: Record<string, string> = {
  EMAIL_NOT_VERIFIED: "Tài khoản chưa xác thực email.",
  ADMISSION_NOT_OPEN: "Chưa đến giờ mở ca thi.",
  ADMISSION_CLOSED: "Ca thi đã đóng.",
  ATTEMPT_LIMIT_REACHED: "Bạn đã dùng hết số lượt làm bài.",
  ACTIVE_ATTEMPT_EXISTS: "Bạn đang có một bài thi chưa nộp.",
  BLUEPRINT_NOT_FROZEN: "Đề thi chưa sẵn sàng.",
};

const RULES = [
  "Bài thi gồm các câu trắc nghiệm, làm trong 60 phút tính từ lúc bấm Vào thi.",
  "Đáp án được lưu tự động sau mỗi lần chọn. Hết giờ, hệ thống tự nộp bài.",
  "Không chuyển tab hoặc rời trang làm bài: mỗi lần rời trang đều được ghi nhận.",
  "Dùng máy tính có mạng ổn định. Nếu mất kết nối, đăng nhập lại và bấm Tiếp tục làm bài.",
];

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function ExamPortal() {
  const router = useRouter();
  const [stage, setStage] = useState<"checking" | "login" | "ready">("checking");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availability, setAvailability] = useState<Record<string, Availability>>({});
  const [skew, setSkew] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const now = useNow() + skew;

  const load = useCallback(async () => {
    try {
      const res = await apiCall<{ assignments: Assignment[] }>("/me/assignments");
      setAssignments(res.assignments);
      const av = await Promise.all(res.assignments.map((a) => apiCall<Availability>(`/me/assignments/${a.assignmentId}/availability`)));
      setAvailability(Object.fromEntries(av.map((x) => [x.assignmentId, x])));
      if (av[0]) setSkew(new Date(av[0].serverTime).getTime() - Date.now());
      setStage("ready");
    } catch (err) {
      if (err instanceof ApiCallError && (err.status === 401 || err.status === 403)) setStage("login");
      else {
        setStage("ready");
        setError("Không tải được lịch thi, vui lòng thử lại.");
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Đến giờ mở ca thì tự làm mới trạng thái để nút Vào thi sáng lên
  useEffect(() => {
    const next = assignments.map((a) => new Date(a.schedule.opensAt).getTime()).find((t) => t > now);
    if (!next) return;
    const id = window.setTimeout(load, Math.max(1000, next - now + 1500));
    return () => window.clearTimeout(id);
  }, [assignments, now, load]);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const res = await apiCall<{ status?: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: String(data.get("identifier")).trim(), password: String(data.get("password")) }),
      });
      if (res.status === "MFA_REQUIRED") {
        setError("Tài khoản quản trị vui lòng đăng nhập tại trang quản trị.");
        return;
      }
      await load();
    } catch (err) {
      setError(
        err instanceof ApiCallError && err.status === 429
          ? "Thử quá nhiều lần, vui lòng đợi một phút."
          : "Mã thí sinh/email hoặc mật khẩu không đúng, hoặc tài khoản chưa kích hoạt.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await apiCall("/auth/logout", { method: "POST" }).catch(() => undefined);
    setAssignments([]);
    setStage("login");
  }

  async function start(a: Assignment) {
    if (a.activeAttemptId) return router.push(`/thi/lam-bai/?a=${a.activeAttemptId}`);
    setBusy(true);
    setError("");
    try {
      const res = await apiCall<{ attemptId: string }>(`/me/assignments/${a.assignmentId}/attempts`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey() },
      });
      router.push(`/thi/lam-bai/?a=${res.attemptId}`);
    } catch (err) {
      if (err instanceof ApiCallError && err.code === "ACTIVE_ATTEMPT_EXISTS") return load();
      setError(err instanceof ApiCallError ? (REASONS[err.code] ?? err.message) : "Không vào được bài thi, vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  if (stage === "checking") return <p className="py-10 text-center text-muted">Đang tải...</p>;

  if (stage === "login")
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={login} className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">Đăng nhập thi Vòng 1</h2>
          <label className="mt-5 block">
            <span className="text-[15px] font-semibold text-navy">Mã thí sinh hoặc email</span>
            <input name="identifier" required autoComplete="username" placeholder="ISNG-2026-XXXXXXXX" className={field} />
          </label>
          <label className="mt-4 block">
            <span className="text-[15px] font-semibold text-navy">Mật khẩu</span>
            <input name="password" type="password" required autoComplete="current-password" className={field} />
          </label>
          <button disabled={busy} className="btn-primary mt-6 w-full py-3.5 text-base disabled:opacity-60">
            {busy ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
          <div className="mt-4 flex justify-between text-sm">
            <Link href="/thi/kich-hoat/" className="font-semibold text-brand hover:underline">
              Kích hoạt tài khoản
            </Link>
            <Link href="/thi/quen-mat-khau/" className="text-muted hover:text-navy">
              Quên mật khẩu?
            </Link>
          </div>
          {error && (
            <p className="mt-4 text-sm font-medium text-orange-ink" role="alert">
              {error}
            </p>
          )}
        </form>
        <aside className="rounded-3xl bg-cream p-6 sm:p-8">
          <h3 className="font-bold text-navy">Lần đầu vào thi?</h3>
          <ol className="mt-3 space-y-2 text-[15px] text-muted">
            <li>1. Kiểm tra email mời thi của Ban Tổ chức (mã thí sinh và ca thi).</li>
            <li>
              2. Vào{" "}
              <Link href="/thi/kich-hoat/" className="font-semibold text-brand hover:underline">
                Kích hoạt tài khoản
              </Link>{" "}
              để đặt mật khẩu.
            </li>
            <li>3. Đến giờ thi, đăng nhập và bấm Vào thi.</li>
          </ol>
          <h3 className="mt-6 font-bold text-navy">Quy định làm bài</h3>
          <ul className="mt-3 space-y-2">
            {RULES.map((r) => (
              <li key={r} className="flex gap-2 text-[15px] text-muted">
                <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-orange" strokeWidth={2.4} />
                {r}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-navy">Lịch thi của bạn</h2>
        <button onClick={logout} className="btn-outline px-4 py-2 text-sm">
          Đăng xuất
        </button>
      </div>
      {assignments.length === 0 && (
        <p className="card mt-5 p-6 text-[15px] text-muted">Bạn chưa được xếp ca thi. Ban Tổ chức sẽ gửi email khi có lịch thi.</p>
      )}
      <div className="mt-5 grid gap-5">
        {assignments.map((a) => {
          const av = availability[a.assignmentId];
          const opens = new Date(a.schedule.opensAt).getTime();
          const closes = new Date(a.schedule.closesAt).getTime();
          const finished = !a.activeAttemptId && a.attemptsUsed > 0;
          const canEnter = !!a.activeAttemptId || !!av?.canStart;
          const wait = opens - now;
          return (
            <article key={a.assignmentId} className="card overflow-hidden">
              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                <div>
                  <p className="text-[13px] font-bold tracking-[0.14em] text-orange uppercase">Vòng {a.exam.round}</p>
                  <h3 className="mt-1 text-2xl font-bold text-navy">{a.exam.name}</h3>
                  <dl className="mt-4 space-y-1.5 text-[15px]">
                    <div className="flex gap-2">
                      <dt className="text-muted">Ca thi:</dt>
                      <dd className="font-semibold text-navy">
                        {fmtTime(a.schedule.opensAt)} – {new Date(a.schedule.closesAt).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" })}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted">Thời gian làm bài:</dt>
                      <dd className="font-semibold text-navy">{Math.round(a.exam.durationSeconds / 60)} phút</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-2xl bg-mist p-5 text-center">
                  {finished ? (
                    <p className="text-[15px] font-semibold text-navy">Bạn đã nộp bài. Kết quả sẽ được Ban Tổ chức công bố.</p>
                  ) : canEnter ? (
                    <>
                      <button onClick={() => start(a)} disabled={busy} className="btn-primary cta-pulse w-full py-4 text-lg disabled:opacity-60">
                        {a.activeAttemptId ? "Tiếp tục làm bài" : "Vào thi"} <Icon name="arrowRight" className="h-5 w-5" />
                      </button>
                      <p className="mt-2 text-[13px] text-muted">Đồng hồ 60 phút bắt đầu chạy khi bạn bấm Vào thi.</p>
                    </>
                  ) : wait > 0 ? (
                    <>
                      <p className="text-[13px] font-semibold text-muted">Ca thi mở sau</p>
                      <p className="mt-1 text-3xl font-bold text-navy tabular-nums">
                        {Math.floor(wait / 86_400_000) > 0 && `${Math.floor(wait / 86_400_000)} ngày `}
                        {String(Math.floor((wait % 86_400_000) / 3_600_000)).padStart(2, "0")}:{String(Math.floor((wait % 3_600_000) / 60_000)).padStart(2, "0")}:
                        {String(Math.floor((wait % 60_000) / 1000)).padStart(2, "0")}
                      </p>
                    </>
                  ) : (
                    <p className="text-[15px] font-semibold text-orange-ink">{(av?.reasons ?? []).map((r) => REASONS[r] ?? r).join(" ") || (now > closes ? "Ca thi đã đóng." : "Chưa thể vào thi.")}</p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {error && (
        <p className="mt-4 text-sm font-medium text-orange-ink" role="alert">
          {error}
        </p>
      )}
      <section className="mt-8 rounded-3xl bg-cream p-6 sm:p-8">
        <h3 className="font-bold text-navy">Quy định làm bài</h3>
        <ul className="mt-3 space-y-2">
          {RULES.map((r) => (
            <li key={r} className="flex gap-2 text-[15px] text-muted">
              <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-orange" strokeWidth={2.4} />
              {r}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
