"use client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { adminApi, AssignmentItem, Configuration, downloadAdmin, RegistrationItem, ScheduleItem, viTime } from "@/lib/admin/api";
import { Button, emptyConfig, Field, inputClass, Notice, Panel, Table, useOperations, useResource } from "./common";
import { Callout, Drawer, Icon, PageHeader, Pagination, Pill, StatCard, status, useConfirm } from "@/components/admin/ui/kit";
import { useDebounce } from "@/hooks/useDebounce";

const statusPill = (st: string) => (st === "IN_PROGRESS" ? status.inProgress : st === "SUBMITTED" ? status.completed : status.notStarted);
const statusLabel: Record<string, string> = { NOT_STARTED: "Chưa vào thi", IN_PROGRESS: "Đang làm bài", SUBMITTED: "Đã nộp bài" };
const clock = (d: Date | null) => (d ? d.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }) : "—");
const slotPill = (s: ScheduleItem) => {
  const now = Date.now();
  return now < new Date(s.opensAt).getTime() ? <Pill tone="blue">Sắp diễn ra</Pill> : now <= new Date(s.closesAt).getTime() ? <Pill tone="green">Đang mở</Pill> : <Pill tone="slate">Đã đóng</Pill>;
};
function SearchBox({ value, onChange, placeholder, className = "min-w-56 flex-1" }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={`relative ${className}`}>
      <span className="sr-only">{placeholder}</span>
      <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-adm-muted" />
      <input className={`${inputClass} pl-9`} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} maxLength={200} />
    </label>
  );
}

/* ───────── Lịch thi & ca thi ───────── */

const blankSchedule = { competitionId: "", name: "", opensAt: "", closesAt: "", durationMinutes: "60", capacity: "100", poolId: "", questionCount: "30" };
type ScheduleForm = typeof blankSchedule;
const vnDate = (local: string) => (local ? new Date(`${local}:00+07:00`) : null);

function validateSchedule(f: ScheduleForm) {
  const e: Partial<Record<keyof ScheduleForm, string>> = {};
  if (!f.competitionId) e.competitionId = "Chọn cuộc thi";
  if (!f.name.trim()) e.name = "Nhập tên ca";
  const o = vnDate(f.opensAt),
    c = vnDate(f.closesAt);
  const dur = Number(f.durationMinutes);
  if (!o) e.opensAt = "Chọn giờ mở ca";
  if (!c) e.closesAt = "Chọn giờ đóng ca";
  else if (o && c <= o) e.closesAt = "Giờ đóng phải sau giờ mở";
  if (!Number.isInteger(dur) || dur < 1 || dur > 240) e.durationMinutes = "Từ 1 đến 240 phút";
  else if (o && c && c > o && c.getTime() - o.getTime() < dur * 60_000) e.durationMinutes = "Khung giờ ca ngắn hơn thời lượng làm bài";
  const cap = Number(f.capacity);
  if (!Number.isInteger(cap) || cap < 1 || cap > 100000) e.capacity = "Từ 1 đến 100.000";
  if (!f.poolId) e.poolId = "Chọn nhóm câu hỏi";
  const q = Number(f.questionCount);
  if (!Number.isInteger(q) || q < 1 || q > 500) e.questionCount = "Từ 1 đến 500 câu";
  return e;
}

export function Schedules() {
  const list = useResource<ScheduleItem[]>("admin/schedules", []),
    config = useResource<Configuration>("admin/configuration", emptyConfig),
    op = useOperations();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ScheduleForm>(blankSchedule);
  const [touched, setTouched] = useState<Partial<Record<keyof ScheduleForm, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const errors = validateSchedule(form);
  const err = (k: keyof ScheduleForm) => (submitted || touched[k] ? errors[k] : undefined);
  const bind = (k: keyof ScheduleForm) => ({
    value: form[k],
    "aria-invalid": !!err(k),
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value })),
    onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    className: inputClass,
  });
  // Mặc định chọn cuộc thi duy nhất
  useEffect(() => {
    if (!form.competitionId && config.data.competitions.length === 1) setForm((f) => ({ ...f, competitionId: config.data.competitions[0].id }));
  }, [config.data.competitions, form.competitionId]);

  function openForm() {
    setFormOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }), 0);
  }
  function create(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    void op.run(async () => {
      await adminApi("admin/schedules", {
        method: "POST",
        body: JSON.stringify({
          competitionId: form.competitionId,
          name: form.name.trim(),
          opensAt: vnDate(form.opensAt)!.toISOString(),
          closesAt: vnDate(form.closesAt)!.toISOString(),
          durationSeconds: Number(form.durationMinutes) * 60,
          capacity: Number(form.capacity),
          questionCount: Number(form.questionCount),
          poolId: form.poolId,
        }),
      });
      setForm({ ...blankSchedule, competitionId: form.competitionId, poolId: form.poolId });
      setTouched({});
      setSubmitted(false);
      setFormOpen(false);
      await list.reload();
    }, "Đã tạo ca thi và chốt đề.");
  }

  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return needle ? list.data.filter((s) => s.name.toLowerCase().includes(needle)) : list.data;
  }, [list.data, debouncedSearch]);
  const compName = (id: string) => config.data.competitions.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch thi & ca thi"
        icon="calendar"
        tone="cyan"
        description="Ca thi Vòng 1: khung giờ mở/đóng theo giờ Việt Nam (UTC+7), thời lượng làm bài, sức chứa và đề được chốt từ một nhóm câu hỏi."
        actions={
          !formOpen && (
            <Button icon="plus" onClick={openForm}>
              Tạo ca thi
            </Button>
          )
        }
      />
      <Notice message={op.error || config.error} error />
      <Notice message={op.message} />

      {formOpen && (
        <div ref={formRef}>
          <Panel icon="plus" title="Tạo ca thi mới" description="Đề thi được chốt ngay khi tạo ca. Nhóm câu hỏi cần có đủ số câu.">
            <form onSubmit={create} noValidate className="space-y-6">
              <fieldset className="grid gap-4 md:grid-cols-2">
                <legend className="mb-3 text-[13px] font-semibold text-adm-sub">Thông tin ca</legend>
                <Field label="Cuộc thi" required error={err("competitionId")}>
                  <select {...bind("competitionId")}>
                    <option value="">Chọn cuộc thi</option>
                    {config.data.competitions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tên ca" required error={err("name")}>
                  <input {...bind("name")} maxLength={200} placeholder="VD: Ca 1 – Sáng 07/11" />
                </Field>
              </fieldset>
              <fieldset className="grid gap-4 border-t border-adm-border pt-5 md:grid-cols-2">
                <legend className="mb-3 pt-5 text-[13px] font-semibold text-adm-sub">Thời gian · giờ Việt Nam (UTC+7)</legend>
                <Field label="Mở ca" required error={err("opensAt")}>
                  <input type="datetime-local" {...bind("opensAt")} />
                </Field>
                <Field label="Đóng ca" required error={err("closesAt")}>
                  <input type="datetime-local" {...bind("closesAt")} />
                </Field>
                <Field label="Thời lượng làm bài (phút)" required error={err("durationMinutes")} hint="1–240 phút, không dài hơn khung giờ ca">
                  <input type="number" inputMode="numeric" min={1} max={240} {...bind("durationMinutes")} />
                </Field>
              </fieldset>
              <fieldset className="grid gap-4 border-t border-adm-border pt-5 md:grid-cols-2">
                <legend className="mb-3 pt-5 text-[13px] font-semibold text-adm-sub">Đề thi & sức chứa</legend>
                <Field label="Nhóm câu hỏi" required error={err("poolId")}>
                  <select {...bind("poolId")}>
                    <option value="">Chọn nhóm</option>
                    {config.data.pools.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Số câu trong đề" required error={err("questionCount")} hint="1–500 câu">
                  <input type="number" inputMode="numeric" min={1} max={500} {...bind("questionCount")} />
                </Field>
                <Field label="Số thí sinh tối đa" required error={err("capacity")} hint="1–100.000">
                  <input type="number" inputMode="numeric" min={1} max={100000} {...bind("capacity")} />
                </Field>
              </fieldset>
              <div className="flex justify-end gap-2 border-t border-adm-border pt-5">
                <Button variant="ghost" onClick={() => setFormOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" loading={op.busy} disabled={config.loading}>
                  Tạo ca thi
                </Button>
              </div>
            </form>
          </Panel>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[17px] font-semibold text-adm-text">Danh sách ca thi</h2>
          <span className="text-[13px] text-adm-sub tabular-nums">{list.data.length} ca</span>
          <span className="flex-1" />
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm theo tên ca" className="w-full sm:w-64" />
        </div>
        {list.error ? (
          <Notice message={`Không tải được ca thi: ${list.error}`} error onRetry={list.reload} />
        ) : (
          <Table
            loading={list.loading}
            numeric={[4, 5]}
            headers={["Ca thi", "Mở ca", "Đóng ca", "Trạng thái", "Thời lượng", "Đã xếp / Sức chứa", "Đề thi"]}
            empty={
              search
                ? { icon: "search", title: "Không có ca phù hợp" }
                : { icon: "calendar", title: "Chưa có ca thi", description: "Tạo ca thi đầu tiên để bắt đầu xếp thí sinh.", action: <Button icon="plus" onClick={openForm}>Tạo ca thi</Button> }
            }
            rows={filtered.map((s) => {
              const full = Number(s.assigned) >= s.capacity;
              return [
                <div key="n">
                  <span className="font-medium text-adm-text">{s.name}</span>
                  {config.data.competitions.length > 1 && <div className="text-xs text-adm-sub">{compName(s.competitionId)}</div>}
                </div>,
                <span key="o" className="whitespace-nowrap tabular-nums">
                  {viTime(s.opensAt)}
                </span>,
                <span key="c" className="whitespace-nowrap tabular-nums">
                  {viTime(s.closesAt)}
                </span>,
                slotPill(s),
                `${s.durationSeconds / 60} phút`,
                <span key="cap" className={full ? "font-medium text-adm-error" : ""}>
                  {s.assigned}/{s.capacity}
                </span>,
                s.blueprintId ? <Pill key="b" tone="green">Đã chốt đề</Pill> : <Pill key="b" tone="red">Chưa có đề</Pill>,
              ];
            })}
          />
        )}
        <p className="text-xs text-adm-muted">Ca thi chưa hỗ trợ sửa hoặc xoá. Cần thay đổi, hãy tạo ca mới và đổi ca cho thí sinh ở trang Phân ca.</p>
      </section>
    </div>
  );
}

/* ───────── Phân ca thí sinh ───────── */

type HistoryRow = { old_schedule_id: string; new_schedule_id: string; reason: string; changed_at: string };

export function Assignments() {
  const [search, setSearch] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const list = useResource<AssignmentItem[]>("admin/assignments", []),
    schedules = useResource<ScheduleItem[]>("admin/schedules", []),
    candidates = useResource<RegistrationItem[]>("admin/registrations", []),
    op = useOperations();
  const confirm = useConfirm();
  const [batchResult, setBatchResult] = useState<{ text: string; problems?: string[] } | null>(null);
  const [inviteSchedule, setInviteSchedule] = useState("");
  const [mode, setMode] = useState<"assign" | "move">("assign");
  const [manual, setManual] = useState({ candidateId: "", scheduleId: "", reason: "" });
  const [manualSubmitted, setManualSubmitted] = useState(false);
  const [historyFor, setHistoryFor] = useState<AssignmentItem | null>(null);
  const [history, setHistory] = useState<{ loading: boolean; error: string; rows: HistoryRow[] }>({ loading: false, error: "", rows: [] });
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(20);

  const now = Date.now();
  const byCandidate = useMemo(() => new Map(list.data.map((a) => [a.candidateId, a])), [list.data]);
  const regById = useMemo(() => new Map(candidates.data.map((c) => [c.id, c])), [candidates.data]);
  const eligible = candidates.data.filter((c) => c.state === "SUBMITTED" && c.candidateCode && !c.deleted && c.accountStatus !== "DISABLED" && !byCandidate.has(c.id));
  const openSlots = schedules.data.filter((s) => new Date(s.opensAt).getTime() > now && s.blueprintId);
  const capacityLeft = openSlots.reduce((n, s) => n + Math.max(0, s.capacity - Number(s.assigned)), 0);
  const inviteTargets = list.data.filter((a) => (!inviteSchedule || a.scheduleId === inviteSchedule) && regById.get(a.candidateId)?.accountStatus !== "ACTIVE");
  const reload = () => Promise.all([list.reload(), schedules.reload(), candidates.reload()]);

  async function autoAssign() {
    const willAssign = Math.min(eligible.length, capacityLeft);
    const r = await confirm({
      title: "Tự động xếp ca",
      description: (
        <ul className="space-y-1">
          <li>
            Hồ sơ đủ điều kiện chưa có ca: <strong className="text-adm-text tabular-nums">{eligible.length}</strong>
          </li>
          <li>
            Chỗ trống ở {openSlots.length} ca sắp diễn ra: <strong className="text-adm-text tabular-nums">{capacityLeft}</strong>
          </li>
          <li>
            Dự kiến xếp: <strong className="text-adm-text tabular-nums">{willAssign}</strong> thí sinh, ưu tiên ca còn nhiều chỗ nhất.
          </li>
          {eligible.length > capacityLeft && <li className="text-adm-warning">{eligible.length - capacityLeft} thí sinh sẽ chưa có ca — cần thêm ca hoặc tăng sức chứa.</li>}
        </ul>
      ),
      confirmText: `Xếp ${willAssign} thí sinh`,
    });
    if (!r.ok) return;
    setBatchResult(null);
    void op.run(async () => {
      const res = await adminApi<{ assigned: number; skipped: number; waiting: number }>("admin/assignments/auto", { method: "POST", body: JSON.stringify({}) });
      setBatchResult({
        text:
          `Đã xếp ${res.assigned} thí sinh vào ca.` +
          (res.waiting ? ` Còn ${res.waiting} thí sinh chưa xếp được vì các ca đã đầy.` : "") +
          (res.skipped ? ` Bỏ qua ${res.skipped} thí sinh (tài khoản bị khoá/xoá hoặc email trùng).` : ""),
      });
      await reload();
    }, "");
  }

  async function invite() {
    const target = schedules.data.find((s) => s.id === inviteSchedule);
    const r = await confirm({
      title: "Gửi email mời thi",
      description: (
        <>
          <p>
            Gửi email cho <strong className="text-adm-text tabular-nums">{inviteTargets.length}</strong> thí sinh chưa kích hoạt tài khoản ở {target ? <strong className="text-adm-text">{target.name}</strong> : "tất cả các ca"}.
          </p>
          <p className="mt-2">Email gồm mã thí sinh, giờ thi và link kích hoạt tài khoản. Đây là email thật gửi tới thí sinh.</p>
        </>
      ),
      confirmText: `Gửi ${inviteTargets.length} email`,
    });
    if (!r.ok) return;
    setBatchResult(null);
    void op.run(async () => {
      const res = await adminApi<{ invited: number; alreadyActive: number; problems: { candidateCode: string | null; message: string }[] }>("admin/invitations", {
        method: "POST",
        body: JSON.stringify(inviteSchedule ? { scheduleId: inviteSchedule } : {}),
      });
      setBatchResult({
        text: `Đã gửi ${res.invited} email mời thi.` + (res.alreadyActive ? ` ${res.alreadyActive} thí sinh đã kích hoạt nên không gửi lại.` : ""),
        problems: res.problems.map((p) => `${p.candidateCode ?? "?"}: ${p.message}`),
      });
      await candidates.reload();
    }, "");
  }

  const current = mode === "move" ? byCandidate.get(manual.candidateId) : undefined;
  const manualErrors = {
    candidateId: manual.candidateId ? "" : "Chọn thí sinh",
    scheduleId: manual.scheduleId ? "" : "Chọn ca thi",
    reason: mode === "move" && !manual.reason.trim() ? "Nhập lý do đổi ca" : "",
  };
  async function saveManual(e: FormEvent) {
    e.preventDefault();
    setManualSubmitted(true);
    if (Object.values(manualErrors).some(Boolean)) return;
    const reg = regById.get(manual.candidateId);
    const to = schedules.data.find((s) => s.id === manual.scheduleId);
    if (mode === "move") {
      const r = await confirm({ title: "Đổi ca thi", description: `${reg?.fullName}: ${current?.scheduleName} → ${to?.name}. Lý do được lưu vào lịch sử đổi ca.`, confirmText: "Đổi ca" });
      if (!r.ok) return;
    }
    void op.run(async () => {
      await adminApi("admin/assignments", { method: "POST", body: JSON.stringify({ candidateId: manual.candidateId, scheduleId: manual.scheduleId, reason: manual.reason.trim() || undefined }) });
      setManual({ candidateId: "", scheduleId: "", reason: "" });
      setManualSubmitted(false);
      await reload();
    }, mode === "move" ? `Đã đổi ca cho ${reg?.fullName}.` : `Đã xếp ${reg?.fullName} vào ${to?.name}.`);
  }

  async function openHistory(a: AssignmentItem) {
    setHistoryFor(a);
    setHistory({ loading: true, error: "", rows: [] });
    try {
      setHistory({ loading: false, error: "", rows: await adminApi<HistoryRow[]>(`admin/assignments/${a.id}/history`) });
    } catch (e) {
      setHistory({ loading: false, error: (e as Error).message, rows: [] });
    }
  }

  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return list.data.filter((a) => (!scheduleFilter || a.scheduleId === scheduleFilter) && (!needle || a.candidateCode.toLowerCase().includes(needle) || a.fullName.toLowerCase().includes(needle)));
  }, [list.data, debouncedSearch, scheduleFilter]);
  const scheduleName = (id: string) => schedules.data.find((s) => s.id === id)?.name ?? id;
  const movable = list.data.filter((a) => a.status === "NOT_STARTED" && !a.attemptId);
  const loadingAll = list.loading || schedules.loading || candidates.loading;

  return (
    <div className="space-y-6">
      <PageHeader icon="clipboard" title="Phân ca thí sinh" description="Xếp thí sinh đã nộp hồ sơ vào ca thi Vòng 1, đổi ca khi cần và gửi email mời thi." />
      <Notice message={op.error || schedules.error || candidates.error} error onRetry={op.error ? undefined : () => void reload()} />
      <Notice message={op.message} />
      {batchResult && (
        <Callout tone={batchResult.problems?.length ? "warning" : "info"} title={batchResult.text} action={<Button size="sm" variant="ghost" onClick={() => setBatchResult(null)}>Ẩn</Button>}>
          {batchResult.problems?.length ? (
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {batchResult.problems.slice(0, 10).map((p) => (
                <li key={p}>{p}</li>
              ))}
              {batchResult.problems.length > 10 && <li>… và {batchResult.problems.length - 10} trường hợp khác</li>}
            </ul>
          ) : (
            "Hoàn tất."
          )}
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard loading={loadingAll} icon="users" tone="amber" label="Chưa có ca" value={eligible.length} hint="Hồ sơ đã nộp đủ điều kiện" />
        <StatCard loading={loadingAll} icon="calendar" tone="cyan" label="Chỗ trống" value={capacityLeft} hint={`${openSlots.length} ca sắp diễn ra đã chốt đề`} />
        <StatCard loading={loadingAll} icon="checkCircle" tone="green" label="Đã xếp ca" value={list.data.length} />
        <StatCard loading={loadingAll} icon="mail" tone="violet" label="Chưa kích hoạt" value={list.data.filter((a) => regById.get(a.candidateId)?.accountStatus !== "ACTIVE").length} hint="Trong số thí sinh đã xếp ca" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel icon="users" title="Thao tác hàng loạt" description="Mỗi thao tác hiển thị số lượng ảnh hưởng để xác nhận trước khi chạy.">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-adm-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-adm-text">Tự động xếp ca</p>
              <p className="text-[13px] text-adm-sub">Xếp hồ sơ chưa có ca vào ca sắp diễn ra còn nhiều chỗ nhất.</p>
            </div>
            <Button variant="secondary" disabled={op.busy || loadingAll || !eligible.length || !capacityLeft} onClick={() => void autoAssign()}>
              Xếp ca…
            </Button>
          </div>
          <div className="space-y-3 rounded-lg border border-adm-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-adm-text">Gửi email mời thi</p>
              <p className="text-[13px] text-adm-sub">Chỉ gửi cho thí sinh chưa kích hoạt tài khoản; người đã kích hoạt không nhận lại.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select className={`${inputClass} min-w-0 flex-1`} value={inviteSchedule} onChange={(e) => setInviteSchedule(e.target.value)} aria-label="Gửi email mời thi cho ca">
                <option value="">Tất cả các ca</option>
                {schedules.data.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {viTime(s.opensAt)}
                  </option>
                ))}
              </select>
              <Button variant="secondary" disabled={op.busy || loadingAll || !inviteTargets.length} onClick={() => void invite()}>
                Gửi email…
              </Button>
            </div>
          </div>
        </Panel>

        <Panel icon="settings" tone="slate" title="Xếp ca thủ công">
          <div role="radiogroup" aria-label="Loại thao tác" className="inline-flex rounded-lg border border-adm-border bg-adm-bg p-0.5">
            {(
              [
                ["assign", "Gán ca mới"],
                ["move", "Đổi ca"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={mode === v}
                onClick={() => {
                  setMode(v);
                  setManual({ candidateId: "", scheduleId: "", reason: "" });
                  setManualSubmitted(false);
                }}
                className={`h-8 rounded-md px-3 text-[13px] font-medium transition ${mode === v ? "bg-white text-adm-text shadow-sm" : "text-adm-sub hover:text-adm-text"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={saveManual} noValidate className="grid gap-4 sm:grid-cols-2">
            <Field label="Thí sinh" required error={manualSubmitted ? manualErrors.candidateId : undefined} hint={mode === "move" ? "Chỉ thí sinh chưa bắt đầu làm bài" : "Hồ sơ đã nộp, chưa có ca"}>
              <select className={inputClass} value={manual.candidateId} aria-invalid={manualSubmitted && !!manualErrors.candidateId} onChange={(e) => setManual({ ...manual, candidateId: e.target.value, scheduleId: "" })}>
                <option value="">Chọn thí sinh</option>
                {mode === "assign"
                  ? eligible.map((c) => (
                      <option value={c.id} key={c.id}>
                        {c.candidateCode} · {c.fullName}
                      </option>
                    ))
                  : movable.map((a) => (
                      <option value={a.candidateId} key={a.id}>
                        {a.candidateCode} · {a.fullName} ({a.scheduleName})
                      </option>
                    ))}
              </select>
            </Field>
            <Field label={mode === "move" ? "Chuyển sang ca" : "Ca thi"} required error={manualSubmitted ? manualErrors.scheduleId : undefined}>
              <select className={inputClass} value={manual.scheduleId} aria-invalid={manualSubmitted && !!manualErrors.scheduleId} onChange={(e) => setManual({ ...manual, scheduleId: e.target.value })}>
                <option value="">Chọn ca</option>
                {schedules.data
                  .filter((s) => s.id !== current?.scheduleId)
                  .map((s) => (
                    <option key={s.id} value={s.id} disabled={Number(s.assigned) >= s.capacity || !s.blueprintId}>
                      {s.name} · {s.assigned}/{s.capacity}
                      {!s.blueprintId ? " · chưa có đề" : Number(s.assigned) >= s.capacity ? " · đã đầy" : ""}
                    </option>
                  ))}
              </select>
            </Field>
            {mode === "move" && (
              <div className="sm:col-span-2">
                <Field label="Lý do đổi ca" required error={manualSubmitted ? manualErrors.reason : undefined}>
                  <input className={inputClass} value={manual.reason} aria-invalid={manualSubmitted && !!manualErrors.reason} onChange={(e) => setManual({ ...manual, reason: e.target.value })} maxLength={500} placeholder="VD: Trùng lịch học, thí sinh xin đổi" />
                </Field>
              </div>
            )}
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" loading={op.busy}>
                {mode === "move" ? "Đổi ca" : "Gán ca"}
              </Button>
            </div>
          </form>
        </Panel>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[17px] font-semibold text-adm-text">Thí sinh đã xếp ca</h2>
          <span className="flex-1" />
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Tìm theo mã, họ tên" className="w-full sm:w-64" />
          <select className={`${inputClass} sm:!w-52`} value={scheduleFilter} onChange={(e) => { setScheduleFilter(e.target.value); setPage(1); }} aria-label="Lọc theo ca">
            <option value="">Tất cả ca</option>
            {schedules.data.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {list.error ? (
          <Notice message={`Không tải được danh sách: ${list.error}`} error onRetry={list.reload} />
        ) : (
          <Table
            loading={list.loading}
            headers={["Mã thí sinh", "Họ tên", "Ca thi", "Tài khoản", "Trạng thái thi", ""]}
            empty={search || scheduleFilter ? { icon: "search", title: "Không có thí sinh phù hợp" } : { icon: "calendar", title: "Chưa xếp ca cho thí sinh nào", description: "Dùng Tự động xếp ca hoặc Xếp ca thủ công ở trên." }}
            rows={filtered.slice((page - 1) * pageSize, page * pageSize).map((a) => [
              <span key="c" className="font-mono text-[13px] font-medium whitespace-nowrap">
                {a.candidateCode}
              </span>,
              <span key="n" className="font-medium">
                {a.fullName}
              </span>,
              <span key="s" className="text-[13px]">
                {a.scheduleName}
              </span>,
              regById.get(a.candidateId)?.accountStatus === "ACTIVE" ? status.active : status.pendingActivation,
              statusPill(a.status),
              <div key="h" className="text-right">
                <Button size="sm" variant="ghost" onClick={() => void openHistory(a)}>
                  Lịch sử
                </Button>
              </div>,
            ])}
            footer={filtered.length > 0 && <Pagination page={page} pageSize={pageSize} total={filtered.length} label="thí sinh" onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
          />
        )}
      </section>

      <Drawer open={!!historyFor} onClose={() => setHistoryFor(null)} title="Lịch sử đổi ca" subtitle={historyFor ? `${historyFor.candidateCode} · ${historyFor.fullName}` : undefined}>
        {history.loading ? (
          <p className="text-sm text-adm-sub">Đang tải…</p>
        ) : history.error ? (
          <Notice message={history.error} error onRetry={() => historyFor && void openHistory(historyFor)} />
        ) : history.rows.length ? (
          <ol className="space-y-4 border-l border-adm-border pl-4">
            {history.rows.map((h) => (
              <li key={h.changed_at}>
                <p className="text-xs text-adm-sub tabular-nums">{viTime(h.changed_at)}</p>
                <p className="text-sm text-adm-text">
                  {scheduleName(h.old_schedule_id)} → <strong>{scheduleName(h.new_schedule_id)}</strong>
                </p>
                <p className="text-[13px] text-adm-sub">{h.reason}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-adm-sub">Thí sinh chưa đổi ca lần nào. Ca hiện tại: {historyFor?.scheduleName}.</p>
        )}
      </Drawer>
    </div>
  );
}

/* ───────── Phòng giám sát ───────── */

export function Monitor() {
  const [search, setSearch] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const list = useResource<AssignmentItem[]>("admin/monitor", []);
  const boardRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);

  // Tự làm mới mỗi 5 giây khi tab đang hiển thị; bảng giữ dữ liệu cũ trong lúc tải để không nhấp nháy
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void list.reload();
    }, 5000);
    return () => clearInterval(id);
  }, [list.reload]);
  useEffect(() => {
    const on = () => setFull(document.fullscreenElement === boardRef.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const schedules = useMemo(() => [...new Map(list.data.map((a) => [a.scheduleId, a.scheduleName])).entries()], [list.data]);
  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return list.data.filter(
      (a) => (!scheduleFilter || a.scheduleId === scheduleFilter) && (!statusFilter || a.status === statusFilter) && (!needle || a.candidateCode.toLowerCase().includes(needle) || a.fullName.toLowerCase().includes(needle)),
    );
  }, [list.data, debouncedSearch, scheduleFilter, statusFilter]);
  const count = (st: string) => list.data.filter((a) => a.status === st).length;
  const firstLoad = list.loading && !list.updatedAt;
  const offline = !!list.error;

  return (
    <div ref={boardRef} className="space-y-6 [&:fullscreen]:overflow-auto [&:fullscreen]:bg-adm-bg [&:fullscreen]:p-8">
      <PageHeader
        title="Phòng giám sát"
        icon="video"
        tone="green"
        description="Trạng thái bài thi Vòng 1 theo dữ liệu đã lưu trên máy chủ."
        actions={
          <>
            <Button variant="secondary" icon="refresh" disabled={list.loading} onClick={() => void list.reload()}>
              Làm mới
            </Button>
            <Button variant="secondary" icon="maximize" onClick={() => (full ? void document.exitFullscreen() : void boardRef.current?.requestFullscreen?.())}>
              {full ? "Thoát toàn màn hình" : "Toàn màn hình"}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-adm-border bg-white px-4 py-2.5 text-[13px] text-adm-sub" role="status" aria-live="polite">
        <span className="flex items-center gap-2 font-medium text-adm-text">
          <span className={`h-2 w-2 rounded-full ${offline ? "bg-adm-error" : "bg-adm-success"}`} aria-hidden />
          {offline ? "Mất kết nối" : "Đã kết nối"}
        </span>
        <span>Tự động làm mới mỗi 5 giây</span>
        <span className="tabular-nums">Cập nhật lần cuối: {clock(list.updatedAt)}</span>
        <span>Giờ Việt Nam (UTC+7)</span>
      </div>
      {offline && list.updatedAt && (
        <Callout tone="warning" title="Không tải được dữ liệu mới" action={<Button size="sm" variant="secondary" onClick={() => void list.reload()}>Thử lại</Button>}>
          Đang hiển thị dữ liệu lúc {clock(list.updatedAt)}. Hệ thống tiếp tục thử lại mỗi 5 giây. ({list.error})
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard loading={firstLoad} icon="users" tone="blue" label="Đã xếp ca" value={list.data.length} />
        <StatCard loading={firstLoad} icon="clock" tone="green" label="Đang làm bài" value={count("IN_PROGRESS")} />
        <StatCard loading={firstLoad} icon="calendar" tone="amber" label="Chưa vào thi" value={count("NOT_STARTED")} />
        <StatCard loading={firstLoad} icon="checkCircle" tone="violet" label="Đã nộp bài" value={count("SUBMITTED")} />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder="Tìm theo mã, họ tên" />
          <select className={`${inputClass} sm:!w-52`} value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)} aria-label="Lọc theo ca">
            <option value="">Tất cả ca</option>
            {schedules.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select className={`${inputClass} sm:!w-44`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Lọc theo trạng thái">
            <option value="">Mọi trạng thái</option>
            {Object.entries(statusLabel).map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {offline && !list.updatedAt ? (
          <Notice message={`Không tải được dữ liệu giám sát: ${list.error}`} error onRetry={list.reload} />
        ) : (
          <Table
            loading={firstLoad}
            numeric={[4]}
            headers={["Mã thí sinh", "Họ tên", "Ca thi", "Trạng thái", "Đã trả lời", "Bắt đầu", "Nộp lúc"]}
            empty={search || scheduleFilter || statusFilter ? { icon: "search", title: "Không có thí sinh phù hợp bộ lọc" } : { icon: "monitor", title: "Chưa có thí sinh được xếp ca", description: "Danh sách hiển thị khi có thí sinh trong các ca Vòng 1." }}
            rows={filtered.map((a) => [
              <span key="c" className="font-mono text-[13px] font-medium whitespace-nowrap">
                {a.candidateCode}
              </span>,
              <span key="n" className="font-medium">
                {a.fullName}
              </span>,
              <span key="s" className="text-[13px]">
                {a.scheduleName}
              </span>,
              statusPill(a.status),
              a.answered,
              <span key="st" className="whitespace-nowrap tabular-nums">
                {viTime(a.startedAt)}
              </span>,
              <span key="f" className="whitespace-nowrap tabular-nums">
                {viTime(a.finalizedAt)}
              </span>,
            ])}
          />
        )}
      </section>
    </div>
  );
}

/* ───────── Bảng điểm Vòng 1 ───────── */

export function Round1() {
  const config = useResource<Configuration>("admin/configuration", emptyConfig),
    [competition, setCompetition] = useState(""),
    [search, setSearch] = useState(""),
    [onlyTop, setOnlyTop] = useState(false),
    op = useOperations();
  const debouncedSearch = useDebounce(search, 300);
  const selected = competition || config.data.competitions[0]?.id || "";
  const list = useResource<AssignmentItem[]>(`admin/results/round-1?competitionId=${selected}`, []);
  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return list.data.filter(
      (a) => (!onlyTop || a.top40 || a.tieAtCutoff) && (!needle || a.candidateCode.toLowerCase().includes(needle) || a.fullName.toLowerCase().includes(needle) || a.scheduleName.toLowerCase().includes(needle)),
    );
  }, [list.data, debouncedSearch, onlyTop]);
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(50);
  const scored = list.data.filter((a) => a.points !== null);
  const top = list.data.filter((a) => a.top40).length;
  const ties = list.data.filter((a) => a.tieAtCutoff).length;
  const best = scored.length ? Math.max(...scored.map((a) => Number(a.points))) : null;
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điểm Vòng 1"
        icon="chart"
        description="Điểm cao nhất của các lượt đã chấm. Đồng điểm giữ cùng hạng; đồng điểm tại ngưỡng Top 40 cần Ban Tổ chức xét thêm."
        actions={
          <>
            {config.data.competitions.length > 1 && (
              <select className={`${inputClass} !w-60`} value={selected} onChange={(e) => setCompetition(e.target.value)} aria-label="Cuộc thi">
                {config.data.competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <Button variant="secondary" icon="download" disabled={op.busy || !selected || list.loading} onClick={() => void op.run(() => downloadAdmin(`results/round-1/export?competitionId=${selected}`, "round-1.xlsx"), "Đã xuất bảng điểm.")}>
              Xuất Excel
            </Button>
          </>
        }
      />
      <Notice message={op.error || config.error} error />
      <Notice message={op.message} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard loading={list.loading && !list.updatedAt} icon="users" tone="blue" label="Thí sinh" value={list.data.length.toLocaleString("vi-VN")} />
        <StatCard loading={list.loading && !list.updatedAt} icon="fileCheck" tone="green" label="Đã có điểm" value={scored.length.toLocaleString("vi-VN")} />
        <StatCard loading={list.loading && !list.updatedAt} icon="trophy" tone="amber" label="Top 40" value={top} hint={ties ? `${ties} thí sinh đồng điểm ở ngưỡng` : undefined} />
        <StatCard loading={list.loading && !list.updatedAt} icon="bars" tone="violet" label="Điểm cao nhất" value={best ?? "—"} hint={scored[0]?.maxPoints ? `Thang ${scored[0].maxPoints}` : undefined} />
      </div>
      {ties > 0 && (
        <Callout tone="warning" title={`${ties} thí sinh đồng điểm tại ngưỡng Top 40`}>
          Hệ thống không tự loại; Ban Tổ chức cần quyết định danh sách vào Vòng 2.
        </Callout>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Tìm theo mã, họ tên, ca" />
          <label className="flex h-10 items-center gap-2 rounded-lg border border-adm-border bg-white px-3 text-[13px] text-adm-text">
            <input type="checkbox" checked={onlyTop} onChange={(e) => { setOnlyTop(e.target.checked); setPage(1); }} className="h-4 w-4 accent-adm-primary" />
            Chỉ Top 40
          </label>
        </div>
        {list.error ? (
          <Notice message={`Không tải được bảng điểm: ${list.error}`} error onRetry={list.reload} />
        ) : (
          <Table
            loading={list.loading}
            numeric={[0, 5]}
            headers={["Hạng", "Mã thí sinh", "Họ tên", "Ca thi", "Trạng thái", "Điểm", "Top 40"]}
            rowClass={(i) => (rows[i]?.top40 ? "bg-[#F5B82E]/[0.07] hover:bg-[#F5B82E]/[0.12]" : "")}
            empty={search || onlyTop ? { icon: "search", title: "Không có thí sinh phù hợp" } : { icon: "chart", title: "Chưa có điểm", description: "Bảng xếp hạng hiển thị khi thí sinh nộp bài Vòng 1." }}
            rows={rows.map((a) => [
              <span key="r" className="font-medium text-adm-text">
                {a.rank ?? "—"}
              </span>,
              <span key="c" className="font-mono text-[13px] font-medium whitespace-nowrap">
                {a.candidateCode}
              </span>,
              <span key="n" className="font-medium">
                {a.fullName}
              </span>,
              <span key="s" className="text-[13px]">
                {a.scheduleName}
              </span>,
              a.points === null ? <Pill key="st" tone="slate">Chưa có điểm</Pill> : status.graded,
              <span key="p" className="font-semibold text-adm-text">
                {a.points === null ? "—" : a.points}
                {a.points !== null && <span className="font-normal text-adm-muted">/{a.maxPoints}</span>}
              </span>,
              a.tieAtCutoff ? (
                <Pill key="t" tone="amber">Đồng điểm — cần xét</Pill>
              ) : a.top40 ? (
                <span key="t" className="text-[13px] font-semibold text-[#A16207]">Top 40</span>
              ) : (
                <span key="t" className="text-adm-muted">—</span>
              ),
            ])}
            footer={filtered.length > 0 && <Pagination page={page} pageSize={pageSize} total={filtered.length} label="thí sinh" onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
          />
        )}
      </section>
    </div>
  );
}
