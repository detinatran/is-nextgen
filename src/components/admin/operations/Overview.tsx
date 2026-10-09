"use client";
import Link from "next/link";
import {
  adminAsset,
  AssignmentItem,
  Configuration,
  RegistrationItem,
  ScheduleItem,
} from "@/lib/admin/api";
import { emptyConfig, Notice, Panel, useResource } from "./common";
import { Icon, IconTile, StatCard, type IconName, type Tone } from "@/components/admin/ui/kit";

const shortcuts: { href: string; title: string; desc: string; icon: IconName; tone: Tone }[] = [
  { href: "/admin/candidates", title: "Hồ sơ & tài khoản", desc: "Quản lý tài khoản thí sinh, duyệt hồ sơ đăng ký", icon: "users", tone: "blue" },
  { href: "/admin/questions", title: "Ngân hàng câu hỏi", desc: "Quản lý, import và kiểm duyệt ngân hàng câu hỏi", icon: "help", tone: "violet" },
  { href: "/admin/exams/schedules", title: "Ca thi Vòng 1", desc: "Tạo ca thi, chốt đề và sức chứa từng ca", icon: "calendar", tone: "cyan" },
  { href: "/admin/exams/monitor", title: "Giám sát thi", desc: "Theo dõi thí sinh làm bài theo thời gian thực", icon: "monitor", tone: "green" },
  { href: "/admin/questions/import", title: "Nhập câu hỏi", desc: "Import câu hỏi từ file Excel hoặc DOCX", icon: "upload", tone: "amber" },
  { href: "/admin/exams/assignments", title: "Phân ca thí sinh", desc: "Xếp thí sinh vào ca và gửi email mời thi", icon: "clipboard", tone: "blue" },
  { href: "/admin/scoring/round-1", title: "Điểm Vòng 1", desc: "Xem bảng xếp hạng và Top 40 Vòng 1", icon: "chart", tone: "violet" },
  { href: "/admin/scoring/manual", title: "Điểm Vòng 2 & Chung kết", desc: "Chấm điểm Rubric cho các vòng trực tiếp", icon: "trophy", tone: "amber" },
];

export default function Overview() {
  const candidates = useResource<RegistrationItem[]>("admin/registrations", []),
    schedules = useResource<ScheduleItem[]>("admin/schedules", []),
    assignments = useResource<AssignmentItem[]>("admin/assignments", []),
    config = useResource<Configuration>("admin/configuration", emptyConfig);
  const submitted = candidates.data.filter((c) => c.state === "SUBMITTED").length;
  const drafts = candidates.data.length - submitted;
  const inProgress = assignments.data.filter((a) => a.status === "IN_PROGRESS").length;
  const done = assignments.data.filter((a) => a.status === "SUBMITTED").length;
  const upcoming = schedules.data.filter((s) => new Date(s.opensAt) > new Date()).length;
  const competition = config.data.competitions.map((c) => c.name).join(" · ");

  return (
    <div className="space-y-6">
      <Notice error message={candidates.error || schedules.error || assignments.error || config.error} />

      {/* Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-[#071533] shadow-lg shadow-[#0B1F4D]/20">
        <img src={adminAsset("/images/admin/dashboard-banner.webp")} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071533] via-[#071533]/85 to-transparent" aria-hidden />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#8CC1FF] uppercase">Mùa I: The Manager in the AI Era</p>
            <h2 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight text-white sm:text-4xl">
              NEXTGEN <span className="text-[#F5B83D]">MANAGER</span>
              <span className="block text-2xl font-bold text-[#8CC1FF] sm:text-3xl">CHALLENGE 2026</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Kiến tạo thế hệ nhà quản trị tương lai bằng tư duy số, hiểu biết AI và bản lĩnh hội nhập toàn cầu.
            </p>
          </div>
          <p className="hidden text-right text-xs font-semibold tracking-[0.18em] text-white/85 uppercase md:block">
            <span className="block">“Tài năng hôm nay</span>
            <span className="block">kiến tạo ngày mai”</span>
            <span className="mt-2 ml-auto block h-0.5 w-10 rounded-full bg-amber-400" />
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="fileCheck" tone="blue" label="Hồ sơ đã nộp" value={submitted} hint={drafts ? `${drafts} hồ sơ đang nháp` : "Chưa có hồ sơ nháp"} />
        <StatCard icon="calendar" tone="cyan" label="Ca thi" value={schedules.data.length} hint={schedules.data.length ? `${upcoming} ca sắp diễn ra` : "Chưa có lịch thi"} />
        <StatCard icon="clock" tone="amber" label="Đang làm bài" value={inProgress} hint={inProgress ? "Thí sinh đang trong phòng thi" : "Chưa có thí sinh đang thi"} />
        <StatCard icon="checkCircle" tone="green" label="Đã nộp bài" value={done} hint={done ? "Bài đã được chấm tự động" : "Chưa có bài nộp"} />
      </div>

      <Panel title="Quản trị cuộc thi" icon="layers" description={competition || "Chưa có cuộc thi được cấu hình."}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#1F5BE0]/30 hover:shadow-lg hover:shadow-blue-900/5"
            >
              <div className="flex items-start justify-between">
                <IconTile name={s.icon} tone={s.tone} size="sm" />
                <Icon name="arrowRight" className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#1F5BE0]" />
              </div>
              <p className="mt-3 font-semibold text-[#0B1F4D]">{s.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{s.desc}</p>
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
