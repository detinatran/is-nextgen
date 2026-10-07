"use client";

import React, { useState } from "react";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import AdminPopconfirm from "@/components/admin/ui/AdminPopconfirm";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";
import { useToastHelpers } from "@/components/admin/ui/Toast";
import { mockScoringCases, rubricCriteria } from "@/mocks/admin";
import type { ManualScoringItem } from "@/mocks/admin/scoring-manual";
import { useAdminI18n } from "@/lib/i18n/AdminI18nContext";

export default function ManualScoringPage() {
  const { t } = useAdminI18n();
  const [cases, setCases] = useState<ManualScoringItem[]>(mockScoringCases);
  const [selectedCase, setSelectedCase] = useState<ManualScoringItem | null>(null);
  const [stateFilter, setStateFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Toast helpers
  const { success, error, warning, info } = useToastHelpers();

  // Rubric Score state for active case
  const [scores, setScores] = useState<Record<string, number>>({
    c1: 4,
    c2: 4,
    c3: 4,
    c4: 4,
    c5: 5,
    c6: 4,
  });
  const [feedback, setFeedback] = useState("");

  const filtered = cases.filter((c) => {
    const matchQuery =
      !searchQuery ||
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.candidateCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchState = stateFilter === "ALL" || c.state === stateFilter;
    return matchQuery && matchState;
  });

  const calculateTotalScore = () => {
    let total = 0;
    rubricCriteria.forEach((c) => {
      const level = scores[c.id] || 0; // 1 to 5
      const scaled = (level / 5) * 10; // convert to 10-point scale
      total += (scaled * c.weight) / 100;
    });
    return total.toFixed(2);
  };

  const handleSaveRubric = () => {
    if (!selectedCase) return;
    const finalCalculated = parseFloat(calculateTotalScore());
    setCases((prev) =>
      prev.map((c) =>
        c.caseId === selectedCase.caseId
          ? {
              ...c,
              reviewerC: { name: "GK. Admin (Trưởng BGK)", score: finalCalculated },
              finalScore: finalCalculated,
              state: "COMPLETED",
            }
          : c
      )
    );
    setSelectedCase(null);
    success(
      t("Lưu phiếu chấm thành công"),
      `${t("Đã lưu phiếu chấm Rubric cho thí sinh")} ${selectedCase.fullName}. ${t("Điểm quy đổi:")} ${finalCalculated}/10.`
    );
  };

  const columns: Column<ManualScoringItem>[] = [
    {
      key: "candidate",
      header: t("Thí sinh & Vòng thi"),
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm block">
            {row.fullName}
          </span>
          <span className="text-[11px] text-slate-400 font-sans tabular-nums tracking-tight">
            {row.candidateCode} • {row.roundName}
          </span>
        </div>
      ),
    },
    {
      key: "scores",
      header: t("Điểm Giám khảo A & B (Thang 10)"),
      render: (row) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-16">{t("GK A:")}</span>
            <span className="font-sans tabular-nums tracking-tight font-bold text-slate-800">
              {row.reviewerA.score !== null ? `${row.reviewerA.score} ${t("đ")}` : t("Chưa chấm")}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">({row.reviewerA.name})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-16">{t("GK B:")}</span>
            <span className="font-sans tabular-nums tracking-tight font-bold text-slate-800">
              {row.reviewerB.score !== null ? `${row.reviewerB.score} ${t("đ")}` : t("Chưa chấm")}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">({row.reviewerB.name})</span>
          </div>
        </div>
      ),
    },
    {
      key: "diff",
      header: t("Độ lệch & GK C"),
      render: (row) => (
        <div>
          {row.scoreDiff !== null ? (
            <div className="space-y-1">
              <span
                className={`font-sans tabular-nums tracking-tight text-xs font-bold px-1.5 py-0.5 rounded ${
                  row.scoreDiff > 20
                    ? "bg-rose-100 text-rose-800 border border-rose-300"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {t("Lệch")} {row.scoreDiff.toFixed(1)}%
              </span>
              {row.scoreDiff > 20 && (
                <span className="text-[10px] text-rose-600 font-bold block">
                  ⚠️ {t("Cần GK C chấm lại (>20%)")}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">{t("Chưa đủ 2 điểm")}</span>
          )}
        </div>
      ),
    },
    {
      key: "finalScore",
      header: t("Điểm chốt"),
      align: "center",
      render: (row) => (
        <span className="font-sans tabular-nums tracking-tight text-base font-extrabold text-[#0B1F4D]">
          {row.finalScore !== null ? `${row.finalScore.toFixed(2)}` : "--"}
        </span>
      ),
    },
    {
      key: "state",
      header: t("Trạng thái"),
      align: "center",
      render: (row) => {
        const variant =
          row.state === "COMPLETED"
            ? "success"
            : row.state === "NEEDS_THIRD"
            ? "danger"
            : row.state === "SCORING"
            ? "warning"
            : "default";
        return (
          <AdminBadge variant={variant} size="sm">
            {row.state === "NEEDS_THIRD"
              ? t("CẦN GK 3 ĐỐI SOÁT")
              : row.state === "COMPLETED"
              ? t("HOÀN THÀNH")
              : row.state === "SCORING"
              ? t("ĐANG CHẤM")
              : t("CHỜ GÁN GK")}
          </AdminBadge>
        );
      },
    },
    {
      key: "actions",
      header: t("Thao tác"),
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <AdminButton
            variant={row.state === "NEEDS_THIRD" ? "brand" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedCase(row);
              setFeedback("");
            }}
          >
            {row.state === "NEEDS_THIRD" ? t("Chấm GK 3") : t("Phiếu Rubric")}
          </AdminButton>
          <AdminPopconfirm
            title={t("Xóa hồ sơ chấm")}
            description={t("Xóa bản ghi chấm điểm của") + ` ${row.fullName}? ${t("Hành động này không thể hoàn tác.")}`}
            confirmVariant="danger"
            confirmText={t("Xóa")}
            onConfirm={() => {
              success(t("Đã xóa hồ sơ chấm"), `${t("Đã xóa hồ sơ chấm của")} ${row.fullName}`);
            }}
            triggerVariant="ghost"
            triggerSize="sm"
          >
            {(open) => (
              <span
                className={`p-1.5 rounded-md hover:bg-rose-50 hover:text-rose-600 transition-colors text-xs cursor-pointer ${open ? "bg-rose-50" : ""}`}
                title={t("Xóa hồ sơ chấm")}
                aria-label={t("Xóa hồ sơ chấm")}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </span>
            )}
          </AdminPopconfirm>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900">
          {t("Chấm thi Rubric Tự luận & Thuyết trình")}
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {t("Khung đánh giá gồm")} <span className="font-bold text-slate-800">6 nhóm năng lực cốt lõi</span>. {t("Hệ thống tự động kích hoạt cờ")}{" "}
          <span className="font-sans tabular-nums tracking-tight font-semibold text-rose-700 bg-rose-50 px-1 rounded">NEEDS_THIRD</span> {t("khi độ lệch giữa 2 giám khảo > 20%.")}
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AdminInput
          placeholder={t("Tìm theo Tên thí sinh, Mã TS...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <AdminSelect
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          options={[
            { label: t("Tất cả trạng thái chấm"), value: "ALL" },
            { label: t("Cần GK 3 đối soát (NEEDS_THIRD)"), value: "NEEDS_THIRD" },
            { label: t("Đang chấm (SCORING)"), value: "SCORING" },
            { label: t("Đã hoàn thành (COMPLETED)"), value: "COMPLETED" },
          ]}
        />
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.caseId}
      />

      {/* Rubric Evaluation Modal */}
      {selectedCase && (
        <AdminModal
          isOpen={true}
          onClose={() => setSelectedCase(null)}
          title={t("Phiếu đánh giá Rubric:") + ` ${selectedCase.fullName}`}
          description={t("Mã TS:") + ` ${selectedCase.candidateCode} • ${selectedCase.roundName}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs font-sans tabular-nums tracking-tight text-slate-700">
                {t("Tổng điểm quy đổi (Thang 10):")}{" "}
                <span className="text-base font-extrabold text-[#0B1F4D]">
                  {calculateTotalScore()} / 10.0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AdminButton variant="outline" size="sm" onClick={() => setSelectedCase(null)}>
                  {t("Đóng")}
                </AdminButton>
                <AdminButton variant="brand" size="sm" onClick={handleSaveRubric}>
                  {t("Lưu & Phê duyệt điểm")}
                </AdminButton>
              </div>
            </div>
          }
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {rubricCriteria.map((item) => (
              <div key={item.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.name}</h4>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                  <AdminBadge variant="default" size="sm">
                    {t("Trọng số:")} {item.weight}%
                  </AdminBadge>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setScores({ ...scores, [item.id]: lvl })}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        scores[item.id] === lvl
                          ? "bg-[#0B1F4D] text-white border-[#0B1F4D] shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t("Mức")} {lvl}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {t("Nhận xét & Ghi chú của Giám khảo:")}
              </label>
              <textarea
                rows={3}
                placeholder={t("Nhận xét điểm mạnh, điểm cần cải thiện của thí sinh...")}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-3 focus:outline-hidden focus:ring-2 focus:ring-[#1F5BE0]/20"
              />
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}