"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ApiCallError, apiCall, fmtTime, idempotencyKey, type Assignment, type Availability } from "@/lib/examApi";
import { langFromPath, localePath } from "@/lib/i18n";
import Icon from "../Icon";

const field =
  "mt-1.5 w-full rounded-xl border border-line bg-mist/50 px-4 py-3 text-base text-ink outline-none transition focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10";

const copy = {
  vi: {
    reasons: {
      EMAIL_NOT_VERIFIED: "Tài khoản chưa xác thực email.",
      ADMISSION_NOT_OPEN: "Chưa đến giờ mở ca thi.",
      ADMISSION_CLOSED: "Ca thi đã đóng.",
      ATTEMPT_LIMIT_REACHED: "Bạn đã dùng hết số lượt làm bài.",
      ACTIVE_ATTEMPT_EXISTS: "Bạn đang có một bài thi chưa nộp.",
      BLUEPRINT_NOT_FROZEN: "Đề thi chưa sẵn sàng.",
    } as Record<string, string>,
    rules: [
      "Bài thi gồm các câu trắc nghiệm; thời gian làm bài tính từ lúc bấm Vào thi.",
      "Đáp án được lưu tự động sau mỗi lần chọn. Hết giờ, hệ thống tự nộp bài.",
      "Không chuyển tab hoặc rời trang làm bài: mỗi lần rời trang đều được ghi nhận.",
      "Dùng máy tính có mạng ổn định. Nếu mất kết nối, đăng nhập lại và bấm Tiếp tục làm bài.",
    ],
    loadError: "Không tải được lịch thi, vui lòng thử lại.",
    adminAccount: "Tài khoản quản trị vui lòng đăng nhập tại trang quản trị.",
    tooMany: "Thử quá nhiều lần, vui lòng đợi một phút.",
    badLogin: "Mã thí sinh/email hoặc mật khẩu không đúng, hoặc tài khoản chưa kích hoạt.",
    startError: "Không vào được bài thi, vui lòng thử lại.",
    loading: "Đang tải...",
    loginTitle: "Đăng nhập thi Vòng 1",
    identifier: "Mã thí sinh hoặc email",
    password: "Mật khẩu",
    signingIn: "Đang đăng nhập...",
    signIn: "Đăng nhập",
    activate: "Kích hoạt tài khoản",
    forgot: "Quên mật khẩu?",
    firstTime: "Lần đầu vào thi?",
    first1: "1. Kiểm tra email mời thi của Ban Tổ chức (mã thí sinh và ca thi).",
    first2a: "2. Vào",
    first2b: "để đặt mật khẩu.",
    first3: "3. Đến giờ thi, đăng nhập và bấm Vào thi.",
    rulesTitle: "Quy định làm bài",
    schedules: "Lịch thi của bạn",
    signOut: "Đăng xuất",
    noAssignment: "Bạn chưa được xếp ca thi. Ban Tổ chức sẽ gửi email khi có lịch thi.",
    round: (n: number) => `Vòng ${n}`,
    session: "Ca thi:",
    duration: "Thời gian làm bài:",
    minutes: (n: number) => `${n} phút`,
    submitted: "Bạn đã nộp bài. Kết quả sẽ được Ban Tổ chức công bố.",
    resume: "Tiếp tục làm bài",
    enter: "Vào thi",
    clockNote: (n: number) => `Đồng hồ ${n} phút bắt đầu chạy khi bạn bấm Vào thi.`,
    opensIn: "Ca thi mở sau",
    days: (n: number) => `${n} ngày `,
    closed: "Ca thi đã đóng.",
    cannotEnter: "Chưa thể vào thi.",
  },
  en: {
    reasons: {
      EMAIL_NOT_VERIFIED: "This account's email has not been verified.",
      ADMISSION_NOT_OPEN: "The exam session has not opened yet.",
      ADMISSION_CLOSED: "The exam session has closed.",
      ATTEMPT_LIMIT_REACHED: "You have used all your attempts.",
      ACTIVE_ATTEMPT_EXISTS: "You already have an exam in progress.",
      BLUEPRINT_NOT_FROZEN: "The exam paper is not ready yet.",
    } as Record<string, string>,
    rules: [
      "The exam is multiple choice; the timer starts when you press Start exam.",
      "Answers are saved automatically after each choice. When time runs out, the exam is submitted for you.",
      "Do not switch tabs or leave the exam page: every time you leave is recorded.",
      "Use a computer with a stable connection. If you get disconnected, sign in again and press Continue exam.",
    ],
    loadError: "Could not load your exam schedule, please try again.",
    adminAccount: "Admin accounts must sign in on the admin page.",
    tooMany: "Too many attempts, please wait a minute.",
    badLogin: "Incorrect candidate code/email or password, or the account has not been activated.",
    startError: "Could not open the exam, please try again.",
    loading: "Loading...",
    loginTitle: "Round 1 exam sign-in",
    identifier: "Candidate code or email",
    password: "Password",
    signingIn: "Signing in...",
    signIn: "Sign in",
    activate: "Activate account",
    forgot: "Forgot password?",
    firstTime: "First time taking the exam?",
    first1: "1. Check the exam invitation email from the Organizing Committee (candidate code and session).",
    first2a: "2. Go to",
    first2b: "to set your password.",
    first3: "3. At exam time, sign in and press Start exam.",
    rulesTitle: "Exam rules",
    schedules: "Your exam schedule",
    signOut: "Sign out",
    noAssignment: "You have not been assigned an exam session yet. The Organizing Committee will email you when it is scheduled.",
    round: (n: number) => `Round ${n}`,
    session: "Session:",
    duration: "Duration:",
    minutes: (n: number) => `${n} minutes`,
    submitted: "You have submitted. Results will be announced by the Organizing Committee.",
    resume: "Continue exam",
    enter: "Start exam",
    clockNote: (n: number) => `The ${n}-minute timer starts when you press Start exam.`,
    opensIn: "Session opens in",
    days: (n: number) => `${n} ${n === 1 ? "day" : "days"} `,
    closed: "The exam session has closed.",
    cannotEnter: "You cannot start the exam yet.",
  },
};

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
  const lang = langFromPath(usePathname());
  const t = copy[lang];
  const href = (path: string) => localePath(lang, path);
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
        setError(t.loadError);
      }
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  // Đến giờ mở ca thì tự làm mới trạng thái để nút Vào thi sáng lên
  useEffect(() => {
    const next = assignments.map((a) => new Date(a.schedule.opensAt).getTime()).find((x) => x > now);
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
        setError(t.adminAccount);
        return;
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiCallError && err.status === 429 ? t.tooMany : t.badLogin);
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
    if (a.activeAttemptId) return router.push(href(`/thi/lam-bai/?a=${a.activeAttemptId}`));
    setBusy(true);
    setError("");
    try {
      const res = await apiCall<{ attemptId: string }>(`/me/assignments/${a.assignmentId}/attempts`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey() },
      });
      router.push(href(`/thi/lam-bai/?a=${res.attemptId}`));
    } catch (err) {
      if (err instanceof ApiCallError && err.code === "ACTIVE_ATTEMPT_EXISTS") return load();
      setError(err instanceof ApiCallError ? (t.reasons[err.code] ?? err.message) : t.startError);
    } finally {
      setBusy(false);
    }
  }

  const rules = (
    <ul className="mt-3 space-y-2">
      {t.rules.map((r) => (
        <li key={r} className="flex gap-2 text-[15px] text-muted">
          <Icon name="check" className="mt-1 h-4 w-4 shrink-0 text-orange" strokeWidth={2.4} />
          {r}
        </li>
      ))}
    </ul>
  );

  if (stage === "checking") return <p className="py-10 text-center text-muted">{t.loading}</p>;

  if (stage === "login")
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <form onSubmit={login} className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold text-navy">{t.loginTitle}</h2>
          <label className="mt-5 block">
            <span className="text-[15px] font-semibold text-navy">{t.identifier}</span>
            <input name="identifier" required autoComplete="username" placeholder="ISNG-2026-XXXXXXXX" className={field} />
          </label>
          <label className="mt-4 block">
            <span className="text-[15px] font-semibold text-navy">{t.password}</span>
            <input name="password" type="password" required autoComplete="current-password" className={field} />
          </label>
          <button disabled={busy} className="btn-primary mt-6 w-full py-3.5 text-base disabled:opacity-60">
            {busy ? t.signingIn : t.signIn}
          </button>
          <div className="mt-4 flex justify-between text-sm">
            <Link href={href("/thi/kich-hoat/")} className="font-semibold text-brand hover:underline">
              {t.activate}
            </Link>
            <Link href={href("/thi/quen-mat-khau/")} className="text-muted hover:text-navy">
              {t.forgot}
            </Link>
          </div>
          {error && (
            <p className="mt-4 text-sm font-medium text-orange-ink" role="alert">
              {error}
            </p>
          )}
        </form>
        <aside className="rounded-3xl bg-cream p-6 sm:p-8">
          <h3 className="font-bold text-navy">{t.firstTime}</h3>
          <ol className="mt-3 space-y-2 text-[15px] text-muted">
            <li>{t.first1}</li>
            <li>
              {t.first2a}{" "}
              <Link href={href("/thi/kich-hoat/")} className="font-semibold text-brand hover:underline">
                {t.activate}
              </Link>{" "}
              {t.first2b}
            </li>
            <li>{t.first3}</li>
          </ol>
          <h3 className="mt-6 font-bold text-navy">{t.rulesTitle}</h3>
          {rules}
        </aside>
      </div>
    );

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-navy">{t.schedules}</h2>
        <button onClick={logout} className="btn-outline px-4 py-2 text-sm">
          {t.signOut}
        </button>
      </div>
      {assignments.length === 0 && <p className="card mt-5 p-6 text-[15px] text-muted">{t.noAssignment}</p>}
      <div className="mt-5 grid gap-5">
        {assignments.map((a) => {
          const av = availability[a.assignmentId];
          const opens = new Date(a.schedule.opensAt).getTime();
          const closes = new Date(a.schedule.closesAt).getTime();
          const finished = !a.activeAttemptId && a.attemptsUsed > 0;
          const canEnter = !!a.activeAttemptId || !!av?.canStart;
          const wait = opens - now;
          const minutes = Math.round(a.exam.durationSeconds / 60);
          return (
            <article key={a.assignmentId} className="card overflow-hidden">
              <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
                <div>
                  <p className="text-[13px] font-bold tracking-[0.14em] text-orange uppercase">{t.round(a.exam.round)}</p>
                  <h3 className="mt-1 text-2xl font-bold text-navy">{lang === "en" ? a.exam.name.replace(/^Vòng (\d+)/, "Round $1") : a.exam.name}</h3>
                  <dl className="mt-4 space-y-1.5 text-[15px]">
                    <div className="flex gap-2">
                      <dt className="text-muted">{t.session}</dt>
                      <dd className="font-semibold text-navy">
                        {fmtTime(a.schedule.opensAt, lang)} –{" "}
                        {new Date(a.schedule.closesAt).toLocaleTimeString(lang === "en" ? "en-GB" : "vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" })}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-muted">{t.duration}</dt>
                      <dd className="font-semibold text-navy">{t.minutes(minutes)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="rounded-2xl bg-mist p-5 text-center">
                  {finished ? (
                    <p className="text-[15px] font-semibold text-navy">{t.submitted}</p>
                  ) : canEnter ? (
                    <>
                      <button onClick={() => start(a)} disabled={busy} className="btn-primary cta-pulse w-full py-4 text-lg disabled:opacity-60">
                        {a.activeAttemptId ? t.resume : t.enter} <Icon name="arrowRight" className="h-5 w-5" />
                      </button>
                      <p className="mt-2 text-[13px] text-muted">{t.clockNote(minutes)}</p>
                    </>
                  ) : wait > 0 ? (
                    <>
                      <p className="text-[13px] font-semibold text-muted">{t.opensIn}</p>
                      <p className="mt-1 text-3xl font-bold text-navy tabular-nums">
                        {Math.floor(wait / 86_400_000) > 0 && t.days(Math.floor(wait / 86_400_000))}
                        {String(Math.floor((wait % 86_400_000) / 3_600_000)).padStart(2, "0")}:{String(Math.floor((wait % 3_600_000) / 60_000)).padStart(2, "0")}:
                        {String(Math.floor((wait % 60_000) / 1000)).padStart(2, "0")}
                      </p>
                    </>
                  ) : (
                    <p className="text-[15px] font-semibold text-orange-ink">{(av?.reasons ?? []).map((r) => t.reasons[r] ?? r).join(" ") || (now > closes ? t.closed : t.cannotEnter)}</p>
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
        <h3 className="font-bold text-navy">{t.rulesTitle}</h3>
        {rules}
      </section>
    </div>
  );
}
