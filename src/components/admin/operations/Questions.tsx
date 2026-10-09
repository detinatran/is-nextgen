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
import { Icon, PageIntro, Pagination, Pill, StatCard } from "@/components/admin/ui/kit";
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

  // Toàn bộ câu hỏi (không lọc) cho thẻ thống kê
  const all = useResource<QuestionItem[]>("admin/questions", []);
  const [page, setPage] = useState(1),
    [pageSize, setPageSize] = useState(10),
    [menuFor, setMenuFor] = useState<string | null>(null);
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

  const diffLabel: Record<string, string> = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" };
  const diffPill = (d: string) => <Pill tone={d === "EASY" ? "green" : d === "MEDIUM" ? "amber" : "red"}>{diffLabel[d] ?? d}</Pill>;
  const byDiff = (d: string) => all.data.filter((q) => q.difficulty === d).length;
  const pools = new Set(all.data.map((q) => q.pool)).size;
  const rows = list.data.slice((page - 1) * pageSize, page * pageSize);
  const edit = (q: QuestionItem) => {
    setEditing(q);
    setForm({
      prompt: q.prompt,
      options: q.options.map((o) => o.text),
      answer: q.options.findIndex((o) => o.isCorrect),
      difficulty: q.difficulty,
      pool: q.pool || "General",
    });
    setOpen(true);
  };
  const remove = (q: QuestionItem) => {
    if (window.confirm("Xoá câu hỏi khỏi ngân hàng? Các phiên bản đã dùng vẫn được giữ lại."))
      void op.run(async () => {
        await adminApi(`admin/questions/${q.questionId}`, { method: "DELETE" });
        await Promise.all([list.reload(), all.reload()]);
      });
  };
  const menuItem = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50";

  return (
    <div className="space-y-6">
      <Notice message={op.error || list.error} error />
      <Notice message={op.message} />

      <PageIntro
        icon="folder"
        title="Ngân hàng câu hỏi"
        description="Tìm kiếm, xem và quản lý ngân hàng câu hỏi trắc nghiệm. Sửa câu hỏi tạo phiên bản mới; đề đã phát vẫn giữ phiên bản cũ."
        aside={
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
        }
      />

      <section className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:grid-cols-[1fr_220px_220px]">
        <Field label="Tìm kiếm câu hỏi">
          <span className="relative block">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input aria-label="Tìm nội dung câu hỏi" placeholder="Tìm nội dung câu hỏi…" className={`${inputClass} pl-9`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          </span>
        </Field>
        <Field label="Nhóm câu hỏi">
          <select className={inputClass} value={poolFilter} onChange={(e) => { setPoolFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả nhóm</option>
            {config.data.pools.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Độ khó">
          <select className={inputClass} value={difficultyFilter} onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}>
            <option value="">Tất cả độ khó</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </Field>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon="file" tone="blue" label="Tổng câu hỏi" value={all.data.length.toLocaleString("vi-VN")} hint="Đang dùng trong ngân hàng" />
        <StatCard icon="folder" tone="green" label="Nhóm câu hỏi" value={pools} hint="Mỗi nhóm là một mảng kiến thức" />
        <StatCard icon="bars" tone="amber" label="Độ khó (Dễ / TB / Khó)" value={`${byDiff("EASY")} / ${byDiff("MEDIUM")} / ${byDiff("HARD")}`} />
        <StatCard icon="database" tone="violet" label="Định dạng import" value="DOCX / Excel" hint="Hỗ trợ nhập hàng loạt" />
      </div>

      <ImportPanel kind="questions" onImported={async () => { await Promise.all([list.reload(), all.reload()]); }} />

      <Panel
        title="Danh sách câu hỏi"
        icon="clipboard"
        description={list.loading ? "Đang tải…" : `${list.data.length} câu hỏi phù hợp`}
        actions={
          <Button variant="outline" icon="refresh" disabled={list.loading} onClick={() => void list.reload()}>
            Làm mới
          </Button>
        }
      >
        <Table
          headers={["#", "Nội dung câu hỏi", "Nhóm", "Độ khó", "Số lựa chọn", "Phiên bản", "Thao tác"]}
          empty={{ icon: "help", title: "Chưa có câu hỏi", description: "Thêm câu hỏi hoặc nhập từ file Excel/DOCX." }}
          rows={rows.map((q, i) => [
            <span key="n" className="tabular-nums text-slate-400">{(page - 1) * pageSize + i + 1}</span>,
            <span key="p" className="line-clamp-2 max-w-xl font-medium text-[#0B1F4D]">{q.prompt}</span>,
            <span key="g" className="whitespace-nowrap text-[13px]">{q.pool}</span>,
            diffPill(q.difficulty),
            <span key="o" className="tabular-nums">{q.options.length}</span>,
            <span key="v" className="tabular-nums text-slate-500">v{q.version}</span>,
            <div key={q.id} className="relative">
              <button type="button" aria-label="Thao tác" onClick={() => setMenuFor(menuFor === q.id ? null : q.id)} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50">
                <Icon name="more" className="h-4 w-4" />
              </button>
              {menuFor === q.id && (
                <div className="absolute top-full right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl" onMouseLeave={() => setMenuFor(null)}>
                  <button type="button" className={menuItem} onClick={() => { setMenuFor(null); edit(q); }}>
                    <Icon name="edit" className="h-4 w-4" /> Sửa
                  </button>
                  <button type="button" className={menuItem} disabled={op.busy} onClick={() => { setMenuFor(null); void op.run(async () => await loadHistory(q.questionId), "Đã tải lịch sử."); }}>
                    <Icon name="clock" className="h-4 w-4" /> Lịch sử phiên bản
                  </button>
                  <button type="button" className={`${menuItem} text-rose-600`} disabled={op.busy} onClick={() => { setMenuFor(null); remove(q); }}>
                    <Icon name="alert" className="h-4 w-4" /> Xoá
                  </button>
                </div>
              )}
            </div>,
          ])}
          footer={
            list.data.length > 0 && (
              <Pagination page={page} pageSize={pageSize} total={list.data.length} label="câu hỏi" onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
            )
          }
        />
      </Panel>

      {open && (
        <Panel
          icon={editing ? "edit" : "plus"}
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
                  {[["EASY", "Dễ"], ["MEDIUM", "Trung bình"], ["HARD", "Khó"]].map(([d, label]) => (
                    <option key={d} value={d}>{label}</option>
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
        <Panel title="Lịch sử phiên bản" icon="clock">
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

    </div>
  );
}