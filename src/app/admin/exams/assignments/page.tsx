"use client";

import React, { useState } from "react";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";

interface AssignmentItem {
  id: string;
  candidateCode: string;
  fullName: string;
  studentId: string;
  school: string;
  scheduleId: string;
  scheduleName: string;
  assignedAt: string;
  historyCount: number;
}

const mockSchedules = [
  { id: "sch-001", name: "Ca 01 - Sáng T7 (07/11 08:30)", capacity: 100, current: 85 },
  { id: "sch-002", name: "Ca 02 - Chiều T7 (07/11 14:30)", capacity: 100, current: 92 },
  { id: "sch-003", name: "Ca 03 - Sáng CN (08/11 09:00)", capacity: 100, current: 78 },
];

const mockAssignments: AssignmentItem[] = [
  {
    id: "asg-001",
    candidateCode: "CAND-00101",
    fullName: "Nguyễn Hoàng Nam",
    studentId: "22070145",
    school: "Trường Quốc tế - ĐHQGHN",
    scheduleId: "sch-001",
    scheduleName: "Ca 01 - Sáng T7 (07/11 08:30)",
    assignedAt: "01/10/2026 10:00",
    historyCount: 0,
  },
  {
    id: "asg-002",
    candidateCode: "CAND-00102",
    fullName: "Trần Thị Mai Anh",
    studentId: "23041088",
    school: "Đại học Ngoại Thương",
    scheduleId: "sch-001",
    scheduleName: "Ca 01 - Sáng T7 (07/11 08:30)",
    assignedAt: "01/10/2026 11:30",
    historyCount: 1,
  },
  {
    id: "asg-003",
    candidateCode: "CAND-00103",
    fullName: "Lê Minh Tuấn",
    studentId: "22070982",
    school: "Trường Quốc tế - ĐHQGHN",
    scheduleId: "sch-002",
    scheduleName: "Ca 02 - Chiều T7 (07/11 14:30)",
    assignedAt: "02/10/2026 09:00",
    historyCount: 0,
  },
  {
    id: "asg-004",
    candidateCode: "CAND-00104",
    fullName: "Phạm Hải Đăng",
    studentId: "21050321",
    school: "Đại học Kinh tế Quốc dân",
    scheduleId: "sch-003",
    scheduleName: "Ca 03 - Sáng CN (08/11 09:00)",
    assignedAt: "03/10/2026 14:15",
    historyCount: 0,
  },
];

export default function CandidateAssignmentsPage() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>(mockAssignments);
  const [scheduleFilter, setScheduleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
      alert("Vui lòng nhập lý do đổi ca thi (bắt buộc theo quy chế kiểm toán)!");
      return;
    }
    const targetSchedule = mockSchedules.find((s) => s.id === newScheduleId);
    if (!targetSchedule) return;

    if (targetSchedule.current >= targetSchedule.capacity) {
      alert("Ca thi này đã đạt sức chứa tối đa (Capacity)! Vui lòng chọn ca khác.");
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
    alert("Đã chuyển ca thi và ghi nhận lịch sử đổi ca thành công!");
  };

  const columns: Column<AssignmentItem>[] = [
    {
      key: "candidateCode",
      header: "Mã TS",
      width: "120px",
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {row.candidateCode}
        </span>
      ),
    },
    {
      key: "name",
      header: "Họ và tên thí sinh",
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm block">
            {row.fullName}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            MSSV: {row.studentId} • {row.school}
          </span>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Ca thi được phân bổ",
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-[#0B1F4D] block">
            {row.scheduleName}
          </span>
          <span className="text-[11px] text-slate-400">Gán lúc: {row.assignedAt}</span>
        </div>
      ),
    },
    {
      key: "history",
      header: "Lịch sử đổi ca",
      align: "center",
      render: (row) => (
        <AdminBadge variant={row.historyCount > 0 ? "warning" : "default"} size="sm">
          {row.historyCount > 0 ? `${row.historyCount} lần đổi` : "Chưa đổi"}
        </AdminBadge>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <AdminButton
          variant="outline"
          size="sm"
          onClick={() => {
            setSelectedAssignment(row);
            setNewScheduleId(row.scheduleId === "sch-001" ? "sch-002" : "sch-001");
            setChangeReason("");
          }}
        >
          Đổi ca thi
        </AdminButton>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900">
          Phân ca thi & Lịch sử điều phối thí sinh
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Quản lý danh sách thí sinh trong từng ca thi. Mọi thao tác đổi ca đều được lưu vết vào bảng{" "}
          <span className="font-mono font-semibold text-slate-700">assignment_schedule_history</span>.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AdminInput
          placeholder="Tìm theo Mã TS, Họ tên, MSSV..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <AdminSelect
          value={scheduleFilter}
          onChange={(e) => setScheduleFilter(e.target.value)}
          options={[
            { label: "Tất cả các ca thi", value: "ALL" },
            { label: "Ca 01 - Sáng T7 (07/11 08:30)", value: "sch-001" },
            { label: "Ca 02 - Chiều T7 (07/11 14:30)", value: "sch-002" },
            { label: "Ca 03 - Sáng CN (08/11 09:00)", value: "sch-003" },
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
          title={`Chuyển ca thi cho: ${selectedAssignment.fullName}`}
          description={`Mã TS: ${selectedAssignment.candidateCode} • Ca hiện tại: ${selectedAssignment.scheduleName}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center gap-2">
              <AdminButton variant="outline" size="sm" onClick={() => setSelectedAssignment(null)}>
                Hủy
              </AdminButton>
              <AdminButton variant="brand" size="sm" onClick={handleChangeScheduleConfirm}>
                Xác nhận đổi ca
              </AdminButton>
            </div>
          }
        >
          <div className="space-y-4">
            <AdminSelect
              label="Chọn ca thi mới"
              value={newScheduleId}
              onChange={(e) => setNewScheduleId(e.target.value)}
              options={mockSchedules
                .filter((s) => s.id !== selectedAssignment.scheduleId)
                .map((s) => ({
                  label: `${s.name} (${s.current}/${s.capacity})`,
                  value: s.id,
                }))}
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Lý do chuyển ca thi (Bắt buộc):
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Thí sinh có lịch học chính khóa đột xuất vào sáng Thứ Bảy..."
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
