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

export default function ImportPanel({
  kind = "questions",
  policyId = "",
  onImported,
}: {
  kind?: "questions" | "scores";
  policyId?: string;
  onImported?: () => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null),
    [result, setResult] = useState<ImportResult | null>(null),
    [checkedPolicy, setCheckedPolicy] = useState("");
  const op = useOperations();
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
      title={
        kind === "questions"
          ? "Nhập ngân hàng câu hỏi"
          : "Nhập điểm từ Excel giám khảo"
      }
    >
      <p className="text-sm text-slate-600">
        {kind === "questions"
          ? "Tệp xlsx hoặc docx gồm một bảng với các cột: prompt, A, B, C, D, answer, difficulty, pool. answer dùng A/B/C/D; difficulty dùng EASY/MEDIUM/HARD. DOCX dùng cùng bảng mẫu, mỗi ô có nội dung văn bản."
          : "Các cột: subjectType (CANDIDATE/TEAM), code, judge, criterion, score. Mỗi giám khảo cần nhập đủ các tiêu chí đã cấu hình cho từng thí sinh/đội."}
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={op.busy}
          onClick={() =>
            void op.run(
              () => downloadAdmin(`${kind}/template`, `${kind}-template.xlsx`),
              "Đã tải mẫu.",
            )
          }
        >
          Tải mẫu Excel
        </Button>
        <input
          aria-label="Chọn tệp nhập"
          className={inputClass + " max-w-sm"}
          type="file"
          accept={kind === "questions" ? ".xlsx,.docx" : ".xlsx"}
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
        />
        <Button
          disabled={op.busy || !file || (kind === "scores" && !policyId)}
          onClick={() => void upload(false)}
        >
          Kiểm tra tệp
        </Button>
        <Button
          disabled={op.busy || !canCommit}
          onClick={() => void upload(true)}
        >
          Xác nhận nhập
        </Button>
      </div>
      {kind === "questions" && (
        <Button
          disabled={op.busy}
          onClick={() =>
            void op.run(
              () =>
                downloadAdmin(
                  "questions/template.docx",
                  "questions-template.docx",
                ),
              "Đã tải mẫu DOCX.",
            )
          }
        >
          Tải mẫu DOCX
        </Button>
      )}
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
