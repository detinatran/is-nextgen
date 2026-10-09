"use client";
import Link from "next/link";
import { useMemo } from "react";
import { AssignmentItem, Configuration, RegistrationItem, ScheduleItem, viTime } from "@/lib/admin/api";
import { findDuplicates } from "@/lib/admin/duplicates";
import { emptyConfig, Notice, useResource } from "./common";
import { Icon, Pill, Skeleton, StatCard } from "@/components/admin/ui/kit";

const shortcuts = [
  { href: "/admin/candidates", title: "Hồ sơ & tài khoản", desc: "Tra cứu hồ sơ, cấp và khoá tài khoản" },
  { href: "/admin/questions/import", title: "Import câu hỏi", desc: "Nhập ngân hàng câu hỏi từ Excel hoặc DOCX" },
  { href: "/admin/exams/schedules", title: "Lịch thi & ca thi", desc: "Tạo ca thi, chốt đề và sức chứa" },
  { href: "/admin/exams/assignments", title: "Phân ca thí sinh", desc: "Xếp ca và gửi email mời thi" },
  { href: "/admin/exams/monitor", title: "Phòng giám sát", desc: "Theo dõi bài làm theo thời gian thực" },
  { href: "/admin/scoring/round-1", title: "Điểm Vòng 1", desc: "Bảng xếp hạng và Top 40" },
];

const DAY = 86_400_000;

export default function Overview() {
  const candidates = useResource<RegistrationItem[]>("admin/registrations", []),
    schedules = useResource<ScheduleItem[]>("admin/schedules", []),
    assignments = useResource<AssignmentItem[]>("admin/assignments", []),
    config = useResource<Configuration>("admin/configuration", emptyConfig);
  const loading = candidates.loading || schedules.loading || assignments.loading;

  const stats = useMemo(() => {
    const now = Date.now();
    const live = candidates.data.filter((c) => !c.deleted);
    const submitted = live.filter((c) => c.state === "SUBMITTED");
    const assignedIds = new Set(assignments.data.map((a) => a.candidateId));
    return {
      submitted: submitted.length,
      drafts: live.filter((c) => c.state === "DRAFT").length,
      pendingActivation: submitted.filter((c) => c.userId && c.accountStatus !== "ACTIVE" && c.accountStatus !== "DISABLED").length,
      unassigned: submitted.filter((c) => c.candidateCode && !assignedIds.has(c.id)).length,
      duplicates: findDuplicates(live).length,
      inProgress: assignments.data.filter((a) => a.status === "IN_PROGRESS").length,
      done: assignments.data.filter((a) => a.status === "SUBMITTED").length,
      upcoming: schedules.data.filter((s) => new Date(s.opensAt).getTime() > now).sort((a, b) => a.opensAt.localeCompare(b.opensAt)),
      soon: schedules.data.filter((s) => {
        const t = new Date(s.opensAt).getTime();
        return t > now && t - now < 7 * DAY;
      }),
      open: schedules.data.filter((s) => new Date(s.opensAt).getTime() <= now && new Date(s.closesAt).getTime() > now),
    };
  }, [candidates.data, schedules.data, assignments.data]);

  const competition = config.data.competitions[0];
  const rubricMissing = [2, 4].filter((round) => !config.data.policies.some((p) => p.round === round && (!competition || p.competition_id === competition.id)));
  const noBlueprint = stats.upcoming.filter((s) => !s.blueprintId);

  type Item = { tone: "amber" | "red" | "blue" | "slate"; title: string; detail: string; href: string; action: string };
  const attention: Item[] = [];
  if (stats.open.length) attention.push({ tone: "blue", title: `${stats.open.length} ca thi đang mở`, detail: `${stats.inProgress} thí sinh đang làm bài`, href: "/admin/exams/monitor", action: "Giám sát" });
  if (stats.duplicates) attention.push({ tone: "red", title: `${stats.duplicates} nhóm hồ sơ trùng`, detail: "Trùng MSSV, email, số điện thoại hoặc Facebook", href: "/admin/candidates/duplicate-reviews", action: "Rà soát" });
  if (stats.unassigned) attention.push({ tone: "amber", title: `${stats.unassigned} hồ sơ đã nộp chưa xếp ca`, detail: "Cần xếp ca Vòng 1 trước khi gửi email mời thi", href: "/admin/exams/assignments", action: "Xếp ca" });
  if (stats.pendingActivation) attention.push({ tone: "amber", title: `${stats.pendingActivation} tài khoản chưa kích hoạt`, detail: "Thí sinh chưa đặt mật khẩu từ email mời thi", href: "/admin/candidates", action: "Xem hồ sơ" });
  if (noBlueprint.length) attention.push({ tone: "red", title: `${noBlueprint.length} ca sắp tới chưa có đề`, detail: "Ca chưa gắn bộ đề đã chốt nên không thể xếp thí sinh", href: "/admin/exams/schedules", action: "Kiểm tra" });
  if (!config.loading && rubricMissing.length)
    attention.push({ tone: "slate", title: `Chưa cấu hình Rubric ${rubricMissing.map((r) => (r === 2 ? "Vòng 2" : "Chung kết")).join(" và ")}`, detail: "Cần có tiêu chí chấm trước khi nhập điểm", href: "/admin/scoring/manual", action: "Cấu hình" });

  const error = candidates.error || schedules.error || assignments.error || config.error;
  const reload = () => {
    void candidates.reload();
    void schedules.reload();
    void assignments.reload();
    void config.reload();
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-adm-navy px-6 py-5 text-white">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-300">{competition?.name ?? "NextGen Manager Challenge 2026"}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Tổng quan vận hành</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-slate-300">
          <span className="h-2 w-2 rounded-full bg-adm-gold" aria-hidden />
          {stats.open.length ? `${stats.open.length} ca thi đang diễn ra` : stats.upcoming[0] ? `Ca kế tiếp: ${viTime(stats.upcoming[0].opensAt)}` : "Chưa có ca thi sắp tới"}
        </div>
      </section>

      <Notice error message={error} onRetry={reload} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard loading={loading} label="Hồ sơ đã nộp" value={stats.submitted} hint={`${stats.drafts} hồ sơ đang nháp`} />
        <StatCard loading={loading} label="Ca thi" value={schedules.data.length} hint={`${stats.upcoming.length} ca sắp diễn ra`} />
        <StatCard loading={loading} label="Đang làm bài" value={stats.inProgress} hint="Thí sinh trong phòng thi" />
        <StatCard loading={loading} label="Đã nộp bài" value={stats.done} hint={`trên ${assignments.data.length} thí sinh đã xếp ca`} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-xl border border-adm-border bg-white">
          <div className="flex items-center justify-between border-b border-adm-border px-5 py-4">
            <h2 className="text-[17px] font-semibold text-adm-text">Cần chú ý</h2>
            <button type="button" onClick={reload} className="flex items-center gap-1.5 text-[13px] text-adm-sub hover:text-adm-text">
              <Icon name="refresh" className="h-3.5 w-3.5" /> Làm mới
            </button>
          </div>
          {loading && !attention.length ? (
            <div className="space-y-3 p-5">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : attention.length ? (
            <ul className="divide-y divide-adm-border">
              {attention.map((a) => (
                <li key={a.title} className="flex items-center gap-4 px-5 py-3.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${{ amber: "bg-adm-warning", red: "bg-adm-error", blue: "bg-adm-primary", slate: "bg-adm-muted" }[a.tone]}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-adm-text">{a.title}</p>
                    <p className="text-[13px] text-adm-sub">{a.detail}</p>
                  </div>
                  <Link href={a.href} className="shrink-0 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-adm-primary hover:bg-blue-50">
                    {a.action}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 px-5 py-6 text-sm text-adm-sub">
              <Icon name="checkCircle" className="text-adm-success" /> Không có việc tồn đọng.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-adm-border bg-white">
          <div className="flex items-center justify-between border-b border-adm-border px-5 py-4">
            <h2 className="text-[17px] font-semibold text-adm-text">Ca thi sắp tới</h2>
            <Link href="/admin/exams/schedules" className="text-[13px] text-adm-sub hover:text-adm-text">
              Tất cả
            </Link>
          </div>
          {schedules.loading && !schedules.data.length ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : stats.upcoming.length ? (
            <ul className="divide-y divide-adm-border">
              {stats.upcoming.slice(0, 5).map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-adm-text">{s.name}</p>
                    <p className="text-xs text-adm-sub tabular-nums">{viTime(s.opensAt)}</p>
                  </div>
                  <span className="text-[13px] text-adm-sub tabular-nums">
                    {s.assigned}/{s.capacity}
                  </span>
                  {!s.blueprintId && <Pill tone="red">Chưa có đề</Pill>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-adm-sub">Chưa có ca thi sắp diễn ra.</p>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-[17px] font-semibold text-adm-text">Truy cập nhanh</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map((s) => (
            <Link key={s.href} href={s.href} className="group flex items-center gap-3 rounded-lg border border-adm-border bg-white px-4 py-3.5 transition hover:border-slate-300 hover:bg-slate-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-primary/40">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-adm-text">{s.title}</p>
                <p className="truncate text-[13px] text-adm-sub">{s.desc}</p>
              </div>
              <Icon name="arrowRight" className="h-4 w-4 text-adm-muted transition group-hover:text-adm-text motion-safe:group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
