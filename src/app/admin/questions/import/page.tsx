"use client";

import React, { useState } from "react";
import Link from "next/link";
import AdminTable, { type Column } from "@/components/admin/ui/AdminTable";
import AdminBadge from "@/components/admin/ui/AdminBadge";
import AdminButton from "@/components/admin/ui/AdminButton";

interface ParsedQuestionRow {
  rowId: number;
  prompt: string;
  optionsCount: number;
  correctAnswer: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  pool: string;
  isValid: boolean;
  errors: string[];
}

const mockParsedData: ParsedQuestionRow[] = [
  {
    rowId: 1,
    prompt: "Định nghĩa nào sau đây phản ánh chính xác nhất về 'Tư duy hệ thống' trong quản trị tổ chức?",
    optionsCount: 4,
    correctAnswer: "A",
    difficulty: "EASY",
    pool: "Tư duy hệ thống",
    isValid: true,
    errors: [],
  },
  {
    rowId: 2,
    prompt: "Trong phân tích tài chính doanh nghiệp, chỉ số Quick Ratio khác với Current Ratio ở điểm nào?",
    optionsCount: 4,
    correctAnswer: "C",
    difficulty: "MEDIUM",
    pool: "Tư duy số liệu & Tài chính",
    isValid: true,
    errors: [],
  },
  {
    rowId: 3,
    prompt: "Khi xảy ra xung đột lợi ích giữa 2 phòng ban Marketing và Vận hành, nhà quản trị nên...",
    optionsCount: 3,
    correctAnswer: "CHƯA CHỌN",
    difficulty: "HARD",
    pool: "Lãnh đạo & Tạo ảnh hưởng",
    isValid: false,
    errors: ["Thiếu đáp án đúng (is_correct)", "Chỉ có 3 lựa chọn"],
  },
  {
    rowId: 4,
    prompt: "Khung năng lực đánh giá thí sinh cuộc thi IS-NextGen Manager gồm bao nhiêu nhóm năng lực cốt lõi?",
    optionsCount: 4,
    correctAnswer: "B",
    difficulty: "EASY",
    pool: "Thể lệ cuộc thi",
    isValid: true,
    errors: [],
  },
];

export default function QuestionImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedQuestionRow[]>(mockParsedData);
  const [isImporting, setIsImporting] = useState(false);

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  const handleSimulateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (invalidCount > 0) {
      if (
        !confirm(
          `Cảnh báo: Có ${invalidCount} câu hỏi bị lỗi cấu trúc. Hệ thống sẽ chỉ import ${validCount} câu hỏi hợp lệ vào Ngân hàng đề thi. Bạn có muốn tiếp tục?`
        )
      ) {
        return;
      }
    }
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      alert(`Đã import thành công ${validCount} câu hỏi vào Ngân hàng đề thi!`);
      window.location.href = "/admin/questions";
    }, 800);
  };

  const columns: Column<ParsedQuestionRow>[] = [
    {
      key: "rowId",
      header: "Dòng",
      width: "70px",
      render: (row) => <span className="font-mono text-xs font-bold">#{row.rowId}</span>,
    },
    {
      key: "prompt",
      header: "Nội dung câu hỏi trích xuất",
      render: (row) => (
        <div>
          <p className="text-xs font-bold text-slate-900 line-clamp-2">{row.prompt}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            Số phương án: <span className="font-semibold text-slate-700">{row.optionsCount}</span> • Đáp án đúng:{" "}
            <span className="font-bold text-emerald-700 font-mono">{row.correctAnswer}</span>
          </div>
        </div>
      ),
    },
    {
      key: "difficulty",
      header: "Độ khó & Nhóm",
      render: (row) => (
        <div>
          <AdminBadge
            variant={row.difficulty === "HARD" ? "danger" : row.difficulty === "MEDIUM" ? "warning" : "success"}
            size="sm"
          >
            {row.difficulty}
          </AdminBadge>
          <span className="text-[11px] text-slate-500 block mt-1">{row.pool}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Kiểm tra hợp lệ",
      align: "center",
      render: (row) => (
        <div>
          <AdminBadge variant={row.isValid ? "success" : "danger"} size="sm">
            {row.isValid ? "Hợp lệ" : "Lỗi cấu trúc"}
          </AdminBadge>
          {row.errors.length > 0 && (
            <div className="text-[10px] text-rose-600 mt-1 font-medium">
              {row.errors.join(", ")}
            </div>
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
          <div className="flex items-center gap-2">
            <Link href="/admin/questions" className="text-xs text-slate-400 hover:text-[#1F5BE0]">
              ← Quay lại Ngân hàng câu hỏi
            </Link>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            Nhập câu hỏi hàng loạt từ tệp
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hỗ trợ file định dạng <span className="font-bold text-slate-700">.xlsx / .docx</span>. Tự động kiểm tra cú pháp và đáp án đúng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("Đang tải file template mẫu: is_nextgen_question_template.xlsx");
            }}
            className="text-xs font-semibold text-[#1F5BE0] hover:underline"
          >
            Tải file mẫu Excel (.xlsx)
          </a>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-[#1F5BE0] transition-colors text-center relative cursor-pointer">
        <input
          type="file"
          accept=".xlsx,.xls,.docx"
          onChange={handleSimulateFile}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {file ? `Đã chọn: ${file.name}` : "Kéo thả file đề thi vào đây hoặc bấm để chọn"}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Hệ thống sẽ tự động quét các bảng hoặc danh sách câu hỏi trong file
            </p>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Kết quả phân tích trước khi lưu (Preview Validation)
            </h3>
            <p className="text-xs text-slate-500">
              Tổng số: <span className="font-bold">{parsedRows.length}</span> câu • Hợp lệ:{" "}
              <span className="font-bold text-emerald-600">{validCount}</span> • Lỗi:{" "}
              <span className="font-bold text-rose-600">{invalidCount}</span>
            </p>
          </div>
          <AdminButton
            variant="brand"
            size="sm"
            onClick={handleConfirmImport}
            isLoading={isImporting}
          >
            Lưu {validCount} câu hỏi hợp lệ vào Ngân hàng
          </AdminButton>
        </div>

        <AdminTable
          columns={columns}
          data={parsedRows}
          keyExtractor={(item) => item.rowId}
        />
      </div>
    </div>
  );
}
