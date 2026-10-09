"use client";
import Link from "next/link";
import { useMemo } from "react";
import { adminAsset, AssignmentItem, Configuration, RegistrationItem, ScheduleItem, viTime } from "@/lib/admin/api";
import { findDuplicates } from "@/lib/admin/duplicates";
import { emptyConfig, Notice, useResource } from "./common";
import { Icon, IconTile, Pill, Skeleton, StatCard, type IconName, type Tone } from "@/components/admin/ui/kit";
import { tr } from "@/lib/i18n/tr";

const shortcuts: { href: string; title: string; desc: string; icon: IconName; tone: Tone }[] = [
  { href: "/admin/candidates", title: "Hồ sơ & tài khoản", desc: "Tra cứu hồ sơ, cấp và khoá tài khoản", icon: "users", tone: "blue" },
  { href: "/admin/questions", title: "Ngân hàng câu hỏi", desc: "Quản lý và xem trước câu hỏi", icon: "help", tone: "violet" },
  { href: "/admin/exams/schedules", title: "Lịch thi & ca thi", desc: "Tạo ca thi, chốt đề và sức chứa", icon: "calendar", tone: "cyan" },
  { href: "/admin/exams/monitor", title: "Phòng giám sát", desc: "Theo dõi bài làm theo thời gian thực", icon: "monitor", tone: "green" },
  { href: "/admin/questions/import", title: "Import câu hỏi", desc: "Nhập từ Excel hoặc DOCX", icon: "upload", tone: "amber" },
  { href: "/admin/exams/assignments", title: "Phân ca thí sinh", desc: "Xếp ca và gửi email mời thi", icon: "clipboard", tone: "blue" },
  { href: "/admin/scoring/round-1", title: "Điểm Vòng 1", desc: "Bảng xếp hạng và Top 40", icon: "chart", tone: "violet" },
  { href: "/admin/scoring/manual", title: "Vòng 2 & Chung kết", desc: "Chấm điểm theo Rubric", icon: "trophy", tone: "amber" },
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
  // Chỉ tính khi đủ dữ liệu, tránh hiện số tạm sai trong lúc đang tải
  const ready = !candidates.loading && !schedules.loading && !assignments.loading;
  if (ready && stats.open.length) attention.push({ tone: "blue", title: tr("{0} ca thi đang mở", stats.open.length), detail: tr("{0} thí sinh đang làm bài", stats.inProgress), href: "/admin/exams/monitor", action: tr("Giám sát") });
  if (ready && stats.duplicates) attention.push({ tone: "red", title: tr("{0} nhóm hồ sơ trùng", stats.duplicates), detail: tr("Trùng MSSV, email, số điện thoại hoặc Facebook"), href: "/admin/candidates/duplicate-reviews", action: tr("Rà soát") });
  if (ready && stats.unassigned) attention.push({ tone: "amber", title: tr("{0} hồ sơ đã nộp chưa xếp ca", stats.unassigned), detail: tr("Cần xếp ca Vòng 1 trước khi gửi email mời thi"), href: "/admin/exams/assignments", action: tr("Xếp ca") });
  if (ready && stats.pendingActivation) attention.push({ tone: "amber", title: tr("{0} tài khoản chưa kích hoạt", stats.pendingActivation), detail: tr("Thí sinh chưa đặt mật khẩu từ email mời thi"), href: "/admin/candidates", action: tr("Xem hồ sơ") });
  if (ready && noBlueprint.length) attention.push({ tone: "red", title: tr("{0} ca sắp tới chưa có đề", noBlueprint.length), detail: tr("Ca chưa gắn bộ đề đã chốt nên không thể xếp thí sinh"), href: "/admin/exams/schedules", action: tr("Kiểm tra") });
  if (!config.loading && rubricMissing.length)
    attention.push({ tone: "slate", title: tr("Chưa cấu hình Rubric {0}", rubricMissing.map((r) => (r === 2 ? tr("Vòng 2") : tr("Chung kết"))).join(tr(" và "))), detail: tr("Cần có tiêu chí chấm trước khi nhập điểm"), href: "/admin/scoring/manual", action: tr("Cấu hình") });

  const error = candidates.error || schedules.error || assignments.error || config.error;
  const reload = () => {
    void candidates.reload();
    void schedules.reload();
    void assignments.reload();
    void config.reload();
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-[#071533] shadow-lg shadow-[#0B1F4D]/20">
        <img src={adminAsset("/images/admin/dashboard-banner.webp")} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071533] via-[#071533]/85 to-transparent" aria-hidden />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#8CC1FF] uppercase">{tr("Mùa I: The Manager in the AI Era")}</p>
            <h1 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-4xl">
              NEXTGEN <span className="text-adm-gold">MANAGER</span>
              <span className="block text-2xl font-bold text-[#8CC1FF] sm:text-3xl">CHALLENGE 2026</span>
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/75">{tr("Kiến tạo thế hệ nhà quản trị tương lai bằng tư duy số, hiểu biết AI và bản lĩnh hội nhập toàn cầu.")}</p>
          </div>
          <p className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[13px] text-white backdrop-blur-sm md:self-end">
            <span className="h-2 w-2 rounded-full bg-adm-gold" aria-hidden />
            {schedules.loading && !schedules.updatedAt ? tr("Đang tải lịch thi…") : stats.open.length ? tr("{0} ca thi đang diễn ra", stats.open.length) : stats.upcoming[0] ? tr("Ca kế tiếp: {0}", viTime(stats.upcoming[0].opensAt)) : tr("Chưa có ca thi sắp tới")}
          </p>
        </div>
      </section>

      <Notice error message={error} onRetry={reload} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard loading={loading} icon="fileCheck" tone="blue" label={tr("Hồ sơ đã nộp")} value={stats.submitted} hint={tr("{0} hồ sơ đang nháp", stats.drafts)} />
        <StatCard loading={loading} icon="calendar" tone="cyan" label={tr("Ca thi")} value={schedules.data.length} hint={tr("{0} ca sắp diễn ra", stats.upcoming.length)} />
        <StatCard loading={loading} icon="clock" tone="amber" label={tr("Đang làm bài")} value={stats.inProgress} hint={tr("Thí sinh trong phòng thi")} />
        <StatCard loading={loading} icon="checkCircle" tone="green" label={tr("Đã nộp bài")} value={stats.done} hint={tr("trên {0} thí sinh đã xếp ca", assignments.data.length)} />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-adm-border px-5 py-4">
            <h2 className="text-[17px] font-semibold text-adm-text">{tr("Cần chú ý")}</h2>
            <button type="button" onClick={reload} className="flex items-center gap-1.5 text-[13px] text-adm-sub hover:text-adm-text">
              <Icon name="refresh" className="h-3.5 w-3.5" /> {" "}{tr("Làm mới")}</button>
          </div>
          {!ready ? (
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
              <Icon name="checkCircle" className="text-adm-success" /> {" "}{tr("Không có việc tồn đọng.")}</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between border-b border-adm-border px-5 py-4">
            <h2 className="text-[17px] font-semibold text-adm-text">{tr("Ca thi sắp tới")}</h2>
            <Link href="/admin/exams/schedules" className="text-[13px] text-adm-sub hover:text-adm-text">
              {tr("Tất cả")}</Link>
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
                  {!s.blueprintId && <Pill tone="red">{tr("Chưa có đề")}</Pill>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 text-sm text-adm-sub">{tr("Chưa có ca thi sắp diễn ra.")}</p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <IconTile name="layers" tone="blue" size="sm" />
          <div>
            <h2 className="text-[17px] font-semibold text-adm-text">{tr("Quản trị cuộc thi")}</h2>
            <p className="text-[13px] text-adm-sub">{competition?.name ?? "NextGen Manager Challenge 2026"}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-[#1F5BE0]/30 hover:shadow-lg hover:shadow-blue-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-adm-primary/40 motion-safe:hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between">
                <IconTile name={s.icon} tone={s.tone} size="sm" />
                <Icon name="arrowRight" className="text-slate-300 transition group-hover:text-adm-primary motion-safe:group-hover:translate-x-0.5" />
              </div>
              <p className="mt-3 font-semibold text-adm-text">{tr(s.title)}</p>
              <p className="mt-1 text-xs leading-relaxed text-adm-sub">{tr(s.desc)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
