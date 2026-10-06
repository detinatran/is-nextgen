"use client";

import React, { useState } from "react";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";

interface ManualScoringItem {
  caseId: string;
  candidateCode: string;
  fullName: string;
  roundName: "Vòng 2 (Video & Tự luận)" | "Vòng Chung kết (Thuyết trình)";
  reviewerA: { name: string; score: number | null };
  reviewerB: { name: string; score: number | null };
  reviewerC: { name: string; score: number | null };
  scoreDiff: number | null; // % discrepancy
  finalScore: number | null;
  state: "AWAITING_REVIEWERS" | "SCORING" | "NEEDS_THIRD" | "COMPLETED";
}

const mockScoringCases: ManualScoringItem[] = [
  {
    caseId: "case-001",
    candidateCode: "CAND-00101",
    fullName: "Nguyễn Hoàng Nam",
    roundName: "Vòng 2 (Video & Tự luận)",
    reviewerA: { name: "GK. TS. Trần Hải Yến", score: 8.5 },
    reviewerB: { name: "GK. ThS. Lê Đình Phong", score: 8.2 },
    reviewerC: { name: "Chưa gán", score: null },
    scoreDiff: 3.6,
    finalScore: 8.35,
    state: "COMPLETED",
  },
  {
    caseId: "case-002",
    candidateCode: "CAND-00102",
    fullName: "Trần Thị Mai Anh",
    roundName: "Vòng 2 (Video & Tự luận)",
    reviewerA: { name: "GK. TS. Trần Hải Yến", score: 9.0 },
    reviewerB: { name: "GK. ThS. Lê Đình Phong", score: 6.8 },
    reviewerC: { name: "GK. PGS. Nguyễn Văn An", score: 8.0 },
    scoreDiff: 24.4, // > 20% -> NEEDS_THIRD triggered
    finalScore: 8.0,
    state: "NEEDS_THIRD",
  },
  {
    caseId: "case-003",
    candidateCode: "CAND-00103",
    fullName: "Lê Minh Tuấn",
    roundName: "Vòng 2 (Video & Tự luận)",
    reviewerA: { name: "GK. TS. Trần Hải Yến", score: 7.8 },
    reviewerB: { name: "GK. ThS. Lê Đình Phong", score: null },
    reviewerC: { name: "Chưa gán", score: null },
    scoreDiff: null,
    finalScore: null,
    state: "SCORING",
  },
  {
    caseId: "case-004",
    candidateCode: "CAND-00104",
    fullName: "Phạm Hải Đăng",
    roundName: "Vòng Chung kết (Thuyết trình)",
    reviewerA: { name: "Chưa chấm", score: null },
    reviewerB: { name: "Chưa chấm", score: null },
    reviewerC: { name: "Chưa gán", score: null },
    scoreDiff: null,
    finalScore: null,
    state: "AWAITING_REVIEWERS",
  },
];

const rubricCriteria = [
  { id: "c1", name: "1. Tư duy hệ thống & Đổi mới sáng tạo", weight: 20, desc: "Khả năng phân tích bức tranh tổng thể, đề xuất giải pháp có tính đột phá" },
  { id: "c2", name: "2. Năng lực số & Phân tích dữ liệu", weight: 20, desc: "Ứng dụng công nghệ/AI và ra quyết định dựa trên bằng chứng số liệu" },
  { id: "c3", name: "3. Lãnh đạo & Tạo ảnh hưởng", weight: 20, desc: "Khả năng truyền cảm hứng, giải quyết xung đột và điều phối đội ngũ" },
  { id: "c4", name: "4. Quản trị thực thi & Hướng tới kết quả", weight: 15, desc: "Lập kế hoạch hành động khả thi, quản trị rủi ro và đo lường KPI" },
  { id: "c5", name: "5. Đạo đức nghề nghiệp & Trách nhiệm xã hội (ESG)", weight: 10, desc: "Tuân thủ chuẩn mực đạo đức, phát triển bền vững" },
  { id: "c6", name: "6. Kỹ năng giao tiếp & Thuyết trình chuyên nghiệp", weight: 15, desc: "Lập luận mạch lạc, phản biện sắc bén, thần thái tự tin" },
];

export default function ManualScoringPage() {
  const [cases, setCases] = useState<ManualScoringItem[]>(mockScoringCases);
  const [selectedCase, setSelectedCase] = useState<ManualScoringItem | null>(null);
  const [stateFilter, setStateFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
    alert(`Đã lưu phiếu chấm Rubric cho thí sinh ${selectedCase.fullName} thành công! Điểm quy đổi: ${finalCalculated}/10.`);
  };

  const columns: Column<ManualScoringItem>[] = [
    {
      key: "candidate",
      header: "Thí sinh & Vòng thi",
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
      header: "Điểm Giám khảo A & B (Thang 10)",
      render: (row) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-16">GK A:</span>
            <span className="font-sans tabular-nums tracking-tight font-bold text-slate-800">
              {row.reviewerA.score !== null ? `${row.reviewerA.score} đ` : "Chưa chấm"}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">({row.reviewerA.name})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 w-16">GK B:</span>
            <span className="font-sans tabular-nums tracking-tight font-bold text-slate-800">
              {row.reviewerB.score !== null ? `${row.reviewerB.score} đ` : "Chưa chấm"}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">({row.reviewerB.name})</span>
          </div>
        </div>
      ),
    },
    {
      key: "diff",
      header: "Độ lệch & GK C",
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
                Lệch {row.scoreDiff.toFixed(1)}%
              </span>
              {row.scoreDiff > 20 && (
                <span className="text-[10px] text-rose-600 font-bold block">
                  ⚠️ Cần GK C chấm lại (&gt;20%)
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic">Chưa đủ 2 điểm</span>
          )}
        </div>
      ),
    },
    {
      key: "finalScore",
      header: "Điểm chốt",
      align: "center",
      render: (row) => (
        <span className="font-sans tabular-nums tracking-tight text-base font-extrabold text-[#0B1F4D]">
          {row.finalScore !== null ? `${row.finalScore.toFixed(2)}` : "--"}
        </span>
      ),
    },
    {
      key: "state",
      header: "Trạng thái",
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
              ? "CẦN GK 3 ĐỐI SOÁT"
              : row.state === "COMPLETED"
              ? "HOÀN THÀNH"
              : row.state === "SCORING"
              ? "ĐANG CHẤM"
              : "CHỜ GÁN GK"}
          </AdminBadge>
        );
      },
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <AdminButton
          variant={row.state === "NEEDS_THIRD" ? "brand" : "outline"}
          size="sm"
          onClick={() => {
            setSelectedCase(row);
            setFeedback("");
          }}
        >
          {row.state === "NEEDS_THIRD" ? "Chấm GK 3" : "Phiếu Rubric"}
        </AdminButton>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900">
          Chấm thi Rubric Tự luận & Thuyết trình
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Khung đánh giá gồm <span className="font-bold text-slate-800">6 nhóm năng lực cốt lõi</span>. Hệ thống tự động kích hoạt cờ{" "}
          <span className="font-sans tabular-nums tracking-tight font-semibold text-rose-700 bg-rose-50 px-1 rounded">NEEDS_THIRD</span> khi độ lệch giữa 2 giám khảo &gt; 20%.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AdminInput
          placeholder="Tìm theo Tên thí sinh, Mã TS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <AdminSelect
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          options={[
            { label: "Tất cả trạng thái chấm", value: "ALL" },
            { label: "Cần GK 3 đối soát (NEEDS_THIRD)", value: "NEEDS_THIRD" },
            { label: "Đang chấm (SCORING)", value: "SCORING" },
            { label: "Đã hoàn thành (COMPLETED)", value: "COMPLETED" },
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
          title={`Phiếu đánh giá Rubric: ${selectedCase.fullName}`}
          description={`Mã TS: ${selectedCase.candidateCode} • ${selectedCase.roundName}`}
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-xs font-sans tabular-nums tracking-tight text-slate-700">
                Tổng điểm quy đổi (Thang 10):{" "}
                <span className="text-base font-extrabold text-[#0B1F4D]">
                  {calculateTotalScore()} / 10.0
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AdminButton variant="outline" size="sm" onClick={() => setSelectedCase(null)}>
                  Đóng
                </AdminButton>
                <AdminButton variant="brand" size="sm" onClick={handleSaveRubric}>
                  Lưu & Phê duyệt điểm
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
                    Trọng số: {item.weight}%
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
                      Mức {lvl}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nhận xét & Ghi chú của Giám khảo:
              </label>
              <textarea
                rows={3}
                placeholder="Nhận xét điểm mạnh, điểm cần cải thiện của thí sinh..."
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
