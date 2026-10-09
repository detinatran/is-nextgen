"use client";
import { ReactNode, useState } from "react";
import { adminApi, downloadAdmin, ImportResult } from "@/lib/admin/api";
import { Button, Notice, Panel, Table, useOperations } from "./common";
import { FileUpload, Icon, StatCard } from "@/components/admin/ui/kit";
import { tr } from "@/lib/i18n/tr";

// Backend nhận tối đa 5.000.000 byte cho tệp nhập (admin.controller FileInterceptor)
const MAX_BYTES = 5_000_000;

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[28px_minmax(0,1fr)]">
      <span className="hidden h-6 w-6 items-center justify-center rounded-full border border-adm-border text-xs font-semibold text-adm-sub sm:flex">{n}</span>
      <div className="min-w-0 space-y-3">
        <h3 className="text-sm font-semibold text-adm-text">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function TemplateCard({ name, ext, desc, onDownload, disabled }: { name: string; ext: string; desc: string; onDownload: () => void; disabled: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-adm-border px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-adm-bg font-mono text-[11px] font-semibold text-adm-sub">{ext}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-adm-text">{name}</p>
        <p className="truncate text-xs text-adm-sub">{desc}</p>
      </div>
      <Button size="sm" variant="secondary" icon="download" disabled={disabled} onClick={onDownload}>
        {tr("Tải về")}</Button>
    </div>
  );
}

export default function ImportPanel({ kind = "questions", policyId = "", onImported, step }: { kind?: "questions" | "scores"; policyId?: string; onImported?: () => Promise<void>; step?: number }) {
  const accept = kind === "questions" ? ".xlsx,.docx" : ".xlsx";
  const [file, setFile] = useState<File | null>(null),
    [result, setResult] = useState<ImportResult | null>(null),
    [checkedPolicy, setCheckedPolicy] = useState("");
  const op = useOperations();
  const pick = (f: File | null) => {
    setFile(f);
    setResult(null);
  };
  const valid = !!result && !result.errors.length && checkedPolicy === policyId;
  const canCommit = valid && !result?.committed;
  async function upload(commit: boolean) {
    if (!file) return;
    await op.run(
      async () => {
        const body = new FormData();
        body.set("file", file);
        const res = await adminApi<ImportResult>(`admin/${kind}/import?commit=${commit}${kind === "scores" ? `&policyId=${encodeURIComponent(policyId)}` : ""}`, { method: "POST", body });
        setResult(res);
        setCheckedPolicy(policyId);
        if (res.committed && onImported) await onImported();
      },
      commit ? tr("Đã nhập dữ liệu.") : tr("Đã kiểm tra tệp."),
    );
  }
  const download = (path: string, name: string) => void op.run(() => downloadAdmin(path, name), tr("Đã tải tệp mẫu."));

  return (
    <Panel
      step={step}
      icon="upload"
      tone="amber"
      title={kind === "questions" ? tr("Nhập ngân hàng câu hỏi") : tr("Nhập điểm giám khảo")}
      description={kind === "questions" ? tr("Hệ thống kiểm tra toàn bộ tệp trước; dữ liệu chỉ được ghi khi không còn lỗi và bạn bấm Nhập.") : tr("Kiểm tra trước, chỉ ghi điểm khi tệp hợp lệ với cấu hình Rubric đang chọn.")}
    >
      <div className="space-y-6">
        <Step n={1} title={tr("Tải tệp mẫu")}>
          <div className="grid gap-3 lg:grid-cols-2">
            <TemplateCard
              ext="XLSX"
              name={tr("Mẫu Excel")}
              desc={kind === "questions" ? tr("Cột prompt, A–D, answer, difficulty, pool") : tr("Cột subjectType, code, judge, criterion, score")}
              disabled={op.busy}
              onDownload={() => download(`${kind}/template`, `${kind}-template.xlsx`)}
            />
            {kind === "questions" && <TemplateCard ext="DOCX" name={tr("Mẫu Word")} desc={tr("Một bảng với các cột như mẫu Excel")} disabled={op.busy} onDownload={() => download("questions/template.docx", "questions-template.docx")} />}
          </div>
          <p className="text-xs text-adm-sub">
            {kind === "questions" ? (
              <>
                <code>answer</code> {" "}{tr("dùng A/B/C/D;")}{" "}<code>difficulty</code> {" "}{tr("dùng EASY/MEDIUM/HARD. Giữ nguyên tên cột trong mẫu.")}</>
            ) : (
              <>
                <code>subjectType</code> {" "}{tr("là CANDIDATE hoặc TEAM. Mỗi giám khảo cần nhập đủ các tiêu chí của Rubric cho từng thí sinh/đội.")}</>
            )}
          </p>
        </Step>

        <Step n={2} title={tr("Chọn tệp")}>
          <FileUpload file={file} onChange={pick} accept={accept} maxBytes={MAX_BYTES} hint={tr("{0} · tối đa 5 MB", accept.replaceAll(",", ", "))} />
        </Step>

        <Step n={3} title={tr("Kiểm tra và nhập")}>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" loading={op.busy && !result} disabled={op.busy || !file || (kind === "scores" && !policyId)} onClick={() => void upload(false)}>
              {tr("Kiểm tra tệp")}</Button>
            <Button disabled={op.busy || !canCommit} loading={op.busy && !!result} onClick={() => void upload(true)}>
              {tr("Nhập dữ liệu")}</Button>
            {kind === "scores" && !policyId && <span className="text-[13px] text-adm-sub">{tr("Chọn cấu hình Rubric trước.")}</span>}
            {!file && <span className="text-[13px] text-adm-muted">{tr("Chọn tệp ở bước 2.")}</span>}
          </div>
          <Notice message={op.error} error />

          {result && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard icon="checkCircle" tone="green" label={result.committed ? tr("Dòng đã nhập") : tr("Dòng hợp lệ")} value={result.errors.length ? Math.max(0, result.rows.length - result.errors.length) : result.rows.length} />
                <StatCard icon="alert" tone="red" label={tr("Lỗi")} value={<span className={result.errors.length ? "text-adm-error" : ""}>{result.errors.length}</span>} />
                <div className="flex items-center gap-2 rounded-xl border border-adm-border bg-white px-5 py-4 text-sm">
                  <Icon name={result.committed ? "checkCircle" : result.errors.length ? "alert" : "check"} className={result.errors.length ? "text-adm-error" : "text-adm-success"} />
                  <span className="text-adm-text">
                    {result.committed ? tr("Đã ghi vào hệ thống") : result.errors.length ? tr("Chưa ghi dữ liệu — sửa tệp rồi kiểm tra lại") : tr("Tệp hợp lệ, sẵn sàng nhập")}
                  </span>
                </div>
              </div>
              {result.errors.length > 0 && <Table headers={[tr("Dòng"), tr("Lỗi")]} numeric={[]} rows={result.errors.map((e) => [<span key="r" className="tabular-nums">{e.row || tr("Toàn tệp")}</span>, e.message])} />}
              {!result.errors.length && kind === "questions" && (
                <Table
                  headers={[tr("Nội dung"), tr("Độ khó"), tr("Đáp án")]}
                  rows={(result.rows as { prompt: string; difficulty: string; answer: number }[]).slice(0, 30).map((r) => [
                    <span key="p" className="line-clamp-2 max-w-2xl">
                      {r.prompt}
                    </span>,
                    r.difficulty,
                    String.fromCharCode(65 + r.answer),
                  ])}
                  footer={result.rows.length > 30 && <p className="border-t border-adm-border px-4 py-2 text-xs text-adm-sub">{tr("Hiển thị 30/")}{result.rows.length} {" "}{tr("dòng đầu.")}</p>}
                />
              )}
              {result.summary && <Table headers={[tr("Mã"), tr("Loại"), tr("Giám khảo"), tr("Điểm tổng hợp")]} numeric={[2, 3]} rows={result.summary.map((r) => [r.code, r.subjectType, r.judges, r.points])} />}
            </div>
          )}
        </Step>
      </div>
    </Panel>
  );
}
