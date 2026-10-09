"use client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { adminApi, AssignmentItem, Configuration, downloadAdmin, RegistrationItem, ScheduleItem, viTime } from "@/lib/admin/api";
import { Button, emptyConfig, Field, inputClass, Notice, Panel, Table, useOperations, useResource } from "./common";
import { Callout, Drawer, Icon, PageHeader, Pagination, Pill, StatCard, status, useConfirm } from "@/components/admin/ui/kit";
import { useDebounce } from "@/hooks/useDebounce";
import { tr } from "@/lib/i18n/tr";

const statusPill = (st: string) => (st === "IN_PROGRESS" ? status.inProgress : st === "SUBMITTED" ? status.completed : status.notStarted);
const statusLabel: Record<string, string> = { NOT_STARTED: "Chưa vào thi", IN_PROGRESS: "Đang làm bài", SUBMITTED: "Đã nộp bài" };
const clock = (d: Date | null) => (d ? d.toLocaleTimeString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false }) : "—");
const slotPill = (s: ScheduleItem) => {
  const now = Date.now();
  return now < new Date(s.opensAt).getTime() ? <Pill tone="blue">{tr("Sắp diễn ra")}</Pill> : now <= new Date(s.closesAt).getTime() ? <Pill tone="green">{tr("Đang mở")}</Pill> : <Pill tone="slate">{tr("Đã đóng")}</Pill>;
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
  if (!f.competitionId) e.competitionId = tr("Chọn cuộc thi");
  if (!f.name.trim()) e.name = tr("Nhập tên ca");
  const o = vnDate(f.opensAt),
    c = vnDate(f.closesAt);
  const dur = Number(f.durationMinutes);
  if (!o) e.opensAt = tr("Chọn giờ mở ca");
  if (!c) e.closesAt = tr("Chọn giờ đóng ca");
  else if (o && c <= o) e.closesAt = tr("Giờ đóng phải sau giờ mở");
  if (!Number.isInteger(dur) || dur < 1 || dur > 240) e.durationMinutes = tr("Từ 1 đến 240 phút");
  else if (o && c && c > o && c.getTime() - o.getTime() < dur * 60_000) e.durationMinutes = tr("Khung giờ ca ngắn hơn thời lượng làm bài");
  const cap = Number(f.capacity);
  if (!Number.isInteger(cap) || cap < 1 || cap > 100000) e.capacity = tr("Từ 1 đến 100.000");
  if (!f.poolId) e.poolId = tr("Chọn nhóm câu hỏi");
  const q = Number(f.questionCount);
  if (!Number.isInteger(q) || q < 1 || q > 500) e.questionCount = tr("Từ 1 đến 500 câu");
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
    }, tr("Đã tạo ca thi và chốt đề."));
  }

  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return needle ? list.data.filter((s) => s.name.toLowerCase().includes(needle)) : list.data;
  }, [list.data, debouncedSearch]);
  const compName = (id: string) => config.data.competitions.find((c) => c.id === id)?.name ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr("Lịch thi & ca thi")}
        icon="calendar"
        tone="cyan"
        description={tr("Ca thi Vòng 1: khung giờ mở/đóng theo giờ Việt Nam (UTC+7), thời lượng làm bài, sức chứa và đề được chốt từ một nhóm câu hỏi.")}
        actions={
          !formOpen && (
            <Button icon="plus" onClick={openForm}>
              {tr("Tạo ca thi")}</Button>
          )
        }
      />
      <Notice message={op.error || config.error} error />
      <Notice message={op.message} />

      {formOpen && (
        <div ref={formRef}>
          <Panel icon="plus" title={tr("Tạo ca thi mới")} description={tr("Đề thi được chốt ngay khi tạo ca. Nhóm câu hỏi cần có đủ số câu.")}>
            <form onSubmit={create} noValidate className="space-y-6">
              <fieldset className="grid gap-4 md:grid-cols-2">
                <legend className="mb-3 text-[13px] font-semibold text-adm-sub">{tr("Thông tin ca")}</legend>
                <Field label={tr("Cuộc thi")} required error={err("competitionId")}>
                  <select {...bind("competitionId")}>
                    <option value="">{tr("Chọn cuộc thi")}</option>
                    {config.data.competitions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={tr("Tên ca")} required error={err("name")}>
                  <input {...bind("name")} maxLength={200} placeholder={tr("VD: Ca 1 – Sáng 07/11")} />
                </Field>
              </fieldset>
              <fieldset className="grid gap-4 border-t border-adm-border pt-5 md:grid-cols-2">
                <legend className="mb-3 pt-5 text-[13px] font-semibold text-adm-sub">{tr("Thời gian · giờ Việt Nam (UTC+7)")}</legend>
                <Field label={tr("Mở ca")} required error={err("opensAt")}>
                  <input type="datetime-local" {...bind("opensAt")} />
                </Field>
                <Field label={tr("Đóng ca")} required error={err("closesAt")}>
                  <input type="datetime-local" {...bind("closesAt")} />
                </Field>
                <Field label={tr("Thời lượng làm bài (phút)")} required error={err("durationMinutes")} hint={tr("1–240 phút, không dài hơn khung giờ ca")}>
                  <input type="number" inputMode="numeric" min={1} max={240} {...bind("durationMinutes")} />
                </Field>
              </fieldset>
              <fieldset className="grid gap-4 border-t border-adm-border pt-5 md:grid-cols-2">
                <legend className="mb-3 pt-5 text-[13px] font-semibold text-adm-sub">{tr("Đề thi & sức chứa")}</legend>
                <Field label={tr("Nhóm câu hỏi")} required error={err("poolId")}>
                  <select {...bind("poolId")}>
                    <option value="">{tr("Chọn nhóm")}</option>
                    {config.data.pools.map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={tr("Số câu trong đề")} required error={err("questionCount")} hint={tr("1–500 câu")}>
                  <input type="number" inputMode="numeric" min={1} max={500} {...bind("questionCount")} />
                </Field>
                <Field label={tr("Số thí sinh tối đa")} required error={err("capacity")} hint="1–100.000">
                  <input type="number" inputMode="numeric" min={1} max={100000} {...bind("capacity")} />
                </Field>
              </fieldset>
              <div className="flex justify-end gap-2 border-t border-adm-border pt-5">
                <Button variant="ghost" onClick={() => setFormOpen(false)}>
                  {tr("Huỷ")}</Button>
                <Button type="submit" loading={op.busy} disabled={config.loading}>
                  {tr("Tạo ca thi")}</Button>
              </div>
            </form>
          </Panel>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[17px] font-semibold text-adm-text">{tr("Danh sách ca thi")}</h2>
          <span className="text-[13px] text-adm-sub tabular-nums">{list.data.length} ca</span>
          <span className="flex-1" />
          <SearchBox value={search} onChange={setSearch} placeholder={tr("Tìm theo tên ca")} className="w-full sm:w-64" />
        </div>
        {list.error ? (
          <Notice message={tr("Không tải được ca thi: {0}", list.error)} error onRetry={list.reload} />
        ) : (
          <Table
            loading={list.loading}
            numeric={[4, 5]}
            headers={[tr("Ca thi"), tr("Mở ca"), tr("Đóng ca"), tr("Trạng thái"), tr("Thời lượng"), tr("Đã xếp / Sức chứa"), tr("Đề thi")]}
            empty={
              search
                ? { icon: "search", title: tr("Không có ca phù hợp") }
                : { icon: "calendar", title: tr("Chưa có ca thi"), description: tr("Tạo ca thi đầu tiên để bắt đầu xếp thí sinh."), action: <Button icon="plus" onClick={openForm}>{tr("Tạo ca thi")}</Button> }
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
                tr("{0} phút", s.durationSeconds / 60),
                <span key="cap" className={full ? "font-medium text-adm-error" : ""}>
                  {s.assigned}/{s.capacity}
                </span>,
                s.blueprintId ? <Pill key="b" tone="green">{tr("Đã chốt đề")}</Pill> : <Pill key="b" tone="red">{tr("Chưa có đề")}</Pill>,
              ];
            })}
          />
        )}
        <p className="text-xs text-adm-muted">{tr("Ca thi chưa hỗ trợ sửa hoặc xoá. Cần thay đổi, hãy tạo ca mới và đổi ca cho thí sinh ở trang Phân ca.")}</p>
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
      title: tr("Tự động xếp ca"),
      description: (
        <ul className="space-y-1">
          <li>
            {tr("Hồ sơ đủ điều kiện chưa có ca:")}{" "}<strong className="text-adm-text tabular-nums">{eligible.length}</strong>
          </li>
          <li>
            {tr("Chỗ trống ở")}{" "}{openSlots.length} {" "}{tr("ca sắp diễn ra:")}{" "}<strong className="text-adm-text tabular-nums">{capacityLeft}</strong>
          </li>
          <li>
            {tr("Dự kiến xếp:")}{" "}<strong className="text-adm-text tabular-nums">{willAssign}</strong> {" "}{tr("thí sinh, ưu tiên ca còn nhiều chỗ nhất.")}</li>
          {eligible.length > capacityLeft && <li className="text-adm-warning">{eligible.length - capacityLeft} {" "}{tr("thí sinh sẽ chưa có ca — cần thêm ca hoặc tăng sức chứa.")}</li>}
        </ul>
      ),
      confirmText: tr("Xếp {0} thí sinh", willAssign),
    });
    if (!r.ok) return;
    setBatchResult(null);
    void op.run(async () => {
      const res = await adminApi<{ assigned: number; skipped: number; waiting: number }>("admin/assignments/auto", { method: "POST", body: JSON.stringify({}) });
      setBatchResult({
        text:
          tr("Đã xếp {0} thí sinh vào ca.", res.assigned) +
          (res.waiting ? tr(" Còn {0} thí sinh chưa xếp được vì các ca đã đầy.", res.waiting) : "") +
          (res.skipped ? tr(" Bỏ qua {0} thí sinh (tài khoản bị khoá/xoá hoặc email trùng).", res.skipped) : ""),
      });
      await reload();
    }, "");
  }

  async function invite() {
    const target = schedules.data.find((s) => s.id === inviteSchedule);
    const r = await confirm({
      title: tr("Gửi email mời thi"),
      description: (
        <>
          <p>
            {tr("Gửi email cho")}{" "}<strong className="text-adm-text tabular-nums">{inviteTargets.length}</strong> {" "}{tr("thí sinh chưa kích hoạt tài khoản ở")}{" "}{target ? <strong className="text-adm-text">{target.name}</strong> : tr("tất cả các ca")}.
          </p>
          <p className="mt-2">{tr("Email gồm mã thí sinh, giờ thi và link kích hoạt tài khoản. Đây là email thật gửi tới thí sinh.")}</p>
        </>
      ),
      confirmText: tr("Gửi {0} email", inviteTargets.length),
    });
    if (!r.ok) return;
    setBatchResult(null);
    void op.run(async () => {
      const res = await adminApi<{ invited: number; alreadyActive: number; problems: { candidateCode: string | null; message: string }[] }>("admin/invitations", {
        method: "POST",
        body: JSON.stringify(inviteSchedule ? { scheduleId: inviteSchedule } : {}),
      });
      setBatchResult({
        text: tr("Đã gửi {0} email mời thi.", res.invited) + (res.alreadyActive ? tr(" {0} thí sinh đã kích hoạt nên không gửi lại.", res.alreadyActive) : ""),
        problems: res.problems.map((p) => `${p.candidateCode ?? "?"}: ${p.message}`),
      });
      await candidates.reload();
    }, "");
  }

  const current = mode === "move" ? byCandidate.get(manual.candidateId) : undefined;
  const manualErrors = {
    candidateId: manual.candidateId ? "" : tr("Chọn thí sinh"),
    scheduleId: manual.scheduleId ? "" : tr("Chọn ca thi"),
    reason: mode === "move" && !manual.reason.trim() ? tr("Nhập lý do đổi ca") : "",
  };
  async function saveManual(e: FormEvent) {
    e.preventDefault();
    setManualSubmitted(true);
    if (Object.values(manualErrors).some(Boolean)) return;
    const reg = regById.get(manual.candidateId);
    const to = schedules.data.find((s) => s.id === manual.scheduleId);
    if (mode === "move") {
      const r = await confirm({ title: tr("Đổi ca thi"), description: tr("{0}: {1} → {2}. Lý do được lưu vào lịch sử đổi ca.", reg?.fullName, current?.scheduleName, to?.name), confirmText: tr("Đổi ca") });
      if (!r.ok) return;
    }
    void op.run(async () => {
      await adminApi("admin/assignments", { method: "POST", body: JSON.stringify({ candidateId: manual.candidateId, scheduleId: manual.scheduleId, reason: manual.reason.trim() || undefined }) });
      setManual({ candidateId: "", scheduleId: "", reason: "" });
      setManualSubmitted(false);
      await reload();
    }, mode === "move" ? tr("Đã đổi ca cho {0}.", reg?.fullName) : tr("Đã xếp {0} vào {1}.", reg?.fullName, to?.name));
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
      <PageHeader icon="clipboard" title={tr("Phân ca thí sinh")} description={tr("Xếp thí sinh đã nộp hồ sơ vào ca thi Vòng 1, đổi ca khi cần và gửi email mời thi.")} />
      <Notice message={op.error || schedules.error || candidates.error} error onRetry={op.error ? undefined : () => void reload()} />
      <Notice message={op.message} />
      {batchResult && (
        <Callout tone={batchResult.problems?.length ? "warning" : "info"} title={batchResult.text} action={<Button size="sm" variant="ghost" onClick={() => setBatchResult(null)}>{tr("Ẩn")}</Button>}>
          {batchResult.problems?.length ? (
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {batchResult.problems.slice(0, 10).map((p) => (
                <li key={p}>{p}</li>
              ))}
              {batchResult.problems.length > 10 && <li>{tr("… và")}{" "}{batchResult.problems.length - 10} {" "}{tr("trường hợp khác")}</li>}
            </ul>
          ) : (
            tr("Hoàn tất.")
          )}
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard loading={loadingAll} icon="users" tone="amber" label={tr("Chưa có ca")} value={eligible.length} hint={tr("Hồ sơ đã nộp đủ điều kiện")} />
        <StatCard loading={loadingAll} icon="calendar" tone="cyan" label={tr("Chỗ trống")} value={capacityLeft} hint={tr("{0} ca sắp diễn ra đã chốt đề", openSlots.length)} />
        <StatCard loading={loadingAll} icon="checkCircle" tone="green" label={tr("Đã xếp ca")} value={list.data.length} />
        <StatCard loading={loadingAll} icon="mail" tone="violet" label={tr("Chưa kích hoạt")} value={list.data.filter((a) => regById.get(a.candidateId)?.accountStatus !== "ACTIVE").length} hint={tr("Trong số thí sinh đã xếp ca")} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel icon="users" title={tr("Thao tác hàng loạt")} description={tr("Mỗi thao tác hiển thị số lượng ảnh hưởng để xác nhận trước khi chạy.")}>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-adm-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-adm-text">{tr("Tự động xếp ca")}</p>
              <p className="text-[13px] text-adm-sub">{tr("Xếp hồ sơ chưa có ca vào ca sắp diễn ra còn nhiều chỗ nhất.")}</p>
            </div>
            <Button variant="secondary" disabled={op.busy || loadingAll || !eligible.length || !capacityLeft} onClick={() => void autoAssign()}>
              {tr("Xếp ca…")}</Button>
          </div>
          <div className="space-y-3 rounded-lg border border-adm-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-adm-text">{tr("Gửi email mời thi")}</p>
              <p className="text-[13px] text-adm-sub">{tr("Chỉ gửi cho thí sinh chưa kích hoạt tài khoản; người đã kích hoạt không nhận lại.")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select className={`${inputClass} min-w-0 flex-1`} value={inviteSchedule} onChange={(e) => setInviteSchedule(e.target.value)} aria-label={tr("Gửi email mời thi cho ca")}>
                <option value="">{tr("Tất cả các ca")}</option>
                {schedules.data.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {viTime(s.opensAt)}
                  </option>
                ))}
              </select>
              <Button variant="secondary" disabled={op.busy || loadingAll || !inviteTargets.length} onClick={() => void invite()}>
                {tr("Gửi email…")}</Button>
            </div>
          </div>
        </Panel>

        <Panel icon="settings" tone="slate" title={tr("Xếp ca thủ công")}>
          <div role="radiogroup" aria-label={tr("Loại thao tác")} className="inline-flex rounded-lg border border-adm-border bg-adm-bg p-0.5">
            {(
              [
                ["assign", tr("Gán ca mới")],
                ["move", tr("Đổi ca")],
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
            <Field label={tr("Thí sinh")} required error={manualSubmitted ? manualErrors.candidateId : undefined} hint={mode === "move" ? tr("Chỉ thí sinh chưa bắt đầu làm bài") : tr("Hồ sơ đã nộp, chưa có ca")}>
              <select className={inputClass} value={manual.candidateId} aria-invalid={manualSubmitted && !!manualErrors.candidateId} onChange={(e) => setManual({ ...manual, candidateId: e.target.value, scheduleId: "" })}>
                <option value="">{tr("Chọn thí sinh")}</option>
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
            <Field label={mode === "move" ? tr("Chuyển sang ca") : tr("Ca thi")} required error={manualSubmitted ? manualErrors.scheduleId : undefined}>
              <select className={inputClass} value={manual.scheduleId} aria-invalid={manualSubmitted && !!manualErrors.scheduleId} onChange={(e) => setManual({ ...manual, scheduleId: e.target.value })}>
                <option value="">{tr("Chọn ca")}</option>
                {schedules.data
                  .filter((s) => s.id !== current?.scheduleId)
                  .map((s) => (
                    <option key={s.id} value={s.id} disabled={Number(s.assigned) >= s.capacity || !s.blueprintId || new Date(s.closesAt).getTime() <= now}>
                      {s.name} · {viTime(s.opensAt)} · {s.assigned}/{s.capacity}
                      {new Date(s.closesAt).getTime() <= now ? tr(" · đã đóng") : !s.blueprintId ? tr(" · chưa có đề") : Number(s.assigned) >= s.capacity ? tr(" · đã đầy") : ""}
                    </option>
                  ))}
              </select>
            </Field>
            {mode === "move" && (
              <div className="sm:col-span-2">
                <Field label={tr("Lý do đổi ca")} required error={manualSubmitted ? manualErrors.reason : undefined}>
                  <input className={inputClass} value={manual.reason} aria-invalid={manualSubmitted && !!manualErrors.reason} onChange={(e) => setManual({ ...manual, reason: e.target.value })} maxLength={500} placeholder={tr("VD: Trùng lịch học, thí sinh xin đổi")} />
                </Field>
              </div>
            )}
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" loading={op.busy}>
                {mode === "move" ? tr("Đổi ca") : tr("Gán ca")}
              </Button>
            </div>
          </form>
        </Panel>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-[17px] font-semibold text-adm-text">{tr("Thí sinh đã xếp ca")}</h2>
          <span className="flex-1" />
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={tr("Tìm theo mã, họ tên")} className="w-full sm:w-64" />
          <select className={`${inputClass} sm:!w-52`} value={scheduleFilter} onChange={(e) => { setScheduleFilter(e.target.value); setPage(1); }} aria-label={tr("Lọc theo ca")}>
            <option value="">{tr("Tất cả ca")}</option>
            {schedules.data.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {list.error ? (
          <Notice message={tr("Không tải được danh sách: {0}", list.error)} error onRetry={list.reload} />
        ) : (
          <Table
            loading={list.loading}
            headers={[tr("Mã thí sinh"), tr("Họ tên"), tr("Ca thi"), tr("Tài khoản"), tr("Trạng thái thi"), ""]}
            empty={search || scheduleFilter ? { icon: "search", title: tr("Không có thí sinh phù hợp") } : { icon: "calendar", title: tr("Chưa xếp ca cho thí sinh nào"), description: tr("Dùng Tự động xếp ca hoặc Xếp ca thủ công ở trên.") }}
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
                  {tr("Lịch sử")}</Button>
              </div>,
            ])}
            footer={filtered.length > 0 && <Pagination page={page} pageSize={pageSize} total={filtered.length} label={tr("thí sinh")} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
          />
        )}
      </section>

      <Drawer open={!!historyFor} onClose={() => setHistoryFor(null)} title={tr("Lịch sử đổi ca")} subtitle={historyFor ? `${historyFor.candidateCode} · ${historyFor.fullName}` : undefined}>
        {history.loading ? (
          <p className="text-sm text-adm-sub">{tr("Đang tải…")}</p>
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
          <p className="text-sm text-adm-sub">{tr("Thí sinh chưa đổi ca lần nào. Ca hiện tại:")}{" "}{historyFor?.scheduleName}.</p>
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
        title={tr("Phòng giám sát")}
        icon="video"
        tone="green"
        description={tr("Trạng thái bài thi Vòng 1 theo dữ liệu đã lưu trên máy chủ.")}
        actions={
          <>
            <Button variant="secondary" icon="refresh" disabled={list.loading} onClick={() => void list.reload()}>
              {tr("Làm mới")}</Button>
            <Button variant="secondary" icon="maximize" onClick={() => (full ? void document.exitFullscreen() : void boardRef.current?.requestFullscreen?.())}>
              {full ? tr("Thoát toàn màn hình") : tr("Toàn màn hình")}
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-adm-border bg-white px-4 py-2.5 text-[13px] text-adm-sub" role="status" aria-live="polite">
        <span className="flex items-center gap-2 font-medium text-adm-text">
          <span className={`h-2 w-2 rounded-full ${offline ? "bg-adm-error" : "bg-adm-success"}`} aria-hidden />
          {offline ? tr("Mất kết nối") : tr("Đã kết nối")}
        </span>
        <span>{tr("Tự động làm mới mỗi 5 giây")}</span>
        <span className="tabular-nums">{tr("Cập nhật lần cuối:")}{" "}{clock(list.updatedAt)}</span>
        <span>{tr("Giờ Việt Nam (UTC+7)")}</span>
      </div>
      {offline && list.updatedAt && (
        <Callout tone="warning" title={tr("Không tải được dữ liệu mới")} action={<Button size="sm" variant="secondary" onClick={() => void list.reload()}>{tr("Thử lại")}</Button>}>
          {tr("Đang hiển thị dữ liệu lúc")}{" "}{clock(list.updatedAt)}{tr(". Hệ thống tiếp tục thử lại mỗi 5 giây. (")}{list.error})
        </Callout>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard loading={firstLoad} icon="users" tone="blue" label={tr("Đã xếp ca")} value={list.data.length} />
        <StatCard loading={firstLoad} icon="clock" tone="green" label={tr("Đang làm bài")} value={count("IN_PROGRESS")} />
        <StatCard loading={firstLoad} icon="calendar" tone="amber" label={tr("Chưa vào thi")} value={count("NOT_STARTED")} />
        <StatCard loading={firstLoad} icon="checkCircle" tone="violet" label={tr("Đã nộp bài")} value={count("SUBMITTED")} />
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={setSearch} placeholder={tr("Tìm theo mã, họ tên")} />
          <select className={`${inputClass} sm:!w-52`} value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)} aria-label={tr("Lọc theo ca")}>
            <option value="">{tr("Tất cả ca")}</option>
            {schedules.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <select className={`${inputClass} sm:!w-44`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={tr("Lọc theo trạng thái")}>
            <option value="">{tr("Mọi trạng thái")}</option>
            {Object.entries(statusLabel).map(([v, label]) => (
              <option key={v} value={v}>
                {tr(label)}
              </option>
            ))}
          </select>
        </div>
        {offline && !list.updatedAt ? (
          <Notice message={tr("Không tải được dữ liệu giám sát: {0}", list.error)} error onRetry={list.reload} />
        ) : (
          <Table
            loading={firstLoad}
            numeric={[4, 5]}
            headers={[tr("Mã thí sinh"), tr("Họ tên"), tr("Ca thi"), tr("Trạng thái"), tr("Đã trả lời"), tr("Rời trang"), tr("Bắt đầu"), tr("Nộp lúc")]}
            empty={search || scheduleFilter || statusFilter ? { icon: "search", title: tr("Không có thí sinh phù hợp bộ lọc") } : { icon: "monitor", title: tr("Chưa có thí sinh được xếp ca"), description: tr("Danh sách hiển thị khi có thí sinh trong các ca Vòng 1.") }}
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
              Number(a.focusLost ?? 0) > 0 ? (
                <span key="fl" className="font-semibold text-adm-warning" title={tr("Số lần thí sinh chuyển tab hoặc rời trang làm bài")}>
                  {Number(a.focusLost)}
                </span>
              ) : (
                <span key="fl" className="text-adm-muted">0</span>
              ),
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

// Điểm mỗi câu được làm tròn 4 chữ số (vd. 100/15 = 6.6667) nên tổng có thể là 100.0005: hiển thị tối đa 2 chữ số thập phân
const fmtPoints = (n: number | string | null) => (n === null ? "—" : +Number(n).toFixed(2));

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
  // Bảng đã xếp theo tỉ lệ: người đứng đầu là tỉ lệ cao nhất
  const leader = list.data.find((a) => a.rank === 1 && a.points !== null);
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr("Bảng điểm Vòng 1")}
        icon="chart"
        description={tr("Xếp hạng theo tỉ lệ điểm (%) để công bằng giữa các ca có số câu khác nhau. Đồng hạng giữ nguyên; đồng điểm tại ngưỡng Top 40 cần Ban Tổ chức xét thêm.")}
        actions={
          <>
            {config.data.competitions.length > 1 && (
              <select className={`${inputClass} !w-60`} value={selected} onChange={(e) => setCompetition(e.target.value)} aria-label={tr("Cuộc thi")}>
                {config.data.competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
            <Button variant="secondary" icon="download" disabled={op.busy || !selected || list.loading} onClick={() => void op.run(() => downloadAdmin(`results/round-1/export?competitionId=${selected}`, "round-1.xlsx"), tr("Đã xuất bảng điểm."))}>
              {tr("Xuất Excel")}</Button>
          </>
        }
      />
      <Notice message={op.error || config.error} error />
      <Notice message={op.message} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard loading={list.loading && !list.updatedAt} icon="users" tone="blue" label={tr("Thí sinh")} value={list.data.length.toLocaleString("vi-VN")} />
        <StatCard loading={list.loading && !list.updatedAt} icon="fileCheck" tone="green" label={tr("Đã có điểm")} value={scored.length.toLocaleString("vi-VN")} />
        <StatCard loading={list.loading && !list.updatedAt} icon="trophy" tone="amber" label="Top 40" value={top} hint={ties ? tr("{0} thí sinh đồng điểm ở ngưỡng", ties) : undefined} />
        <StatCard loading={list.loading && !list.updatedAt} icon="bars" tone="violet" label={tr("Tỉ lệ cao nhất")} value={leader?.percent != null ? `${+leader.percent.toFixed(2)}%` : "—"} hint={leader ? tr("{0}/{1} điểm", fmtPoints(leader.points), fmtPoints(leader.maxPoints)) : undefined} />
      </div>
      {ties > 0 && (
        <Callout tone="warning" title={tr("{0} thí sinh đồng điểm tại ngưỡng Top 40", ties)}>
          {tr("Hệ thống không tự loại; Ban Tổ chức cần quyết định danh sách vào Vòng 2.")}</Callout>
      )}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={tr("Tìm theo mã, họ tên, ca")} />
          <label className="flex h-10 items-center gap-2 rounded-lg border border-adm-border bg-white px-3 text-[13px] text-adm-text">
            <input type="checkbox" checked={onlyTop} onChange={(e) => { setOnlyTop(e.target.checked); setPage(1); }} className="h-4 w-4 accent-adm-primary" />
            {tr("Chỉ Top 40")}</label>
        </div>
        {list.error ? (
          <Notice message={tr("Không tải được bảng điểm: {0}", list.error)} error onRetry={list.reload} />
        ) : (
          <Table
            loading={list.loading}
            numeric={[0, 5, 6]}
            headers={[tr("Hạng"), tr("Mã thí sinh"), tr("Họ tên"), tr("Ca thi"), tr("Trạng thái"), tr("Điểm"), tr("Tỉ lệ"), "Top 40"]}
            rowClass={(i) => (rows[i]?.top40 ? "bg-[#F5B82E]/[0.07] hover:bg-[#F5B82E]/[0.12]" : "")}
            empty={search || onlyTop ? { icon: "search", title: tr("Không có thí sinh phù hợp") } : { icon: "chart", title: tr("Chưa có điểm"), description: tr("Bảng xếp hạng hiển thị khi thí sinh nộp bài Vòng 1.") }}
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
              a.points === null ? <Pill key="st" tone="slate">{tr("Chưa có điểm")}</Pill> : status.graded,
              <span key="p" className="font-semibold text-adm-text">
                {a.points === null ? "—" : fmtPoints(a.points)}
                {a.points !== null && <span className="font-normal text-adm-muted">/{fmtPoints(a.maxPoints)}</span>}
              </span>,
              <span key="pc" className="text-adm-sub">
                {a.percent == null ? "—" : `${+a.percent.toFixed(2)}%`}
              </span>,
              a.tieAtCutoff ? (
                <Pill key="t" tone="amber">{tr("Đồng điểm — cần xét")}</Pill>
              ) : a.top40 ? (
                <span key="t" className="text-[13px] font-semibold text-[#A16207]">Top 40</span>
              ) : (
                <span key="t" className="text-adm-muted">—</span>
              ),
            ])}
            footer={filtered.length > 0 && <Pagination page={page} pageSize={pageSize} total={filtered.length} label={tr("thí sinh")} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
          />
        )}
      </section>
    </div>
  );
}
