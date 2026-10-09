"use client";
import Link from "next/link";
import ImportPanel from "@/components/admin/operations/ImportPanel";
import { Icon, PageHeader } from "@/components/admin/ui/kit";

export default function QuestionImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Import câu hỏi"
        description="Nhập câu hỏi hàng loạt từ Excel (.xlsx) hoặc Word (.docx) theo tệp mẫu."
        actions={
          <Link href="/admin/questions" className="inline-flex h-10 items-center gap-2 rounded-lg border border-adm-border bg-white px-4 text-sm font-medium text-adm-text hover:bg-slate-50">
            <Icon name="arrowLeft" /> Ngân hàng câu hỏi
          </Link>
        }
      />
      <ImportPanel kind="questions" />
    </div>
  );
}
