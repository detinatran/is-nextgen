"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminError, adminCall, adminUrl } from "@/lib/adminApi";
import Icon from "../Icon";
import { ImportButton, Modal, field, messageOf, type ImportError } from "./shared";

type Pool = { id: string; code: string; name: string; questionCount: number };
type Difficulty = "EASY" | "MEDIUM" | "HARD";
type Question = {
  questionId: string;
  version: number;
  poolId: string;
  poolCode: string;
  prompt: string;
  difficulty: Difficulty;
  options: { position: number; text: string; isCorrect: boolean }[];
};
type Draft = { questionId?: string; poolId: string; prompt: string; difficulty: Difficulty; options: { text: string; isCorrect: boolean }[] };

export const difficultyLabel: Record<Difficulty, string> = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" };
const difficultyTone: Record<Difficulty, string> = { EASY: "bg-[#e7f6ec] text-[#15803d]", MEDIUM: "bg-sky/15 text-brand", HARD: "bg-orange/10 text-orange-ink" };
const LETTERS = "ABCDEFGH";

/** FR-4.3: ngân hàng câu hỏi Vòng 1 — nhóm câu hỏi, thêm/sửa/ẩn, nhập từ Excel. */
export default function QuestionBank({ onLogout }: { onLogout: () => void }) {
  const [pools, setPools] = useState<Pool[]>([]);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [pool, setPool] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [newPool, setNewPool] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, q] = await Promise.all([adminCall<Pool[]>("/admin/question-pools"), adminCall<Question[]>("/admin/questions")]);
      setPools(p);
      setQuestions(q);
      setError("");
    } catch (err) {
      if (err instanceof AdminError && err.status === 401) onLogout();
      else setError(messageOf(err));
    }
  }, [onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (questions ?? []).filter((x) => (!pool || x.poolId === pool) && (!q || x.prompt.toLowerCase().includes(q) || x.options.some((o) => o.text.toLowerCase().includes(q))));
  }, [questions, pool, query]);

  async function archive(q: Question) {
    if (!window.confirm(`Ẩn câu hỏi này khỏi ngân hàng?\n\n${q.prompt.slice(0, 200)}\n\nĐề đã phát cho thí sinh không bị ảnh hưởng.`)) return;
    try {
      await adminCall(`/admin/questions/${q.questionId}`, { method: "DELETE" });
      setNotice("Đã ẩn câu hỏi.");
      load();
    } catch (err) {
      setError(messageOf(err));
    }
  }

  function onImported(res: { created?: number; errors?: ImportError[] }) {
    if (res.errors?.length) return;
    setNotice(`Đã nhập ${res.created} câu hỏi.`);
    load();
  }

  return (
    <div className="mx-auto max-w-[90rem] px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setPool("")} className={chip(!pool)}>
          Tất cả · {questions?.length ?? 0}
        </button>
        {pools.map((p) => (
          <button key={p.id} onClick={() => setPool(p.id)} className={chip(pool === p.id)} title={p.name}>
            {p.code} · {p.questionCount}
          </button>
        ))}
        <button onClick={() => setNewPool(true)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand/5">
          <Icon name="plus" className="h-4 w-4" /> Nhóm mới
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-56 flex-1">
          <span className="text-xs font-semibold text-muted">Tìm câu hỏi</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nội dung câu hỏi hoặc đáp án" className={`${field} mt-1`} />
        </label>
        <a href={adminUrl("/admin/questions/template")} className="btn-outline px-4 py-2.5 text-sm">
          Tải file mẫu
        </a>
        <ImportButton path="/admin/questions/import" label="Nhập từ Excel" onDone={onImported} />
        <button
          onClick={() => setDraft({ poolId: pool || pools[0]?.id || "", prompt: "", difficulty: "MEDIUM", options: [0, 1, 2, 3].map((i) => ({ text: "", isCorrect: i === 0 })) })}
          disabled={!pools.length}
          className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
        >
          <Icon name="plus" className="h-4 w-4" /> Thêm câu hỏi
        </button>
      </div>
      {!pools.length && questions && <p className="mt-3 text-sm text-muted">Chưa có nhóm câu hỏi. Tạo nhóm mới hoặc nhập file Excel (nhóm được tạo theo cột &quot;Nhóm câu hỏi&quot;).</p>}
      {notice && <p className="mt-3 text-sm font-medium text-[#15803d]">{notice}</p>}
      {error && <p className="mt-3 text-sm font-medium text-orange-ink">{error}</p>}

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-line">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="bg-mist/70 text-xs font-semibold tracking-wide text-muted uppercase">
            <tr>
              {["#", "Nhóm", "Độ khó", "Câu hỏi và đáp án", ""].map((h) => (
                <th key={h} className="px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((q, i) => (
              <tr key={q.questionId} className="border-t border-line align-top">
                <td className="px-4 py-3 text-muted tabular-nums">{i + 1}</td>
                <td className="px-4 py-3 font-mono text-[13px] text-navy">{q.poolCode}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap ${difficultyTone[q.difficulty]}`}>{difficultyLabel[q.difficulty]}</span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold whitespace-pre-line text-navy">{q.prompt}</p>
                  <ol className="mt-1.5 grid gap-x-6 gap-y-0.5 text-[13px] sm:grid-cols-2">
                    {q.options.map((o, j) => (
                      <li key={o.position} className={o.isCorrect ? "font-semibold text-[#15803d]" : "text-muted"}>
                        {LETTERS[j]}. {o.text}
                        {o.isCorrect && " ✓"}
                      </li>
                    ))}
                  </ol>
                  {q.version > 1 && <p className="mt-1 text-[11px] text-muted">Đã sửa · phiên bản {q.version}</p>}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => setDraft({ questionId: q.questionId, poolId: q.poolId, prompt: q.prompt, difficulty: q.difficulty, options: q.options.map(({ text, isCorrect }) => ({ text, isCorrect })) })}
                    className="font-semibold text-brand hover:underline"
                  >
                    Sửa
                  </button>
                  <button onClick={() => archive(q)} className="ml-4 text-muted hover:text-orange-ink">
                    Ẩn
                  </button>
                </td>
              </tr>
            ))}
            {questions && shown.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Chưa có câu hỏi phù hợp.
                </td>
              </tr>
            )}
            {!questions && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Đang tải...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {draft && (
        <QuestionEditor
          draft={draft}
          pools={pools}
          onClose={() => setDraft(null)}
          onSaved={(msg) => {
            setDraft(null);
            setNotice(msg);
            load();
          }}
        />
      )}
      {newPool && (
        <PoolForm
          onClose={() => setNewPool(false)}
          onSaved={(p) => {
            setNewPool(false);
            setPool(p.id);
            load();
          }}
        />
      )}
    </div>
  );
}

const chip = (on: boolean) => `rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${on ? "bg-navy text-white" : "bg-white text-navy ring-1 ring-line hover:ring-navy/30"}`;

function QuestionEditor({ draft, pools, onClose, onSaved }: { draft: Draft; pools: Pool[]; onClose: () => void; onSaved: (msg: string) => void }) {
  const [d, setD] = useState(draft);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const setOption = (i: number, patch: Partial<Draft["options"][number]>) =>
    setD((x) => ({ ...x, options: x.options.map((o, j) => (j === i ? { ...o, ...patch } : patch.isCorrect ? { ...o, isCorrect: false } : o)) }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const options = d.options.map((o) => ({ ...o, text: o.text.trim() })).filter((o) => o.text);
    if (options.length < 2) return setError("Cần ít nhất 2 đáp án.");
    if (options.filter((o) => o.isCorrect).length !== 1) return setError("Hãy chọn 1 đáp án đúng (đáp án đúng không được để trống).");
    setBusy(true);
    setError("");
    try {
      const body = JSON.stringify({ poolId: d.poolId, prompt: d.prompt.trim(), difficulty: d.difficulty, options });
      if (d.questionId) await adminCall(`/admin/questions/${d.questionId}`, { method: "PUT", body });
      else await adminCall("/admin/questions", { method: "POST", body });
      onSaved(d.questionId ? "Đã lưu thay đổi. Thí sinh đã nhận đề trước đó vẫn giữ nguyên câu cũ." : "Đã thêm câu hỏi.");
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal onClose={onClose} wide>
      <form onSubmit={save}>
        <h3 className="text-lg font-bold text-navy">{d.questionId ? "Sửa câu hỏi" : "Thêm câu hỏi"}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label>
            <span className="text-xs font-semibold text-muted">Nhóm câu hỏi</span>
            <select value={d.poolId} onChange={(e) => setD({ ...d, poolId: e.target.value })} className={`${field} mt-1`}>
              {pools.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-semibold text-muted">Độ khó</span>
            <select value={d.difficulty} onChange={(e) => setD({ ...d, difficulty: e.target.value as Difficulty })} className={`${field} mt-1`}>
              {(Object.keys(difficultyLabel) as Difficulty[]).map((k) => (
                <option key={k} value={k}>
                  {difficultyLabel[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-muted">Nội dung câu hỏi</span>
          <textarea value={d.prompt} onChange={(e) => setD({ ...d, prompt: e.target.value })} required minLength={3} rows={4} className={`${field} mt-1`} />
        </label>
        <p className="mt-3 text-xs font-semibold text-muted">Đáp án (chọn ô tròn ở đáp án đúng)</p>
        <ul className="mt-1 space-y-2">
          {d.options.map((o, i) => (
            <li key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={o.isCorrect} onChange={() => setOption(i, { isCorrect: true })} className="h-4 w-4 accent-[#15803d]" aria-label={`Đáp án ${LETTERS[i]} đúng`} />
              <span className="w-5 font-semibold text-navy">{LETTERS[i]}</span>
              <input value={o.text} onChange={(e) => setOption(i, { text: e.target.value })} className={field} />
              {d.options.length > 2 && (
                <button type="button" onClick={() => setD({ ...d, options: d.options.filter((_, j) => j !== i) })} className="p-1 text-muted hover:text-orange-ink" aria-label="Bỏ đáp án">
                  <Icon name="x" className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
        {d.options.length < 8 && (
          <button type="button" onClick={() => setD({ ...d, options: [...d.options, { text: "", isCorrect: false }] })} className="mt-2 text-sm font-semibold text-brand hover:underline">
            + Thêm đáp án
          </button>
        )}
        {d.questionId && <p className="mt-3 text-[13px] text-muted">Sửa câu hỏi sẽ tạo phiên bản mới; bài thi đã phát cho thí sinh vẫn dùng phiên bản cũ.</p>}
        {error && <p className="mt-3 text-sm font-medium text-orange-ink">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-outline px-5 py-2.5 text-sm">
            Huỷ
          </button>
          <button disabled={busy} className="btn-primary px-5 py-2.5 text-sm disabled:opacity-60">
            {busy ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PoolForm({ onClose, onSaved }: { onClose: () => void; onSaved: (p: Pool) => void }) {
  const [error, setError] = useState("");
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    try {
      onSaved(await adminCall<Pool>("/admin/question-pools", { method: "POST", body: JSON.stringify({ code: String(data.get("code")).trim().toUpperCase(), name: String(data.get("name")).trim() }) }));
    } catch (err) {
      setError(messageOf(err));
    }
  }
  return (
    <Modal onClose={onClose}>
      <form onSubmit={save}>
        <h3 className="text-lg font-bold text-navy">Nhóm câu hỏi mới</h3>
        <p className="mt-1 text-[13px] text-muted">Mỗi nhóm là một mảng kiến thức. Cấu trúc đề lấy số câu ngẫu nhiên từ từng nhóm.</p>
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-muted">Mã nhóm (viết liền, không dấu)</span>
          <input name="code" required pattern="[A-Za-z0-9_\-]{2,30}" placeholder="VD: LOGIC" className={`${field} mt-1 uppercase`} />
        </label>
        <label className="mt-3 block">
          <span className="text-xs font-semibold text-muted">Tên nhóm</span>
          <input name="name" required maxLength={100} placeholder="VD: Tư duy logic" className={`${field} mt-1`} />
        </label>
        {error && <p className="mt-3 text-sm font-medium text-orange-ink">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="btn-outline px-5 py-2.5 text-sm">
            Huỷ
          </button>
          <button className="btn-primary px-5 py-2.5 text-sm">Tạo nhóm</button>
        </div>
      </form>
    </Modal>
  );
}
