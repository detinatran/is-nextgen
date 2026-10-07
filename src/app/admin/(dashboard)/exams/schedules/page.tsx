"use client";

import React, { useState } from "react";
import Link from "next/link";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import AdminPopconfirm from "@/components/admin/ui/AdminPopconfirm";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import { useToastHelpers } from "@/components/admin/ui/Toast";
import { mockSchedules } from "@/mocks/admin";
import type { ScheduleItem } from "@/mocks/admin/schedules";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";
import { exportCSV } from "@/lib/admin/csv";

export default function ExamSchedulesPage() {
  const { t, lang } = useAdminI18n();
  const [schedules, setSchedules] = useState<ScheduleItem[]>(mockSchedules);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Toast
  const { success, error, warning } = useToastHelpers();

  // Form State
  const [formName, setFormName] = useState("");
  const [formOpensAt, setFormOpensAt] = useState("2026-11-08T19:00");
  const [formClosesAt, setFormClosesAt] = useState("2026-11-08T20:00");
  const [formCapacity, setFormCapacity] = useState(100);

  const handleCreateSchedule = () => {
    if (!formName.trim()) {
      warning(t("Thiếu thông tin"), t("Vui lòng nhập tên ca thi!"));
      return;
    }
    const newSch: ScheduleItem = {
      id: `sch-${Date.now()}`,
      exam_id: "exam-vong-1",
      name: formName,
      opens_at: new Date(formOpensAt).toISOString(),
      closes_at: new Date(formClosesAt).toISOString(),
      capacity: Number(formCapacity),
      assignedCount: 0,
      revision: 1,
    };
    setSchedules([...schedules, newSch]);
    setIsModalOpen(false);
    success(t("Tạo ca thi thành công"), t("Đã tạo ca thi mới thành công!"));
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule) return;

    // Block deletion if candidates are already assigned
    if (schedule.assignedCount > 0) {
      error(
        t("Không thể xóa ca thi"),
        t("Ca thi này đã có {count} thí sinh được gán. Vui lòng chuyển tất cả thí sinh sang ca khác trước khi xóa.", { count: schedule.assignedCount })
      );
      return;
    }

    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    success(t("Đã xóa ca thi"), t("Đã xóa ca thi") + ` ${schedule.name} ` + t("thành công!"));
  };

  const handleExportCSV = () => {
    exportCSV({
      filename: `IS-NextGen_Lich_Thi_Vong_1_${new Date().toISOString().slice(0, 10)}.csv`,
      columns: [
        { header: t("Tên ca thi"), key: "name" },
        { header: t("Thời gian mở ca"), key: "opens_at", render: (row) => new Date(row.opens_at).toLocaleString(lang === "vi" ? "vi-VN" : "en-US") },
        { header: t("Thời gian đóng ca"), key: "closes_at", render: (row) => new Date(row.closes_at).toLocaleString(lang === "vi" ? "vi-VN" : "en-US") },
        { header: t("Sức chứa"), key: "capacity" },
        { header: t("Đã gán"), key: "assignedCount" },
        { header: t("Trạng thái"), key: "status", render: (row) => row.assignedCount >= row.capacity ? t("ĐẦY CA") : t("CÒN CHỖ") },
      ],
      data: schedules,
    });
    success(t("Đã xuất CSV"), t("Đã xuất") + ` ${schedules.length} ` + t("ca thi ra file CSV."));
  };

  const columns: Column<ScheduleItem>[] = [
    {
      key: "name",
      header: t("Tên ca thi & Ngày giờ"),
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">{row.name}</span>
          <span className="text-xs text-slate-500 font-sans tabular-nums tracking-tight">
            {new Date(row.opens_at).toLocaleString(lang === "vi" ? "vi-VN" : "en-US")} →{" "}
            {new Date(row.closes_at).toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-US")} {t("(60 phút)")}
          </span>
        </div>
      ),
    },
    {
      key: "capacity",
      header: t("Tải mục tiêu & Sức chứa"),
      render: (row) => {
        const percent = Math.round((row.assignedCount / row.capacity) * 100);
        return (
          <div className="w-48 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">{t("Đã gán:")}</span>
              <span className="font-sans tabular-nums tracking-tight font-bold text-slate-900">
                {row.assignedCount} / {row.capacity} ({percent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all ${
                  percent >= 90
                    ? "bg-rose-500"
                    : percent >= 75
                    ? "bg-amber-500"
                    : "bg-[#1F5BE0]"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: t("Trạng thái"),
      align: "center",
      render: (row) => {
        const isFull = row.assignedCount >= row.capacity;
        return (
          <AdminBadge variant={isFull ? "danger" : "success"} size="sm">
            {isFull ? t("ĐẦY CA") : t("CÒN CHỖ")}
          </AdminBadge>
        );
      },
    },
    {
      key: "actions",
      header: t("Thao tác"),
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/exams/assignments?scheduleId=${row.id}`}>
            <AdminButton variant="outline" size="sm">
              {t("Xem danh sách TS")}
            </AdminButton>
          </Link>
          {row.assignedCount === 0 && (
            <AdminPopconfirm
              title={t("Xóa ca thi")}
              description={t("Xóa ca thi") + ` "${row.name}"? ${t("Chỉ cho phép xóa khi chưa có thí sinh được gán")}.`}
              confirmVariant="danger"
              confirmText={t("Xóa")}
              onConfirm={() => handleDeleteSchedule(row.id)}
              triggerVariant="ghost"
              triggerSize="sm"
            >
              {(open) => (
                <span
                  className={`p-1.5 rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors text-xs cursor-pointer ${open ? "bg-rose-50" : ""}`}
                  title={t("Xóa ca thi")}
                  aria-label={t("Xóa ca thi")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </span>
              )}
            </AdminPopconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {t("Quản lý Ca thi Vòng 1")}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("Thời lượng mỗi ca:")} <span className="font-bold text-slate-800">60 phút</span>
          </p>
        </div>

        <AdminButton
          variant="brand"
          size="sm"
          onClick={() => {
            setFormName("");
            setIsModalOpen(true);
          }}
        >
          + {t("Tạo ca thi mới")}
        </AdminButton>
        <AdminButton variant="outline" size="sm" onClick={handleExportCSV}>
          {t("Xuất CSV")}
        </AdminButton>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={schedules}
        keyExtractor={(item) => item.id}
      />

      {/* Create Schedule Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("Tạo ca thi mới Vòng 1")}
        description={t("Thời lượng làm bài cố định 60 phút theo thể lệ cuộc thi (round = 1)")}
        maxWidth="lg"
        footer={
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              {t("Hủy")}
            </AdminButton>
            <AdminButton variant="brand" size="sm" onClick={handleCreateSchedule}>
              {t("Xác nhận tạo ca")}
            </AdminButton>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminInput
            label={t("Tên ca thi")}
            required
            placeholder={t("Ví dụ: Ca 05 - Tối Chủ Nhật (08/11/2026)")}
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <AdminInput
              label={t("Thời gian mở ca")}
              type="datetime-local"
              required
              value={formOpensAt}
              onChange={(e) => setFormOpensAt(e.target.value)}
            />
            <AdminInput
              label={t("Thời gian đóng ca")}
              type="datetime-local"
              required
              value={formClosesAt}
              onChange={(e) => setFormClosesAt(e.target.value)}
            />
          </div>

          <AdminInput
            label={t("Sức chứa tối đa (Capacity)")}
            type="number"
            min={1}
            max={200}
            required
            value={formCapacity}
            onChange={(e) => setFormCapacity(Number(e.target.value))}
            helperText={t("Khuyến nghị: 50 - 100 thí sinh để duy trì tốc độ phản hồi < 2s")}
          />
        </div>
      </AdminModal>
    </div>
  );
}
