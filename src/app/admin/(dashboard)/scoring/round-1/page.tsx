"use client";

import React, { useState } from "react";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import AdminPopconfirm from "@/components/admin/ui/AdminPopconfirm";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";
import { useToastHelpers } from "@/components/admin/ui/Toast";
import { mockRound1Results, getTop40 } from "@/mocks/admin";
import type { Round1ResultItem } from "@/mocks/admin/scoring-round1";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

export default function Round1ScoringPage() {
  const { t } = useAdminI18n();
  const [results, setResults] = useState<Round1ResultItem[]>(mockRound1Results);
  const [filterTop, setFilterTop] = useState<"ALL" | "TOP40">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const { success } = useToastHelpers();

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
    const headers = [t("Hạng"), t("Mã TS"), t("Họ Tên"), t("MSSV"), t("Trường"), t("Điểm"), t("Số Câu Đúng"), t("Thời Gian Làm Bài"), t("Kết Quả")];
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
    success(t("Đã xuất CSV"), `${t("Đã xuất")} ${filtered.length} ${t("hồ sơ bảng điểm Vòng 1 ra file CSV.")}`);
  };

  const handlePublishConfirm = () => {
    setIsApproved(true);
    setIsPublishModalOpen(false);
    success(t("Đã phê duyệt kết quả Vòng 1"), t("Danh sách TOP 40 thí sinh đã được chốt và chuyển sang Vòng 2 (result_revisions: APPROVED)"));
  };

  const columns: Column<Round1ResultItem>[] = [
    {
      key: "rank",
      header: t("Hạng"),
      width: "70px",
      align: "center",
      render: (row) => (
        <span
          className={`font-sans tabular-nums tracking-tight text-xs font-extrabold px-2 py-0.5 rounded ${
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
      header: t("Thí sinh"),
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm block">
            {row.fullName}
          </span>
          <span className="text-[11px] text-slate-400 font-sans tabular-nums tracking-tight">
            {row.candidateCode} • {t("MSSV")}: {row.studentId} • {row.school}
          </span>
        </div>
      ),
    },
    {
      key: "score",
      header: t("Điểm thi & Tỷ lệ đúng"),
      align: "center",
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-sans tabular-nums tracking-tight text-base font-extrabold text-[#0B1F4D] block">
            {row.score.toFixed(1)}
          </span>
          <span className="text-[11px] text-slate-500 font-sans tabular-nums tracking-tight">
            {row.correctAnswers} / {row.totalQuestions} {t("câu đúng")}
          </span>
        </div>
      ),
    },
    {
      key: "timeTaken",
      header: t("Thời gian làm bài (Tie-break)"),
      render: (row) => (
        <div className="space-y-0.5">
          <span className="font-sans tabular-nums tracking-tight text-xs font-semibold text-slate-800 block">
            {formatDuration(row.timeTakenSeconds)}
          </span>
          <span className="text-[10px] text-slate-400">{t("Nộp:")} {row.submittedAt}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: t("Kết quả Vòng 1"),
      align: "center",
      render: (row) => (
        <AdminBadge variant={row.isTop40 ? "success" : "default"} size="sm">
          {row.isTop40 ? t("LỌT TOP 40 (VÀO V2)") : t("DỪNG BƯỚC")}
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
              {t("Bảng điểm tự động & Xếp hạng Vòng 1")}
            </h2>
            {isApproved && (
              <AdminBadge variant="success" size="sm">
                {t("ĐÃ PHÊ DUYỆT CHỐT SỔ")}
              </AdminBadge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("Điểm tự động tính toán từ các phương án đúng. Tiêu chí phụ khi bằng điểm: Thí sinh nộp bài sớm hơn xếp trên.")}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <AdminButton variant="outline" size="sm" onClick={handleExportCSV}>
            {t("Xuất bảng điểm (Excel/CSV)")}
          </AdminButton>
          {!isApproved && (
            <AdminPopconfirm
              title={t("Phê duyệt kết quả Vòng 1")}
              description={t("Thao tác này sẽ chuyển revision của bảng kết quả sang APPROVED và khóa bảng xếp hạng Vòng 1. Sau khi phê duyệt, 40 thí sinh TOP sẽ được gán quyền nộp bài cho Vòng 2. Hành động không thể hoàn tác.")}
              confirmVariant="primary"
              confirmText={t("Xác nhận phê duyệt")}
              onConfirm={handlePublishConfirm}
              triggerVariant="brand"
              triggerSize="sm"
            >
              {(open) => (
                <AdminButton variant="brand" size="sm">
                  {t("Phê duyệt TOP 40 vào Vòng 2")}
                </AdminButton>
              )}
            </AdminPopconfirm>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AdminInput
          placeholder={t("Tìm theo Tên thí sinh, Mã TS, MSSV...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <AdminSelect
          value={filterTop}
          onChange={(e) => setFilterTop(e.target.value as any)}
          options={[
            { label: t("Tất cả thí sinh đã có điểm"), value: "ALL" },
            { label: t("Chỉ lọc danh sách TOP 40 thí sinh đi tiếp"), value: "TOP40" },
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
        title={t("Phê duyệt kết quả Vòng 1 & Chốt danh sách TOP 40")}
        description={t("Thao tác này sẽ chuyển revision của bảng kết quả sang APPROVED và khóa bảng xếp hạng Vòng 1")}
        maxWidth="lg"
        footer={
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" size="sm" onClick={() => setIsPublishModalOpen(false)}>
              {t("Hủy")}
            </AdminButton>
            <AdminButton variant="brand" size="sm" onClick={handlePublishConfirm}>
              {t("Xác nhận phê duyệt")}
            </AdminButton>
          </div>
        }
      >
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            {t("Hệ thống đã tự động áp dụng quy chế xét giải:")}
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 font-medium">
            <li>{t("Lấy 40 thí sinh có điểm số từ cao xuống thấp.")}</li>
            <li>{t("Trường hợp bằng điểm (Tie-breaking): Ưu tiên thí sinh có thời gian làm bài ngắn hơn.")}</li>
            <li>{t("Sau khi phê duyệt, 40 thí sinh này sẽ được gán quyền nộp bài cho Vòng 2.")}</li>
          </ul>
        </div>
      </AdminModal>
    </div>
  );
}
