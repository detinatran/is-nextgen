"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminError, adminCall, adminUrl } from "@/lib/adminApi";
import Icon from "../Icon";
import { ImportButton, Modal, field, fmtDate, messageOf, type ImportError } from "./shared";

type Schedule = { id: string; label: string; opensAt: string; closesAt: string; capacity: number; assigned: number; invited: number; activeAccounts: number; started: number; finalized: number };
type Overview = {
  exam: { id: string; name: string; durationSeconds: number } | null;
  blueprint: { id: string; version: number; questionCount: number; items: { poolId: string; poolCode: string; count: number; points: number }[] } | null;
  schedules: Schedule[];
  totals: { submitted: number; assigned: number; unassigned: number };
};
type Pool = { id: string; code: string; name: string; questionCount: number };
type RosterRow = {
  assignmentId: string;
  scheduleId: string;
  candidateCode: string | null;
  fullName: string;
  school: string | null;
  email: string;
  account: "NONE" | "PROVISIONED" | "ACTIVE" | "DISABLED";
  attemptState: "ACTIVE" | "FINALIZED" | null;
  finalizedAt: string | null;
  finalizationCause: string | null;
  points: number | null;
  maxPoints: number | null;
  focusLost: number;
};

// Giờ Việt Nam <-> ô datetime-local
const toInput = (iso: string) => new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).replace(" ", "T").slice(0, 16);
const fromInput = (v: string) => new Date(`${v}:00+07:00`).toISOString();
const timeOnly = (iso: string) => new Date(iso).toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit" });
const dayOnly = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short", day: "2-digit", month: "2-digit" });
const slotTime = (s: Schedule) => `${dayOnly(s.opensAt)} · ${timeOnly(s.opensAt)}–${timeOnly(s.closesAt)}`;

const accountLabel = { NONE: "Chưa mời", PROVISIONED: "Đã mời", ACTIVE: "Đã kích hoạt", DISABLED: "Bị khoá" } as const;
function statusOf(r: RosterRow) {
  if (r.attemptState === "ACTIVE") return { text: "Đang thi", tone: "bg-sky/15 text-brand" };
  if (r.attemptState === "FINALIZED") return { text: r.finalizationCause === "TIMEOUT" ? "Hết giờ, tự nộp" : "Đã nộp", tone: "bg-[#e7f6ec] text-[#15803d]" };
  return { text: "Chưa thi", tone: "bg-mist text-muted" };
}

/** FR-3.1, FR-3.4, FR-4.3, FR-4.4: đề thi, ca thi, phân ca, mời thi, theo dõi và xuất điểm Vòng 1. */
export default function Round1({ onLogout }: { onLogout: () => void }) {
  const [ov, setOv] = useState<Overview | null>(null);
  const [pools, setPools] = useState<Pool[]>([]);
  const [roster, setRoster] = useState<RosterRow[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [editing, setEditing] = useState<Schedule | "new" | null>(null);
  const [blueprintOpen, setBlueprintOpen] = useState(false);

  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof AdminError && err.status === 401) onLogout();
      else setError(messageOf(err));
    },
    [onLogout],
  );

  const load = useCallback(async () => {
    try {
      const [o, p] = await Promise.all([adminCall<Overview>("/admin/exams/round1"), adminCall<Pool[]>("/admin/question-pools")]);
      setOv(o);
      setPools(p);
      setRoster(o.exam ? await adminCall<RosterRow[]>(`/admin/exams/${o.exam.id}/assignments`) : []);
      setError("");
    } catch (err) {
      fail(err);
    }
  }, [fail]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(key: string, job: () => Promise<string>) {
    setBusy(key);
    setNotice("");
    setError("");
    try {
      setNotice(await job());
      await load();
    } catch (err) {
      fail(err);
    } finally {
      setBusy("");
    }
  }

  if (!ov) return <div className="mx-auto max-w-[90rem] px-4 py-10 text-sm text-muted sm:px-6">{error || "Đang tải..."}</div>;

  const exam = ov.exam;
  if (!exam)
    return (
      <div className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6">
        <div className="card max-w-xl p-8">
          <h2 className="text-xl font-bold text-navy">Chưa có đề thi Vòng 1</h2>
          <p className="mt-2 text-[15px] text-muted">Tạo đề thi trắc nghiệm 60 phút, sau đó chọn số câu lấy từ mỗi nhóm câu hỏi và tạo các ca thi.</p>
          <button
            onClick={() => run("exam", async () => (await adminCall("/admin/exams/round1", { method: "POST", body: JSON.stringify({}) }), "Đã tạo đề thi Vòng 1."))}
            disabled={!!busy}
            className="btn-primary mt-5 px-6 py-3 disabled:opacity-60"
          >
            Tạo đề thi Vòng 1
          </button>
          {error && <p className="mt-3 text-sm font-medium text-orange-ink">{error}</p>}
        </div>
      </div>
    );

  const sum = (k: keyof Schedule) => ov.schedules.reduce((n, s) => n + (s[k] as number), 0);
  const capacity = sum("capacity");
  const totalPoints = ov.blueprint?.items.reduce((n, it) => n + it.count * it.points, 0) ?? 0;

  return (
    <div className="mx-auto max-w-[90rem] space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy">{exam.name}</h2>
          <p className="text-sm text-muted">{exam.durationSeconds / 60} phút · tính từ lúc thí sinh bấm Vào thi</p>
        </div>
        <button onClick={load} className="btn-outline px-4 py-2 text-sm">
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Hồ sơ đã nộp" value={ov.totals.submitted} />
        <Stat label="Đã xếp ca" value={ov.totals.assigned} sub={capacity ? `sức chứa ${capacity}` : undefined} />
        <Stat label="Chưa xếp ca" value={ov.totals.unassigned} warn={ov.totals.unassigned > 0} />
        <Stat label="Đã kích hoạt tài khoản" value={sum("activeAccounts")} sub={`đã mời ${sum("invited")}`} />
        <Stat label="Đã vào thi" value={sum("started")} />
        <Stat label="Đã nộp bài" value={sum("finalized")} />
      </div>

      {notice && <p className="rounded-xl bg-[#e7f6ec] px-4 py-2.5 text-sm font-medium text-[#15803d]">{notice}</p>}
      {error && <p className="rounded-xl bg-orange/10 px-4 py-2.5 text-sm font-medium text-orange-ink">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-navy">1. Cấu trúc đề</h3>
            <button onClick={() => setBlueprintOpen(true)} disabled={!pools.length} className="text-sm font-semibold text-brand hover:underline disabled:opacity-40">
              {ov.blueprint ? "Sửa" : "Thiết lập"}
            </button>
          </div>
          {ov.blueprint ? (
            <>
              <ul className="mt-3 divide-y divide-line text-sm">
                {ov.blueprint.items.map((it) => (
                  <li key={it.poolId} className="flex justify-between py-2">
                    <span className="font-mono text-navy">{it.poolCode}</span>
                    <span className="text-muted">
                      {it.count} câu × {it.points} điểm
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm font-semibold text-navy">
                Tổng {ov.blueprint.questionCount} câu · {totalPoints} điểm <span className="font-normal text-muted">(phiên bản {ov.blueprint.version})</span>
              </p>
              <p className="mt-2 text-[13px] text-muted">Mỗi thí sinh nhận bộ câu ngẫu nhiên theo cấu trúc này; thứ tự câu và đáp án được xáo trộn.</p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">{pools.length ? "Chưa thiết lập. Chọn số câu lấy từ mỗi nhóm câu hỏi." : "Hãy thêm câu hỏi ở tab Ngân hàng câu hỏi trước."}</p>
          )}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-navy">2. Ca thi</h3>
            <button onClick={() => setEditing("new")} className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
              <Icon name="plus" className="h-4 w-4" /> Thêm ca
            </button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-2 pr-3">Ca</th>
                  <th className="py-2 pr-3">Thời gian (giờ VN)</th>
                  <th className="py-2 pr-3 text-right">Đã xếp</th>
                  <th className="py-2 pr-3 text-right">Kích hoạt</th>
                  <th className="py-2 pr-3 text-right">Đã nộp</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {ov.schedules.map((s) => (
                  <tr key={s.id} className="border-t border-line">
                    <td className="py-2 pr-3 font-semibold text-navy">{s.label}</td>
                    <td className="py-2 pr-3">{slotTime(s)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      {s.assigned}/{s.capacity}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{s.activeAccounts}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{s.finalized}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <button onClick={() => setEditing(s)} className="font-semibold text-brand hover:underline">
                        Sửa
                      </button>
                      <button
                        disabled={!!busy || s.assigned === 0}
                        onClick={() =>
                          window.confirm(`Gửi email mời thi cho thí sinh ${s.label} chưa được mời?`) &&
                          run(`invite-${s.id}`, async () => inviteMessage(await adminCall(`/admin/exams/${exam.id}/invitations`, { method: "POST", body: JSON.stringify({ scheduleId: s.id }) })))
                        }
                        className="ml-3 text-muted hover:text-navy disabled:opacity-40"
                      >
                        Gửi mời
                      </button>
                    </td>
                  </tr>
                ))}
                {ov.schedules.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted">
                      Chưa có ca thi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold text-navy">3. Phân ca và mời thi</h3>
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!!busy || !ov.blueprint || !ov.schedules.length}
              onClick={() =>
                run("auto", async () => {
                  const r = await adminCall<{ assigned: number; notAssigned: number }>(`/admin/exams/${exam.id}/assignments/auto`, { method: "POST" });
                  return `Đã xếp ${r.assigned} thí sinh vào ca.` + (r.notAssigned ? ` Còn ${r.notAssigned} thí sinh chưa xếp được vì các ca đã đầy: hãy thêm ca hoặc tăng sức chứa.` : "");
                })
              }
              className="btn-outline px-4 py-2.5 text-sm disabled:opacity-40"
              title="Xếp các thí sinh đã nộp hồ sơ nhưng chưa có ca vào ca còn nhiều chỗ nhất"
            >
              {busy === "auto" ? "Đang xếp..." : "Tự động xếp ca"}
            </button>
            <a href={adminUrl(`/admin/exams/${exam.id}/assignments/export`)} className="btn-outline px-4 py-2.5 text-sm">
              Tải file phân ca
            </a>
            <ImportButton<{ applied?: number; errors?: ImportError[] }>
              path={`/admin/exams/${exam.id}/assignments/import`}
              label="Nhập file phân ca"
              onDone={(r) => {
                if (!r.errors?.length) {
                  setNotice(`Đã cập nhật ca thi cho ${r.applied} thí sinh.`);
                  load();
                }
              }}
            />
            <button
              disabled={!!busy || !ov.totals.assigned}
              onClick={() =>
                window.confirm("Gửi email mời thi cho tất cả thí sinh đã xếp ca nhưng chưa kích hoạt tài khoản?") &&
                run("invite", async () => inviteMessage(await adminCall(`/admin/exams/${exam.id}/invitations`, { method: "POST", body: JSON.stringify({}) })))
              }
              className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40"
            >
              {busy === "invite" ? "Đang gửi..." : "Gửi email mời thi"}
            </button>
          </div>
        </div>
        <p className="mt-2 text-[13px] text-muted">
          File phân ca: sửa cột &quot;Ca thi&quot; (số thứ tự ca) rồi nhập lại. Email mời gồm mã thí sinh, ca thi và link kích hoạt tài khoản tại trang /thi/kich-hoat/. Gửi lại chỉ gửi cho người chưa kích hoạt.
        </p>
      </section>

      <RosterTable examId={exam.id} roster={roster} schedules={ov.schedules} onChanged={load} onError={fail} />

      {editing && (
        <ScheduleForm
          examId={exam.id}
          schedule={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => {
            setEditing(null);
            setNotice(msg);
            load();
          }}
        />
      )}
      {blueprintOpen && (
        <BlueprintForm
          examId={exam.id}
          pools={pools}
          current={ov.blueprint?.items ?? []}
          onClose={() => setBlueprintOpen(false)}
          onSaved={(msg) => {
            setBlueprintOpen(false);
            setNotice(msg);
            load();
          }}
        />
      )}
    </div>
  );
}

function inviteMessage(r: unknown) {
  const { invited, alreadyActive, problems } = r as { invited: number; alreadyActive: number; problems: { candidateCode: string | null; message: string }[] };
  let msg = `Đã xếp hàng gửi ${invited} email mời thi.`;
  if (alreadyActive) msg += ` ${alreadyActive} thí sinh đã kích hoạt nên không gửi lại.`;
  if (problems.length) msg += ` Lỗi ${problems.length}: ${problems.map((p) => `${p.candidateCode ?? "?"} (${p.message})`).join("; ")}`;
  return msg;
}

function Stat({ label, value, sub, warn }: { label: string; value: number; sub?: string; warn?: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-line">
      <p className="text-[12px] font-semibold text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${warn ? "text-orange-ink" : "text-navy"}`}>{value}</p>
      {sub && <p className="text-[12px] text-muted">{sub}</p>}
    </div>
  );
}

function RosterTable({ examId, roster, schedules, onChanged, onError }: { examId: string; roster: RosterRow[] | null; schedules: Schedule[]; onChanged: () => void; onError: (e: unknown) => void }) {
  const [slot, setSlot] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [live, setLive] = useState(false);

  // Theo dõi trực tiếp trong giờ thi: tự làm mới 15 giây/lần
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(onChanged, 15_000);
    return () => window.clearInterval(id);
  }, [live, onChanged]);

  const label = useMemo(() => new Map(schedules.map((s) => [s.id, s.label])), [schedules]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (roster ?? []).filter(
      (r) =>
        (!slot || r.scheduleId === slot) &&
        (!status || statusOf(r).text === status || (status === "Đã nộp" && r.attemptState === "FINALIZED") || (status === "Rời trang" && r.focusLost > 0)) &&
        (!q || [r.candidateCode, r.fullName, r.email, r.school].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [roster, slot, status, query]);

  async function move(r: RosterRow, scheduleId: string) {
    try {
      await adminCall(`/admin/assignments/${r.assignmentId}`, { method: "PATCH", body: JSON.stringify({ scheduleId, reason: "Đổi ca trên trang quản trị" }) });
      onChanged();
    } catch (err) {
      onError(err);
    }
  }

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-bold text-navy">4. Thí sinh và kết quả</h3>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-navy">
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="h-4 w-4 accent-[#f26b1d]" />
            Theo dõi trực tiếp (15 giây)
          </label>
          <a href={adminUrl(`/admin/exams/${examId}/scores/export`)} className="btn-primary px-4 py-2.5 text-sm">
            Xuất điểm, đánh dấu Top 40
          </a>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm mã, tên, email, trường" className={`${field} max-w-xs`} />
        <select value={slot} onChange={(e) => setSlot(e.target.value)} className={`${field} !w-auto`}>
          <option value="">Tất cả ca</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} · {slotTime(s)}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} !w-auto`}>
          <option value="">Mọi trạng thái</option>
          <option>Chưa thi</option>
          <option>Đang thi</option>
          <option>Đã nộp</option>
          <option>Rời trang</option>
        </select>
        <span className="self-center text-sm text-muted">{rows.length} thí sinh</span>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[62rem] text-left text-sm">
          <thead className="bg-mist/70 text-xs font-semibold tracking-wide text-muted uppercase">
            <tr>
              {["Mã thí sinh", "Họ và tên", "Ca thi", "Tài khoản", "Trạng thái", "Điểm", "Rời trang"].map((h) => (
                <th key={h} className="px-3 py-2.5">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const st = statusOf(r);
              return (
                <tr key={r.assignmentId} className="border-t border-line">
                  <td className="px-3 py-2.5 font-mono text-[13px] text-navy">{r.candidateCode}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-semibold text-navy">{r.fullName}</span>
                    <span className="block text-[12px] text-muted">
                      {r.email}
                      {r.school && ` · ${r.school}`}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {r.attemptState ? (
                      label.get(r.scheduleId)
                    ) : (
                      <select value={r.scheduleId} onChange={(e) => move(r, e.target.value)} className="rounded-lg border border-line bg-white px-2 py-1 text-sm" aria-label={`Ca thi của ${r.fullName}`}>
                        {schedules.map((s) => (
                          <option key={s.id} value={s.id} disabled={s.id !== r.scheduleId && s.assigned >= s.capacity}>
                            {s.label}
                            {s.id !== r.scheduleId && s.assigned >= s.capacity ? " (đầy)" : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[13px]">{accountLabel[r.account]}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap ${st.tone}`}>{st.text}</span>
                    {r.finalizedAt && <span className="mt-0.5 block text-[11px] text-muted">{fmtDate(r.finalizedAt)}</span>}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-navy tabular-nums">{r.points === null ? "—" : `${r.points}/${r.maxPoints}`}</td>
                  <td className={`px-3 py-2.5 tabular-nums ${r.focusLost > 0 ? "font-semibold text-orange-ink" : "text-muted"}`}>{r.focusLost || "—"}</td>
                </tr>
              );
            })}
            {roster && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted">
                  {roster.length ? "Không có thí sinh phù hợp." : "Chưa xếp thí sinh nào vào ca."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ScheduleForm({ examId, schedule, onClose, onSaved }: { examId: string; schedule: Schedule | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = JSON.stringify({ opensAt: fromInput(String(data.get("opensAt"))), closesAt: fromInput(String(data.get("closesAt"))), capacity: Number(data.get("capacity")) });
    setBusy(true);
    setError("");
    try {
      if (schedule) await adminCall(`/admin/exam-schedules/${schedule.id}`, { method: "PATCH", body });
      else await adminCall(`/admin/exams/${examId}/schedules`, { method: "POST", body });
      onSaved(schedule ? `Đã lưu ${schedule.label}.` : "Đã thêm ca thi.");
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!schedule || !window.confirm(`Xoá ${schedule.label}?`)) return;
    try {
      await adminCall(`/admin/exam-schedules/${schedule.id}`, { method: "DELETE" });
      onSaved(`Đã xoá ${schedule.label}.`);
    } catch (err) {
      setError(messageOf(err));
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={save}>
        <h3 className="text-lg font-bold text-navy">{schedule ? `Sửa ${schedule.label}` : "Thêm ca thi"}</h3>
        <p className="mt-1 text-[13px] text-muted">Giờ Việt Nam. Thí sinh được bắt đầu làm bài từ giờ mở đến giờ đóng ca; mỗi người có đủ 60 phút tính từ lúc bấm Vào thi.</p>
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-muted">Mở ca</span>
          <input name="opensAt" type="datetime-local" required defaultValue={schedule ? toInput(schedule.opensAt) : "2026-11-07T08:00"} className={`${field} mt-1`} />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-muted">Đóng ca (giờ muộn nhất được bắt đầu)</span>
          <input name="closesAt" type="datetime-local" required defaultValue={schedule ? toInput(schedule.closesAt) : "2026-11-07T08:30"} className={`${field} mt-1`} />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-muted">Sức chứa (số thí sinh)</span>
          <input name="capacity" type="number" min={Math.max(1, schedule?.assigned ?? 1)} max={1000} required defaultValue={schedule?.capacity ?? 100} className={`${field} mt-1`} />
        </label>
        {error && <p className="mt-3 text-sm font-medium text-orange-ink">{error}</p>}
        <div className="mt-5 flex items-center justify-between gap-3">
          {schedule ? (
            <button type="button" onClick={remove} disabled={schedule.assigned > 0} className="text-sm text-muted hover:text-orange-ink disabled:opacity-40" title={schedule.assigned > 0 ? "Chuyển hết thí sinh sang ca khác trước khi xoá" : ""}>
              Xoá ca
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline px-5 py-2.5 text-sm">
              Huỷ
            </button>
            <button disabled={busy} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60">
              Lưu
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function BlueprintForm({ examId, pools, current, onClose, onSaved }: { examId: string; pools: Pool[]; current: { poolId: string; count: number; points: number }[]; onClose: () => void; onSaved: (msg: string) => void }) {
  const [rows, setRows] = useState(() =>
    pools.map((p) => {
      const it = current.find((c) => c.poolId === p.id);
      return { pool: p, count: it?.count ?? 0, points: it?.points ?? 1 };
    }),
  );
  const [error, setError] = useState("");
  const total = rows.reduce((n, r) => n + r.count, 0);
  const points = rows.reduce((n, r) => n + r.count * r.points, 0);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const items = rows.filter((r) => r.count > 0).map((r) => ({ poolId: r.pool.id, count: r.count, points: r.points }));
    if (!items.length) return setError("Chọn ít nhất 1 câu.");
    const short = rows.find((r) => r.count > r.pool.questionCount);
    if (short) return setError(`Nhóm ${short.pool.code} chỉ có ${short.pool.questionCount} câu.`);
    try {
      await adminCall(`/admin/exams/${examId}/blueprint`, { method: "PUT", body: JSON.stringify({ items }) });
      onSaved("Đã lưu cấu trúc đề. Thí sinh được xếp ca từ giờ sẽ nhận đề theo cấu trúc mới.");
    } catch (err) {
      setError(messageOf(err));
    }
  }

  const set = (i: number, patch: Partial<{ count: number; points: number }>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <Modal onClose={onClose} wide>
      <form onSubmit={save}>
        <h3 className="text-lg font-bold text-navy">Cấu trúc đề Vòng 1</h3>
        <p className="mt-1 text-[13px] text-muted">Số câu lấy ngẫu nhiên từ mỗi nhóm và điểm mỗi câu. Nên ra số câu ít hơn số câu trong nhóm để mỗi thí sinh nhận bộ đề khác nhau.</p>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="py-2">Nhóm</th>
              <th className="py-2">Số câu trong nhóm</th>
              <th className="py-2">Số câu lấy</th>
              <th className="py-2">Điểm/câu</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.pool.id} className="border-t border-line">
                <td className="py-2 pr-3">
                  <span className="font-mono font-semibold text-navy">{r.pool.code}</span>
                  <span className="block text-[12px] text-muted">{r.pool.name}</span>
                </td>
                <td className="py-2 pr-3 tabular-nums">{r.pool.questionCount}</td>
                <td className="py-2 pr-3">
                  <input type="number" min={0} max={r.pool.questionCount} value={r.count} onChange={(e) => set(i, { count: Math.max(0, Number(e.target.value) || 0) })} className={`${field} w-24`} />
                </td>
                <td className="py-2">
                  <input type="number" min={0} max={100} step={0.25} value={r.points} onChange={(e) => set(i, { points: Number(e.target.value) || 0 })} className={`${field} w-24`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-sm font-semibold text-navy">
          Tổng: {total} câu · {points} điểm
        </p>
        {error && <p className="mt-3 text-sm font-medium text-orange-ink">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-outline px-5 py-2.5 text-sm">
            Huỷ
          </button>
          <button className="btn-primary px-5 py-2.5 text-sm">Lưu cấu trúc đề</button>
        </div>
      </form>
    </Modal>
  );
}
