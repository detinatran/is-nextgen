"use client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  adminApi,
  AssignmentItem,
  Configuration,
  downloadAdmin,
  examStatus,
  RegistrationItem,
  ScheduleItem,
  viTime,
} from "@/lib/admin/api";
import {
  Button,
  emptyConfig,
  Field,
  inputClass,
  Notice,
  Panel,
  Table,
  useOperations,
  useResource,
} from "./common";
import AdminButton from "@/components/admin/ui/AdminButton";
import { Callout, Icon, IconTile, IntroBadge, PageIntro, Pagination, Pill, StatCard } from "@/components/admin/ui/kit";

const statusPill = (st: string) =>
  st === "IN_PROGRESS" ? <Pill tone="blue" dot>{examStatus(st)}</Pill> : st === "SUBMITTED" ? <Pill tone="green">{examStatus(st)}</Pill> : <Pill tone="slate">{examStatus(st)}</Pill>;
import { useDebounce } from "@/hooks/useDebounce";

export function Schedules() {
  const list = useResource<ScheduleItem[]>("admin/schedules", []),
    config = useResource<Configuration>("admin/configuration", emptyConfig),
    op = useOperations();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      fields = Object.fromEntries(new FormData(form));
    void op.run(async () => {
      await adminApi("admin/schedules", {
        method: "POST",
        body: JSON.stringify({
          competitionId: fields.competitionId,
          name: fields.name,
          opensAt: new Date(`${fields.opensAt}:00+07:00`).toISOString(),
          closesAt: new Date(`${fields.closesAt}:00+07:00`).toISOString(),
          durationSeconds: Number(fields.durationMinutes) * 60,
          capacity: Number(fields.capacity),
          questionCount: Number(fields.questionCount),
          poolId: fields.poolId,
        }),
      });
      form.reset();
      await list.reload();
    });
  }

  // Filter schedules by search
  const filteredSchedules = useMemo(() => {
    if (!debouncedSearch) return list.data;
    const needle = debouncedSearch.toLowerCase();
    return list.data.filter((s) =>
      s.name.toLowerCase().includes(needle) ||
      s.competitionId.toLowerCase().includes(needle)
    );
  }, [list.data, debouncedSearch]);

  const compName = (id: string) => config.data.competitions.find((c) => c.id === id)?.name ?? "—";
  const slotState = (s: ScheduleItem) => {
    const now = Date.now(), o = new Date(s.opensAt).getTime(), c = new Date(s.closesAt).getTime();
    return now < o ? <Pill tone="blue">Sắp diễn ra</Pill> : now <= c ? <Pill tone="green" dot>Đang mở</Pill> : <Pill tone="slate">Đã đóng</Pill>;
  };

  return (
    <div className="space-y-6">
      <Notice message={op.error || list.error || config.error} error />
      <Notice message={op.message} />
      <PageIntro
        icon="calendar"
        tone="cyan"
        title="Lịch thi & ca thi Vòng 1"
        description="Mỗi ca có giờ mở/đóng (giờ Việt Nam, UTC+7), thời lượng làm bài, sức chứa và đề được chốt từ một nhóm câu hỏi. Cần đủ câu hỏi trong nhóm trước khi tạo ca."
      />
      <Panel title="Tạo ca thi Vòng 1" icon="plus">
        <form onSubmit={create} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Cuộc thi">
            <select required className={inputClass} name="competitionId">
              <option value="">Chọn cuộc thi</option>
              {config.data.competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tên ca">
            <input required name="name" className={inputClass} maxLength={200} placeholder="VD: Ca 1 - Sáng 07/11" />
          </Field>
          <Field label="Mở ca">
            <input required type="datetime-local" name="opensAt" className={inputClass} />
          </Field>
          <Field label="Đóng ca">
            <input required type="datetime-local" name="closesAt" className={inputClass} />
          </Field>
          <Field label="Thời lượng (phút)">
            <input required type="number" min={1} max={240} defaultValue={60} name="durationMinutes" className={inputClass} />
          </Field>
          <Field label="Số thí sinh tối đa">
            <input required type="number" min={1} max={100000} defaultValue={100} name="capacity" className={inputClass} />
          </Field>
          <Field label="Nhóm câu hỏi">
            <select required name="poolId" className={inputClass}>
              <option value="">Chọn nhóm</option>
              {config.data.pools.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Số câu trong đề">
            <input required type="number" min={1} max={500} defaultValue={30} name="questionCount" className={inputClass} />
          </Field>
          <div className="sm:col-span-2 xl:col-span-4">
            <Button type="submit" icon="plus" disabled={op.busy || config.loading}>
              Tạo ca thi
            </Button>
          </div>
        </form>
      </Panel>
      <Panel
        title="Danh sách ca thi"
        icon="calendar"
        tone="cyan"
        description={`${list.data.length} ca thi`}
        actions={
          <>
            <label className="relative w-64">
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={`${inputClass} pl-9`} placeholder="Tìm theo tên ca..." value={search} onChange={(e) => setSearch(e.target.value)} maxLength={200} />
            </label>
            <Button variant="outline" icon="refresh" disabled={op.busy || list.loading} onClick={() => void list.reload()}>
              Làm mới
            </Button>
          </>
        }
      >
        <Table
          headers={["Ca thi", "Cuộc thi", "Mở ca", "Đóng ca", "Thời lượng", "Số thí sinh", "Đề thi", "Trạng thái"]}
          empty={{ icon: "calendar", title: "Chưa có ca thi", description: "Tạo ca thi đầu tiên bằng biểu mẫu phía trên." }}
          rows={filteredSchedules.map((s) => {
            const pct = Math.min(100, Math.round((Number(s.assigned) / Math.max(1, s.capacity)) * 100));
            return [
              <span key="n" className="font-semibold text-[#0B1F4D]">{s.name}</span>,
              <span key="c" className="text-[13px]">{compName(s.competitionId)}</span>,
              <span key="o" className="whitespace-nowrap">{viTime(s.opensAt)}</span>,
              <span key="cl" className="whitespace-nowrap">{viTime(s.closesAt)}</span>,
              `${s.durationSeconds / 60} phút`,
              <div key="cap" className="min-w-28">
                <span className="text-[13px] font-semibold tabular-nums">
                  {s.assigned}/{s.capacity}
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <span className={`block h-full rounded-full ${pct >= 100 ? "bg-rose-500" : "bg-[#1F5BE0]"}`} style={{ width: `${pct}%` }} />
                </span>
              </div>,
              s.blueprintId ? <Pill key="b" tone="green">Đã chốt đề</Pill> : <Pill key="b" tone="amber">Chưa có đề</Pill>,
              slotState(s),
            ];
          })}
        />
      </Panel>
    </div>
  );
}

export function Assignments() {
  const [search, setSearch] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const debouncedScheduleFilter = useDebounce(scheduleFilter, 300);

  const list = useResource<AssignmentItem[]>("admin/assignments", []),
    schedules = useResource<ScheduleItem[]>("admin/schedules", []),
    candidates = useResource<RegistrationItem[]>("admin/registrations", []),
    op = useOperations();
  const [history, setHistory] = useState<
    {
      old_schedule_id: string;
      new_schedule_id: string;
      reason: string;
      changed_at: string;
    }[]
  >([]);
  const [batchResult, setBatchResult] = useState("");
  const [inviteSchedule, setInviteSchedule] = useState("");

  // Xếp ca tự động: hồ sơ đã nộp chưa có ca → ca sắp diễn ra còn nhiều chỗ nhất
  function autoAssign() {
    setBatchResult("");
    void op.run(async () => {
      const r = await adminApi<{ assigned: number; skipped: number; waiting: number }>("admin/assignments/auto", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setBatchResult(
        `Đã xếp ${r.assigned} thí sinh vào ca.` +
          (r.waiting ? ` Còn ${r.waiting} thí sinh chưa xếp được vì các ca đã đầy: hãy thêm ca hoặc tăng sức chứa.` : "") +
          (r.skipped ? ` Bỏ qua ${r.skipped} thí sinh (tài khoản bị khoá/xoá hoặc email trùng).` : ""),
      );
      await Promise.all([list.reload(), schedules.reload(), candidates.reload()]);
    }, "");
  }

  // Email mời thi: ca thi + link kích hoạt tài khoản (thí sinh tự đặt mật khẩu); người đã kích hoạt không nhận lại
  function invite() {
    const target = schedules.data.find((s) => s.id === inviteSchedule);
    if (!window.confirm(`Gửi email mời thi cho thí sinh ${target ? target.name : "tất cả các ca"} chưa kích hoạt tài khoản?`)) return;
    setBatchResult("");
    void op.run(async () => {
      const r = await adminApi<{ invited: number; alreadyActive: number; problems: { candidateCode: string | null; message: string }[] }>(
        "admin/invitations",
        { method: "POST", body: JSON.stringify(inviteSchedule ? { scheduleId: inviteSchedule } : {}) },
      );
      setBatchResult(
        `Đã gửi ${r.invited} email mời thi.` +
          (r.alreadyActive ? ` ${r.alreadyActive} thí sinh đã kích hoạt tài khoản nên không gửi lại.` : "") +
          (r.problems.length ? ` Lỗi ${r.problems.length}: ${r.problems.map((p) => `${p.candidateCode ?? "?"} (${p.message})`).join("; ")}` : ""),
      );
      await candidates.reload();
    }, "");
  }

  // Client-side filtering
  const filteredList = useMemo(() => {
    let data = list.data;
    if (debouncedSearch) {
      const needle = debouncedSearch.toLowerCase();
      data = data.filter((a) =>
        a.candidateCode.toLowerCase().includes(needle) ||
        a.fullName.toLowerCase().includes(needle)
      );
    }
    if (debouncedScheduleFilter) {
      data = data.filter((a) => a.scheduleId === debouncedScheduleFilter);
    }
    return data;
  }, [list.data, debouncedSearch, debouncedScheduleFilter]);

  function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    void op.run(async () => {
      await adminApi("admin/assignments", {
        method: "POST",
        body: JSON.stringify({
          candidateId: fields.candidateId,
          scheduleId: fields.scheduleId,
          reason: fields.reason || undefined,
        }),
      });
      await Promise.all([list.reload(), schedules.reload()]);
    });
  }

  return (
    <div className="space-y-6">
      <Notice message={op.error || list.error || schedules.error || candidates.error} error />
      <Notice message={op.message} />
      <Notice message={batchResult} />
      <Panel
        title="Xếp ca và mời thi hàng loạt"
        icon="users"
        description="Tự động xếp ca cho các thí sinh đã nộp hồ sơ hoặc gán ca thủ công. Có thể gửi email mời thi hàng loạt sau khi xếp ca."
      >
        <div className="flex flex-wrap items-end gap-3">
          <Button icon="filter" disabled={op.busy} onClick={autoAssign}>
            Tự động xếp ca
          </Button>
          <div className="w-full sm:w-64">
            <select className={inputClass} value={inviteSchedule} onChange={(e) => setInviteSchedule(e.target.value)} aria-label="Gửi email mời thi cho">
              <option value="">Tất cả các ca</option>
              {schedules.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {viTime(s.opensAt)}
                </option>
              ))}
            </select>
          </div>
          <Button variant="soft" icon="send" disabled={op.busy || !list.data.length} onClick={invite}>
            Gửi email mời thi
          </Button>
        </div>
        <Callout>
          <strong>Tự động xếp ca:</strong> các hồ sơ đã nộp chưa có ca được xếp vào ca sắp diễn ra còn nhiều chỗ nhất. Email mời thi gồm mã thí sinh, giờ thi và link
          kích hoạt tài khoản; thí sinh tự đặt mật khẩu, BTC không cần phát mật khẩu. Thí sinh đã kích hoạt không nhận lại email.
        </Callout>
      </Panel>
      <Panel title="Gán thí sinh hoặc đổi ca" icon="settings">
        <form onSubmit={assign} className="grid gap-4 sm:grid-cols-2">
          <Field label="Thí sinh">
            <select required name="candidateId" className={inputClass}>
              <option value="">Chọn thí sinh</option>
              {candidates.data
                .filter((c) => c.state === "SUBMITTED" && c.accountStatus !== "DISABLED" && !c.deleted)
                .map((c) => (
                  <option value={c.id} key={`${c.id}-${c.registrationId}`}>
                    {c.candidateCode} · {c.fullName}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Ca thi">
            <select required name="scheduleId" className={inputClass}>
              <option value="">Chọn ca</option>
              {schedules.data.map((s) => (
                <option key={s.id} value={s.id} disabled={Number(s.assigned) >= s.capacity}>
                  {s.name} · {s.assigned}/{s.capacity} · {viTime(s.opensAt)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lý do (bắt buộc khi đổi ca)">
            <input name="reason" className={inputClass} maxLength={500} placeholder="Nhập lý do..." />
          </Field>
          <div className="self-end">
            <Button type="submit" icon="checkCircle" disabled={op.busy}>
              Lưu phân ca
            </Button>
          </div>
        </form>
      </Panel>
      <Panel
        title="Danh sách thí sinh theo ca"
        icon="users"
        description={`${filteredList.length} thí sinh`}
        actions={
          <>
            <label className="relative w-56">
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={`${inputClass} pl-9`} placeholder="Tìm theo mã, tên..." value={search} onChange={(e) => setSearch(e.target.value)} maxLength={200} />
            </label>
            <select className={`${inputClass} !w-40`} value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)} aria-label="Lọc ca">
              <option value="">Tất cả ca</option>
              {schedules.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button variant="outline" icon="refresh" disabled={op.busy || list.loading} onClick={() => void list.reload()}>
              Làm mới
            </Button>
          </>
        }
      >
        <Table
          headers={["Mã thí sinh", "Họ tên", "Ca", "Trạng thái", "Lịch sử"]}
          empty={{ icon: "calendar", title: "Chưa có dữ liệu", description: "Danh sách thí sinh theo ca sẽ hiển thị tại đây sau khi xếp ca." }}
          rows={filteredList.map((a) => [
            <span key="c" className="whitespace-nowrap font-mono text-[13px] font-semibold text-[#0B1F4D]">{a.candidateCode}</span>,
            <span key="n" className="font-medium">{a.fullName}</span>,
            a.scheduleName,
            statusPill(a.status),
            <Button
              key={a.id}
              variant="outline"
              icon="clock"
              disabled={op.busy}
              onClick={() =>
                void op.run(async () => {
                  const rows = await adminApi<typeof history>(`admin/assignments/${a.id}/history`);
                  setHistory(rows);
                }, "Đã tải lịch sử đổi ca.")
              }
            >
              Xem lịch sử
            </Button>,
          ])}
        />
      </Panel>
      {!!history.length && (
        <Panel title="Lịch sử đổi ca" icon="clock" actions={<Button variant="outline" onClick={() => setHistory([])}>Đóng</Button>}>
          <Table
            headers={["Ca cũ", "Ca mới", "Lý do", "Thời điểm"]}
            rows={history.map((h) => [
              schedules.data.find((s) => s.id === h.old_schedule_id)?.name ?? h.old_schedule_id,
              schedules.data.find((s) => s.id === h.new_schedule_id)?.name ?? h.new_schedule_id,
              h.reason,
              viTime(h.changed_at),
            ])}
          />
        </Panel>
      )}
    </div>
  );
}

export function Monitor() {
  const [search, setSearch] = useState("");
  const [scheduleFilter, setScheduleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const debouncedScheduleFilter = useDebounce(scheduleFilter, 300);
  const debouncedStatusFilter = useDebounce(statusFilter, 300);

  const list = useResource<AssignmentItem[]>("admin/monitor", []);
  const op = useOperations();

  // Tự làm mới mỗi 5 giây, hiển thị đếm ngược
  const [countdown, setCountdown] = useState(5);
  const boardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          void list.reload();
          return 5;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [list.reload]);

  // Build schedule list from data
  const schedules = useMemo(
    () => [...new Map(list.data.map((a) => [a.scheduleId, a.scheduleName])).entries()],
    [list.data],
  );

  // Client-side filtering
  const filteredList = useMemo(() => {
    let data = list.data;
    if (debouncedSearch) {
      const needle = debouncedSearch.toLowerCase();
      data = data.filter((a) =>
        a.candidateCode.toLowerCase().includes(needle) ||
        a.fullName.toLowerCase().includes(needle)
      );
    }
    if (debouncedScheduleFilter) {
      data = data.filter((a) => a.scheduleId === debouncedScheduleFilter);
    }
    if (debouncedStatusFilter) {
      data = data.filter((a) => a.status === debouncedStatusFilter);
    }
    return data;
  }, [list.data, debouncedSearch, debouncedScheduleFilter, debouncedStatusFilter]);

  const count = (st: string) => list.data.filter((a) => a.status === st).length;
  return (
    <div className="space-y-6">
      <Notice message={list.error || op.error} error />
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <IconTile name="video" size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[#0B1F4D] sm:text-xl">Giám sát thi Vòng 1</h2>
            <p className="mt-0.5 text-sm text-slate-500">Cập nhật mỗi 5 giây từ dữ liệu bài thi đã lưu. Giờ hiển thị theo Việt Nam (UTC+7).</p>
          </div>
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${list.error ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${list.error ? "bg-amber-500" : "animate-pulse bg-emerald-500"}`} />
            <div className="text-xs leading-tight">
              <p className={`font-bold ${list.error ? "text-amber-800" : "text-emerald-800"}`}>{list.error ? "Mất kết nối tạm thời" : "Hệ thống đang hoạt động"}</p>
              <p className={list.error ? "text-amber-700" : "text-emerald-700"}>{list.error ? "Đang hiển thị dữ liệu lần tải trước" : "Dữ liệu bài thi đang được đồng bộ"}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon="users" tone="blue" label="Tổng thí sinh" value={list.data.length} hint="Đã xếp ca Vòng 1" />
          <StatCard icon="clock" tone="green" label="Đang làm bài" value={count("IN_PROGRESS")} hint="Đang trong phòng thi" />
          <StatCard icon="calendar" tone="amber" label="Chưa vào thi" value={count("NOT_STARTED")} hint="Chưa bắt đầu làm bài" />
          <StatCard icon="checkCircle" tone="violet" label="Đã nộp bài" value={count("SUBMITTED")} hint="Đã chấm tự động" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_200px_200px_auto]">
          <Field label="Tìm kiếm">
            <span className="relative block">
              <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input className={`${inputClass} pl-9`} placeholder="Tìm theo mã, tên..." value={search} onChange={(e) => setSearch(e.target.value)} maxLength={200} />
            </span>
          </Field>
          <Field label="Ca thi">
            <select className={inputClass} value={scheduleFilter} onChange={(e) => setScheduleFilter(e.target.value)}>
              <option value="">Tất cả ca</option>
              {schedules.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select className={inputClass} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Tất cả</option>
              {["NOT_STARTED", "IN_PROGRESS", "SUBMITTED"].map((s) => (
                <option key={s} value={s}>
                  {examStatus(s)}
                </option>
              ))}
            </select>
          </Field>
          <div className="self-end">
            <Button icon="refresh" disabled={list.loading} onClick={() => { setCountdown(5); void list.reload(); }}>
              Làm mới
            </Button>
          </div>
        </div>
      </section>

      <div ref={boardRef} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <IconTile name="users" size="sm" />
          <h2 className="text-base font-bold text-[#0B1F4D] sm:text-lg">Danh sách thí sinh đang thi</h2>
          <Pill tone="green" dot>
            Live
          </Pill>
          <span className="flex-1" />
          <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
            <Icon name="refresh" className="h-4 w-4" /> Tự động cập nhật sau: {countdown} giây
          </span>
          <Button variant="outline" icon="maximize" onClick={() => void boardRef.current?.requestFullscreen?.()}>
            Toàn màn hình
          </Button>
        </div>
        <Table
          headers={["Mã", "Họ tên", "Ca", "Trạng thái", "Đã trả lời", "Bắt đầu", "Nộp lúc"]}
          empty={{ icon: "monitor", title: "Chưa có thí sinh đang thi", description: "Khi thí sinh vào phòng thi, danh sách sẽ hiển thị tại đây." }}
          rows={filteredList.map((a) => [
            <span key="c" className="whitespace-nowrap font-mono text-[13px] font-semibold text-[#0B1F4D]">{a.candidateCode}</span>,
            <span key="n" className="font-medium">{a.fullName}</span>,
            a.scheduleName,
            statusPill(a.status),
            <span key="a" className="tabular-nums">{a.answered}</span>,
            <span key="s" className="whitespace-nowrap">{viTime(a.startedAt)}</span>,
            <span key="f" className="whitespace-nowrap">{viTime(a.finalizedAt)}</span>,
          ])}
        />
      </div>

      <Callout icon="bulb" title="Lưu ý giám sát">
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Theo dõi trạng thái thí sinh theo thời gian thực, kịp thời xử lý các trường hợp bất thường.</li>
          <li>Thí sinh rời trang làm bài (chuyển tab) được hệ thống ghi nhận để BTC xem xét.</li>
          <li>Dữ liệu được tự động cập nhật mỗi 5 giây.</li>
        </ul>
      </Callout>
    </div>
  );
}

export function Round1() {
  const config = useResource<Configuration>("admin/configuration", emptyConfig),
    [competition, setCompetition] = useState(""),
    [search, setSearch] = useState(""),
    op = useOperations();
  const debouncedSearch = useDebounce(search, 300);
  const selected = competition || config.data.competitions[0]?.id || "";
  const list = useResource<AssignmentItem[]>(
    `admin/results/round-1?competitionId=${selected}`,
    [],
  );

  // Client-side search filter
  const filteredList = useMemo(() => {
    if (!debouncedSearch) return list.data;
    const needle = debouncedSearch.toLowerCase();
    return list.data.filter((a) =>
      a.candidateCode.toLowerCase().includes(needle) ||
      a.fullName.toLowerCase().includes(needle) ||
      a.scheduleName.toLowerCase().includes(needle)
    );
  }, [list.data, debouncedSearch]);

  const [page, setPage] = useState(1), [pageSize, setPageSize] = useState(50);
  const scored = list.data.filter((a) => a.points !== null);
  const top = list.data.filter((a) => a.top40).length;
  const best = scored.length ? Math.max(...scored.map((a) => Number(a.points))) : null;
  const rows = filteredList.slice((page - 1) * pageSize, page * pageSize);
  const rankCell = (rank: number | null | undefined) =>
    rank && rank <= 3 ? (
      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${rank === 1 ? "bg-amber-100 text-amber-500" : rank === 2 ? "bg-slate-100 text-slate-400" : "bg-orange-100 text-orange-500"}`} title={`Hạng ${rank}`}>
        <Icon name="crown" className="h-4 w-4" />
      </span>
    ) : (
      <span className="pl-2 tabular-nums text-slate-500">{rank ?? "—"}</span>
    );

  return (
    <div className="space-y-6">
      <Notice message={op.error || list.error || config.error} error />
      <Notice message={op.message} />
      <PageIntro
        icon="chart"
        title="Bảng điểm Vòng 1"
        description="Xem điểm cao nhất của các lượt đã chấm. Đồng điểm giữ cùng hạng; các trường hợp đồng điểm ở ngưỡng Top 40 cần Ban Tổ chức xét thêm."
        aside={<IntroBadge icon="clipboardCheck" title="Vòng 1" subtitle="Trắc nghiệm" />}
      />
      <section className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:grid-cols-[260px_1fr_auto_auto]">
        <Field label="Cuộc thi">
          <select className={inputClass} value={selected} onChange={(e) => setCompetition(e.target.value)}>
            {config.data.competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tìm kiếm">
          <span className="relative block">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className={`${inputClass} pl-9`} placeholder="Tìm theo mã, tên, ca..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} maxLength={200} />
          </span>
        </Field>
        <div className="self-end">
          <Button variant="outline" icon="upload" disabled={op.busy || !selected || list.loading} onClick={() => void op.run(() => downloadAdmin(`results/round-1/export?competitionId=${selected}`, "round-1.xlsx"), "Đã xuất bảng điểm.")}>
            Xuất Excel
          </Button>
        </div>
        <div className="self-end">
          <Button icon="refresh" onClick={() => void list.reload()}>
            Làm mới
          </Button>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="users" tone="blue" label="Tổng thí sinh" value={list.data.length.toLocaleString("vi-VN")} />
        <StatCard icon="fileCheck" tone="green" label="Đã có điểm" value={scored.length.toLocaleString("vi-VN")} />
        <StatCard icon="trophy" tone="amber" label="Top 40 hiện tại" value={top} />
        <StatCard icon="bars" tone="violet" label="Điểm cao nhất" value={best ?? "—"} />
      </div>
      <Panel title="Bảng xếp hạng thí sinh" icon="chart">
        <Table
          headers={["Hạng", "Mã thí sinh", "Họ tên", "Ca thi", "Trạng thái", "Điểm", "Top 40"]}
          empty={{ icon: "chart", title: "Chưa có điểm", description: "Bảng xếp hạng hiển thị khi thí sinh nộp bài Vòng 1." }}
          rows={rows.map((a) => [
            rankCell(a.rank),
            <span key="c" className="whitespace-nowrap font-mono text-[13px] font-semibold text-[#0B1F4D]">{a.candidateCode}</span>,
            <span key="n" className="font-medium">{a.fullName}</span>,
            a.scheduleName,
            a.points === null ? <Pill key="s" tone="slate">Chưa có điểm</Pill> : <Pill key="s" tone="green">Đã chấm</Pill>,
            <span key="p" className="font-bold tabular-nums text-[#0B1F4D]">{a.points === null ? "—" : `${a.points}/${a.maxPoints}`}</span>,
            a.tieAtCutoff ? (
              <Pill key="t" tone="amber">Đồng điểm — cần xét</Pill>
            ) : a.top40 ? (
              <span key="t" className="text-amber-500" title="Trong nhóm Top 40">
                <Icon name="trophy" className="h-5 w-5" />
              </span>
            ) : (
              <span key="t" className="text-slate-300">—</span>
            ),
          ])}
          footer={
            filteredList.length > 0 && (
              <Pagination page={page} pageSize={pageSize} total={filteredList.length} label="thí sinh" onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
            )
          }
        />
      </Panel>
    </div>
  );
}
