"use client";

import React, { useState } from "react";
import Link from "next/link";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";
import AdminModal from "@/components/admin/ui/AdminModal";
import { AdminInput, AdminSelect } from "@/components/admin/ui/AdminInput";
import { useToastHelpers } from "@/components/admin/ui/Toast";
import { mockQuestions, getPools, getDifficulties } from "@/mocks/admin";
import type { QuestionItem, QuestionDifficulty } from "@/mocks/admin/questions";

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>(mockQuestions);
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [stateFilter, setStateFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const { success, error, warning, info } = useToastHelpers();

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
      warning("Không thể chỉnh sửa", "Câu hỏi này đã đóng băng (FROZEN) để dùng cho bài thi. Hệ thống cơ sở dữ liệu chặn chỉnh sửa trực tiếp để bảo vệ tính toàn vẹn (protect_question_version). Bạn cần tạo phiên bản mới!");
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
      error("Thiếu nội dung", "Vui lòng nhập nội dung câu hỏi!");
      return;
    }
    const hasCorrect = formOptions.some((o) => o.is_correct && o.text.trim());
    if (!hasCorrect) {
      error("Thiếu đáp án đúng", "Câu hỏi phải có ít nhất 1 đáp án đúng và có nội dung!");
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
      success("Đã cập nhật", `Câu hỏi ${editingQuestion.id} đã được lưu thay đổi.`);
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
      success("Đã tạo mới", `Câu hỏi ${newId} đã được thêm vào ngân hàng.`);
    }

    setIsEditorOpen(false);
  };

  const handleFreeze = (q: QuestionItem) => {
    warning("Xác nhận đóng băng đề thi", `Câu hỏi [${q.id}] phiên bản v${q.version} sẽ chuyển sang trạng thái FROZEN vĩnh viễn. Sau khi đóng băng, trigger DB sẽ từ chối mọi thao tác UPDATE/DELETE. Hành động không thể hoàn tác.`, {
      action: {
        label: "Đóng băng",
        onClick: () => {
          setQuestions((prev) =>
            prev.map((item) =>
              item.id === q.id
                ? { ...item, state: "FROZEN", frozen_at: new Date().toISOString() }
                : item
            )
          );
          success("Đã đóng băng", `Câu hỏi ${q.id} v${q.version} đã chuyển sang trạng thái FROZEN.`);
        },
      },
    });
  };

  const columns: Column<QuestionItem>[] = [
    {
      key: "version",
      header: "Phiên bản",
      width: "100px",
      render: (row) => (
        <span className="font-sans tabular-nums tracking-tight text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
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
      header: "Trạng thái",
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
              <AdminButton variant="brand" size="sm" onClick={() => handleFreeze(row)}>
                Freeze
              </AdminButton>
            </>
          ) : (
            <span className="text-[11px] text-slate-400 font-sans tabular-nums tracking-tight italic">
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
            Ngân hàng câu hỏi trắc nghiệm Vòng 1
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
              Import Excel / Word
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
