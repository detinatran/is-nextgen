"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { adminApi, Configuration, downloadAdmin, ScorePolicy } from "@/lib/admin/api";
import { Button, emptyConfig, Field, inputClass, Notice, Panel, Table, useOperations, useResource } from "./common";
import ImportPanel from "./ImportPanel";
import { Callout, Drawer, Icon, PageHeader, Tabs } from "@/components/admin/ui/kit";
import { useDebounce } from "@/hooks/useDebounce";

type Results = {
  summary: { subjectType: string; code: string; judges: number; points: number }[];
  rows: { subjectType: string; code: string; judge: string; criterion: string; score: number }[];
};
const rounds = [
  { value: 2, label: "Vòng 2" },
  { value: 4, label: "Chung kết" },
];

export default function ManualScores() {
  const config = useResource<Configuration>("admin/configuration", emptyConfig),
    op = useOperations();
  const [competitionId, setCompetitionId] = useState(""),
    [round, setRound] = useState(2),
    [chosenPolicy, setChosenPolicy] = useState("");
  const [policyOpen, setPolicyOpen] = useState(false),
    [policyForm, setPolicyForm] = useState({ label: "", maxScore: "100" }),
    [criteria, setCriteria] = useState<ScorePolicy["criteria"]>([{ code: "TOTAL", weight: 1, max: 100 }]),
    [policySubmitted, setPolicySubmitted] = useState(false);
  const [results, setResults] = useState<{ loading: boolean; error: string; data: Results | null }>({ loading: false, error: "", data: null });
  const [view, setView] = useState<"summary" | "detail">("summary");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [teamCode, setTeamCode] = useState("");

  const competition = competitionId || config.data.competitions[0]?.id || "";
  const policies = config.data.policies.filter((p) => p.competition_id === competition && p.round === round);
  const policy = policies.find((p) => p.id === chosenPolicy) || policies[0];
  const teams = config.data.teams.filter((t) => t.competition_id === competition);

  const loadResults = useCallback(async () => {
    if (!policy) return setResults({ loading: false, error: "", data: null });
    setResults((r) => ({ ...r, loading: true, error: "" }));
    try {
      setResults({ loading: false, error: "", data: await adminApi<Results>(`admin/scores/${policy.id}`) });
    } catch (e) {
      setResults({ loading: false, error: (e as Error).message, data: null });
    }
  }, [policy?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  const needle = debouncedSearch.trim().toLowerCase();
  const summary = useMemo(() => (results.data?.summary ?? []).filter((r) => !needle || r.code.toLowerCase().includes(needle)), [results.data, needle]);
  const detail = useMemo(
    () => (results.data?.rows ?? []).filter((r) => !needle || [r.code, r.judge, r.criterion].some((v) => v.toLowerCase().includes(needle))),
    [results.data, needle],
  );

  const weightSum = criteria.reduce((s, c) => s + (Number(c.weight) || 0), 0);
  const policyErrors = {
    label: policyForm.label.trim() ? "" : "Nhập tên Rubric",
    maxScore: Number(policyForm.maxScore) > 0 && Number(policyForm.maxScore) <= 10000 ? "" : "Từ 0 đến 10.000",
    criteria: criteria.some((c) => !/^[A-Za-z0-9_-]{1,40}$/.test(c.code))
      ? "Mã tiêu chí chỉ gồm chữ, số, - và _ (tối đa 40 ký tự)"
      : new Set(criteria.map((c) => c.code)).size !== criteria.length
        ? "Mã tiêu chí bị trùng"
        : criteria.some((c) => !(c.weight > 0 && c.weight <= 1) || !(c.max > 0 && c.max <= 10000))
          ? "Trọng số trong (0, 1], thang điểm trong (0, 10.000]"
          : Math.abs(weightSum - 1) > 1e-6
            ? `Tổng trọng số phải bằng 1 (hiện ${+weightSum.toFixed(4)})`
            : "",
  };
  function savePolicy(event: FormEvent) {
    event.preventDefault();
    setPolicySubmitted(true);
    if (Object.values(policyErrors).some(Boolean)) return;
    void op.run(async () => {
      const created = await adminApi<{ id: string }>("admin/score-policies", {
        method: "POST",
        body: JSON.stringify({ competitionId: competition, round, label: policyForm.label.trim(), maxScore: Number(policyForm.maxScore), criteria }),
      });
      setChosenPolicy(created.id);
      setPolicyOpen(false);
      setPolicySubmitted(false);
      await config.reload();
    }, "Đã lưu phiên bản Rubric mới.");
  }

  function createTeam(event: FormEvent) {
    event.preventDefault();
    if (!teamCode.trim()) return;
    void op.run(async () => {
      await adminApi("admin/teams", { method: "POST", body: JSON.stringify({ competitionId: competition, code: teamCode.trim() }) });
      setTeamCode("");
      await config.reload();
    }, `Đã thêm mã đội ${teamCode.trim()}.`);
  }
  const setCrit = (i: number, patch: Partial<ScorePolicy["criteria"][number]>) => setCriteria(criteria.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  return (
    <div className="space-y-6">
      <PageHeader title="Chấm điểm Rubric" description="Điểm Vòng 2 và Chung kết theo bộ tiêu chí Ban Tổ chức phê duyệt. Mỗi phiên bản Rubric giữ nguyên điểm đã nhập theo phiên bản đó." />
      <Notice message={op.error} error />
      <Notice message={op.message} />
      {config.error && <Notice message={`Không tải được cấu hình: ${config.error}`} error onRetry={config.reload} />}

      <section className="flex flex-wrap items-end gap-4 rounded-xl border border-adm-border bg-white p-4">
        {config.data.competitions.length > 1 && (
          <div className="w-full sm:w-64">
            <Field label="Cuộc thi">
              <select className={inputClass} value={competition} onChange={(e) => { setCompetitionId(e.target.value); setChosenPolicy(""); }}>
                {config.data.competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-adm-text">Vòng thi</span>
          <div role="radiogroup" aria-label="Vòng thi" className="inline-flex h-[42px] items-center rounded-lg border border-adm-border bg-adm-bg p-0.5">
            {rounds.map((r) => (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={round === r.value}
                onClick={() => { setRound(r.value); setChosenPolicy(""); }}
                className={`h-full rounded-md px-4 text-[13px] font-medium transition ${round === r.value ? "bg-white text-adm-text shadow-sm" : "text-adm-sub hover:text-adm-text"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="w-full sm:w-72">
          <Field label="Phiên bản Rubric">
            <select className={inputClass} value={policy?.id || ""} onChange={(e) => setChosenPolicy(e.target.value)} disabled={!policies.length}>
              {!policies.length && <option value="">Chưa có Rubric</option>}
              {policies.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.config.label} · v{p.version}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <Panel
        step={1}
        title="Cấu hình Rubric"
        description="Tiêu chí, trọng số và thang điểm dùng để tính điểm."
        actions={
          <Button variant="secondary" icon="plus" disabled={!competition} onClick={() => setPolicyOpen(true)}>
            Phiên bản mới
          </Button>
        }
      >
        {policy ? (
          <>
            <Table
              numeric={[1, 2]}
              headers={["Tiêu chí", "Trọng số", "Thang điểm"]}
              rows={policy.config.criteria.map((c) => [<span key="c" className="font-mono text-[13px]">{c.code}</span>, `${+(c.weight * 100).toFixed(2)}%`, c.max])}
            />
            <p className="text-[13px] leading-relaxed text-adm-sub">
              Điểm mỗi giám khảo = Σ (điểm tiêu chí ÷ thang tiêu chí × trọng số) × {policy.config.maxScore}. Điểm tổng hợp = trung bình các giám khảo, làm tròn 4 chữ số thập phân.
            </p>
          </>
        ) : (
          <Callout tone="warning" title={`Chưa có Rubric cho ${rounds.find((r) => r.value === round)?.label}`} action={<Button size="sm" onClick={() => setPolicyOpen(true)} disabled={!competition}>Tạo Rubric</Button>}>
            Cần cấu hình tiêu chí theo quy định đã duyệt trước khi nhập điểm.
          </Callout>
        )}
      </Panel>

      <Panel step={2} title="Đội thi" description="Mã đội hợp lệ để nhập điểm với subjectType = TEAM.">
        <form className="flex flex-wrap items-end gap-3" onSubmit={createTeam}>
          <div className="w-full sm:w-72">
            <Field label="Mã đội">
              <input value={teamCode} onChange={(e) => setTeamCode(e.target.value)} className={inputClass} maxLength={80} placeholder="VD: TEAM01" />
            </Field>
          </div>
          <Button type="submit" variant="secondary" disabled={op.busy || !competition || !teamCode.trim()}>
            Thêm mã đội
          </Button>
        </form>
        {teams.length ? (
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => (
              <span key={t.team_code} className="rounded-md border border-adm-border bg-adm-bg px-2 py-1 font-mono text-xs text-adm-text">
                {t.team_code}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-adm-sub">Chưa có mã đội. Bỏ qua bước này nếu chấm điểm từng thí sinh.</p>
        )}
      </Panel>

      <ImportPanel step={3} key={policy?.id || "none"} kind="scores" policyId={policy?.id} onImported={loadResults} />

      <Panel
        title="Kết quả"
        description={policy ? `${policy.config.label} · v${policy.version}` : "Chọn hoặc tạo Rubric để xem kết quả."}
        actions={
          policy && (
            <Button variant="secondary" icon="download" disabled={op.busy || !results.data?.summary.length} onClick={() => void op.run(() => downloadAdmin(`scores/${policy.id}/export`, "manual-scores.xlsx"), "Đã xuất bảng tổng hợp.")}>
              Xuất Excel
            </Button>
          )
        }
      >
        {policy &&
          (results.error ? (
            <Notice message={`Không tải được kết quả: ${results.error}`} error onRetry={() => void loadResults()} />
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <Tabs
                  value={view}
                  onChange={setView}
                  items={[
                    { value: "summary", label: "Tổng hợp", count: results.data?.summary.length },
                    { value: "detail", label: "Chi tiết theo giám khảo", count: results.data?.rows.length },
                  ]}
                />
                <label className="relative mb-2 w-full sm:w-64">
                  <span className="sr-only">Tìm theo mã, giám khảo, tiêu chí</span>
                  <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-adm-muted" />
                  <input className={`${inputClass} pl-9`} placeholder="Tìm mã, giám khảo, tiêu chí" value={search} onChange={(e) => setSearch(e.target.value)} maxLength={200} />
                </label>
              </div>
              {view === "summary" ? (
                <Table
                  loading={results.loading}
                  numeric={[2, 3]}
                  headers={["Mã", "Loại", "Số giám khảo", "Điểm tổng hợp"]}
                  empty={{ icon: "chart", title: "Chưa có điểm", description: "Nhập tệp điểm ở bước 3." }}
                  rows={summary.map((r) => [<span key="c" className="font-mono text-[13px]">{r.code}</span>, r.subjectType === "TEAM" ? "Đội" : "Thí sinh", r.judges, <strong key="p">{r.points}</strong>])}
                />
              ) : (
                <Table
                  loading={results.loading}
                  numeric={[3]}
                  headers={["Mã", "Giám khảo", "Tiêu chí", "Điểm"]}
                  empty={{ icon: "chart", title: "Chưa có điểm", description: "Nhập tệp điểm ở bước 3." }}
                  rows={detail.map((r) => [<span key="c" className="font-mono text-[13px]">{r.code}</span>, r.judge, <span key="k" className="font-mono text-[13px]">{r.criterion}</span>, r.score])}
                />
              )}
            </>
          ))}
      </Panel>

      <Drawer
        open={policyOpen}
        onClose={() => setPolicyOpen(false)}
        title="Phiên bản Rubric mới"
        subtitle={rounds.find((r) => r.value === round)?.label}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPolicyOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" form="policy-form" loading={op.busy}>
              Lưu Rubric
            </Button>
          </>
        }
      >
        <form id="policy-form" onSubmit={savePolicy} noValidate className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <Field label="Tên Rubric" required error={policySubmitted ? policyErrors.label : undefined}>
              <input className={inputClass} value={policyForm.label} onChange={(e) => setPolicyForm({ ...policyForm, label: e.target.value })} maxLength={200} placeholder="Theo quy định đã duyệt" />
            </Field>
            <Field label="Thang điểm tổng" required error={policySubmitted ? policyErrors.maxScore : undefined}>
              <input type="number" step="any" className={inputClass} value={policyForm.maxScore} onChange={(e) => setPolicyForm({ ...policyForm, maxScore: e.target.value })} />
            </Field>
          </div>
          <fieldset>
            <legend className="mb-2 flex w-full items-center justify-between text-[13px] font-medium text-adm-text">
              Tiêu chí
              <span className={`tabular-nums ${Math.abs(weightSum - 1) > 1e-6 ? "text-adm-warning" : "text-adm-sub"}`}>Tổng trọng số {+weightSum.toFixed(4)}</span>
            </legend>
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_100px_100px] gap-2 text-xs text-adm-sub">
                <span>Mã</span>
                <span>Trọng số (0–1)</span>
                <span>Thang điểm</span>
              </div>
              {criteria.map((c, i) => (
                <div className="grid grid-cols-[1fr_100px_100px] gap-2" key={i}>
                  <input aria-label={`Mã tiêu chí ${i + 1}`} className={inputClass} value={c.code} onChange={(e) => setCrit(i, { code: e.target.value })} />
                  <input aria-label={`Trọng số tiêu chí ${i + 1}`} type="number" step="any" className={inputClass} value={c.weight} onChange={(e) => setCrit(i, { weight: Number(e.target.value) })} />
                  <input aria-label={`Thang điểm tiêu chí ${i + 1}`} type="number" step="any" className={inputClass} value={c.max} onChange={(e) => setCrit(i, { max: Number(e.target.value) })} />
                </div>
              ))}
            </div>
            {policySubmitted && policyErrors.criteria && (
              <p className="mt-2 text-xs text-adm-error" role="alert">
                {policyErrors.criteria}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="ghost" icon="plus" disabled={criteria.length >= 30} onClick={() => setCriteria([...criteria, { code: "", weight: 0.1, max: 10 }])}>
                Thêm tiêu chí
              </Button>
              <Button size="sm" variant="ghost" disabled={criteria.length <= 1} onClick={() => setCriteria(criteria.slice(0, -1))}>
                Bỏ tiêu chí cuối
              </Button>
            </div>
          </fieldset>
        </form>
      </Drawer>
    </div>
  );
}
