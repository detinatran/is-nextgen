"use client";

import React, { useState } from "react";
import Link from "next/link";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import { AdminInput } from "@/components/admin/ui/AdminInput";
import type { ExamSchedule } from "@/types/admin";

interface ScheduleItem extends ExamSchedule {
  name: string;
  assignedCount: number;
}

const mockSchedules: ScheduleItem[] = [
  {
    id: "sch-001",
    exam_id: "exam-vong-1",
    name: "Ca 01 - Sáng Thứ Bảy (07/11/2026)",
    opens_at: "2026-11-07T08:30:00+07:00",
    closes_at: "2026-11-07T09:30:00+07:00",
    capacity: 100,
    assignedCount: 85,
    revision: 1,
  },
  {
    id: "sch-002",
    exam_id: "exam-vong-1",
    name: "Ca 02 - Chiều Thứ Bảy (07/11/2026)",
    opens_at: "2026-11-07T14:30:00+07:00",
    closes_at: "2026-11-07T15:30:00+07:00",
    capacity: 100,
    assignedCount: 92,
    revision: 1,
  },
  {
    id: "sch-003",
    exam_id: "exam-vong-1",
    name: "Ca 03 - Sáng Chủ Nhật (08/11/2026)",
    opens_at: "2026-11-08T09:00:00+07:00",
    closes_at: "2026-11-08T10:00:00+07:00",
    capacity: 100,
    assignedCount: 78,
    revision: 1,
  },
  {
    id: "sch-004",
    exam_id: "exam-vong-1",
    name: "Ca 04 - Chiều Chủ Nhật (08/11/2026) [Dự phòng]",
    opens_at: "2026-11-08T15:00:00+07:00",
    closes_at: "2026-11-08T16:00:00+07:00",
    capacity: 100,
    assignedCount: 15,
    revision: 1,
  },
];

export default function ExamSchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(mockSchedules);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formName, setFormName] = useState("");
  const [formOpensAt, setFormOpensAt] = useState("2026-11-08T19:00");
  const [formClosesAt, setFormClosesAt] = useState("2026-11-08T20:00");
  const [formCapacity, setFormCapacity] = useState(100);

  const handleCreateSchedule = () => {
    if (!formName.trim()) {
      alert("Vui lòng nhập tên ca thi!");
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
    alert("Đã tạo ca thi mới thành công!");
  };

  const columns: Column<ScheduleItem>[] = [
    {
      key: "name",
      header: "Tên ca thi & Ngày giờ",
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-sm block">{row.name}</span>
          <span className="text-xs text-slate-500 font-sans tabular-nums tracking-tight">
            {new Date(row.opens_at).toLocaleString("vi-VN")} →{" "}
            {new Date(row.closes_at).toLocaleTimeString("vi-VN")} (60 phút)
          </span>
        </div>
      ),
    },
    {
      key: "capacity",
      header: "Tải mục tiêu & Sức chứa",
      render: (row) => {
        const percent = Math.round((row.assignedCount / row.capacity) * 100);
        return (
          <div className="w-48 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Đã gán:</span>
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
      header: "Trạng thái",
      align: "center",
      render: (row) => {
        const isFull = row.assignedCount >= row.capacity;
        return (
          <AdminBadge variant={isFull ? "danger" : "success"} size="sm">
            {isFull ? "ĐẦY CA" : "CÒN CHỖ"}
          </AdminBadge>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/admin/exams/assignments?scheduleId=${row.id}`}>
            <AdminButton variant="outline" size="sm">
              Xem danh sách TS
            </AdminButton>
          </Link>
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
            Quản lý Ca thi Vòng 1
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Thời lượng mỗi ca: <span className="font-bold text-slate-800">60 phút</span> • Tải mục tiêu:{" "}
            <span className="font-bold text-slate-800">50 - 100 thí sinh/ca</span> để chống nghẽn mạng.
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
          + Tạo ca thi mới
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
        title="Tạo ca thi mới Vòng 1"
        description="Thời lượng làm bài cố định 60 phút theo thể lệ cuộc thi (round = 1)"
        maxWidth="lg"
        footer={
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton variant="brand" size="sm" onClick={handleCreateSchedule}>
              Xác nhận tạo ca
            </AdminButton>
          </div>
        }
      >
        <div className="space-y-4">
          <AdminInput
            label="Tên ca thi"
            required
            placeholder="Ví dụ: Ca 05 - Tối Chủ Nhật (08/11/2026)"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <AdminInput
              label="Thời gian mở ca"
              type="datetime-local"
              required
              value={formOpensAt}
              onChange={(e) => setFormOpensAt(e.target.value)}
            />
            <AdminInput
              label="Thời gian đóng ca"
              type="datetime-local"
              required
              value={formClosesAt}
              onChange={(e) => setFormClosesAt(e.target.value)}
            />
          </div>

          <AdminInput
            label="Sức chứa tối đa (Capacity)"
            type="number"
            min={1}
            max={200}
            required
            value={formCapacity}
            onChange={(e) => setFormCapacity(Number(e.target.value))}
            helperText="Khuyến nghị: 50 - 100 thí sinh để duy trì tốc độ phản hồi < 2s"
          />
        </div>
      </AdminModal>
    </div>
  );
}
