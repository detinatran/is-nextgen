"use client";

import React, { useState } from "react";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";

interface Round1ResultItem {
  id: string;
  rank: number;
  candidateCode: string;
  fullName: string;
  studentId: string;
  school: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTakenSeconds: number; // For tie-breaking
  submittedAt: string;
  isTop40: boolean;
  status: "QUALIFIED" | "ELIMINATED";
}

const mockRound1Results: Round1ResultItem[] = [
  {
    id: "res-001",
    rank: 1,
    candidateCode: "CAND-00101",
    fullName: "Nguyễn Hoàng Nam",
    studentId: "22070145",
    school: "Trường Quốc tế - ĐHQGHN",
    score: 95.0,
    correctAnswers: 38,
    totalQuestions: 40,
    timeTakenSeconds: 2145, // 35m 45s
    submittedAt: "07/11/2026 09:05:45",
    isTop40: true,
    status: "QUALIFIED",
  },
  {
    id: "res-002",
    rank: 2,
    candidateCode: "CAND-00102",
    fullName: "Trần Thị Mai Anh",
    studentId: "23041088",
    school: "Đại học Ngoại Thương",
    score: 92.5,
    correctAnswers: 37,
    totalQuestions: 40,
    timeTakenSeconds: 2310, // 38m 30s
    submittedAt: "07/11/2026 09:08:30",
    isTop40: true,
    status: "QUALIFIED",
  },
  {
    id: "res-003",
    rank: 3,
    candidateCode: "CAND-00103",
    fullName: "Lê Minh Tuấn",
    studentId: "22070982",
    school: "Trường Quốc tế - ĐHQGHN",
    score: 90.0,
    correctAnswers: 36,
    totalQuestions: 40,
    timeTakenSeconds: 1980, // 33m 00s
    submittedAt: "07/11/2026 09:03:00",
    isTop40: true,
    status: "QUALIFIED",
  },
  {
    id: "res-004",
    rank: 4,
    candidateCode: "CAND-00104",
    fullName: "Phạm Hải Đăng",
    studentId: "21050321",
    school: "Đại học Kinh tế Quốc dân",
    score: 87.5,
    correctAnswers: 35,
    totalQuestions: 40,
    timeTakenSeconds: 2450,
    submittedAt: "07/11/2026 09:10:50",
    isTop40: true,
    status: "QUALIFIED",
  },
  {
    id: "res-040",
    rank: 40,
    candidateCode: "CAND-00140",
    fullName: "Hoàng Đức Anh",
    studentId: "23071190",
    school: "Đại học Thương Mại",
    score: 72.5,
    correctAnswers: 29,
    totalQuestions: 40,
    timeTakenSeconds: 3100,
    submittedAt: "07/11/2026 09:21:40",
    isTop40: true,
    status: "QUALIFIED",
  },
  {
    id: "res-041",
    rank: 41,
    candidateCode: "CAND-00141",
    fullName: "Đỗ Bích Ngọc",
    studentId: "22040512",
    school: "Học viện Ngân hàng",
    score: 70.0,
    correctAnswers: 28,
    totalQuestions: 40,
    timeTakenSeconds: 2890,
    submittedAt: "07/11/2026 09:18:10",
    isTop40: false,
    status: "ELIMINATED",
  },
];

export default function Round1ScoringPage() {
  const [results, setResults] = useState<Round1ResultItem[]>(mockRound1Results);
  const [filterTop, setFilterTop] = useState<"ALL" | "TOP40">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const filtered = results.filter((item) => {
    const matchQuery =
      !searchQuery ||
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentId.includes(searchQuery);

    const matchTop = filterTop === "ALL" || (filterTop === "TOP40" && item.isTop40);

    return matchQuery && matchTop;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}p ${secs}s`;
  };

  const handleExportCSV = () => {
    const headers = ["Hang", "Ma_TS", "Ho_Ten", "MSSV", "Truong", "Diem", "So_Cau_Dung", "Thoi_Gian_Lam_Bai", "Ket_Qua"];
    const rows = filtered.map((r) => [
      r.rank,
      r.candidateCode,
      `"${r.fullName}"`,
      r.studentId,
      `"${r.school}"`,
      r.score,
      `${r.correctAnswers}/${r.totalQuestions}`,
      formatDuration(r.timeTakenSeconds),
      r.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,﻿" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bang_Diem_Vong_1_ISNextGen_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePublishConfirm = () => {
    setIsApproved(true);
    setIsPublishModalOpen(false);
    alert("Đã phê duyệt và chốt danh sách TOP 40 bước vào Vòng 2 (result_revisions: APPROVED)!");
  };

  const columns: Column<Round1ResultItem>[] = [
    {
      key: "rank",
      header: "Hạng",
      width: "70px",
      align: "center",
      render: (row) => (
        <span
          className={`font-mono text-xs font-extrabold px-2 py-0.5 rounded ${
            row.rank <= 3
              ? "bg-amber-100 text-amber-900 border border-amber-300"
              : row.rank <= 40
              ? "bg-sky-50 text-sky-800 border border-sky-200"
              : "text-slate-500"
          }`}
        >
          #{row.rank}
        </span>
      ),
    },
    {
      key: "candidate",
      header: "Thí sinh",
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm block">
            {row.fullName}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {row.candidateCode} • MSSV: {row.studentId} • {row.school}
          </span>
        </div>
      ),
    },
    {
      key: "score",
      header: "Điểm thi & Tỷ lệ đúng",
      align: "center",
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-mono text-base font-extrabold text-[#0B1F4D] block">
            {row.score.toFixed(1)}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {row.correctAnswers} / {row.totalQuestions} câu đúng
          </span>
        </div>
      ),
    },
    {
      key: "timeTaken",
      header: "Thời gian làm bài (Tie-break)",
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-semibold text-slate-800 block">
            {formatDuration(row.timeTakenSeconds)}
          </span>
          <span className="text-[10px] text-slate-400">Nộp: {row.submittedAt}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Kết quả Vòng 1",
      align: "center",
      render: (row) => (
        <AdminBadge variant={row.isTop40 ? "success" : "default"} size="sm">
          {row.isTop40 ? "LỌT TOP 40 (VÀO V2)" : "DỪNG BƯỚC"}
        </AdminBadge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Bảng điểm tự động & Xếp hạng Vòng 1
            </h2>
            {isApproved && (
              <AdminBadge variant="success" size="sm">
                ĐÃ PHÊ DUYỆT CHỐT SỔ
              </AdminBadge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Điểm tự động tính toán từ các phương án đúng. Tiêu chí phụ khi bằng điểm: Thí sinh nộp bài sớm hơn xếp trên.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <AdminButton variant="outline" size="sm" onClick={handleExportCSV}>
            Xuất bảng điểm (Excel/CSV)
          </AdminButton>
          {!isApproved && (
            <AdminButton
              variant="brand"
              size="sm"
              onClick={() => setIsPublishModalOpen(true)}
            >
              Phê duyệt TOP 40 vào Vòng 2
            </AdminButton>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AdminInput
          placeholder="Tìm theo Tên thí sinh, Mã TS, MSSV..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <AdminSelect
          value={filterTop}
          onChange={(e) => setFilterTop(e.target.value as any)}
          options={[
            { label: "Tất cả thí sinh đã có điểm", value: "ALL" },
            { label: "Chỉ lọc danh sách TOP 40 thí sinh đi tiếp", value: "TOP40" },
          ]}
        />
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
      />

      {/* Publish Modal */}
      <AdminModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="Phê duyệt kết quả Vòng 1 & Chốt danh sách TOP 40"
        description="Thao tác này sẽ chuyển revision của bảng kết quả sang APPROVED và khóa bảng xếp hạng Vòng 1"
        maxWidth="lg"
        footer={
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" size="sm" onClick={() => setIsPublishModalOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton variant="brand" size="sm" onClick={handlePublishConfirm}>
              Xác nhận phê duyệt
            </AdminButton>
          </div>
        }
      >
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            Hệ thống đã tự động áp dụng quy chế xét giải:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 font-medium">
            <li>Lấy 40 thí sinh có điểm số từ cao xuống thấp.</li>
            <li>Trường hợp bằng điểm (Tie-breaking): Ưu tiên thí sinh có thời gian làm bài ngắn hơn.</li>
            <li>Sau khi phê duyệt, 40 thí sinh này sẽ được gán quyền nộp bài cho Vòng 2.</li>
          </ul>
        </div>
      </AdminModal>
    </div>
  );
}
