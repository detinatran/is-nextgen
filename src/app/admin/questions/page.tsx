"use client";

import React, { useState } from "react";
import Link from "next/link";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";
import type { QuestionVersion, QuestionOption, QuestionDifficulty } from "@/types/admin";

interface QuestionItem extends QuestionVersion {
  poolName: string;
}

const mockQuestions: QuestionItem[] = [
  {
    id: "qv-001",
    question_id: "q-001",
    version: 1,
    state: "FROZEN",
    prompt: "Trong bối cảnh chuyển đổi số, mô hình quản trị nào sau đây đề cao tính linh hoạt và khả năng tự tổ chức của các nhóm liên chức năng (cross-functional teams)?",
    difficulty: "EASY",
    revision: 1,
    created_by_user_id: "u-admin-01",
    frozen_at: "2026-10-01T00:00:00Z",
    poolName: "Kiến thức quản trị nền tảng",
    options: [
      { id: "opt-1", question_version_id: "qv-001", position: 1, text: "Mô hình Agile / Scrum", is_correct: true },
      { id: "opt-2", question_version_id: "qv-001", position: 2, text: "Mô hình Thác nước (Waterfall)", is_correct: false },
      { id: "opt-3", question_version_id: "qv-001", position: 3, text: "Mô hình Phân cấp thứ bậc truyền thống (Bureaucracy)", is_correct: false },
      { id: "opt-4", question_version_id: "qv-001", position: 4, text: "Mô hình Quản trị chuyên chế (Autocratic)", is_correct: false },
    ],
  },
  {
    id: "qv-002",
    question_id: "q-002",
    version: 2,
    state: "FROZEN",
    prompt: "Một nhà quản trị đối mặt với tình huống: Chi phí vận hành tăng 15% trong khi doanh thu giảm 5% do đối thủ cạnh tranh ứng dụng AI tối ưu hóa chuỗi cung ứng. Quyết định chiến lược ưu tiên ngắn hạn là gì?",
    difficulty: "HARD",
    revision: 2,
    created_by_user_id: "u-admin-01",
    frozen_at: "2026-10-02T10:00:00Z",
    poolName: "Tư duy phân tích & Ra quyết định",
    options: [
      { id: "opt-5", question_version_id: "qv-002", position: 1, text: "Cắt giảm ngay 20% nhân sự để bù đắp thâm hụt dòng tiền", is_correct: false },
      { id: "opt-6", question_version_id: "qv-002", position: 2, text: "Rà soát điểm nghẽn chi phí chuỗi cung ứng, lập dự án thí điểm AI tối ưu tồn kho", is_correct: true },
      { id: "opt-7", question_version_id: "qv-002", position: 3, text: "Vay vốn ngắn hạn ngân hàng để mở rộng chiến dịch quảng bá đại trà", is_correct: false },
      { id: "opt-8", question_version_id: "qv-002", position: 4, text: "Hạ giá bán sản phẩm xuống thấp hơn đối thủ 10%", is_correct: false },
    ],
  },
  {
    id: "qv-003",
    question_id: "q-003",
    version: 1,
    state: "DRAFT",
    prompt: "Chỉ số ROI (Return on Investment) của một dự án đầu tư phần mềm quản trị được tính theo công thức chuẩn nào?",
    difficulty: "MEDIUM",
    revision: 1,
    created_by_user_id: "u-admin-02",
    frozen_at: null,
    poolName: "Tư duy số liệu & Tài chính",
    options: [
      { id: "opt-9", question_version_id: "qv-003", position: 1, text: "(Lợi nhuận ròng / Chi phí đầu tư) x 100%", is_correct: true },
      { id: "opt-10", question_version_id: "qv-003", position: 2, text: "(Doanh thu / Chi phí đầu tư) x 100%", is_correct: false },
      { id: "opt-11", question_version_id: "qv-003", position: 3, text: "(Dòng tiền thuần / Vốn chủ sở hữu) x 100%", is_correct: false },
      { id: "opt-12", question_version_id: "qv-003", position: 4, text: "Tổng lợi nhuận gộp trừ đi thuế doanh nghiệp", is_correct: false },
    ],
  },
];

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>(mockQuestions);
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null);

  // Form State
  const [formPrompt, setFormPrompt] = useState("");
  const [formDifficulty, setFormDifficulty] = useState<QuestionDifficulty>("MEDIUM");
  const [formPool, setFormPool] = useState("Kiến thức quản trị nền tảng");
  const [formOptions, setFormOptions] = useState<{ text: string; is_correct: boolean }[]>([
    { text: "", is_correct: true },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ]);

  const filteredQuestions = questions.filter((q) => {
    const matchQuery = !searchQuery || q.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDiff = difficultyFilter === "ALL" || q.difficulty === difficultyFilter;
    const matchState = stateFilter === "ALL" || q.state === stateFilter;
    return matchQuery && matchDiff && matchState;
  });

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    setFormPrompt("");
    setFormDifficulty("MEDIUM");
    setFormPool("Kiến thức quản trị nền tảng");
    setFormOptions([
      { text: "", is_correct: true },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ]);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (q: QuestionItem) => {
    if (q.state === "FROZEN") {
      alert("Câu hỏi này đã đóng băng (FROZEN) để dùng cho bài thi. Hệ thống cơ sở dữ liệu chặn chỉnh sửa trực tiếp để bảo vệ tính toàn vẹn (protect_question_version). Bạn cần tạo phiên bản mới!");
      return;
    }
    setEditingQuestion(q);
    setFormPrompt(q.prompt);
    setFormDifficulty(q.difficulty);
    setFormPool(q.poolName);
    setFormOptions(
      q.options?.map((o) => ({ text: o.text, is_correct: o.is_correct })) || []
    );
    setIsEditorOpen(true);
  };

  const handleSaveQuestion = () => {
    if (!formPrompt.trim()) {
      alert("Vui lòng nhập nội dung câu hỏi!");
      return;
    }
    const hasCorrect = formOptions.some((o) => o.is_correct && o.text.trim());
    if (!hasCorrect) {
      alert("Câu hỏi phải có ít nhất 1 đáp án đúng và có nội dung!");
      return;
    }

    if (editingQuestion) {
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === editingQuestion.id
            ? {
                ...item,
                prompt: formPrompt,
                difficulty: formDifficulty,
                poolName: formPool,
                options: formOptions.map((opt, idx) => ({
                  id: `opt-edit-${idx}`,
                  question_version_id: item.id,
                  position: idx + 1,
                  text: opt.text,
                  is_correct: opt.is_correct,
                })),
              }
            : item
        )
      );
    } else {
      const newId = `qv-${Date.now()}`;
      const newQuestion: QuestionItem = {
        id: newId,
        question_id: `q-${Date.now()}`,
        version: 1,
        state: "DRAFT",
        prompt: formPrompt,
        difficulty: formDifficulty,
        revision: 1,
        created_by_user_id: "u-admin-current",
        frozen_at: null,
        poolName: formPool,
        options: formOptions.map((opt, idx) => ({
          id: `opt-new-${idx}`,
          question_version_id: newId,
          position: idx + 1,
          text: opt.text,
          is_correct: opt.is_correct,
        })),
      };
      setQuestions([newQuestion, ...questions]);
    }

    setIsEditorOpen(false);
  };

  const handleFreeze = (q: QuestionItem) => {
    if (
      confirm(
        `XÁC NHẬN ĐÓNG BĂNG ĐỀ THI: Câu hỏi [${q.id}] phiên bản v${q.version} sẽ chuyển sang trạng thái FROZEN vĩnh viễn. Sau khi đóng băng, trigger DB sẽ từ chối mọi thao tác UPDATE/DELETE. Bạn có chắc chắn?`
      )
    ) {
      setQuestions((prev) =>
        prev.map((item) =>
          item.id === q.id
            ? { ...item, state: "FROZEN", frozen_at: new Date().toISOString() }
            : item
        )
      );
    }
  };

  const columns: Column<QuestionItem>[] = [
    {
      key: "version",
      header: "Phiên bản",
      width: "100px",
      render: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          v{row.version}
        </span>
      ),
    },
    {
      key: "prompt",
      header: "Nội dung câu hỏi & Lựa chọn",
      render: (row) => (
        <div className="space-y-1.5 py-1">
          <p className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2">
            {row.prompt}
          </p>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {row.options?.map((opt, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded border ${
                  opt.is_correct
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                    : "bg-slate-50 text-slate-600 border-slate-200"
                }`}
              >
                {String.fromCharCode(65 + idx)}. {opt.text}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: "pool",
      header: "Nhóm kiến thức",
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">{row.poolName}</span>
      ),
    },
    {
      key: "difficulty",
      header: "Độ khó",
      align: "center",
      render: (row) => {
        const variant =
          row.difficulty === "HARD"
            ? "danger"
            : row.difficulty === "MEDIUM"
            ? "warning"
            : "success";
        return (
          <AdminBadge variant={variant} size="sm">
            {row.difficulty}
          </AdminBadge>
        );
      },
    },
    {
      key: "state",
      header: "Trạng thái (FR-06)",
      align: "center",
      render: (row) => (
        <AdminBadge
          variant={row.state === "FROZEN" ? "info" : "default"}
          size="sm"
        >
          {row.state === "FROZEN" ? "ĐÃ ĐÓNG BĂNG" : "DỰ THẢO"}
        </AdminBadge>
      ),
    },
    {
      key: "actions",
      header: "Thao tác",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.state === "DRAFT" ? (
            <>
              <AdminButton variant="outline" size="sm" onClick={() => handleOpenEdit(row)}>
                Sửa
              </AdminButton>
              <AdminButton
                variant="brand"
                size="sm"
                onClick={() => handleFreeze(row)}
                title="Đóng băng để thi"
              >
                Freeze
              </AdminButton>
            </>
          ) : (
            <span className="text-[11px] text-slate-400 font-mono italic">
              Bất biến (Locked)
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Ngân hàng câu hỏi trắc nghiệm Vòng 1 (FR-06)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng cộng: <span className="font-bold text-[#0B1F4D]">{questions.length}</span> câu • Đã đóng băng:{" "}
            <span className="font-bold text-sky-700">
              {questions.filter((q) => q.state === "FROZEN").length}
            </span>{" "}
            câu
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/admin/questions/import">
            <AdminButton variant="outline" size="sm">
              Import Excel / Word (FR-07)
            </AdminButton>
          </Link>
          <AdminButton variant="brand" size="sm" onClick={handleOpenAdd}>
            + Thêm câu hỏi mới
          </AdminButton>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminInput
          placeholder="Tìm kiếm nội dung câu hỏi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <AdminSelect
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          options={[
            { label: "Tất cả độ khó", value: "ALL" },
            { label: "Dễ (EASY)", value: "EASY" },
            { label: "Trung bình (MEDIUM)", value: "MEDIUM" },
            { label: "Khó (HARD)", value: "HARD" },
          ]}
        />
        <AdminSelect
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          options={[
            { label: "Tất cả trạng thái", value: "ALL" },
            { label: "Đã đóng băng (FROZEN)", value: "FROZEN" },
            { label: "Dự thảo (DRAFT)", value: "DRAFT" },
          ]}
        />
      </div>

      {/* Table */}
      <AdminTable
        columns={columns}
        data={filteredQuestions}
        keyExtractor={(item) => item.id}
      />

      {/* Create / Edit Question Modal */}
      <AdminModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editingQuestion ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi trắc nghiệm mới"}
        description="Mỗi câu hỏi phải có ít nhất 2 đáp án và duy nhất 1 đáp án đúng"
        maxWidth="2xl"
        footer={
          <div className="flex items-center gap-2">
            <AdminButton variant="outline" size="sm" onClick={() => setIsEditorOpen(false)}>
              Hủy
            </AdminButton>
            <AdminButton variant="brand" size="sm" onClick={handleSaveQuestion}>
              Lưu bản ghi
            </AdminButton>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nội dung câu hỏi:
            </label>
            <textarea
              rows={3}
              placeholder="Nhập nội dung đề thi..."
              value={formPrompt}
              onChange={(e) => setFormPrompt(e.target.value)}
              className="w-full text-xs sm:text-sm border border-slate-300 rounded-lg p-3 focus:outline-hidden focus:ring-2 focus:ring-[#1F5BE0]/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AdminSelect
              label="Mức độ khó"
              value={formDifficulty}
              onChange={(e) => setFormDifficulty(e.target.value as QuestionDifficulty)}
              options={[
                { label: "Dễ (EASY)", value: "EASY" },
                { label: "Trung bình (MEDIUM)", value: "MEDIUM" },
                { label: "Khó (HARD)", value: "HARD" },
              ]}
            />
            <AdminSelect
              label="Nhóm kiến thức (Pool)"
              value={formPool}
              onChange={(e) => setFormPool(e.target.value)}
              options={[
                { label: "Kiến thức quản trị nền tảng", value: "Kiến thức quản trị nền tảng" },
                { label: "Tư duy phân tích & Ra quyết định", value: "Tư duy phân tích & Ra quyết định" },
                { label: "Tư duy số liệu & Tài chính", value: "Tư duy số liệu & Tài chính" },
              ]}
            />
          </div>

          {/* Options */}
          <div className="space-y-2.5 pt-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Các phương án trả lời (Tick vào nút tròn để chọn đáp án đúng):
            </label>
            {formOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="correct-option"
                  checked={opt.is_correct}
                  onChange={() => {
                    setFormOptions((prev) =>
                      prev.map((o, i) => ({ ...o, is_correct: i === idx }))
                    );
                  }}
                  className="w-4 h-4 text-[#1F5BE0] cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-600 w-4">
                  {String.fromCharCode(65 + idx)}.
                </span>
                <input
                  type="text"
                  placeholder={`Phương án ${String.fromCharCode(65 + idx)}...`}
                  value={opt.text}
                  onChange={(e) => {
                    const text = e.target.value;
                    setFormOptions((prev) =>
                      prev.map((o, i) => (i === idx ? { ...o, text } : o))
                    );
                  }}
                  className="flex-1 text-xs sm:text-sm border border-slate-300 rounded-lg px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#1F5BE0]/20"
                />
              </div>
            ))}
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
