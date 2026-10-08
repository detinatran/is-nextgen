import {
  aggregateScores,
  safeCell,
  validatePolicy,
  validateQuestion,
} from "../../src/admin/domain";
describe("Admin import/export and scoring rules", () => {
  it("requires a single valid answer and nonempty options", () => {
    expect(
      validateQuestion({
        prompt: "Q",
        options: ["A", ""],
        answer: -1,
        difficulty: "BAD",
        pool: "P",
      }).length,
    ).toBe(3);
  });
  it("rejects invalid total weights and incomplete judge sheets", () => {
    expect(() =>
      validatePolicy({
        label: "Policy",
        maxScore: 100,
        criteria: [{ code: "A", weight: 0.5, max: 10 }],
      }),
    ).toThrow();
    expect(() =>
      aggregateScores(
        {
          label: "Policy",
          maxScore: 100,
          criteria: [{ code: "A", weight: 1, max: 10 }],
        },
        [
          {
            subjectType: "TEAM",
            code: "T1",
            judge: "J1",
            criterion: "B",
            score: 1,
          },
        ],
      ),
    ).toThrow();
  });
  it("neutralizes spreadsheet formulas while preserving numeric scores", () => {
    expect(safeCell(' =HYPERLINK("bad")')).toBe('\' =HYPERLINK("bad")');
    expect(safeCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(safeCell(89)).toBe(89);
  });
});
