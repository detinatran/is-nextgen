"use client";
import { useState } from "react";
import { adminApi, downloadAdmin, ImportResult } from "@/lib/admin/api";
import {
  Button,
  inputClass,
  Notice,
  Panel,
  Table,
  useOperations,
} from "./common";
import { Icon } from "@/components/admin/ui/kit";

export default function ImportPanel({
  kind = "questions",
  policyId = "",
  onImported,
  step,
}: {
  kind?: "questions" | "scores";
  policyId?: string;
  onImported?: () => Promise<void>;
  step?: number;
}) {
  const [dragging, setDragging] = useState(false);
  const accept = kind === "questions" ? ".xlsx,.docx" : ".xlsx";
  const [file, setFile] = useState<File | null>(null),
    [result, setResult] = useState<ImportResult | null>(null),
    [checkedPolicy, setCheckedPolicy] = useState("");
  const op = useOperations();
  const pick = (f: File | null) => {
    setFile(f);
    setResult(null);
  };
  const canCommit =
    result &&
    !result.errors.length &&
    !result.committed &&
    checkedPolicy === policyId;
  async function upload(commit: boolean) {
    if (!file) return;
    await op.run(
      async () => {
        const body = new FormData();
        body.set("file", file);
        const res = await adminApi<ImportResult>(
          `admin/${kind}/import?commit=${commit}${kind === "scores" ? `&policyId=${encodeURIComponent(policyId)}` : ""}`,
          { method: "POST", body },
        );
        setResult(res);
        setCheckedPolicy(policyId);
        if (res.committed && onImported) await onImported();
      },
      commit
        ? "Đã xử lý yêu cầu nhập. Xem kết quả bên dưới."
        : "Đã kiểm tra tệp.",
    );
  }
  return (
    <Panel
      step={step}
      icon="upload"
      title={kind === "questions" ? "Nhập ngân hàng câu hỏi" : "Nhập điểm từ Excel giám khảo"}
      description={
        kind === "questions"
          ? "Tệp .xlsx hoặc .docx gồm một bảng với các cột: prompt, A, B, C, D, answer, difficulty, pool. answer dùng A/B/C/D; difficulty dùng EASY/MEDIUM/HARD."
          : "Các cột: subjectType (CANDIDATE/TEAM), code, judge, criterion, score. Mỗi giám khảo cần nhập đủ các tiêu chí đã cấu hình cho từng thí sinh/đội."
      }
      actions={
        kind === "questions" && (
          <Button variant="soft" icon="download" disabled={op.busy} onClick={() => void op.run(() => downloadAdmin("questions/template.docx", "questions-template.docx"), "Đã tải mẫu DOCX.")}>
            Tải mẫu DOCX
          </Button>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button icon="download" disabled={op.busy} onClick={() => void op.run(() => downloadAdmin(`${kind}/template`, `${kind}-template.xlsx`), "Đã tải mẫu.")}>
          Tải mẫu Excel
        </Button>
        <label className="flex h-10 min-w-56 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-500 hover:border-[#1F5BE0]/40">
          <Icon name="file" className="h-4 w-4 text-slate-400" />
          <span className="truncate">{file ? file.name : "Chọn tệp (chưa có tệp nào)"}</span>
          <input aria-label="Chọn tệp nhập" className="hidden" type="file" accept={accept} onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        </label>
        <Button icon="search" disabled={op.busy || !file || (kind === "scores" && !policyId)} onClick={() => void upload(false)}>
          Kiểm tra tệp
        </Button>
        <Button variant="soft" icon="upload" disabled={op.busy || !canCommit} onClick={() => void upload(true)}>
          Xác nhận nhập
        </Button>
      </div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          pick(e.dataTransfer.files?.[0] ?? null);
        }}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-6 text-center transition ${dragging ? "border-[#1F5BE0] bg-blue-50" : "border-slate-200 bg-slate-50/50"}`}
      >
        <Icon name="upload" className="h-6 w-6 text-[#1F5BE0]" />
        <p className="mt-2 text-sm font-semibold text-[#0B1F4D]">Hoặc kéo thả file vào đây</p>
        <p className="mt-0.5 text-xs text-slate-500">Hỗ trợ {kind === "questions" ? ".xlsx, .docx" : ".xlsx"}. Hệ thống kiểm tra trước, chỉ ghi dữ liệu khi bấm Xác nhận nhập.</p>
      </div>
      <Notice message={op.error} error />
      <Notice message={op.message} />
      {result && (
        <>
          <Notice
            error={!!result.errors.length}
            message={
              result.committed
                ? `Đã lưu ${result.rows.length} dòng.`
                : result.errors.length
                  ? `Có ${result.errors.length} lỗi. Chưa ghi dữ liệu; sửa tệp rồi kiểm tra lại.`
                  : `${result.rows.length} dòng hợp lệ. Bạn có thể xác nhận nhập.`
            }
          />
          {result.errors.length > 0 && (
            <Table
              headers={["Dòng", "Lỗi"]}
              rows={result.errors.map((e) => [e.row || "Toàn tệp", e.message])}
            />
          )}
          {!result.errors.length && kind === "questions" && (
            <Table
              headers={["Nội dung", "Độ khó", "Đáp án"]}
              rows={(
                result.rows as {
                  prompt: string;
                  difficulty: string;
                  answer: number;
                }[]
              )
                .slice(0, 30)
                .map((r) => [
                  r.prompt,
                  r.difficulty,
                  String.fromCharCode(65 + r.answer),
                ])}
            />
          )}
          {result.summary && (
            <Table
              headers={["Mã", "Loại", "Giám khảo", "Điểm tổng hợp"]}
              rows={result.summary.map((r) => [
                r.code,
                r.subjectType,
                r.judges,
                r.points,
              ])}
            />
          )}
        </>
      )}
    </Panel>
  );
}
