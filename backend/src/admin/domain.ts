import { AppException } from "../common/errors/app-error";

export type QuestionInput = {
  prompt: string;
  options: string[];
  answer: number;
  difficulty: string;
  pool: string;
};
export type ScorePolicy = {
  label: string;
  maxScore: number;
  criteria: { code: string; weight: number; max: number }[];
};
export type ScoreRow = {
  sourceRow?: number;
  subjectType: "CANDIDATE" | "TEAM";
  code: string;
  judge: string;
  criterion: string;
  score: number;
};

export function validateQuestion(q: QuestionInput): string[] {
  const issues: string[] = [];
  if (
    typeof q.prompt !== "string" ||
    !q.prompt.trim() ||
    q.prompt.length > 10000
  )
    issues.push("Nội dung câu hỏi không hợp lệ");
  if (
    !Array.isArray(q.options) ||
    q.options.length < 2 ||
    q.options.length > 8 ||
    q.options.some((o) => typeof o !== "string" || !o.trim() || o.length > 5000)
  )
    issues.push("Cần 2–8 lựa chọn có nội dung");
  if (
    !Number.isInteger(q.answer) ||
    q.answer < 0 ||
    q.answer >= (q.options?.length ?? 0)
  )
    issues.push("Thiếu hoặc sai đáp án");
  if (!["EASY", "MEDIUM", "HARD"].includes(q.difficulty))
    issues.push("Độ khó phải là EASY, MEDIUM hoặc HARD");
  if (typeof q.pool !== "string" || !q.pool.trim() || q.pool.length > 120)
    issues.push("Nhóm câu hỏi không hợp lệ");
  return issues;
}

export function validatePolicy(policy: ScorePolicy): void {
  if (
    !policy ||
    typeof policy.label !== "string" ||
    !policy.label.trim() ||
    !Number.isFinite(policy.maxScore) ||
    policy.maxScore <= 0 ||
    policy.maxScore > 10000 ||
    !Array.isArray(policy.criteria) ||
    !policy.criteria.length ||
    policy.criteria.length > 30
  )
    throw AppException.validation("Công thức tính điểm không hợp lệ");
  const codes = new Set<string>();
  for (const c of policy.criteria) {
    if (
      !/^[A-Za-z0-9_-]{1,40}$/.test(c.code) ||
      codes.has(c.code) ||
      !Number.isFinite(c.weight) ||
      c.weight <= 0 ||
      c.weight > 1 ||
      !Number.isFinite(c.max) ||
      c.max <= 0 ||
      c.max > 10000
    )
      throw AppException.validation(
        "Mã tiêu chí, trọng số hoặc điểm tối đa không hợp lệ",
      );
    codes.add(c.code);
  }
  if (
    Math.abs(policy.criteria.reduce((s, c) => s + c.weight, 0) - 1) > 0.000001
  )
    throw AppException.validation("Tổng trọng số phải bằng 1");
}

/** Weighted normalized criteria, then arithmetic mean across complete judge sheets. */
export function aggregateScores(
  policy: ScorePolicy,
  rows: ScoreRow[],
): { code: string; subjectType: string; judges: number; points: number }[] {
  validatePolicy(policy);
  const groups = new Map<string, ScoreRow[]>();
  for (const row of rows) {
    const key = `${row.subjectType}:${row.code}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()].map((subjectRows) => {
    const judges = [...new Set(subjectRows.map((r) => r.judge))];
    const totals = judges.map((judge) => {
      const judgeRows = subjectRows.filter((r) => r.judge === judge);
      return policy.criteria.reduce((sum, c) => {
        const values = judgeRows.filter((r) => r.criterion === c.code);
        if (
          values.length !== 1 ||
          !Number.isFinite(values[0].score) ||
          values[0].score < 0 ||
          values[0].score > c.max
        )
          throw AppException.validation(
            `Thiếu/trùng/sai điểm ${subjectRows[0].code}, ${judge}, ${c.code}`,
          );
        return sum + (values[0].score / c.max) * c.weight * policy.maxScore;
      }, 0);
    });
    return {
      code: subjectRows[0].code,
      subjectType: subjectRows[0].subjectType,
      judges: judges.length,
      points:
        Math.round(
          (totals.reduce((a, b) => a + b, 0) / judges.length) * 10000,
        ) / 10000,
    };
  });
}

export const safeCell = (value: unknown): string | number => {
  if (typeof value === "number") return value;
  const text = value === null || value === undefined ? "" : String(value);
  return /^[\s\p{Cc}]*[=+@-]/u.test(text) ? `'${text}` : text;
};
