"use client";
import ImportPanel from "@/components/admin/operations/ImportPanel";
import { Callout, PageIntro } from "@/components/admin/ui/kit";

export default function QuestionImportPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        icon="upload"
        tone="amber"
        title="Import ngân hàng câu hỏi"
        description="Nhập câu hỏi hàng loạt từ file Excel (.xlsx) hoặc Word (.docx) theo mẫu. Hệ thống kiểm tra toàn bộ tệp trước, chỉ ghi khi không còn lỗi."
      />
      <ImportPanel kind="questions" />
      <Callout title="Lưu ý khi soạn tệp">
        Mỗi dòng là một câu hỏi: <strong>prompt</strong> (nội dung), <strong>A–D</strong> (các lựa chọn), <strong>answer</strong> (A/B/C/D), <strong>difficulty</strong>{" "}
        (EASY/MEDIUM/HARD) và <strong>pool</strong> (nhóm câu hỏi). Nên tải file mẫu và giữ nguyên tên cột.
      </Callout>
    </div>
  );
}
