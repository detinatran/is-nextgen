"use client";

import React from "react";
import AdminModal from "@/components/admin/ui/AdminModal";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import type { DuplicateReviewItem } from "@/mocks/admin/duplicates";

interface DuplicateDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: DuplicateReviewItem | null;
  onResolve: (keepCandidateId: string, note: string) => void;
  resolutionNote?: string;
}

export function DuplicateDiffModal({
  isOpen,
  onClose,
  review,
  onResolve,
  resolutionNote = "",
}: DuplicateDiffModalProps) {
  if (!isOpen || !review) return null;

  const candidates = review.conflictDetails.candidates;

  type CandidateType = typeof candidates[0];
  type FieldGetter = (c: CandidateType) => string;

  const getStudentId = (c: CandidateType) => c.profile.student_id;
  const getEmail = (c: CandidateType) => c.profile.email;
  const getPhone = (c: CandidateType) => c.profile.phone;
  const getFacebook = (c: CandidateType) => c.profile.facebook;

  const fieldsToCompare: { key: string; label: string; getter: FieldGetter }[] = [
    { key: "code", label: "Mã thí sinh", getter: (c: CandidateType) => c.code },
    { key: "name", label: "Họ và tên", getter: (c: CandidateType) => c.name },
    { key: "school", label: "Trường", getter: (c: CandidateType) => c.school },
    { key: "student_id", label: "MSSV", getter: getStudentId },
    { key: "email", label: "Email", getter: getEmail },
    { key: "phone", label: "Số điện thoại", getter: getPhone },
    { key: "facebook", label: "Facebook", getter: getFacebook },
    { key: "submittedAt", label: "Thời gian nộp", getter: (c: CandidateType) => c.submittedAt },
  ];

  const renderDiffRow = (field: typeof fieldsToCompare[0]) => {
    const values = candidates.map((c) => field.getter(c));
    const allSame = values.every((v) => v === values[0]);
    const hasConflict = !allSame && values.some((v) => v !== values[0]);

    return (
      <div
        key={field.key}
        className={`grid grid-cols-[auto_1fr_1fr] gap-3 items-center py-2 px-3 rounded-lg transition-colors ${
          hasConflict ? "bg-rose-50 border border-rose-200" : "bg-slate-50 border border-slate-200"
        }`}
      >
        <span className={`text-xs font-bold text-slate-700 ${hasConflict ? "text-rose-700" : ""}`}>
          {field.label}
        </span>
        {candidates.map((c, idx) => (
          <span
            key={idx}
            className={`text-xs font-mono text-slate-800 break-all ${
              hasConflict && values[idx] !== values[0] ? "bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold" : ""
            }`}
          >
            {values[idx] || "—"}
          </span>
        ))}
      </div>
    );
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="So sánh chi tiết hồ sơ trùng lặp"
      description={`Mã đối chiếu: ${review.id} • Dữ liệu trùng: ${review.conflictDetails.field} • Độ tương đồng: ${Math.round((review.signals.similarity_score || 0) * 100)}%`}
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            Chọn hồ sơ chính thức để giữ lại. Hồ sơ còn lại sẽ lưu vào lịch sử nhưng không được phân ca thi.
          </div>
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" size="sm" onClick={onClose}>
              Đóng
            </AdminButton>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {candidates.map((c, idx) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
            >
              <div className="flex items-center gap-2">
                <AdminBadge variant="default" size="sm">
                  Hồ sơ #{idx + 1}
                </AdminBadge>
                <span className="font-bold text-slate-900 text-sm">{c.name}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-sans tabular-nums tracking-tight">
                {c.code} • {c.school}
              </div>
              <div className="text-[11px] text-slate-500">
                Nộp lúc: <span className="font-semibold text-slate-700">{c.submittedAt}</span>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <AdminButton
                  variant="brand"
                  size="sm"
                  className="w-full"
                  onClick={() => onResolve(c.code, resolutionNote || "")}
                >
                  Giữ bản này
                </AdminButton>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Diff Table */}
        <div>
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Bảng đối chiếu chi tiết từng trường dữ liệu
          </h4>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_1fr] bg-slate-100 border-b border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
              <span>Trường</span>
              {candidates.map((c, idx) => (
                <span key={idx} className="text-center">
                  {c.code}
                </span>
              ))}
            </div>
            <div className="divide-y divide-slate-200">
              {fieldsToCompare.map(renderDiffRow)}
            </div>
          </div>
        </div>

        {/* Resolution Note */}
        <div className="pt-4 border-t border-slate-200">
          <label className="text-xs font-semibold text-slate-700 block mb-2">
            Ghi chú quyết định xử lý (bắt buộc):
          </label>
          <textarea
            rows={3}
            placeholder="Ví dụ: Thí sinh nộp nhầm video ở lượt đầu, giữ bản nộp lại... / Giữ bản nộp sớm nhất theo quy định..."
            className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-3 focus:outline-hidden focus:ring-2 focus:ring-[#1F5BE0]/20"
            onBlur={(e) => {
              // Store note temporarily for the resolve action
              (e.target as HTMLTextAreaElement).dataset.note = e.target.value;
            }}
          />
        </div>
      </div>
    </AdminModal>
  );
}

export default DuplicateDiffModal;