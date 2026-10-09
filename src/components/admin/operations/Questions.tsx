"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { adminApi, QuestionItem, Configuration } from "@/lib/admin/api";
import { Button, Field, inputClass, Notice, Table, useOperations, useResource } from "./common";
import { Drawer, Icon, PageHeader, Pagination, Pill, RowMenu, Skeleton, useConfirm } from "@/components/admin/ui/kit";
import { useDebounce } from "@/hooks/useDebounce";

const blank = () => ({ prompt: "", options: ["", "", "", ""], answer: 0, difficulty: "EASY", pool: "General" });
const diffLabel: Record<string, string> = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" };
const diffPill = (d: string) => <Pill tone={d === "EASY" ? "green" : d === "MEDIUM" ? "amber" : "red"}>{diffLabel[d] ?? d}</Pill>;
const letter = (i: number) => String.fromCharCode(65 + i);

export default function Questions() {
  const config = useResource<Configuration>("admin/configuration", { competitions: [], pools: [], teams: [], policies: [] });
  const [search, setSearch] = useState("");
  const [poolFilter, setPoolFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const list = useResource<QuestionItem[]>(
    `admin/questions?search=${encodeURIComponent(debouncedSearch)}&pool=${encodeURIComponent(poolFilter)}&difficulty=${encodeURIComponent(difficultyFilter)}`,
    [],
  );
  const all = useResource<QuestionItem[]>("admin/questions", []);
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(20);
  const op = useOperations();
  const confirm = useConfirm();
  const [form, setForm] = useState(blank),
    [editing, setEditing] = useState<QuestionItem | null>(null),
    [open, setOpen] = useState(false),
    [preview, setPreview] = useState<QuestionItem | null>(null),
    [history, setHistory] = useState<{ loading: boolean; error: string; rows: QuestionItem[] }>({ loading: false, error: "", rows: [] });

  function save(event: FormEvent) {
    event.preventDefault();
    void op.run(async () => {
      const endpoint = editing ? `admin/questions/${editing.questionId}?expectedVersion=${editing.version}` : "admin/questions";
      await adminApi(endpoint, { method: editing ? "PUT" : "POST", body: JSON.stringify({ ...form, ...(editing ? { expectedVersion: editing.version } : {}) }) });
      setOpen(false);
      setForm(blank());
      setEditing(null);
      await Promise.all([list.reload(), all.reload()]);
    }, editing ? "Đã lưu phiên bản mới của câu hỏi." : "Đã thêm câu hỏi.");
  }

  async function openPreview(q: QuestionItem) {
    setPreview(q);
    setHistory({ loading: true, error: "", rows: [] });
    try {
      setHistory({ loading: false, error: "", rows: await adminApi<QuestionItem[]>(`admin/questions/${q.questionId}/history`) });
    } catch (e) {
      setHistory({ loading: false, error: (e as Error).message, rows: [] });
    }
  }

  const byDiff = (d: string) => all.data.filter((q) => q.difficulty === d).length;
  const rows = list.data.slice((page - 1) * pageSize, page * pageSize);
  const filtering = !!(search || poolFilter || difficultyFilter);
  const edit = (q: QuestionItem) => {
    setPreview(null);
    setEditing(q);
    setForm({ prompt: q.prompt, options: q.options.map((o) => o.text), answer: q.options.findIndex((o) => o.isCorrect), difficulty: q.difficulty, pool: q.pool || "General" });
    setOpen(true);
  };
  const remove = async (q: QuestionItem) => {
    const r = await confirm({ title: "Xoá câu hỏi", description: "Câu hỏi bị gỡ khỏi ngân hàng và không được dùng cho đề mới. Các phiên bản đã phát trong đề vẫn được giữ.", confirmText: "Xoá câu hỏi", danger: true });
    if (!r.ok) return;
    setPreview(null);
    void op.run(async () => {
      await adminApi(`admin/questions/${q.questionId}`, { method: "DELETE" });
      await Promise.all([list.reload(), all.reload()]);
    }, "Đã xoá câu hỏi.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ngân hàng câu hỏi"
        icon="folder"
        tone="violet"
        description="Câu hỏi trắc nghiệm cho Vòng 1. Sửa câu hỏi sẽ tạo phiên bản mới; đề đã phát vẫn giữ phiên bản cũ."
        actions={
          <>
            <Link href="/admin/questions/import" className="inline-flex h-10 items-center gap-2 rounded-lg border border-adm-border bg-white px-4 text-sm font-medium text-adm-text hover:bg-slate-50">
              <Icon name="upload" /> Import từ file
            </Link>
            <Button
              icon="plus"
              onClick={() => {
                setForm(blank());
                setEditing(null);
                setOpen(true);
              }}
            >
              Thêm câu hỏi
            </Button>
          </>
        }
      />
      <Notice message={op.error} error />
      <Notice message={op.message} />

      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-adm-sub">
        {all.loading ? (
          <Skeleton className="h-5 w-72" />
        ) : (
          <>
            <span>
              <strong className="text-adm-text tabular-nums">{all.data.length.toLocaleString("vi-VN")}</strong> câu hỏi
            </span>
            <span>
              <strong className="text-adm-text tabular-nums">{new Set(all.data.map((q) => q.pool)).size}</strong> nhóm
            </span>
            <span className="tabular-nums">
              Dễ {byDiff("EASY")} · Trung bình {byDiff("MEDIUM")} · Khó {byDiff("HARD")}
            </span>
          </>
        )}
      </div>

      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-adm-border bg-white p-4">
        <label className="relative min-w-60 flex-1">
          <span className="sr-only">Tìm nội dung câu hỏi</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-adm-muted" />
          <input placeholder="Tìm nội dung câu hỏi" className={`${inputClass} pl-9`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </label>
        <label className="w-full sm:w-52">
          <span className="sr-only">Nhóm câu hỏi</span>
          <select className={inputClass} value={poolFilter} onChange={(e) => { setPoolFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả nhóm</option>
            {config.data.pools.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="w-full sm:w-44">
          <span className="sr-only">Độ khó</span>
          <select className={inputClass} value={difficultyFilter} onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}>
            <option value="">Mọi độ khó</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </label>
        {filtering && (
          <Button variant="ghost" onClick={() => { setSearch(""); setPoolFilter(""); setDifficultyFilter(""); setPage(1); }}>
            Xoá lọc
          </Button>
        )}
      </section>

      {list.error ? (
        <Notice message={`Không tải được câu hỏi: ${list.error}`} error onRetry={list.reload} />
      ) : (
        <Table
          loading={list.loading}
          numeric={[3]}
          headers={["Nội dung câu hỏi", "Nhóm", "Độ khó", "Phiên bản", ""]}
          empty={
            filtering
              ? { icon: "search", title: "Không có câu hỏi phù hợp", description: "Thử đổi từ khoá hoặc bộ lọc." }
              : {
                  icon: "help",
                  title: "Ngân hàng chưa có câu hỏi",
                  description: "Thêm từng câu hoặc import hàng loạt từ Excel/DOCX.",
                  action: (
                    <Link href="/admin/questions/import" className="text-sm font-medium text-adm-primary hover:underline">
                      Import câu hỏi
                    </Link>
                  ),
                }
          }
          rows={rows.map((q) => [
            <button key="p" type="button" onClick={() => void openPreview(q)} title={q.prompt} className="line-clamp-2 max-w-2xl text-left font-medium text-adm-text hover:text-adm-primary">
              {q.prompt}
            </button>,
            <span key="g" className="whitespace-nowrap text-[13px] text-adm-sub">
              {q.pool}
            </span>,
            diffPill(q.difficulty),
            <span key="v" className="text-[13px] text-adm-sub">
              v{q.version}
            </span>,
            <div key="a" className="flex items-center justify-end gap-1">
              <Button size="sm" variant="secondary" onClick={() => void openPreview(q)}>
                Xem
              </Button>
              <RowMenu
                items={[
                  { label: "Sửa (tạo phiên bản mới)", onClick: () => edit(q) },
                  { label: "Xoá câu hỏi", onClick: () => void remove(q), danger: true, disabled: op.busy },
                ]}
              />
            </div>,
          ])}
          footer={list.data.length > 0 && <Pagination page={page} pageSize={pageSize} total={list.data.length} label="câu hỏi" onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
        />
      )}

      <Drawer
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Chi tiết câu hỏi"
        subtitle={preview ? `${preview.pool} · v${preview.version}` : undefined}
        footer={
          preview && (
            <>
              <Button variant="danger" onClick={() => void remove(preview)}>
                Xoá
              </Button>
              <Button variant="secondary" onClick={() => edit(preview)}>
                Sửa
              </Button>
            </>
          )
        }
      >
        {preview && (
          <div className="space-y-6">
            <div>
              <div className="mb-3">{diffPill(preview.difficulty)}</div>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-adm-text">{preview.prompt}</p>
            </div>
            <ol className="space-y-2">
              {preview.options.map((o, i) => (
                <li key={i} className={`flex gap-3 rounded-lg border px-3 py-2.5 text-sm ${o.isCorrect ? "border-emerald-200 bg-emerald-50/60" : "border-adm-border"}`}>
                  <span className="font-semibold text-adm-sub">{letter(i)}</span>
                  <span className="flex-1 text-adm-text">{o.text}</span>
                  {o.isCorrect && <span className="text-xs font-medium text-adm-success">Đáp án đúng</span>}
                </li>
              ))}
            </ol>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-adm-text">Lịch sử phiên bản</h3>
              {history.loading ? (
                <Skeleton className="h-16 w-full" />
              ) : history.error ? (
                <Notice message={history.error} error onRetry={() => void openPreview(preview)} />
              ) : (
                <ul className="divide-y divide-adm-border rounded-lg border border-adm-border">
                  {history.rows.map((h) => (
                    <li key={h.id} className="px-3 py-2.5 text-[13px]">
                      <span className="mr-2 font-semibold text-adm-text">v{h.version}</span>
                      <span className="text-adm-sub">{h.prompt.length > 120 ? h.prompt.slice(0, 120) + "…" : h.prompt}</span>
                      <span className="mt-0.5 block text-xs text-adm-muted">
                        Đáp án {letter(h.options.findIndex((o) => o.isCorrect))} · {diffLabel[h.difficulty] ?? h.difficulty}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Sửa câu hỏi" : "Thêm câu hỏi"}
        subtitle={editing ? `Lưu sẽ tạo phiên bản v${editing.version + 1}` : undefined}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" form="question-form" loading={op.busy}>
              Lưu câu hỏi
            </Button>
          </>
        }
      >
        <form id="question-form" onSubmit={save} className="space-y-4">
          <Field label="Nội dung câu hỏi" required>
            <textarea required maxLength={10000} className={`${inputClass} h-auto py-2`} rows={4} value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
          </Field>
          <fieldset className="space-y-3">
            <legend className="mb-1.5 text-[13px] font-medium text-adm-text">
              Lựa chọn <span className="font-normal text-adm-sub">— chọn ô tròn ở đáp án đúng</span>
            </legend>
            {form.options.map((option, i) => (
              <div key={i} className="flex items-center gap-3">
                <input type="radio" name="answer" checked={form.answer === i} onChange={() => setForm({ ...form, answer: i })} aria-label={`Đáp án đúng là ${letter(i)}`} className="h-4 w-4 accent-adm-primary" />
                <span className="w-4 text-sm font-semibold text-adm-sub">{letter(i)}</span>
                <input
                  required
                  maxLength={5000}
                  aria-label={`Lựa chọn ${letter(i)}`}
                  className={inputClass}
                  value={option}
                  onChange={(e) => setForm({ ...form, options: form.options.map((o, j) => (i === j ? e.target.value : o)) })}
                />
              </div>
            ))}
            <div className="flex gap-2 pl-11">
              <Button size="sm" variant="ghost" disabled={form.options.length >= 8} onClick={() => setForm({ ...form, options: [...form.options, ""] })}>
                Thêm lựa chọn
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={form.options.length <= 2}
                onClick={() => setForm({ ...form, options: form.options.slice(0, -1), answer: Math.min(form.answer, form.options.length - 2) })}
              >
                Bỏ lựa chọn cuối
              </Button>
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Độ khó" required>
              <select className={inputClass} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                {Object.entries(diffLabel).map(([d, label]) => (
                  <option key={d} value={d}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nhóm" required>
              <input required maxLength={120} className={inputClass} value={form.pool} onChange={(e) => setForm({ ...form, pool: e.target.value })} />
            </Field>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
