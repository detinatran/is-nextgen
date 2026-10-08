"use client";
import { FormEvent, useEffect, useState } from "react";
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

export function Schedules() {
  const list = useResource<ScheduleItem[]>("admin/schedules", []),
    config = useResource<Configuration>("admin/configuration", emptyConfig),
    op = useOperations();
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      fields = Object.fromEntries(new FormData(form));
    void op.run(async () => {
      await adminApi("admin/schedules", {
        method: "POST",
        body: JSON.stringify({
          ...fields,
          opensAt: new Date(`${fields.opensAt}:00+07:00`).toISOString(),
          closesAt: new Date(`${fields.closesAt}:00+07:00`).toISOString(),
          capacity: Number(fields.capacity),
          questionCount: Number(fields.questionCount),
          durationSeconds: Number(fields.durationMinutes) * 60,
          durationMinutes: undefined,
        }),
      });
      form.reset();
      await list.reload();
    });
  }
  return (
    <div className="space-y-6">
      <Notice message={op.error || list.error || config.error} error />
      <Notice message={op.message} />
      <Panel title="Tạo ca thi Vòng 1">
        <p className="text-sm text-slate-500">
          Giờ mở/đóng theo giờ Việt Nam (UTC+7). Cần đủ câu hỏi trong nhóm trước
          khi tạo ca.
        </p>
        <form onSubmit={create} className="grid sm:grid-cols-2 gap-4">
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
            <input
              required
              name="name"
              className={inputClass}
              maxLength={200}
            />
          </Field>
          <Field label="Mở ca">
            <input
              required
              type="datetime-local"
              name="opensAt"
              className={inputClass}
            />
          </Field>
          <Field label="Đóng ca">
            <input
              required
              type="datetime-local"
              name="closesAt"
              className={inputClass}
            />
          </Field>
          <Field label="Thời lượng (phút)">
            <input
              required
              type="number"
              min={1}
              max={240}
              defaultValue={60}
              name="durationMinutes"
              className={inputClass}
            />
          </Field>
          <Field label="Số thí sinh tối đa">
            <input
              required
              type="number"
              min={1}
              max={100000}
              defaultValue={100}
              name="capacity"
              className={inputClass}
            />
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
            <input
              required
              type="number"
              min={1}
              max={500}
              defaultValue={30}
              name="questionCount"
              className={inputClass}
            />
          </Field>
          <Button type="submit" disabled={op.busy || config.loading}>
            Tạo ca
          </Button>
        </form>
      </Panel>
      <Panel title="Danh sách ca thi">
        <Table
          headers={["Ca thi", "Mở", "Đóng", "Thời lượng", "Số thí sinh"]}
          rows={list.data.map((s) => [
            s.name,
            viTime(s.opensAt),
            viTime(s.closesAt),
            `${s.durationSeconds / 60} phút`,
            `${s.assigned}/${s.capacity}`,
          ])}
        />
      </Panel>
    </div>
  );
}

export function Assignments() {
  const list = useResource<AssignmentItem[]>("admin/assignments", []),
    schedules = useResource<ScheduleItem[]>("admin/schedules", []),
    candidates = useResource<RegistrationItem[]>("admin/registrations", []),
    op = useOperations();
  const [filter, setFilter] = useState("");
  const [history, setHistory] = useState<
    {
      old_schedule_id: string;
      new_schedule_id: string;
      reason: string;
      changed_at: string;
    }[]
  >([]);
  function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    void op.run(async () => {
      await adminApi("admin/assignments", {
        method: "POST",
        body: JSON.stringify(fields),
      });
      await Promise.all([list.reload(), schedules.reload()]);
    });
  }
  return (
    <div className="space-y-6">
      <Notice
        message={op.error || list.error || schedules.error || candidates.error}
        error
      />
      <Notice message={op.message} />
      <Panel title="Gán thí sinh hoặc đổi ca">
        <form onSubmit={assign} className="grid sm:grid-cols-2 gap-4">
          <Field label="Thí sinh">
            <select required name="candidateId" className={inputClass}>
              <option value="">Chọn thí sinh</option>
              {candidates.data
                .filter((c) => c.accountStatus === "ACTIVE" && !c.deleted)
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
                <option
                  key={s.id}
                  value={s.id}
                  disabled={Number(s.assigned) >= s.capacity}
                >
                  {s.name} · {s.assigned}/{s.capacity} · {viTime(s.opensAt)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Lý do (bắt buộc khi đổi ca)">
            <input name="reason" className={inputClass} maxLength={500} />
          </Field>
          <div className="self-end">
            <Button type="submit" disabled={op.busy}>
              Lưu phân ca
            </Button>
          </div>
        </form>
      </Panel>
      <Panel title="Danh sách thí sinh theo ca">
        <Field label="Lọc ca">
          <select
            className={inputClass}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            {schedules.data.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Table
          headers={["Mã thí sinh", "Họ tên", "Ca", "Trạng thái", "Lịch sử"]}
          rows={list.data
            .filter((a) => !filter || a.scheduleId === filter)
            .map((a) => [
              a.candidateCode,
              a.fullName,
              a.scheduleName,
              examStatus(a.status),
              <Button
                key={a.id}
                disabled={op.busy}
                onClick={() =>
                  void op.run(async () => {
                    const rows = await adminApi<typeof history>(
                      `admin/assignments/${a.id}/history`,
                    );
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
        <Panel title="Lịch sử đổi ca">
          <Table
            headers={["Ca cũ", "Ca mới", "Lý do", "Thời điểm"]}
            rows={history.map((h) => [
              schedules.data.find((s) => s.id === h.old_schedule_id)?.name ??
                h.old_schedule_id,
              schedules.data.find((s) => s.id === h.new_schedule_id)?.name ??
                h.new_schedule_id,
              h.reason,
              viTime(h.changed_at),
            ])}
          />
          <Button onClick={() => setHistory([])}>Đóng</Button>
        </Panel>
      )}
    </div>
  );
}

export function Monitor() {
  const list = useResource<AssignmentItem[]>("admin/monitor", []),
    op = useOperations();
  const [filter, setFilter] = useState(""),
    [scheduleFilter, setScheduleFilter] = useState("");
  useEffect(() => {
    const timer = setInterval(() => {
      void list.reload();
    }, 5000);
    return () => clearInterval(timer);
  }, [list.reload]);
  const schedules = [
    ...new Map(list.data.map((a) => [a.scheduleId, a.scheduleName])).entries(),
  ];
  return (
    <div className="space-y-6">
      <Notice message={list.error || op.error} error />
      <Panel title="Giám sát thi Vòng 1">
        <p className="text-sm text-slate-500">
          Cập nhật mỗi 5 giây từ dữ liệu bài thi đã lưu. Giờ hiển thị theo Việt
          Nam (UTC+7).
        </p>
        <div className="flex flex-wrap gap-3">
          <Field label="Ca thi">
            <select
              className={inputClass}
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
            >
              <option value="">Tất cả ca</option>
              {schedules.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select
              className={inputClass}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">Tất cả</option>
              {["NOT_STARTED", "IN_PROGRESS", "SUBMITTED"].map((s) => (
                <option key={s} value={s}>
                  {examStatus(s)}
                </option>
              ))}
            </select>
          </Field>
          <Button disabled={list.loading} onClick={() => void list.reload()}>
            Làm mới
          </Button>
        </div>
        {list.error && (
          <p className="text-amber-700 text-sm">
            Dữ liệu bên dưới là lần tải thành công trước đó; chưa cập nhật được
            trạng thái mới.
          </p>
        )}
        <Table
          headers={[
            "Mã",
            "Họ tên",
            "Ca",
            "Trạng thái",
            "Đã trả lời",
            "Bắt đầu",
            "Nộp lúc",
          ]}
          rows={list.data
            .filter(
              (a) =>
                (!filter || a.status === filter) &&
                (!scheduleFilter || a.scheduleId === scheduleFilter),
            )
            .map((a) => [
              a.candidateCode,
              a.fullName,
              a.scheduleName,
              examStatus(a.status),
              a.answered,
              viTime(a.startedAt),
              viTime(a.finalizedAt),
            ])}
        />
      </Panel>
    </div>
  );
}

export function Round1() {
  const config = useResource<Configuration>("admin/configuration", emptyConfig),
    [competition, setCompetition] = useState(""),
    op = useOperations();
  const selected = competition || config.data.competitions[0]?.id || "";
  const list = useResource<AssignmentItem[]>(
    `admin/results/round-1?competitionId=${selected}`,
    [],
  );
  return (
    <div className="space-y-6">
      <Notice message={op.error || list.error || config.error} error />
      <Notice message={op.message} />
      <Panel title="Bảng điểm Vòng 1">
        <Field label="Cuộc thi">
          <select
            className={inputClass}
            value={selected}
            onChange={(e) => setCompetition(e.target.value)}
          >
            {config.data.competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <p className="text-sm text-slate-500">
          Điểm cao nhất của các lượt đã chấm. Đồng điểm giữ cùng hạng; các
          trường hợp đồng điểm ở ngưỡng Top 40 cần Ban Tổ Chức xét thêm.
        </p>
        <div className="flex gap-3">
          <Button
            disabled={op.busy || !selected || list.loading}
            onClick={() =>
              void op.run(
                () =>
                  downloadAdmin(
                    `results/round-1/export?competitionId=${selected}`,
                    "round-1.xlsx",
                  ),
                "Đã xuất bảng điểm.",
              )
            }
          >
            Xuất Excel
          </Button>
          <Button onClick={() => void list.reload()}>Làm mới</Button>
        </div>
        <Table
          headers={[
            "Hạng",
            "Mã",
            "Họ tên",
            "Ca",
            "Trạng thái",
            "Điểm",
            "Top 40",
          ]}
          rows={list.data.map((a) => [
            a.rank,
            a.candidateCode,
            a.fullName,
            a.scheduleName,
            examStatus(a.status),
            a.points === null ? "Chưa có điểm" : `${a.points}/${a.maxPoints}`,
            a.tieAtCutoff
              ? "Đồng điểm — cần xét"
              : a.top40
                ? "Trong nhóm xét"
                : "—",
          ])}
        />
      </Panel>
    </div>
  );
}
