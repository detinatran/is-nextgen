"use client";
import { FormEvent, useState } from "react";
import { adminApi, QuestionItem } from "@/lib/admin/api";
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

const blank = () => ({
  prompt: "",
  options: ["", "", "", ""],
  answer: 0,
  difficulty: "EASY",
  pool: "General",
});
export default function Questions() {
  const list = useResource<QuestionItem[]>("admin/questions", []),
    op = useOperations();
  const [form, setForm] = useState(blank),
    [editing, setEditing] = useState<QuestionItem | null>(null),
    [open, setOpen] = useState(false);
  const [history, setHistory] = useState<QuestionItem[]>([]),
    [search, setSearch] = useState("");
  function save(event: FormEvent) {
    event.preventDefault();
    void op.run(async () => {
      await adminApi(
        `admin/questions${editing ? `/${editing.questionId}` : ""}`,
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({
            ...form,
            ...(editing ? { expectedVersion: editing.version } : {}),
          }),
        },
      );
      setOpen(false);
      setForm(blank());
      setEditing(null);
      await list.reload();
    });
  }
  return (
    <div className="space-y-6">
      <Notice message={op.error || list.error} error />
      <Notice message={op.message} />
      <Panel title="Ngân hàng câu hỏi">
        <div className="flex gap-3">
          <input
            aria-label="Tìm nội dung câu hỏi"
            placeholder="Tìm nội dung câu hỏi…"
            className={inputClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            onClick={() => {
              setForm(blank());
              setEditing(null);
              setOpen(true);
            }}
          >
            Thêm câu hỏi
          </Button>
        </div>
        {list.loading && <p role="status">Đang tải…</p>}
        <Table
          headers={["Nội dung", "Độ khó", "Nhóm", "Phiên bản", "Thao tác"]}
          rows={list.data
            .filter((q) =>
              q.prompt.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
            )
            .map((q) => [
              q.prompt,
              q.difficulty,
              q.pool,
              q.version,
              <div key={q.id} className="flex gap-2">
                <Button
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
                </Button>
                <Button
                  disabled={op.busy}
                  onClick={() =>
                    void op.run(
                      async () =>
                        setHistory(
                          await adminApi(
                            `admin/questions/${q.questionId}/history`,
                          ),
                        ),
                      "Đã tải lịch sử.",
                    )
                  }
                >
                  Lịch sử
                </Button>
                <Button
                  danger
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
                </Button>
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
                <Field
                  key={i}
                  label={`Lựa chọn ${String.fromCharCode(65 + i)}`}
                >
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
              <Button
                disabled={form.options.length >= 8}
                onClick={() =>
                  setForm({ ...form, options: [...form.options, ""] })
                }
              >
                Thêm lựa chọn
              </Button>
              <Button
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
              </Button>
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
              <Button type="submit" disabled={op.busy}>
                Lưu câu hỏi
              </Button>
              <Button onClick={() => setOpen(false)}>Huỷ</Button>
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
          <Button onClick={() => setHistory([])}>Đóng lịch sử</Button>
        </Panel>
      )}
    </div>
  );
}
