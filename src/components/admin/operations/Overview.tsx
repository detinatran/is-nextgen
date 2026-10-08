"use client";
import Link from "next/link";
import {
  AssignmentItem,
  Configuration,
  RegistrationItem,
  ScheduleItem,
} from "@/lib/admin/api";
import { emptyConfig, Notice, Panel, useResource } from "./common";
export default function Overview() {
  const candidates = useResource<RegistrationItem[]>("admin/registrations", []),
    schedules = useResource<ScheduleItem[]>("admin/schedules", []),
    assignments = useResource<AssignmentItem[]>("admin/assignments", []),
    config = useResource<Configuration>("admin/configuration", emptyConfig);
  const stats = [
    [
      "Hồ sơ đã nộp",
      candidates.data.filter((c) => c.state === "SUBMITTED").length,
    ],
    ["Ca thi", schedules.data.length],
    [
      "Đang làm bài",
      assignments.data.filter((a) => a.status === "IN_PROGRESS").length,
    ],
    [
      "Đã nộp bài",
      assignments.data.filter((a) => a.status === "SUBMITTED").length,
    ],
  ];
  return (
    <div className="space-y-6">
      <Notice
        error
        message={
          candidates.error ||
          schedules.error ||
          assignments.error ||
          config.error
        }
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(([title, value]) => (
          <Panel title={String(title)} key={title}>
            <p className="text-3xl font-bold text-blue-600">{value}</p>
          </Panel>
        ))}
      </div>
      <Panel title="Quản trị cuộc thi">
        <p className="text-slate-600 text-sm">
          {config.data.competitions.map((c) => c.name).join(" · ") ||
            "Chưa có cuộc thi được cấu hình."}
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            ["/admin/candidates", "Hồ sơ & tài khoản"],
            ["/admin/questions", "Ngân hàng câu hỏi"],
            ["/admin/questions/import", "Nhập câu hỏi"],
            ["/admin/exams/schedules", "Ca thi Vòng 1"],
            ["/admin/exams/assignments", "Phân ca thí sinh"],
            ["/admin/exams/monitor", "Giám sát thi"],
            ["/admin/scoring/round-1", "Điểm Vòng 1"],
            ["/admin/scoring/manual", "Điểm Vòng 2 & Chung kết"],
          ].map(([href, title]) => (
            <Link
              key={href}
              href={href}
              className="border rounded-lg p-4 text-blue-700 font-medium hover:bg-blue-50"
            >
              {title} →
            </Link>
          ))}
        </div>
      </Panel>
    </div>
  );
}
