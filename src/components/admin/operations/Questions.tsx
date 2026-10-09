"use client";
import { FormEvent, useState, useMemo } from "react";
import { adminApi, QuestionItem, Configuration } from "@/lib/admin/api";
import {
  Button,
  Field,
  inputClass,
  Notice,
  Panel,
  Table,
  useOperations,
  useResource,
} from "./common";
import AdminButton from "@/components/admin/ui/AdminButton";
import ImportPanel from "./ImportPanel";
import { useDebounce } from "@/hooks/useDebounce";

const blank = () => ({
  prompt: "",
  options: ["", "", "", ""],
  answer: 0,
  difficulty: "EASY",
  pool: "General",
});

export default function Questions() {
  const config = useResource<Configuration>("admin/configuration", { competitions: [], pools: [], teams: [], policies: [] });
  const [search, setSearch] = useState("");
  const [poolFilter, setPoolFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // Fetch questions with server-side search params
  const list = useResource<QuestionItem[]>(
    `admin/questions?search=${encodeURIComponent(debouncedSearch)}&pool=${encodeURIComponent(poolFilter)}&difficulty=${encodeURIComponent(difficultyFilter)}`,
    [],
  );

  const op = useOperations();
  const [form, setForm] = useState(blank),
    [editing, setEditing] = useState<QuestionItem | null>(null),
    [open, setOpen] = useState(false);
  const [history, setHistory] = useState<QuestionItem[]>([]);

  function save(event: FormEvent) {
    event.preventDefault();
    void op.run(async () => {
      const endpoint = editing
        ? `admin/questions/${editing.questionId}?expectedVersion=${editing.version}`
        : "admin/questions";
      await adminApi(endpoint, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          ...form,
          ...(editing ? { expectedVersion: editing.version } : {}),
        }),
      });
      setOpen(false);
      setForm(blank());
      setEditing(null);
      await list.reload();
    });
  }

  async function loadHistory(questionId: string) {
    try {
      const rows = await adminApi<QuestionItem[]>(`admin/questions/${questionId}/history`);
      setHistory(rows);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }

  return (
    <div className="space-y-6">
      <Notice message={op.error || list.error} error />
      <Notice message={op.message} />

      <Panel title="Ngân hàng câu hỏi">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-60">
            <Field label="Tìm kiếm câu hỏi">
              <input
                aria-label="Tìm nội dung câu hỏi"
                placeholder="Tìm nội dung câu hỏi…"
                className={inputClass}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Nhóm câu hỏi">
            <select className={inputClass} value={poolFilter} onChange={(e) => setPoolFilter(e.target.value)}>
              <option value="">Tất cả nhóm</option>
              {config.data.pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Độ khó">
            <select className={inputClass} value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
              <option value="">Tất cả độ khó</option>
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </Field>
          <AdminButton
            onClick={() => {
              setForm(blank());
              setEditing(null);
              setOpen(true);
            }}
          >
            Thêm câu hỏi
          </AdminButton>
        </div>

        {list.loading && <p role="status" className="text-sm text-slate-500">Đang tải…</p>}

        <Table
          headers={["Nội dung", "Độ khó", "Nhóm", "Phiên bản", "Thao tác"]}
          rows={list.data.map((q) => [
            q.prompt,
            q.difficulty,
            q.pool,
            q.version,
            <div key={q.id} className="flex gap-2">
              <AdminButton
                onClick={() => {
                  setEditing(q);
                  setForm({
                    prompt: q.prompt,
                    options: q.options.map((o) => o.text),
                    answer: q.options.findIndex((o) => o.isCorrect),
                    difficulty: q.difficulty,
                    pool: q.pool || "General",
                  });
                  setOpen(true);
                }}
              >
                Sửa
              </AdminButton>
              <AdminButton
                variant="outline"
                size="sm"
                disabled={op.busy}
                onClick={() =>
                  void op.run(
                    async () => await loadHistory(q.questionId),
                    "Đã tải lịch sử.",
                  )
                }
              >
                Lịch sử
              </AdminButton>
              <AdminButton
                variant="danger"
                size="sm"
                disabled={op.busy}
                onClick={() => {
                  if (
                    window.confirm(
                      "Xoá câu hỏi khỏi ngân hàng? Các phiên bản đã dùng vẫn được giữ lại.",
                    )
                  )
                    void op.run(async () => {
                      await adminApi(`admin/questions/${q.questionId}`, {
                        method: "DELETE",
                      });
                      await list.reload();
                    });
                }}
              >
                Xoá
              </AdminButton>
            </div>,
          ])}
        />
      </Panel>

      {open && (
        <Panel
          title={
            editing
              ? `Sửa câu hỏi · phiên bản mới từ v${editing.version}`
              : "Thêm câu hỏi"
          }
        >
          <form onSubmit={save} className="space-y-4">
            <Field label="Nội dung">
              <textarea
                required
                maxLength={10000}
                className={inputClass}
                rows={4}
                value={form.prompt}
                onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              {form.options.map((option, i) => (
                <Field key={i} label={`Lựa chọn ${String.fromCharCode(65 + i)}`}>
                  <input
                    required
                    maxLength={5000}
                    className={inputClass}
                    value={option}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        options: form.options.map((o, j) =>
                          i === j ? e.target.value : o,
                        ),
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            <div className="flex gap-2">
              <AdminButton
                variant="outline"
                disabled={form.options.length >= 8}
                onClick={() => setForm({ ...form, options: [...form.options, ""] })}
              >
                Thêm lựa chọn
              </AdminButton>
              <AdminButton
                variant="outline"
                disabled={form.options.length <= 2}
                onClick={() =>
                  setForm({
                    ...form,
                    options: form.options.slice(0, -1),
                    answer: Math.min(form.answer, form.options.length - 2),
                  })
                }
              >
                Bỏ lựa chọn cuối
              </AdminButton>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Đáp án đúng">
                <select
                  className={inputClass}
                  value={form.answer}
                  onChange={(e) =>
                    setForm({ ...form, answer: Number(e.target.value) })
                  }
                >
                  {form.options.map((_, i) => (
                    <option key={i} value={i}>
                      {String.fromCharCode(65 + i)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Độ khó">
                <select
                  className={inputClass}
                  value={form.difficulty}
                  onChange={(e) =>
                    setForm({ ...form, difficulty: e.target.value })
                  }
                >
                  {["EASY", "MEDIUM", "HARD"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Field>
              <Field label="Nhóm">
                <input
                  required
                  maxLength={120}
                  className={inputClass}
                  value={form.pool}
                  onChange={(e) => setForm({ ...form, pool: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex gap-2">
              <AdminButton type="submit" disabled={op.busy}>
                Lưu câu hỏi
              </AdminButton>
              <AdminButton variant="outline" onClick={() => setOpen(false)}>
                Huỷ
              </AdminButton>
            </div>
          </form>
        </Panel>
      )}

      {!!history.length && (
        <Panel title="Lịch sử phiên bản">
          <Table
            headers={["Phiên bản", "Nội dung", "Lựa chọn và đáp án", "Độ khó"]}
            rows={history.map((q) => [
              q.version,
              q.prompt,
              <ul key={q.id}>
                {q.options.map((o, i) => (
                  <li key={i}>
                    {String.fromCharCode(65 + i)}. {o.text}
                    {o.isCorrect ? " ✓" : ""}
                  </li>
                ))}
              </ul>,
              q.difficulty,
            ])}
          />
          <AdminButton variant="outline" onClick={() => setHistory([])}>Đóng lịch sử</AdminButton>
        </Panel>
      )}

      <ImportPanel kind="questions" onImported={() => list.reload()} />
    </div>
  );
}