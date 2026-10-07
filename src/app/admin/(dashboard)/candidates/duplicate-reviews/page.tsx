"use client";

import React, { useState } from "react";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import { useToastHelpers } from "@/components/admin/ui/Toast";
import { mockDuplicates, getDuplicateById } from "@/mocks/admin";
import type { DuplicateReviewItem } from "@/mocks/admin/duplicates";
import DuplicateDiffModal from "@/components/admin/candidate/DuplicateDiffModal";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

export default function DuplicateReviewsPage() {
  const { t } = useAdminI18n();
  const [reviews, setReviews] = useState<DuplicateReviewItem[]>(mockDuplicates);
  const [selectedReview, setSelectedReview] = useState<DuplicateReviewItem | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");

  const { success } = useToastHelpers();

  const handleResolve = (keepCandidateId: string, note: string = "") => {
    if (!selectedReview) return;
    setReviews((prev) =>
      prev.map((r) =>
        r.id === selectedReview.id
          ? {
              ...r,
              state: "RESOLVED",
              disposition: `${t("Giữ lại bản ghi")} [${keepCandidateId}] - ${t("Ghi chú")}: ${note || t("Hợp lệ")}`,
              reviewed_at: new Date().toISOString(),
            }
          : r
      )
    );
    setSelectedReview(null);
    success(t("Đã giải quyết trùng lặp"), `${t("Đã giữ lại hồ sơ")} ${keepCandidateId}.`);
  };

  const columns: Column<DuplicateReviewItem>[] = [
    {
      key: "id",
      header: t("Mã Review"),
      width: "120px",
      render: (row) => <span className="font-sans tabular-nums tracking-tight text-xs font-bold">{row.id}</span>,
    },
    {
      key: "conflict",
      header: t("Trường dữ liệu nghi ngờ"),
      render: (row) => (
        <div>
          <span className="font-bold text-rose-700 text-xs block">
            {row.conflictDetails.field}
          </span>
          <span className="text-xs text-slate-500 font-sans tabular-nums tracking-tight">
            {t("Giá trị trùng")}: {row.conflictDetails.value}
          </span>
        </div>
      ),
    },
    {
      key: "candidates",
      header: t("Các hồ sơ liên quan"),
      render: (row) => (
        <div className="space-y-1">
          {row.conflictDetails.candidates.map((c, i) => (
            <div key={i} className="text-xs flex items-center gap-2">
              <span className="font-sans tabular-nums tracking-tight font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                {c.code}
              </span>
              <span className="font-medium text-slate-900">{c.name}</span>
              <span className="text-slate-400">({c.submittedAt})</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "state",
      header: t("Trạng thái"),
      align: "center",
      render: (row) => (
        <AdminBadge
          variant={row.state === "OPEN" ? "warning" : "success"}
          size="sm"
        >
          {row.state === "OPEN" ? t("Cần xử lý") : t("Đã giải quyết")}
        </AdminBadge>
      ),
    },
    {
      key: "actions",
      header: t("Thao tác"),
      align: "right",
      render: (row) =>
        row.state === "OPEN" ? (
          <AdminButton
            variant="primary"
            size="sm"
            onClick={() => setSelectedReview(row)}
          >
            {t("Xử lý trùng lặp")}
          </AdminButton>
        ) : (
          <span className="text-xs text-slate-400 font-sans tabular-nums tracking-tight">
            {row.disposition?.slice(0, 30)}...
          </span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900">
          {t("Rà soát hồ sơ trùng lặp")}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {t("Hệ thống phát hiện hồ sơ có dấu hiệu nộp trùng lặp (chung MSSV, Số điện thoại, Email hoặc Link Facebook) để Ban Chuyên môn đối chiếu và hợp nhất.")}
        </p>
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={reviews}
        keyExtractor={(item) => item.id}
      />

      {/* Duplicate Diff Modal */}
      <DuplicateDiffModal
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        review={selectedReview}
        onResolve={handleResolve}
        resolutionNote={resolutionNote}
      />
    </div>
  );
}
