"use client";

import React, { useState } from "react";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import AdminPopconfirm from "@/components/admin/ui/AdminPopconfirm";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";
import { useToastHelpers } from "@/components/admin/ui/Toast";
import { mockAssignments, mockSchedules } from "@/mocks/admin";
import type { AssignmentItem } from "@/mocks/admin/assignments";
import type { ScheduleItem } from "@/mocks/admin/schedules";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

export default function CandidateAssignmentsPage() {
  const { t } = useAdminI18n();
  const [assignments, setAssignments] = useState<AssignmentItem[]>(mockAssignments);
  const [scheduleFilter, setScheduleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Toast
  const { success, error, warning, info } = useToastHelpers();

  // Change Schedule Modal
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);
  const [newScheduleId, setNewScheduleId] = useState("sch-002");
  const [changeReason, setChangeReason] = useState("");

  const filtered = assignments.filter((item) => {
    const matchQuery =
      !searchQuery ||
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentId.includes(searchQuery);

    const matchSchedule =
      scheduleFilter === "ALL" || item.scheduleId === scheduleFilter;

    return matchQuery && matchSchedule;
  });

  const handleChangeScheduleConfirm = () => {
    if (!selectedAssignment) return;
    if (!changeReason.trim()) {
      warning(t("Thiếu thông tin"), t("Vui lòng nhập lý do đổi ca thi (bắt buộc theo quy chế kiểm toán)!"));
      return;
    }
    const targetSchedule = mockSchedules.find((s) => s.id === newScheduleId);
    if (!targetSchedule) return;

    if (targetSchedule.assignedCount >= targetSchedule.capacity) {
      error(t("Ca thi đã đầy"), t("Ca thi này đã đạt sức chứa tối đa (Capacity)! Vui lòng chọn ca khác."));
      return;
    }

    setAssignments((prev) =>
      prev.map((a) =>
        a.id === selectedAssignment.id
          ? {
              ...a,
              scheduleId: targetSchedule.id,
              scheduleName: targetSchedule.name,
              historyCount: a.historyCount + 1,
            }
          : a
      )
    );

    setSelectedAssignment(null);
    setChangeReason("");
    success(t("Đổi ca thi thành công"), t("Đã chuyển ca thi và ghi nhận lịch sử đổi ca thành công!"));
  };

  const columns: Column<AssignmentItem>[] = [
    {
      key: "candidateCode",
      header: t("Mã TS"),
      width: "120px",
      render: (row) => (
        <span className="font-sans tabular-nums tracking-tight text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {row.candidateCode}
        </span>
      ),
    },
    {
      key: "name",
      header: t("Họ và tên thí sinh"),
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm block">
            {row.fullName}
          </span>
          <span className="text-[11px] text-slate-400 font-sans tabular-nums tracking-tight">
            {t("MSSV")}: {row.studentId} • {row.school}
          </span>
        </div>
      ),
    },
    {
      key: "schedule",
      header: t("Ca thi được phân bổ"),
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-[#0B1F4D] block">
            {row.scheduleName}
          </span>
          <span className="text-[11px] text-slate-400">{t("Gán lúc:")} {row.assignedAt}</span>
        </div>
      ),
    },
    {
      key: "history",
      header: t("Lịch sử đổi ca"),
      align: "center",
      render: (row) => (
        <AdminBadge variant={row.historyCount > 0 ? "warning" : "default"} size="sm">
          {row.historyCount > 0 ? t(`${row.historyCount} lần đổi`) : t("Chưa đổi")}
        </AdminBadge>
      ),
    },
    {
      key: "actions",
      header: t("Thao tác"),
      align: "right",
      render: (row) => (
        <AdminPopconfirm
          title={t("Đổi ca thi thí sinh")}
          description={t("Chuyển") + ` ${row.fullName} (${row.candidateCode}) ${t("sang ca thi khác. Hành động sẽ được ghi nhận vào")} assignment_schedule_history.`}
          confirmVariant="brand"
          confirmText={t("Xác nhận đổi ca")}
          onConfirm={() => {
            setSelectedAssignment(row);
            setNewScheduleId(row.scheduleId === "sch-001" ? "sch-002" : "sch-001");
            setChangeReason("");
          }}
          triggerVariant="outline"
          triggerSize="sm"
        >
          {(open) => (
            <span
              className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors ${open ? "bg-slate-50" : ""}`}
            >
              {t("Đổi ca thi")}
            </span>
          )}
        </AdminPopconfirm>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900">
          {t("Phân ca thi & Lịch sử điều phối thí sinh")}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t("Quản lý danh sách thí sinh trong từng ca thi. Mọi thao tác đổi ca đều được lưu vết vào bảng")}{" "}
          <span className="font-sans tabular-nums tracking-tight font-semibold text-slate-700">assignment_schedule_history</span>.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AdminInput
          placeholder={t("Tìm theo Mã TS, Họ tên, MSSV...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <AdminSelect
          value={scheduleFilter}
          onChange={(e) => setScheduleFilter(e.target.value)}
          options={[
            { label: t("Tất cả các ca thi"), value: "ALL" },
            { label: t("Ca 01 - Sáng T7 (07/11 08:30)"), value: "sch-001" },
            { label: t("Ca 02 - Chiều T7 (07/11 14:30)"), value: "sch-002" },
            { label: t("Ca 03 - Sáng CN (08/11 09:00)"), value: "sch-003" },
          ]}
        />
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
      />

      {/* Change Schedule Modal */}
      {selectedAssignment && (
        <AdminModal
          isOpen={true}
          onClose={() => setSelectedAssignment(null)}
          title={t("Chuyển ca thi cho:") + ` ${selectedAssignment.fullName}`}
          description={t("Mã TS:") + ` ${selectedAssignment.candidateCode} • ${t("Ca hiện tại:")} ${selectedAssignment.scheduleName}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center gap-2">
              <AdminButton variant="outline" size="sm" onClick={() => setSelectedAssignment(null)}>
                {t("Hủy")}
              </AdminButton>
              <AdminButton variant="brand" size="sm" onClick={handleChangeScheduleConfirm}>
                {t("Xác nhận đổi ca")}
              </AdminButton>
            </div>
          }
        >
          <div className="space-y-4">
            <AdminSelect
              label={t("Chọn ca thi mới")}
              value={newScheduleId}
              onChange={(e) => setNewScheduleId(e.target.value)}
              options={mockSchedules
                .filter((s) => s.id !== selectedAssignment.scheduleId)
                .map((s) => ({
                  label: `${s.name} (${s.assignedCount}/${s.capacity})`,
                  value: s.id,
                }))}
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t("Lý do chuyển ca thi (Bắt buộc):")}
              </label>
              <textarea
                rows={3}
                placeholder={t("Ví dụ: Thí sinh có lịch học chính khóa đột xuất vào sáng Thứ Bảy...")}
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-3 focus:outline-hidden focus:ring-2 focus:ring-[#1F5BE0]/20"
              />
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
