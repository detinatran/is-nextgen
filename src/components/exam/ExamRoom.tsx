"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiCallError, apiCall, idempotencyKey, uuid, type AttemptView } from "@/lib/examApi";
import { asset } from "@/lib/paths";
import Icon from "../Icon";

type QState = { selected: string | null; revision: number; flagged: boolean; flagRevision: number };
type SaveStatus = "idle" | "saving" | "saved" | "error";

const LETTERS = "ABCDEFGH";

function fmtClock(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** Phòng thi Vòng 1 (FR-3.3): đồng hồ theo giờ server, tự lưu, đánh dấu, tự nộp khi hết giờ, ghi nhận rời trang. */
export default function ExamRoom() {
  const attemptId = useSearchParams().get("a") ?? "";
  const [view, setView] = useState<AttemptView | null>(null);
  const [answers, setAnswers] = useState<Record<string, QState>>({});
  const [current, setCurrent] = useState(0);
  const [writer, setWriter] = useState<number | null>(null);
  const [needTakeover, setNeedTakeover] = useState(false);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [finished, setFinished] = useState<null | "MANUAL" | "TIMEOUT">(null);
  const [focusLost, setFocusLost] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const skew = useRef(0);
  const queues = useRef<Record<string, Promise<void>>>({});
  const submitting = useRef(false);

  const load = useCallback(async () => {
    try {
      const v = await apiCall<AttemptView>(`/me/attempts/${attemptId}`);
      skew.current = new Date(v.attempt.serverTime).getTime() - Date.now();
      setView(v);
      setAnswers(
        Object.fromEntries(
          v.candidateState.map((s) => [s.deliveredQuestionId, { selected: s.selectedOptionId, revision: s.answerRevision, flagged: s.reviewFlag, flagRevision: s.flagRevision ?? 0 }]),
        ),
      );
      setWriter(v.attempt.writerGeneration);
      setNeedTakeover(v.attempt.state === "ACTIVE" && v.attempt.writerGeneration === null);
      if (v.attempt.state === "FINALIZED") setFinished("TIMEOUT");
    } catch (err) {
      setError(err instanceof ApiCallError && err.status === 401 ? "LOGIN" : "Không tải được bài thi. Vui lòng tải lại trang.");
    }
  }, [attemptId]);

  useEffect(() => {
    if (attemptId) load();
  }, [attemptId, load]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const deadline = view ? new Date(view.attempt.deadlineAt).getTime() : 0;
  const remaining = deadline - (now + skew.current);

  const submit = useCallback(
    async (cause: "MANUAL" | "TIMEOUT") => {
      if (submitting.current || !view) return;
      submitting.current = true;
      setConfirming(false);
      await Promise.all(Object.values(queues.current)).catch(() => undefined);
      try {
        await apiCall(`/me/attempts/${attemptId}/submission`, {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey() },
          body: JSON.stringify({ writerGeneration: writer ?? 1 }),
        });
      } catch {
        // Hết giờ: server tự chốt bài (worker) nên vẫn coi như đã nộp
      }
      setFinished(cause);
    },
    [attemptId, view, writer],
  );

  // Hết giờ thì tự nộp
  useEffect(() => {
    if (view && !finished && view.attempt.state === "ACTIVE" && remaining <= 0) submit("TIMEOUT");
  }, [remaining, view, finished, submit]);

  // Ghi nhận rời trang làm bài (chuyển tab / thu nhỏ / chuyển cửa sổ)
  useEffect(() => {
    if (!view || finished) return;
    let count = 0;
    let blurTimer = 0;
    const report = (kind: "HIDDEN" | "BLUR") => {
      count++;
      setFocusLost(count);
      apiCall(`/me/attempts/${attemptId}/focus-events`, { method: "POST", body: JSON.stringify({ kind, count }) }).catch(() => undefined);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        window.clearTimeout(blurTimer);
        report("HIDDEN");
      }
    };
    const onBlur = () => {
      blurTimer = window.setTimeout(() => document.visibilityState === "visible" && !document.hasFocus() && report("BLUR"), 400);
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.clearTimeout(blurTimer);
    };
  }, [view, finished, attemptId]);

  function handleWriteError(err: unknown) {
    if (err instanceof ApiCallError && err.code === "STATE_CONFLICT") setNeedTakeover(true);
    else if (err instanceof ApiCallError && err.code === "DEADLINE_PASSED") submit("TIMEOUT");
    else if (err instanceof ApiCallError && err.status === 401) setError("LOGIN");
    else setStatus("error");
  }

  /** Mỗi câu một hàng đợi để các lần lưu không giẫm revision của nhau. */
  function enqueue(qid: string, job: () => Promise<void>) {
    const prev = queues.current[qid] ?? Promise.resolve();
    const next = prev.then(job, job);
    queues.current[qid] = next.catch(() => undefined);
  }

  function choose(qid: string, optionId: string) {
    if (!writer || needTakeover || finished) return;
    setAnswers((a) => ({ ...a, [qid]: { ...a[qid], selected: optionId } }));
    setStatus("saving");
    enqueue(qid, async () => {
      const send = async (expected: number): Promise<void> => {
        try {
          const res = await apiCall<{ revision: number }>(`/me/attempts/${attemptId}/answers/${qid}`, {
            method: "PUT",
            body: JSON.stringify({ selectedOptionId: optionId, expectedRevision: expected, mutationId: uuid(), writerGeneration: writer }),
          });
          setAnswers((a) => ({ ...a, [qid]: { ...a[qid], revision: res.revision } }));
          setStatus("saved");
        } catch (err) {
          if (err instanceof ApiCallError && err.code === "REVISION_CONFLICT") {
            const latest = await apiCall<AttemptView>(`/me/attempts/${attemptId}`);
            const s = latest.candidateState.find((x) => x.deliveredQuestionId === qid);
            return send(s?.answerRevision ?? 0);
          }
          handleWriteError(err);
        }
      };
      await send(answersRef.current[qid]?.revision ?? 0);
    });
  }

  function toggleFlag(qid: string) {
    if (!writer || needTakeover || finished) return;
    const flagged = !answersRef.current[qid]?.flagged;
    setAnswers((a) => ({ ...a, [qid]: { ...a[qid], flagged } }));
    enqueue(`flag:${qid}`, async () => {
      try {
        const res = await apiCall<{ revision: number }>(`/me/attempts/${attemptId}/review-flags/${qid}`, {
          method: "PUT",
          body: JSON.stringify({ flagged, expectedRevision: answersRef.current[qid]?.flagRevision ?? 0, writerGeneration: writer }),
        });
        setAnswers((a) => ({ ...a, [qid]: { ...a[qid], flagRevision: res.revision } }));
      } catch (err) {
        handleWriteError(err);
      }
    });
  }

  const answersRef = useRef(answers);
  answersRef.current = answers;

  async function takeover(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    setError("");
    try {
      if (password) await apiCall("/auth/reauthentication", { method: "POST", body: JSON.stringify({ password }) });
      const res = await apiCall<{ writerGeneration: number }>(`/me/attempts/${attemptId}/session-takeover`, { method: "POST" });
      setWriter(res.writerGeneration);
      setNeedTakeover(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiCallError && err.status === 401 ? "Mật khẩu không đúng." : "Chưa tiếp tục được. Hãy nhập mật khẩu để xác nhận.");
    }
  }

  if (!attemptId) return <Center>Thiếu mã bài thi.</Center>;
  if (error === "LOGIN")
    return (
      <Center>
        Phiên đăng nhập đã hết.{" "}
        <Link href="/thi/" className="font-semibold text-brand underline">
          Đăng nhập lại
        </Link>{" "}
        rồi bấm Tiếp tục làm bài; đáp án đã chọn vẫn được giữ.
      </Center>
    );
  if (finished)
    return (
      <Center>
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e7f6ec] text-[#15803d]">
          <Icon name="check" className="h-7 w-7" strokeWidth={2.4} />
        </span>
        <strong className="block text-xl text-navy">Đã nộp bài</strong>
        <span className="mt-2 block text-muted">
          {finished === "TIMEOUT" ? "Hết thời gian làm bài, hệ thống đã tự nộp bài của bạn." : "Bài làm của bạn đã được ghi nhận."} Kết quả sẽ được Ban Tổ chức công bố.
        </span>
        <Link href="/thi/" className="btn-primary mt-6">
          Về trang thi
        </Link>
      </Center>
    );
  if (!view) return <Center>{error || "Đang tải bài thi..."}</Center>;

  const qs = view.form;
  const q = qs[current];
  const st = answers[q.deliveredQuestionId];
  const answered = qs.filter((x) => answers[x.deliveredQuestionId]?.selected).length;
  const flaggedCount = qs.filter((x) => answers[x.deliveredQuestionId]?.flagged).length;
  const lowTime = remaining < 5 * 60_000;

  return (
    <div className="min-h-screen bg-mist select-none" onContextMenu={(e) => e.preventDefault()}>
      <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/images/logo.png")} alt="NextGen Manager" className="h-10 w-auto" />
          <div className={`rounded-xl px-4 py-1.5 text-center tabular-nums ${lowTime ? "bg-orange text-white" : "bg-navy text-white"}`} role="timer" aria-label="Thời gian còn lại">
            <span className="block text-[11px] font-semibold tracking-wider uppercase opacity-80">Còn lại</span>
            <span className="text-xl font-bold">{fmtClock(remaining)}</span>
          </div>
          <button onClick={() => setConfirming(true)} className="btn-primary px-5 py-2.5">
            Nộp bài
          </button>
        </div>
        {focusLost > 0 && (
          <p className="bg-[#fff1e6] px-4 py-1.5 text-center text-[13px] font-medium text-orange-ink">
            Bạn đã rời trang làm bài {focusLost} lần. Mỗi lần rời trang đều được ghi nhận gửi Ban Tổ chức.
          </p>
        )}
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 lg:grid-cols-[1fr_17rem]">
        <section className="card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-muted">
              Câu {current + 1}/{qs.length}
            </p>
            <button
              onClick={() => toggleFlag(q.deliveredQuestionId)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition ${st?.flagged ? "bg-orange text-white ring-orange" : "text-muted ring-line hover:text-navy"}`}
            >
              <Icon name="flag" className="h-4 w-4" /> {st?.flagged ? "Đã đánh dấu" : "Đánh dấu xem lại"}
            </button>
          </div>
          <h2 className="mt-4 text-lg leading-relaxed font-semibold whitespace-pre-line text-navy sm:text-xl">{q.prompt}</h2>
          <ul className="mt-6 space-y-3" role="radiogroup">
            {[...q.options]
              .sort((a, b) => a.position - b.position)
              .map((o, i) => {
                const on = st?.selected === o.deliveredOptionId;
                return (
                  <li key={o.deliveredOptionId}>
                    <button
                      role="radio"
                      aria-checked={on}
                      onClick={() => choose(q.deliveredQuestionId, o.deliveredOptionId)}
                      className={`flex w-full items-start gap-3 rounded-2xl border-2 px-4 py-3.5 text-left text-[15px] transition ${on ? "border-brand bg-brand/5" : "border-line bg-white hover:border-brand/40"}`}
                    >
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${on ? "bg-brand text-white" : "bg-mist text-navy"}`}>{LETTERS[i]}</span>
                      <span className="pt-0.5 whitespace-pre-line text-ink">{o.text}</span>
                    </button>
                  </li>
                );
              })}
          </ul>
          <div className="mt-8 flex items-center justify-between gap-3">
            <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0} className="btn-outline px-5 py-2.5 disabled:opacity-40">
              <Icon name="chevronLeft" className="h-4 w-4" /> Câu trước
            </button>
            <span className="text-[13px] text-muted" aria-live="polite">
              {status === "saving" ? "Đang lưu..." : status === "saved" ? "Đã lưu" : status === "error" ? "Lỗi lưu, hãy chọn lại" : ""}
            </span>
            <button onClick={() => setCurrent((c) => Math.min(qs.length - 1, c + 1))} disabled={current === qs.length - 1} className="btn-primary px-5 py-2.5 disabled:opacity-40">
              Câu sau <Icon name="chevronRight" className="h-4 w-4" />
            </button>
          </div>
        </section>

        <aside className="card h-max p-5 lg:sticky lg:top-24">
          <p className="text-sm font-bold text-navy">Danh sách câu hỏi</p>
          <p className="mt-1 text-[13px] text-muted">
            Đã làm {answered}/{qs.length}
            {flaggedCount > 0 && ` · Đánh dấu ${flaggedCount}`}
          </p>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {qs.map((x, i) => {
              const s = answers[x.deliveredQuestionId];
              return (
                <button
                  key={x.deliveredQuestionId}
                  onClick={() => setCurrent(i)}
                  aria-label={`Câu ${i + 1}`}
                  className={`relative h-10 rounded-lg text-sm font-semibold transition ${
                    s?.selected ? "bg-navy text-white" : "bg-mist text-navy hover:bg-line"
                  } ${i === current ? "ring-2 ring-brand ring-offset-2" : ""}`}
                >
                  {i + 1}
                  {s?.flagged && <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange ring-2 ring-white" />}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-1.5 text-[12px] text-muted">
            <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-navy" /> Đã trả lời</p>
            <p className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-mist ring-1 ring-line" /> Chưa trả lời</p>
            <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-orange" /> Đánh dấu xem lại</p>
          </div>
        </aside>
      </div>

      {confirming && (
        <Modal>
          <h3 className="text-lg font-bold text-navy">Nộp bài?</h3>
          <p className="mt-2 text-[15px] text-muted">
            Bạn đã trả lời {answered}/{qs.length} câu
            {qs.length - answered > 0 && <strong className="text-orange-ink">, còn {qs.length - answered} câu chưa làm</strong>}
            {flaggedCount > 0 && `, ${flaggedCount} câu đang đánh dấu`}. Sau khi nộp, bạn không thể sửa bài.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setConfirming(false)} className="btn-outline px-5 py-2.5">
              Làm tiếp
            </button>
            <button onClick={() => submit("MANUAL")} className="btn-primary px-5 py-2.5">
              Nộp bài
            </button>
          </div>
        </Modal>
      )}

      {needTakeover && (
        <Modal>
          <form onSubmit={takeover}>
            <h3 className="text-lg font-bold text-navy">Tiếp tục làm bài tại đây?</h3>
            <p className="mt-2 text-[15px] text-muted">
              Bài thi đang được mở ở một tab hoặc thiết bị khác. Nhập mật khẩu để tiếp tục làm bài tại đây; nơi kia sẽ không lưu được nữa. Đồng hồ vẫn chạy.
            </p>
            <input name="password" type="password" autoComplete="current-password" placeholder="Mật khẩu" className="mt-4 w-full rounded-xl border border-line px-4 py-3" />
            {error && error !== "LOGIN" && <p className="mt-2 text-sm text-orange-ink">{error}</p>}
            <button className="btn-primary mt-5 w-full py-3">Tiếp tục tại đây</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4">
      <div className="card max-w-md p-8 text-center text-[15px] text-ink">{children}</div>
    </div>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/50 px-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">{children}</div>
    </div>
  );
}
