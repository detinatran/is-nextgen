import argon2 from "argon2";
import ExcelJS from "exceljs";
import AdmZip from "adm-zip";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  authed,
  createTestApp,
  destroyTestApp,
  login,
  resetDatabase,
  seedReadyVideo,
  setupExam,
  type TestContext,
  type SessionCookies,
} from "./helpers/test-kit";
import { ScoringService } from "../../src/scoring/scoring.service";
import type { Response as SuperResponse } from "superagent";
import { SessionService } from "../../src/identity-access/session.service";

describe("Admin FR-01–FR-12 with PostgreSQL", () => {
  let ctx: TestContext, cookies: SessionCookies;
  const password = "AdminTest!12345",
    email = "admin@test.local";
  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await destroyTestApp(ctx);
  });
  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    const user = await ctx.prisma.users.create({
      data: {
        email,
        email_normalized: email,
        password_hash: await argon2.hash(password),
        status: "ACTIVE",
        email_verified_at: new Date(),
      },
    });
    const role = await ctx.prisma.roles.findUniqueOrThrow({
      where: { code: "ADMIN" },
    });
    await ctx.prisma.user_roles.create({
      data: { user_id: user.id, role_id: role.id },
    });
    const challenge = await login(ctx, email, password);
    expect(challenge.status).toBe(200);
    expect(challenge.body.status).toBe("MFA_REQUIRED");
    const intent = await ctx.prisma.notification_intents.findUniqueOrThrow({
      where: { deduplication_key: `challenge:${challenge.body.challengeId}` },
    });
    const result = await ctx.http
      .post(
        `/api/v1/auth/admin/mfa-challenges/${challenge.body.challengeId}/verification`,
      )
      .send({ code: (intent.payload as { code: string }).code });
    expect(result.status).toBe(200);
    const raw = result.headers["set-cookie"] as unknown as string[];
    cookies = {
      session: raw.find((c) => c.startsWith("isng_session="))!.split(";")[0],
      csrf: raw.find((c) => c.startsWith("isng_csrf="))!.split(";")[0],
    };
  });

  async function createCandidate(index = 1) {
    const result = await ctx.http
      .post("/api/v1/admin/candidates")
      .set(authed(cookies))
      .send({
        fullName: `Thí sinh ${index}`,
        email: `student${index}@test.local`,
        school: "Trường Kiểm Thử",
        studentId: `SV${index}`,
      });
    expect(result.status).toBe(201);
    return result.body as {
      candidateId: string;
      identifier: string;
      email: string;
      password: string;
    };
  }
  async function competition() {
    return ctx.prisma.competitions.create({
      data: {
        code: randomUUID(),
        name: "Admin test competition",
        registration_opens_at: new Date(Date.now() - 100000),
        registration_closes_at: new Date(Date.now() + 86400000),
      },
    });
  }
  async function question(prompt = "1 + 1 = ?") {
    const body = {
      prompt,
      options: ["1", "2", "3", "4"],
      answer: 1,
      difficulty: "EASY",
      pool: "Admin test pool",
    };
    const result = await ctx.http
      .post("/api/v1/admin/questions")
      .set(authed(cookies))
      .send(body);
    expect(result.status).toBe(201);
    return { ...result.body, input: body };
  }
  async function xlsx(headers: string[], rows: unknown[][]) {
    const w = new ExcelJS.Workbook();
    const sheet = w.addWorksheet("Import");
    sheet.addRow(headers);
    rows.forEach((r) => sheet.addRow(r));
    return Buffer.from(await w.xlsx.writeBuffer());
  }
  const binaryParser = (
    res: SuperResponse,
    callback: (error: Error | null, data: Buffer) => void,
  ) => {
    const chunks: Buffer[] = [];
    res.on("data", (chunk: Buffer) => chunks.push(chunk));
    res.on("end", () => callback(null, Buffer.concat(chunks)));
  };
  async function schedule(competitionId: string, capacity = 1) {
    const pool = await ctx.prisma.question_pools.findUniqueOrThrow({
      where: { code: "Admin test pool" },
    });
    const body = {
      competitionId,
      name: `Ca ${randomUUID()}`,
      opensAt: new Date(Date.now() - 60000).toISOString(),
      closesAt: new Date(Date.now() + 7200000).toISOString(),
      durationSeconds: 1800,
      capacity,
      questionCount: 1,
      poolId: pool.id,
    };
    const result = await ctx.http
      .post("/api/v1/admin/schedules")
      .set(authed(cookies))
      .send(body);
    expect(result.status).toBe(201);
    return result.body;
  }
  async function submitted(candidateId: string, competitionId: string) {
    const registration = await ctx.prisma.registrations.create({
      data: { candidate_id: candidateId, competition_id: competitionId },
    });
    const videoId = await seedReadyVideo(ctx, registration.id);
    await ctx.prisma.registrations.update({
      where: { id: registration.id },
      data: {
        state: "SUBMITTED",
        submitted_at: new Date(),
        submitted_profile: {},
      },
    });
    return { registration, videoId };
  }

  it("FR-01/02 denies bad credentials, pre-MFA sessions and student access; revokes logout", async () => {
    expect((await login(ctx, email, "incorrect")).status).toBe(401);
    expect((await ctx.http.get("/api/v1/admin/registrations")).status).toBe(
      401,
    );
    const adminUser = await ctx.prisma.users.findUniqueOrThrow({
      where: { email_normalized: email },
    });
    const legacy = await ctx.app.get(SessionService).issue(adminUser.id, 24);
    expect(
      (
        await ctx.http
          .get("/api/v1/admin/session")
          .set("Cookie", `isng_session=${legacy.token}`)
      ).status,
    ).toBe(403);
    expect(
      (
        await ctx.http
          .post("/api/v1/admin/candidates")
          .set("Cookie", cookies.session)
          .send({
            fullName: "CSRF",
            email: "csrf@test.local",
            studentId: "X",
            school: "X",
          })
      ).status,
    ).toBe(403);
    const student = await createCandidate();
    const session = await login(ctx, student.email, student.password);
    expect(session.status).toBe(200);
    expect(
      (
        await ctx.http
          .get("/api/v1/admin/registrations")
          .set(authed(session.cookies))
      ).status,
    ).toBe(403);
    expect(
      (await ctx.http.get("/api/v1/admin/session").set(authed(cookies))).status,
    ).toBe(200);
    expect(
      (await ctx.http.post("/api/v1/auth/logout").set(authed(cookies))).status,
    ).toBe(204);
    expect(
      (await ctx.http.get("/api/v1/admin/session").set(authed(cookies))).status,
    ).toBe(401);
  });

  it("FR-03 resets credentials, revokes old sessions, locks and deletes accounts", async () => {
    const student = await createCandidate();
    const session = await login(ctx, student.email, student.password);
    const reset = await ctx.http
      .post(`/api/v1/admin/candidates/${student.candidateId}/account`)
      .set(authed(cookies))
      .send({ action: "RESET" });
    expect(reset.status).toBe(201);
    expect((await login(ctx, student.email, student.password)).status).toBe(
      401,
    );
    expect(
      (
        await ctx.http
          .get("/api/v1/me/assignments")
          .set(authed(session.cookies))
      ).status,
    ).toBe(401);
    expect((await login(ctx, student.email, reset.body.password)).status).toBe(
      200,
    );
    expect(
      (
        await ctx.http
          .post(`/api/v1/admin/candidates/${student.candidateId}/account`)
          .set(authed(cookies))
          .send({ action: "DISABLE" })
      ).status,
    ).toBe(201);
    expect((await login(ctx, student.email, reset.body.password)).status).toBe(
      401,
    );
    expect(
      (
        await ctx.http
          .post(`/api/v1/admin/candidates/${student.candidateId}/account`)
          .set(authed(cookies))
          .send({ action: "ENABLE" })
      ).status,
    ).toBe(201);
    expect(
      (
        await ctx.http
          .post(`/api/v1/admin/candidates/${student.candidateId}/account`)
          .set(authed(cookies))
          .send({ action: "DELETE", reason: "Duplicate account" })
      ).status,
    ).toBe(201);
    expect((await login(ctx, student.email, reset.body.password)).status).toBe(
      401,
    );
    expect(
      (
        await ctx.http
          .post(`/api/v1/admin/candidates/${student.candidateId}/account`)
          .set(authed(cookies))
          .send({ action: "ENABLE" })
      ).status,
    ).toBe(409);
    expect(await ctx.prisma.candidate_profiles.count()).toBe(1);
  });

  it("FR-04/05 searches by student ID/name/email, filters school, streams private video and exports real files", async () => {
    const student = await createCandidate(),
      comp = await competition(),
      { registration, videoId } = await submitted(student.candidateId, comp.id);
    const media = await ctx.prisma.media_objects.findUniqueOrThrow({
      where: { id: videoId },
    });
    const path = resolve(process.env.MEDIA_STORAGE_DIR!, media.object_key);
    await mkdir(resolve(path, ".."), { recursive: true });
    await writeFile(path, Buffer.from("private-video-test"));
    for (const search of ["SV1", "Thí sinh", student.email]) {
      const found = await ctx.http
        .get("/api/v1/admin/registrations")
        .query({ search, school: "Trường Kiểm Thử" })
        .set(authed(cookies));
      expect(found.status).toBe(200);
      expect(found.body).toHaveLength(1);
    }
    expect(
      (
        await ctx.http.get(
          `/api/v1/admin/registrations/${registration.id}/video`,
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await ctx.http
          .get(`/api/v1/admin/registrations/${registration.id}/video`)
          .set(authed(cookies))
      ).status,
    ).toBe(200);
    const exported = await ctx.http
      .get("/api/v1/admin/registrations/export?format=xlsx")
      .set(authed(cookies))
      .buffer(true)
      .parse(binaryParser);
    expect(exported.status).toBe(200);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(exported.body);
    expect(workbook.worksheets[0].rowCount).toBe(2);
    expect(workbook.worksheets[0].getRow(2).getCell(1).text).toBe(
      student.identifier,
    );
    const csv = await ctx.http
      .get("/api/v1/admin/registrations/export?format=csv")
      .set(authed(cookies));
    expect(csv.status).toBe(200);
    expect(csv.text).toContain(student.identifier);
    expect(csv.text).toContain("/video");
  });

  it("FR-06 preserves old versions, rejects stale edits and archives without evidence deletion", async () => {
    const q = await question();
    const update = await ctx.http
      .put(`/api/v1/admin/questions/${q.questionId}`)
      .set(authed(cookies))
      .send({ ...q.input, prompt: "Edited", expectedVersion: 1 });
    expect(update.status).toBe(200);
    expect(update.body.version).toBe(2);
    expect(
      (
        await ctx.http
          .put(`/api/v1/admin/questions/${q.questionId}`)
          .set(authed(cookies))
          .send({ ...q.input, expectedVersion: 1 })
      ).status,
    ).toBe(409);
    const history = await ctx.http
      .get(`/api/v1/admin/questions/${q.questionId}/history`)
      .set(authed(cookies));
    expect(history.status).toBe(200);
    expect(history.body.map((v: { version: number }) => v.version)).toEqual([
      2, 1,
    ]);
    expect(history.body[1].prompt).toBe(q.input.prompt);
    expect(
      (
        await ctx.http
          .delete(`/api/v1/admin/questions/${q.questionId}`)
          .set(authed(cookies))
      ).status,
    ).toBe(200);
    expect(
      (await ctx.http.get("/api/v1/admin/questions").set(authed(cookies))).body,
    ).toHaveLength(0);
    expect(await ctx.prisma.question_versions.count()).toBe(2);
  });

  it("FR-07 validates missing answers before atomic import and supports xlsx/docx", async () => {
    const headers = [
      "prompt",
      "A",
      "B",
      "C",
      "D",
      "answer",
      "difficulty",
      "pool",
    ];
    const bad = await xlsx(headers, [
      ["Question", "a", "b", "c", "d", "", "EASY", "Import pool"],
    ]);
    const invalid = await ctx.http
      .post("/api/v1/admin/questions/import?commit=true")
      .set(authed(cookies))
      .attach("file", bad, "bad.xlsx");
    expect(invalid.status).toBe(201);
    expect(invalid.body.committed).toBe(false);
    expect(invalid.body.errors[0].row).toBe(2);
    expect(await ctx.prisma.questions.count()).toBe(0);
    const good = await xlsx(headers, [
      ["Question", "a", "b", "c", "d", "A", "HARD", "Import pool"],
    ]);
    const preview = await ctx.http
      .post("/api/v1/admin/questions/import")
      .set(authed(cookies))
      .attach("file", good, "good.xlsx");
    expect(preview.body.errors).toHaveLength(0);
    expect(await ctx.prisma.questions.count()).toBe(0);
    expect(
      (
        await ctx.http
          .post("/api/v1/admin/questions/import?commit=true")
          .set(authed(cookies))
          .attach("file", good, "good.xlsx")
      ).body.committed,
    ).toBe(true);
    const zip = new AdmZip();
    const rows = [
      headers,
      ["Docx question", "a", "b", "c", "d", "D", "MEDIUM", "Docx pool"],
    ];
    zip.addFile(
      "word/document.xml",
      Buffer.from(
        `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:tbl>${rows.map((r) => `<w:tr>${r.map((c) => `<w:tc><w:p><w:r><w:t>${c}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr>`).join("")}</w:tbl></w:body></w:document>`,
      ),
    );
    const docx = await ctx.http
      .post("/api/v1/admin/questions/import?commit=true")
      .set(authed(cookies))
      .attach("file", zip.toBuffer(), "questions.docx");
    expect(docx.status).toBe(201);
    expect(docx.body.committed).toBe(true);
    expect(await ctx.prisma.questions.count()).toBe(2);
  });

  it("FR-08/09 prevents concurrent overbooking and records rescheduling history", async () => {
    const comp = await competition();
    await question();
    const s1 = await schedule(comp.id),
      s2 = await schedule(comp.id);
    const [c1, c2] = await Promise.all([
      createCandidate(1),
      createCandidate(2),
    ]);
    const results = await Promise.all(
      [c1, c2].map((c) =>
        ctx.http
          .post("/api/v1/admin/assignments")
          .set(authed(cookies))
          .send({ candidateId: c.candidateId, scheduleId: s1.id }),
      ),
    );
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(
      await ctx.prisma.candidate_assignments.count({
        where: { schedule_id: s1.id },
      }),
    ).toBe(1);
    const winner = results[0].status === 201 ? c1 : c2;
    expect(
      (
        await ctx.http
          .post("/api/v1/admin/assignments")
          .set(authed(cookies))
          .send({ candidateId: winner.candidateId, scheduleId: s2.id })
      ).status,
    ).toBe(400);
    const moved = await ctx.http
      .post("/api/v1/admin/assignments")
      .set(authed(cookies))
      .send({
        candidateId: winner.candidateId,
        scheduleId: s2.id,
        reason: "Approved change",
      });
    expect(moved.status).toBe(201);
    const history = await ctx.http
      .get(`/api/v1/admin/assignments/${moved.body.id}/history`)
      .set(authed(cookies));
    expect(history.body).toHaveLength(1);
    expect(history.body[0].old_schedule_id).toBe(s1.id);
    const listed = await ctx.http
      .get("/api/v1/admin/schedules")
      .set(authed(cookies));
    expect(listed.status).toBe(200);
    expect(
      listed.body.find((s: { id: string }) => s.id === s1.id).assigned,
    ).toBe(0);
  });

  it("FR-10/11 monitors real attempt transitions and exports scores tied to candidate and schedule", async () => {
    const student = await createCandidate();
    await ctx.prisma.users.updateMany({
      where: { email: student.email },
      data: { email_verified_at: new Date() },
    });
    const session = await login(ctx, student.email, student.password);
    const exam = await setupExam(ctx, {
      studentEmail: student.email,
      questionCount: 1,
    });
    let monitor = await ctx.http
      .get("/api/v1/admin/monitor")
      .set(authed(cookies));
    expect(monitor.status).toBe(200);
    expect(monitor.body[0].status).toBe("NOT_STARTED");
    const started = await ctx.http
      .post(`/api/v1/me/assignments/${exam.assignmentId}/attempts`)
      .set(authed(session.cookies))
      .set("Idempotency-Key", randomUUID());
    expect(started.status).toBe(201);
    const original = await ctx.prisma.question_versions.findUniqueOrThrow({
      where: { id: exam.questionVersionIds[0] },
    });
    const options = await ctx.prisma.question_options.findMany({
      where: { question_version_id: original.id },
      orderBy: { position: "asc" },
    });
    const edited = await ctx.http
      .put(`/api/v1/admin/questions/${original.question_id}`)
      .set(authed(cookies))
      .send({
        prompt: "Edited after delivery",
        options: options.map((o) => o.text),
        answer: options.findIndex((o) => o.is_correct),
        difficulty: "HARD",
        pool: "Admin test pool",
        expectedVersion: original.version,
      });
    expect(edited.status).toBe(200);
    const anotherSchedule = await schedule(exam.competitionId);
    const rejectedMove = await ctx.http
      .post("/api/v1/admin/assignments")
      .set(authed(cookies))
      .send({
        candidateId: student.candidateId,
        scheduleId: anotherSchedule.id,
        reason: "Attempt already started",
      });
    expect(rejectedMove.status).toBe(409);
    expect(
      (
        await ctx.prisma.question_versions.findUniqueOrThrow({
          where: { id: original.id },
        })
      ).prompt,
    ).toBe(original.prompt);
    expect(
      await ctx.prisma.delivered_questions.count({
        where: {
          attempt_id: started.body.attemptId,
          question_version_id: original.id,
        },
      }),
    ).toBe(1);
    monitor = await ctx.http.get("/api/v1/admin/monitor").set(authed(cookies));
    expect(monitor.body[0].status).toBe("IN_PROGRESS");
    const submittedResult = await ctx.http
      .post(`/api/v1/me/attempts/${started.body.attemptId}/submission`)
      .set(authed(session.cookies))
      .set("Idempotency-Key", randomUUID())
      .send({ writerGeneration: 1 });
    expect(submittedResult.status).toBe(200);
    await ctx.app
      .get(ScoringService)
      .scoreAttempt(started.body.attemptId, randomUUID());
    monitor = await ctx.http.get("/api/v1/admin/monitor").set(authed(cookies));
    expect(monitor.body[0].status).toBe("SUBMITTED");
    const scores = await ctx.http
      .get("/api/v1/admin/results/round-1")
      .query({ competitionId: exam.competitionId })
      .set(authed(cookies));
    expect(scores.status).toBe(200);
    expect(scores.body[0].candidateCode).toBe(student.identifier);
    expect(scores.body[0].rank).toBe(1);
    expect(
      (
        await ctx.http
          .get("/api/v1/admin/results/round-1/export")
          .query({ competitionId: exam.competitionId })
          .set(authed(cookies))
      ).status,
    ).toBe(200);
  });

  it("FR-12 rejects invalid candidate/team codes and imports weighted judge scores with retained policy versions", async () => {
    const comp = await competition(),
      student = await createCandidate();
    await submitted(student.candidateId, comp.id);
    const policy = await ctx.http
      .post("/api/v1/admin/score-policies")
      .set(authed(cookies))
      .send({
        competitionId: comp.id,
        round: 2,
        label: "Test approved weights",
        maxScore: 100,
        criteria: [
          { code: "A", weight: 0.6, max: 10 },
          { code: "B", weight: 0.4, max: 20 },
        ],
      });
    expect(policy.status).toBe(201);
    const headers = ["subjectType", "code", "judge", "criterion", "score"];
    const bad = await xlsx(headers, [
      [],
      ["TEAM", "UNKNOWN", "J1", "A", 8],
      ["TEAM", "UNKNOWN", "J1", "B", 15],
    ]);
    const invalid = await ctx.http
      .post(
        `/api/v1/admin/scores/import?policyId=${policy.body.id}&commit=true`,
      )
      .set(authed(cookies))
      .attach("file", bad, "bad.xlsx");
    expect(invalid.status).toBe(201);
    expect(invalid.body.errors.length).toBeGreaterThan(0);
    expect(invalid.body.errors[0].row).toBe(3);
    expect(await ctx.prisma.admin_judge_scores.count()).toBe(0);
    const good = await xlsx(headers, [
      ["CANDIDATE", student.identifier, "J1", "A", 8],
      ["CANDIDATE", student.identifier, "J1", "B", 15],
      ["CANDIDATE", student.identifier, "J2", "A", 10],
      ["CANDIDATE", student.identifier, "J2", "B", 20],
    ]);
    const imported = await ctx.http
      .post(
        `/api/v1/admin/scores/import?policyId=${policy.body.id}&commit=true`,
      )
      .set(authed(cookies))
      .attach("file", good, "scores.xlsx");
    expect(imported.status).toBe(201);
    expect(imported.body.committed).toBe(true);
    expect(imported.body.summary[0].points).toBe(89);
    const duplicate = await ctx.http
      .post(
        `/api/v1/admin/scores/import?policyId=${policy.body.id}&commit=true`,
      )
      .set(authed(cookies))
      .attach("file", good, "scores.xlsx");
    expect(duplicate.body.committed).toBe(false);
    expect(await ctx.prisma.admin_judge_scores.count()).toBe(4);
    const result = await ctx.http
      .get(`/api/v1/admin/scores/${policy.body.id}`)
      .set(authed(cookies));
    expect(result.body.summary[0].points).toBe(89);
    expect(
      (
        await ctx.http
          .post("/api/v1/admin/teams")
          .set(authed(cookies))
          .send({ competitionId: comp.id, code: "TEAM-01" })
      ).status,
    ).toBe(201);
    const teamFile = await xlsx(headers, [
      ["TEAM", "TEAM-01", "J1", "A", 10],
      ["TEAM", "TEAM-01", "J1", "B", 20],
    ]);
    const teamImported = await ctx.http
      .post(
        `/api/v1/admin/scores/import?policyId=${policy.body.id}&commit=true`,
      )
      .set(authed(cookies))
      .attach("file", teamFile, "teams.xlsx");
    expect(teamImported.body.committed).toBe(true);
    expect(teamImported.body.summary[0].points).toBe(100);
    const exported = await ctx.http
      .get(`/api/v1/admin/scores/${policy.body.id}/export`)
      .set(authed(cookies))
      .buffer(true)
      .parse(binaryParser);
    expect(exported.status).toBe(200);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(exported.body);
    expect(workbook.worksheets[0].getRow(3).getCell(5).value).toBe(89);
  });
});
