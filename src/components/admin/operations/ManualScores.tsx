"use client";
import { FormEvent, useState, useMemo } from "react";
import {
  adminApi,
  Configuration,
  downloadAdmin,
  ScorePolicy,
} from "@/lib/admin/api";
import {
  Button,
  emptyConfig,
  Field,
  inputClass,
  Notice,
  Panel,
  Table,
  useOperations,
  useResource,
} from "./common";
import ImportPanel from "./ImportPanel";
import AdminButton from "@/components/admin/ui/AdminButton";
import { useDebounce } from "@/hooks/useDebounce";

type Results = {
  summary: {
    subjectType: string;
    code: string;
    judges: number;
    points: number;
  }[];
  rows: {
    subjectType: string;
    code: string;
    judge: string;
    criterion: string;
    score: number;
  }[];
};
export default function ManualScores() {
  const config = useResource<Configuration>("admin/configuration", emptyConfig),
    op = useOperations();
  const [competitionId, setCompetitionId] = useState(""),
    [round, setRound] = useState(2),
    [chosenPolicy, setChosenPolicy] = useState("");
  const [policyOpen, setPolicyOpen] = useState(false),
    [criteria, setCriteria] = useState<ScorePolicy["criteria"]>([
      { code: "TOTAL", weight: 1, max: 100 },
    ]);
  const [results, setResults] = useState<Results | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const competition = competitionId || config.data.competitions[0]?.id || "";
  const policies = config.data.policies.filter(
    (p) => p.competition_id === competition && p.round === round,
  );
  const policy = policies.find((p) => p.id === chosenPolicy) || policies[0];

  async function reload() {
    if (policy)
      setResults(await adminApi<Results>(`admin/scores/${policy.id}`));
  }

  // Client-side search filter
  const filteredSummary = useMemo(() => {
    if (!results || !debouncedSearch) return results?.summary ?? [];
    const needle = debouncedSearch.toLowerCase();
    return results.summary.filter((r) =>
      r.code.toLowerCase().includes(needle) ||
      r.subjectType.toLowerCase().includes(needle)
    );
  }, [results, debouncedSearch]);

  const filteredRows = useMemo(() => {
    if (!results || !debouncedSearch) return results?.rows ?? [];
    const needle = debouncedSearch.toLowerCase();
    return results.rows.filter((r) =>
      r.code.toLowerCase().includes(needle) ||
      r.judge.toLowerCase().includes(needle) ||
      r.criterion.toLowerCase().includes(needle)
    );
  }, [results, debouncedSearch]);

  function savePolicy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      fields = new FormData(form);
    void op.run(async () => {
      const created = await adminApi<{ id: string }>("admin/score-policies", {
        method: "POST",
        body: JSON.stringify({
          competitionId: competition,
          round,
          label: fields.get("label"),
          maxScore: Number(fields.get("maxScore")),
          criteria,
        }),
      });
      setChosenPolicy(created.id);
      setResults(null);
      setPolicyOpen(false);
      await config.reload();
    });
  }

  function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    void op.run(async () => {
      await adminApi("admin/teams", {
        method: "POST",
        body: JSON.stringify({
          competitionId: competition,
          code: new FormData(form).get("code"),
        }),
      });
      form.reset();
      await config.reload();
    });
  }

  return (
    <div className="space-y-6">
      <Notice message={op.error || config.error} error />
      <Notice message={op.message} />
      <Panel title="Điểm Vòng 2 & Chung kết">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Cuộc thi">
            <select
              className={inputClass}
              value={competition}
              onChange={(e) => {
                setCompetitionId(e.target.value);
                setChosenPolicy("");
                setResults(null);
              }}
            >
              {config.data.competitions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vòng">
            <select
              className={inputClass}
              value={round}
              onChange={(e) => {
                setRound(Number(e.target.value));
                setChosenPolicy("");
                setResults(null);
              }}
            >
              <option value={2}>Vòng 2</option>
              <option value={4}>Chung kết</option>
            </select>
          </Field>
          <Field label="Công thức tính điểm">
            <select
              className={inputClass}
              value={policy?.id || ""}
              onChange={(e) => {
                setChosenPolicy(e.target.value);
                setResults(null);
              }}
            >
              <option value="">Chọn công thức</option>
              {policies.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.config.label} · v{p.version}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {policy ? (
          <>
            <p className="text-sm text-slate-600">
              Điểm mỗi giám khảo = tổng (điểm tiêu chí / thang điểm tiêu chí ×
              trọng số) × {policy.config.maxScore}. Điểm tổng hợp = trung bình
              các giám khảo; làm tròn 4 chữ số thập phân.
            </p>
            <Table
              headers={["Mã tiêu chí", "Trọng số", "Thang điểm"]}
              rows={policy.config.criteria.map((c) => [
                c.code,
                `${c.weight * 100}%`,
                c.max,
              ])}
            />
          </>
        ) : (
          <p className="text-sm text-amber-800">
            Chưa cấu hình công thức cho vòng này. Nhập trọng số và thang điểm
            theo công thức BCM được Ban Tổ Chức duyệt trước khi nhập điểm.
          </p>
        )}
        <AdminButton
          disabled={!competition}
          onClick={() => setPolicyOpen(!policyOpen)}
        >
          Cấu hình phiên bản công thức mới
        </AdminButton>
      </Panel>
      {policyOpen && (
        <Panel title="Cấu hình công thức BCM">
          <p className="text-sm text-slate-500">
            Điền các tiêu chí theo quy định chính thức. Tổng trọng số phải bằng
            1. Mỗi phiên bản giữ nguyên công thức và các điểm đã nhập.
          </p>
          <form onSubmit={savePolicy} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Tên công thức">
                <input
                  className={inputClass}
                  required
                  name="label"
                  maxLength={200}
                  placeholder="Tên công thức theo quy định BCM"
                />
              </Field>
              <Field label="Thang điểm tổng">
                <input
                  required
                  type="number"
                  min={1}
                  max={10000}
                  step="any"
                  name="maxScore"
                  defaultValue={100}
                  className={inputClass}
                />
              </Field>
            </div>
            {criteria.map((c, i) => (
              <div className="grid sm:grid-cols-3 gap-3" key={i}>
                <Field label="Mã tiêu chí">
                  <input
                    required
                    pattern="[A-Za-z0-9_-]{1,40}"
                    className={inputClass}
                    value={c.code}
                    onChange={(e) =>
                      setCriteria(
                        criteria.map((v, j) =>
                          j === i ? { ...v, code: e.target.value } : v,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Trọng số (0–1)">
                  <input
                    required
                    type="number"
                    min={0.000001}
                    max={1}
                    step="any"
                    className={inputClass}
                    value={c.weight}
                    onChange={(e) =>
                      setCriteria(
                        criteria.map((v, j) =>
                          j === i
                            ? { ...v, weight: Number(e.target.value) }
                            : v,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Thang điểm tiêu chí">
                  <input
                    required
                    type="number"
                    min={0.000001}
                    max={10000}
                    step="any"
                    className={inputClass}
                    value={c.max}
                    onChange={(e) =>
                      setCriteria(
                        criteria.map((v, j) =>
                          j === i ? { ...v, max: Number(e.target.value) } : v,
                        ),
                      )
                    }
                  />
                </Field>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <AdminButton
                variant="outline"
                disabled={criteria.length >= 30}
                onClick={() =>
                  setCriteria([...criteria, { code: "", weight: 0.1, max: 10 }])
                }
              >
                Thêm tiêu chí
              </AdminButton>
              <AdminButton
                variant="outline"
                disabled={criteria.length <= 1}
                onClick={() => setCriteria(criteria.slice(0, -1))}
              >
                Bỏ tiêu chí cuối
              </AdminButton>
              <AdminButton type="submit" disabled={op.busy}>
                Lưu công thức
              </AdminButton>
            </div>
          </form>
        </Panel>
      )}
      <Panel title="Mã đội hợp lệ">
        <form className="flex items-end gap-3" onSubmit={createTeam}>
          <Field label="Mã đội">
            <input required name="code" className={inputClass} maxLength={80} />
          </Field>
          <AdminButton type="submit" disabled={op.busy || !competition}>
            Thêm mã đội
          </AdminButton>
        </form>
        <p className="text-sm text-slate-500">
          {config.data.teams
            .filter((t) => t.competition_id === competition)
            .map((t) => t.team_code)
            .join(", ") || "Chưa có mã đội."}
        </p>
      </Panel>
      <ImportPanel
        key={policy?.id || "none"}
        kind="scores"
        policyId={policy?.id}
        onImported={reload}
      />
      {policy && (
        <Panel title="Bảng điểm tổng hợp">
          <div className="flex flex-wrap gap-3 mb-4">
            <Field label="Tìm kiếm">
              <input
                className={inputClass}
                placeholder="Tìm theo mã, loại, giám khảo, tiêu chí..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={200}
              />
            </Field>
            <AdminButton
              disabled={op.busy}
              onClick={() => void op.run(reload, "Đã tải bảng điểm.")}
            >
              Xem bảng điểm
            </AdminButton>
            <AdminButton
              disabled={op.busy}
              onClick={() =>
                void op.run(
                  () =>
                    downloadAdmin(
                      `scores/${policy.id}/export`,
                      "manual-scores.xlsx",
                    ),
                  "Đã xuất bảng tổng hợp.",
                )
              }
            >
              Xuất Excel
            </AdminButton>
          </div>
          {results && (
            <>
              <Table
                headers={["Mã", "Loại", "Giám khảo", "Điểm tổng hợp"]}
                rows={filteredSummary.map((r) => [
                  r.code,
                  r.subjectType === "TEAM" ? "Đội" : "Thí sinh",
                  r.judges,
                  r.points,
                ])}
              />
              <Table
                headers={["Mã", "Giám khảo", "Tiêu chí", "Điểm"]}
                rows={filteredRows.map((r) => [
                  r.code,
                  r.judge,
                  r.criterion,
                  r.score,
                ])}
              />
            </>
          )}
        </Panel>
      )}
    </div>
  );
}
