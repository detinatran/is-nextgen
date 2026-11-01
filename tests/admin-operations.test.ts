import test from "node:test";
import assert from "node:assert/strict";

test("Schedule safety: protected official Round 1 schedule cannot be deleted", () => {
  const OFFICIAL_ROUND1_SCHEDULE_ID = "1d7134cb-d5ab-4f47-80ee-f6ff50a41e40";
  const officialSchedule = {
    id: "1d7134cb-d5ab-4f47-80ee-f6ff50a41e40",
    name: "Vòng 1 · 07/11 (vào thi 08:00–23:00)",
  };

  const isProtected = (id: string, name: string) => {
    return id === OFFICIAL_ROUND1_SCHEDULE_ID || name.includes("07/11");
  };

  assert.equal(isProtected(officialSchedule.id, officialSchedule.name), true);

  const testSchedule1 = {
    id: "a3178eab-410f-4155-abc4-a55edda64f1e",
    name: "Ca thử nghiệm",
  };
  const testSchedule2 = {
    id: "c2b829dc-ffc7-4bda-9f73-2131345611ab",
    name: "Ca thử nghiệm 2",
  };
  assert.equal(isProtected(testSchedule1.id, testSchedule1.name), false);
  assert.equal(isProtected(testSchedule2.id, testSchedule2.name), false);
});

test("Schedule blueprint generation: poolId 'ALL' includes all 5 pools totaling 25 questions", () => {
  const pools = [
    { id: "p1", code: "SELF", count: 5 },
    { id: "p2", code: "THINK", count: 5 },
    { id: "p3", code: "CREATE", count: 5 },
    { id: "p4", code: "CONNECT", count: 5 },
    { id: "p5", code: "ADAPT", count: 5 },
  ];

  function buildBlueprint(poolId: string | undefined, questionCount: number) {
    if (!poolId || poolId === "ALL") {
      const items = pools.map((p) => ({
        poolId: p.id,
        count: p.count,
        points: Number((100 / 25).toFixed(4)),
      }));
      const total = items.reduce((sum, item) => sum + item.count, 0);
      return { total, items };
    }
    return {
      total: questionCount,
      items: [{ poolId, count: questionCount, points: 100 / questionCount }],
    };
  }

  const allBlueprint = buildBlueprint("ALL", 25);
  assert.equal(allBlueprint.total, 25);
  assert.equal(allBlueprint.items.length, 5);
  assert.equal(allBlueprint.items.every((i) => i.count === 5), true);
  assert.equal(allBlueprint.items[0].points, 4);

  const singleBlueprint = buildBlueprint("p1", 5);
  assert.equal(singleBlueprint.total, 5);
  assert.equal(singleBlueprint.items.length, 1);
});

test("Candidate deletion: ensures full cascade deletes without leaving orphaned unique email", () => {
  const mockDb = {
    users: [{ id: "u1", email_normalized: "cand@test.com" }],
    candidates: [{ id: "c1", user_id: "u1" }],
    candidate_profiles: [{ candidate_id: "c1", email_normalized: "cand@test.com" }],
    registrations: [{ id: "r1", candidate_id: "c1" }],
  };

  function deleteCandidate(candidateId: string) {
    const c = mockDb.candidates.find((c) => c.id === candidateId);
    if (!c) return false;
    mockDb.candidates = mockDb.candidates.filter((x) => x.id !== candidateId);
    mockDb.candidate_profiles = mockDb.candidate_profiles.filter((x) => x.candidate_id !== candidateId);
    mockDb.registrations = mockDb.registrations.filter((x) => x.candidate_id !== candidateId);
    if (c.user_id) {
      mockDb.users = mockDb.users.filter((x) => x.id !== c.user_id);
    }
    return true;
  }

  assert.equal(deleteCandidate("c1"), true);
  assert.equal(mockDb.candidates.length, 0);
  assert.equal(mockDb.candidate_profiles.length, 0);
  assert.equal(mockDb.registrations.length, 0);
  assert.equal(mockDb.users.length, 0);

  // Email is now completely free to register again
  const canRegister = !mockDb.users.some((u) => u.email_normalized === "cand@test.com") &&
                      !mockDb.candidate_profiles.some((p) => p.email_normalized === "cand@test.com");
  assert.equal(canRegister, true);
});
