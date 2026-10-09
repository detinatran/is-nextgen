import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomBytes, randomUUID } from "node:crypto";
import argon2 from "argon2";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { AppException } from "../common/errors/app-error";
import { ErrorCodes } from "../common/errors/error-codes";
import type { AuthenticatedRequest } from "../common/http/request-context";
import {
  AccountActionDto,
  AssignmentDto,
  CandidateDto,
  PolicyDto,
  QuestionDto,
  ScheduleDto,
  TeamDto,
} from "./admin.dto";
import {
  aggregateScores,
  QuestionInput,
  ScorePolicy,
  ScoreRow,
  validatePolicy,
  validateQuestion,
} from "./domain";
import { SpreadsheetsService } from "./spreadsheets.service";
import { Round1OpsService } from "./round1-ops.service";

type Tx = Prisma.TransactionClient;
type RegistrationRow = {
  id: string;
  candidateCode: string | null;
  userId: string | null;
  fullName: string;
  studentId: string | null;
  school: string | null;
  department: string | null;
  major: string | null;
  email: string;
  phone: string | null;
  facebook: string | null;
  dateOfBirth: Date | null;
  registrationId: string | null;
  state: string | null;
  submittedAt: Date | null;
  videoId: string | null;
  accountStatus: string | null;
  deleted: boolean;
};
type AssignmentRow = {
  id: string;
  candidateId: string;
  candidateCode: string;
  fullName: string;
  school: string;
  scheduleId: string;
  scheduleName: string;
  examId: string;
  competitionId: string;
  opensAt: Date;
  closesAt: Date;
  status: string;
  attemptId: string | null;
  ordinal: number | null;
  startedAt: Date | null;
  finalizedAt: Date | null;
  answered: bigint;
  points: Prisma.Decimal | null;
  maxPoints: Prisma.Decimal | null;
  focusLost: bigint;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly sheets: SpreadsheetsService,
    private readonly round1Ops: Round1OpsService,
  ) {}

  private conflict(message: string): never {
    throw AppException.conflict(ErrorCodes.STATE_CONFLICT, message);
  }
  private async transaction<T>(work: (tx: Tx) => Promise<T>): Promise<T> {
    for (let i = 0; i < 3; i++) {
      try {
        return await this.prisma.$transaction(work, {
          isolationLevel: "Serializable",
          timeout: 120000,
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2034" && i < 2) continue;
          if (["P2002", "P2003", "P2034"].includes(e.code))
            this.conflict(
              "Dữ liệu trùng, có phụ thuộc hoặc vừa được thay đổi; tải lại và thử lại",
            );
        }
        throw e;
      }
    }
    return this.conflict("Không thể hoàn tất giao dịch");
  }
  private record(
    tx: Tx,
    req: AuthenticatedRequest,
    action: string,
    target: string,
    id?: string,
    metadata?: Record<string, unknown>,
    reason?: string,
  ) {
    return this.audit.record(tx, {
      actor_user_id: req.auth!.userId,
      correlation_id: req.correlationId ?? randomUUID(),
      action,
      target_type: target,
      target_id: id,
      metadata,
      reason,
    });
  }

  /** Hồ sơ trùng: quyết định giữ hồ sơ nào, lưu trong hệ thống để cả BTC cùng thấy. */
  async duplicateDecisions() {
    const rows = await this.prisma.admin_duplicate_decisions.findMany();
    return Object.fromEntries(rows.map((r) => [r.group_key, { candidateId: r.kept_candidate_id, decidedAt: r.decided_at }]));
  }
  decideDuplicate(groupKey: string, candidateId: string, req: AuthenticatedRequest) {
    return this.transaction(async (tx) => {
      if (!(await tx.candidates.findUnique({ where: { id: candidateId } })))
        throw AppException.notFound("Hồ sơ không tồn tại");
      await tx.admin_duplicate_decisions.upsert({
        where: { group_key: groupKey },
        create: { group_key: groupKey, kept_candidate_id: candidateId, decided_by_user_id: req.auth!.userId },
        update: { kept_candidate_id: candidateId, decided_by_user_id: req.auth!.userId, decided_at: new Date() },
      });
      await this.record(tx, req, "admin.duplicate.kept", "candidate", candidateId, { groupKey });
      return { groupKey, candidateId };
    });
  }
  clearDuplicate(groupKey: string, req: AuthenticatedRequest) {
    return this.transaction(async (tx) => {
      await tx.admin_duplicate_decisions.deleteMany({ where: { group_key: groupKey } });
      await this.record(tx, req, "admin.duplicate.cleared", "candidate", undefined, { groupKey });
      return { groupKey };
    });
  }

  async configuration() {
    const [competitions, pools, teams, policies] = await Promise.all([
      this.prisma.competitions.findMany({
        orderBy: { registration_opens_at: "desc" },
      }),
      this.prisma.question_pools.findMany({ orderBy: { name: "asc" } }),
      this.prisma.team_code_references.findMany(),
      this.prisma.admin_score_policies.findMany({
        orderBy: { version: "desc" },
      }),
    ]);
    return { competitions, pools, teams, policies };
  }

  async registrations(
    search = "",
    school = "",
    competitionId?: string,
    db: Tx = this.prisma,
  ) {
    if (search.length > 200 || school.length > 200)
      throw AppException.validation("Bộ lọc quá dài");
    const needle = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    return db.$queryRaw<RegistrationRow[]>`
      SELECT c.id, c.candidate_code AS "candidateCode", c.user_id AS "userId", p.full_name AS "fullName",
        p.student_id AS "studentId", p.school, p.department, p.major, p.email, p.phone, p.facebook,
        p.date_of_birth AS "dateOfBirth", r.id AS "registrationId", r.state, r.submitted_at AS "submittedAt",
        rv.media_object_id AS "videoId", u.status AS "accountStatus", (d.user_id IS NOT NULL) AS deleted
      FROM candidates c JOIN candidate_profiles p ON p.candidate_id=c.id
      LEFT JOIN registrations r ON r.candidate_id=c.id
      LEFT JOIN registration_videos rv ON rv.registration_id=r.id
      LEFT JOIN users u ON u.id=c.user_id LEFT JOIN admin_account_deletions d ON d.user_id=u.id
      WHERE (p.full_name ILIKE ${needle} OR p.student_id ILIKE ${needle} OR p.email ILIKE ${needle} OR c.candidate_code ILIKE ${needle})
        AND (${school}='' OR p.school=${school})
        AND (${competitionId ?? null}::uuid IS NULL OR r.competition_id=${competitionId ?? null}::uuid)
      ORDER BY c.created_at DESC`;
  }

  async createCandidate(dto: CandidateDto, req: AuthenticatedRequest) {
    const email = dto.email.trim().toLowerCase();
    if (![dto.fullName, dto.school, dto.studentId].every((v) => v.trim()))
      throw AppException.validation("Thông tin không được để trống");
    const password = `Ng1!${randomBytes(16).toString("base64url")}`;
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    return this.transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email,
          email_normalized: email,
          password_hash: hash,
          status: "ACTIVE",
          // BTC trực tiếp cấp và giao thông tin đăng nhập: coi như đã xác minh email để vào thi được
          email_verified_at: new Date(),
        },
      });
      const role = await tx.roles.findUniqueOrThrow({
        where: { code: "STUDENT" },
      });
      await tx.user_roles.create({
        data: {
          user_id: user.id,
          role_id: role.id,
          granted_by_user_id: req.auth!.userId,
        },
      });
      const candidate = await tx.candidates.create({
        data: {
          user_id: user.id,
          candidate_code: `CAND-${randomBytes(8).toString("hex").toUpperCase()}`,
        },
      });
      await tx.candidate_profiles.create({
        data: {
          candidate_id: candidate.id,
          full_name: dto.fullName.trim(),
          email,
          email_normalized: email,
          student_id: dto.studentId.trim(),
          school: dto.school.trim(),
        },
      });
      await this.record(
        tx,
        req,
        "admin.account.created",
        "candidate",
        candidate.id,
      );
      return {
        candidateId: candidate.id,
        identifier: candidate.candidate_code,
        email,
        password,
      };
    });
  }

  async account(
    candidateId: string,
    dto: AccountActionDto,
    req: AuthenticatedRequest,
  ) {
    const password = `Ng1!${randomBytes(16).toString("base64url")}`;
    const hash = ["PROVISION", "RESET"].includes(dto.action)
      ? await argon2.hash(password, { type: argon2.argon2id })
      : undefined;
    return this.transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM candidates WHERE id=${candidateId}::uuid FOR UPDATE`;
      const c = await tx.candidates.findUnique({ where: { id: candidateId } });
      if (!c) throw AppException.notFound("Không tìm thấy thí sinh");
      const p = await tx.candidate_profiles.findUniqueOrThrow({
        where: { candidate_id: candidateId },
      });
      let userId = c.user_id;
      if (userId) {
        await tx.$queryRaw`SELECT id FROM users WHERE id=${userId}::uuid FOR UPDATE`;
        const roles = await tx.user_roles.findMany({
          where: { user_id: userId },
        });
        const admin = await tx.roles.findFirst({
          where: { id: { in: roles.map((r) => r.role_id) }, code: "ADMIN" },
        });
        if (admin)
          throw AppException.forbidden(
            "Không được thay đổi tài khoản Admin qua chức năng thí sinh",
          );
        if (
          await tx.admin_account_deletions.findUnique({
            where: { user_id: userId },
          })
        )
          this.conflict("Tài khoản đã xoá; không thể mở lại");
      }
      if (dto.action === "PROVISION") {
        if (userId) this.conflict("Thí sinh đã có tài khoản");
        const user = await tx.users.create({
          data: {
            email: p.email,
            email_normalized: p.email_normalized,
            password_hash: hash,
            status: "ACTIVE",
            email_verified_at: new Date(),
          },
        });
        userId = user.id;
        const role = await tx.roles.findUniqueOrThrow({
          where: { code: "STUDENT" },
        });
        await tx.user_roles.create({
          data: {
            user_id: userId,
            role_id: role.id,
            granted_by_user_id: req.auth!.userId,
          },
        });
        await tx.candidates.update({
          where: { id: candidateId },
          data: { user_id: userId },
        });
      } else {
        if (!userId) this.conflict("Thí sinh chưa được cấp tài khoản");
        if (dto.action === "DELETE" && !dto.reason?.trim())
          throw AppException.validation("Cần lý do xoá tài khoản");
        const user = await tx.users.findUniqueOrThrow({
          where: { id: userId },
        });
        if (dto.action === "ENABLE" && !user.password_hash)
          this.conflict("Cần cấp lại thông tin đăng nhập trước");
        await tx.users.update({
          where: { id: userId },
          data: {
            status: ["DISABLE", "DELETE"].includes(dto.action)
              ? "DISABLED"
              : "ACTIVE",
            ...(dto.action === "RESET" ? { password_hash: hash, email_verified_at: user.email_verified_at ?? new Date() } : {}),
            ...(dto.action === "DELETE" ? { password_hash: null } : {}),
            revision: { increment: 1 },
            updated_at: new Date(),
          },
        });
        await tx.auth_sessions.updateMany({
          where: { user_id: userId, revoked_at: null },
          data: { revoked_at: new Date() },
        });
        // Recovery/activation locators issued before a reset/delete cannot resurrect the previous credentials.
        await tx.auth_challenges.updateMany({
          where: { user_id: userId, consumed_at: null },
          data: { consumed_at: new Date() },
        });
        if (dto.action === "DELETE")
          await tx.admin_account_deletions.create({
            data: {
              user_id: userId,
              deleted_by_user_id: req.auth!.userId,
              reason: dto.reason!.trim(),
            },
          });
      }
      await this.record(
        tx,
        req,
        `admin.account.${dto.action.toLowerCase()}`,
        "candidate",
        candidateId,
        undefined,
        dto.reason,
      );
      return {
        identifier: c.candidate_code ?? p.email,
        email: p.email,
        ...(hash ? { password } : {}),
      };
    });
  }

  async registrationExport(
    format: string,
    search: string,
    school: string,
    competitionId: string | undefined,
    req: AuthenticatedRequest,
  ) {
    const rows = await this.registrations(search, school, competitionId);
    const buffer = await this.sheets.export(
      [
        "candidateCode",
        "fullName",
        "dateOfBirth",
        "studentId",
        "school",
        "department",
        "major",
        "email",
        "phone",
        "facebook",
        "registrationStatus",
        "submittedAt",
        "video",
      ],
      rows.map((r) => [
        r.candidateCode,
        r.fullName,
        r.dateOfBirth?.toISOString().slice(0, 10),
        r.studentId,
        r.school,
        r.department,
        r.major,
        r.email,
        r.phone,
        r.facebook,
        r.state,
        r.submittedAt?.toISOString(),
        r.videoId
          ? `${(process.env.ADMIN_PUBLIC_URL ?? "https://nextgen.vnuis.edu.vn/admin").replace(/\/$/, "")}/api/v1/admin/registrations/${r.registrationId}/video`
          : "",
      ]),
      format,
    );
    await this.record(
      this.prisma,
      req,
      "admin.registrations.exported",
      "registration",
      undefined,
      { count: rows.length, format },
    );
    return buffer;
  }

  async video(registrationId: string, req: AuthenticatedRequest) {
    const binding = await this.prisma.registration_videos.findUnique({
      where: { registration_id: registrationId },
    });
    if (!binding) throw AppException.notFound("Hồ sơ chưa nộp video");
    const media = await this.prisma.media_objects.findUniqueOrThrow({
      where: { id: binding.media_object_id },
    });
    await this.record(
      this.prisma,
      req,
      "admin.video.viewed",
      "registration",
      registrationId,
    );
    return media;
  }

  async questions(historyId?: string, db: Tx = this.prisma) {
    const versions = await db.$queryRaw<
      {
        id: string;
        questionId: string;
        version: number;
        prompt: string;
        difficulty: string;
        archived: boolean;
        pool: string | null;
        options: { text: string; isCorrect: boolean }[];
      }[]
    >`
      SELECT v.id, v.question_id AS "questionId", v.version, v.prompt, v.difficulty, (q.archived_at IS NOT NULL) AS archived,
        (SELECT p.name FROM question_pool_memberships m JOIN question_pools p ON p.id=m.pool_id WHERE m.question_version_id=v.id LIMIT 1) AS pool,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('text',o.text,'isCorrect',o.is_correct) ORDER BY o.position) FROM question_options o WHERE o.question_version_id=v.id),'[]') AS options
      FROM question_versions v JOIN questions q ON q.id=v.question_id
      WHERE (${historyId ?? null}::uuid IS NOT NULL AND q.id=${historyId ?? null}::uuid)
         OR (${historyId ?? null}::uuid IS NULL AND q.archived_at IS NULL AND v.version=(SELECT max(v2.version) FROM question_versions v2 WHERE v2.question_id=q.id))
      ORDER BY v.question_id,v.version DESC`;
    return versions;
  }

  private async writeQuestion(
    tx: Tx,
    dto: QuestionInput,
    req: AuthenticatedRequest,
    questionId?: string,
    expectedVersion?: number,
  ) {
    const errors = validateQuestion(dto);
    if (errors.length) throw AppException.validation(errors.join("; "));
    let version = 1;
    if (questionId) {
      await tx.$queryRaw`SELECT id FROM questions WHERE id=${questionId}::uuid FOR UPDATE`;
      const q = await tx.questions.findUnique({ where: { id: questionId } });
      if (!q || q.archived_at)
        throw AppException.notFound("Câu hỏi không tồn tại hoặc đã xoá");
      const latest = await tx.question_versions.findFirst({
        where: { question_id: questionId },
        orderBy: { version: "desc" },
      });
      if (expectedVersion !== latest?.version)
        this.conflict("Câu hỏi đã thay đổi; tải lại trước khi sửa");
      version = (latest?.version ?? 0) + 1;
    } else
      questionId = (
        await tx.questions.create({
          data: { created_by_user_id: req.auth!.userId },
        })
      ).id;
    const v = await tx.question_versions.create({
      data: {
        question_id: questionId,
        version,
        prompt: dto.prompt.trim(),
        difficulty: dto.difficulty,
        created_by_user_id: req.auth!.userId,
      },
    });
    await tx.question_options.createMany({
      data: dto.options.map((text, index) => ({
        question_version_id: v.id,
        position: index + 1,
        text: text.trim(),
        is_correct: index === dto.answer,
      })),
    });
    const poolName = dto.pool.trim();
    const pool = await tx.question_pools.upsert({
      where: { code: poolName },
      update: {},
      create: { code: poolName, name: poolName },
    });
    await tx.question_pool_memberships.create({
      data: { pool_id: pool.id, question_version_id: v.id },
    });
    await tx.question_versions.update({
      where: { id: v.id },
      data: {
        state: "FROZEN",
        frozen_at: new Date(),
        revision: { increment: 1 },
      },
    });
    await this.record(
      tx,
      req,
      "admin.question.version_created",
      "question",
      questionId,
      { version },
    );
    return { questionId, version };
  }
  saveQuestion(
    dto: QuestionDto,
    req: AuthenticatedRequest,
    questionId?: string,
  ) {
    return this.transaction((tx) =>
      this.writeQuestion(tx, dto, req, questionId, dto.expectedVersion),
    );
  }
  archiveQuestion(id: string, req: AuthenticatedRequest) {
    return this.transaction(async (tx) => {
      const question = await tx.questions.findUnique({ where: { id } });
      if (!question) throw AppException.notFound();
      await tx.questions.update({
        where: { id },
        data: { archived_at: new Date() },
      });
      await this.record(tx, req, "admin.question.archived", "question", id);
      return { archived: true };
    });
  }
  async importQuestions(
    file: Express.Multer.File,
    commit: boolean,
    req: AuthenticatedRequest,
  ) {
    const parsed = await this.sheets.questions(file);
    if (!commit || parsed.errors.length) return { ...parsed, committed: false };
    await this.transaction(async (tx) => {
      for (const q of parsed.rows) await this.writeQuestion(tx, q, req);
    });
    return { ...parsed, committed: true };
  }

  async schedules() {
    return this.prisma.$queryRaw<
      {
        id: string;
        name: string;
        competitionId: string;
        opensAt: Date;
        closesAt: Date;
        capacity: number;
        durationSeconds: number;
        assigned: bigint;
        blueprintId: string | null;
      }[]
    >`
      SELECT s.id,s.name,e.competition_id AS "competitionId",s.opens_at AS "opensAt",s.closes_at AS "closesAt",s.capacity,s.duration_seconds AS "durationSeconds",
        (SELECT count(*) FROM candidate_assignments a WHERE a.schedule_id=s.id) AS assigned,
        (SELECT b.id FROM blueprint_versions b WHERE b.exam_id=s.exam_id AND b.state='FROZEN' ORDER BY version DESC LIMIT 1) AS "blueprintId"
      FROM exam_schedules s JOIN exams e ON e.id=s.exam_id WHERE e.round=1 ORDER BY s.opens_at DESC`;
  }
  createSchedule(dto: ScheduleDto, req: AuthenticatedRequest) {
    if (new Date(dto.closesAt) <= new Date(dto.opensAt))
      throw AppException.validation("Giờ đóng phải sau giờ mở");
    if (
      (new Date(dto.closesAt).getTime() - new Date(dto.opensAt).getTime()) /
        1000 <
      dto.durationSeconds
    )
      throw AppException.validation("Khoảng mở ca phải đủ thời lượng làm bài");
    return this.transaction(async (tx) => {
      const competition = await tx.competitions.findUnique({
        where: { id: dto.competitionId },
      });
      if (!competition) throw AppException.notFound("Cuộc thi không tồn tại");
      await tx.$queryRaw`SELECT id FROM competitions WHERE id=${dto.competitionId}::uuid FOR UPDATE`;
      const eligible = await tx.$queryRaw<{ count: bigint }[]>`
        SELECT count(*) FROM question_pool_memberships m JOIN question_versions v ON v.id=m.question_version_id JOIN questions q ON q.id=v.question_id
        WHERE m.pool_id=${dto.poolId}::uuid AND v.state='FROZEN' AND q.archived_at IS NULL AND v.version=(SELECT max(v2.version) FROM question_versions v2 WHERE v2.question_id=q.id)`;
      if (Number(eligible[0].count) < dto.questionCount)
        throw AppException.validation(
          "Nhóm câu hỏi chưa đủ câu hợp lệ cho đề thi",
        );
      let exam = await tx.exams.findFirst({
        where: { competition_id: dto.competitionId, round: 1 },
        orderBy: { id: "asc" },
      });
      if (!exam)
        exam = await tx.exams.create({
          data: {
            competition_id: dto.competitionId,
            round: 1,
            name: "Vòng 1",
            duration_seconds: 3600,
          },
        });
      const latest = await tx.blueprint_versions.findFirst({
        where: { exam_id: exam.id },
        orderBy: { version: "desc" },
      });
      const blueprint = await tx.blueprint_versions.create({
        data: {
          exam_id: exam.id,
          version: (latest?.version ?? 0) + 1,
          state: "FROZEN",
          question_count: dto.questionCount,
          selection_policy: {
            items: [
              {
                poolId: dto.poolId,
                count: dto.questionCount,
                points: 100 / dto.questionCount,
              },
            ],
          },
        },
      });
      const schedule = await tx.exam_schedules.create({
        data: {
          exam_id: exam.id,
          name: dto.name.trim(),
          opens_at: new Date(dto.opensAt),
          closes_at: new Date(dto.closesAt),
          duration_seconds: dto.durationSeconds,
          capacity: dto.capacity,
        },
      });
      // Keep the exact blueprint selected when the schedule is created.
      await tx.admin_schedule_blueprints.create({
        data: { schedule_id: schedule.id, blueprint_version_id: blueprint.id },
      });
      await this.record(
        tx,
        req,
        "admin.schedule.created",
        "schedule",
        schedule.id,
      );
      return schedule;
    });
  }

  async assignments(competitionId?: string): Promise<AssignmentRow[]> {
    return this.prisma.$queryRaw<AssignmentRow[]>`
      SELECT a.id,a.candidate_id AS "candidateId",c.candidate_code AS "candidateCode",p.full_name AS "fullName",p.school,
        s.id AS "scheduleId",s.name AS "scheduleName",a.exam_id AS "examId",e.competition_id AS "competitionId",s.opens_at AS "opensAt",s.closes_at AS "closesAt",
        CASE WHEN latest.state='ACTIVE' THEN 'IN_PROGRESS' WHEN latest.state='FINALIZED' THEN 'SUBMITTED' ELSE 'NOT_STARTED' END AS status,
        latest.id AS "attemptId",latest.ordinal,latest.started_at AS "startedAt",latest.finalized_at AS "finalizedAt",
        (SELECT count(*) FROM answers ans WHERE ans.attempt_id=latest.id AND ans.selected_delivered_option_id IS NOT NULL) AS answered,
        final.points,sc.max_points AS "maxPoints",
        (SELECT count(*) FROM audit_events ev WHERE ev.action='exam.focus_lost'
           AND ev.target_id IN (SELECT at2.id FROM attempts at2 WHERE at2.assignment_id=a.id)) AS "focusLost"
      FROM candidate_assignments a JOIN candidates c ON c.id=a.candidate_id JOIN candidate_profiles p ON p.candidate_id=c.id
      JOIN exam_schedules s ON s.id=a.schedule_id JOIN exams e ON e.id=a.exam_id
      LEFT JOIN LATERAL (SELECT * FROM attempts at WHERE at.assignment_id=a.id ORDER BY at.ordinal DESC LIMIT 1) latest ON true
      LEFT JOIN candidate_final_scores final ON final.assignment_id=a.id LEFT JOIN attempt_scores sc ON sc.attempt_id=final.winning_attempt_id
      WHERE e.round=1 AND (${competitionId ?? null}::uuid IS NULL OR e.competition_id=${competitionId ?? null}::uuid)
      ORDER BY s.opens_at,c.candidate_code`;
  }
  assign(dto: AssignmentDto, req: AuthenticatedRequest) {
    return this.transaction(async (tx) => {
      const candidate = await tx.candidates.findUnique({
        where: { id: dto.candidateId },
      });
      if (!candidate?.candidate_code)
        throw AppException.validation("Thí sinh cần mã định danh");
      // Chưa có tài khoản thì tạo tài khoản chờ kích hoạt; thí sinh tự đặt mật khẩu qua email mời thi
      const account = await this.round1Ops.ensureAccount(tx, dto.candidateId, req.auth!.userId);
      if (!account)
        throw AppException.validation(
          "Tài khoản thí sinh đã bị khoá/xoá hoặc email trùng với thí sinh khác",
        );
      await tx.$queryRaw`SELECT id FROM candidates WHERE id=${dto.candidateId}::uuid FOR UPDATE`;
      const schedule = await tx.exam_schedules.findUnique({
        where: { id: dto.scheduleId },
      });
      if (!schedule) throw AppException.notFound("Ca thi không tồn tại");
      // Serialize rescheduling with Start, which locks this same assignment before creating an attempt.
      await tx.$queryRaw`SELECT id FROM candidate_assignments WHERE candidate_id=${dto.candidateId}::uuid AND exam_id=${schedule.exam_id}::uuid FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM exam_schedules WHERE id=${dto.scheduleId}::uuid FOR UPDATE`;
      const exam = await tx.exams.findUniqueOrThrow({
        where: { id: schedule.exam_id },
      });
      if (exam.round !== 1) throw AppException.validation("Chỉ phân ca Vòng 1");
      const existing = await tx.candidate_assignments.findUnique({
        where: {
          candidate_id_exam_id: {
            candidate_id: dto.candidateId,
            exam_id: schedule.exam_id,
          },
        },
      });
      if (existing?.schedule_id === schedule.id)
        return { id: existing.id, unchanged: true };
      if (
        (await tx.candidate_assignments.count({
          where: { schedule_id: schedule.id },
        })) >= schedule.capacity
      )
        this.conflict("Ca thi đã đủ số thí sinh tối đa");
      let id: string;
      if (existing) {
        if (!dto.reason?.trim())
          throw AppException.validation("Cần lý do đổi ca");
        if (await tx.attempts.count({ where: { assignment_id: existing.id } }))
          this.conflict("Không thể đổi ca sau khi thí sinh đã bắt đầu thi");
        await tx.candidate_assignments.update({
          where: { id: existing.id },
          data: { schedule_id: schedule.id, revision: { increment: 1 } },
        });
        await tx.assignment_schedule_history.create({
          data: {
            assignment_id: existing.id,
            old_schedule_id: existing.schedule_id,
            new_schedule_id: schedule.id,
            changed_by_user_id: req.auth!.userId,
            reason: dto.reason.trim(),
          },
        });
        id = existing.id;
      } else {
        const pinned = await tx.admin_schedule_blueprints.findUnique({
          where: { schedule_id: schedule.id },
        });
        const blueprint = pinned
          ? await tx.blueprint_versions.findUnique({
              where: { id: pinned.blueprint_version_id },
            })
          : await tx.blueprint_versions.findFirst({
              where: { exam_id: schedule.exam_id, state: "FROZEN" },
              orderBy: { version: "desc" },
            });
        if (!blueprint) this.conflict("Ca thi chưa có đề được chốt");
        id = (
          await tx.candidate_assignments.create({
            data: {
              candidate_id: dto.candidateId,
              exam_id: schedule.exam_id,
              schedule_id: schedule.id,
              blueprint_version_id: blueprint.id,
              assigned_by_user_id: req.auth!.userId,
            },
          })
        ).id;
      }
      await this.record(
        tx,
        req,
        existing ? "admin.assignment.rescheduled" : "admin.assignment.created",
        "assignment",
        id,
        undefined,
        dto.reason,
      );
      return { id };
    });
  }
  history(assignmentId: string) {
    return this.prisma.assignment_schedule_history.findMany({
      where: { assignment_id: assignmentId },
      orderBy: { changed_at: "desc" },
    });
  }

  async round1(competitionId?: string) {
    if (!competitionId) {
      const competition = await this.prisma.competitions.findFirst({
        orderBy: { registration_opens_at: "desc" },
      });
      if (!competition) return [];
      competitionId = competition.id;
    }
    const rows = await this.assignments(competitionId);
    // Các ca có thể có số câu khác nhau nên xếp hạng theo tỉ lệ điểm (%), không theo điểm thô
    const percentOf = (r: { points: unknown; maxPoints: unknown }) =>
      Number(r.maxPoints) > 0 ? Math.round((Number(r.points) / Number(r.maxPoints)) * 1e6) / 1e4 : 0;
    const scored = rows
      .filter((r) => r.points !== null)
      .map((r) => ({ ...r, percent: percentOf(r) }))
      .sort(
        (a, b) =>
          b.percent - a.percent ||
          a.candidateCode.localeCompare(b.candidateCode),
      );
    let rank = 0,
      previous: number | undefined;
    const ranked = scored.map((r, index) => {
      if (r.percent !== previous) rank = index + 1;
      previous = r.percent;
      return { ...r, rank, top40: rank <= 40, tieAtCutoff: false };
    });
    const cutoff = ranked[39]?.percent;
    const tied =
      cutoff !== undefined &&
      ranked.filter((r) => r.percent === cutoff).length > 1;
    return [
      ...ranked.map((r) => ({
        ...r,
        tieAtCutoff: tied && r.percent === cutoff,
      })),
      ...rows
        .filter((r) => r.points === null)
        .map((r) => ({ ...r, percent: null, rank: null, top40: false, tieAtCutoff: false })),
    ];
  }
  async round1Export(
    competitionId: string | undefined,
    req: AuthenticatedRequest,
  ) {
    const rows = await this.round1(competitionId);
    const buffer = await this.sheets.export(
      [
        "rank",
        "candidateCode",
        "fullName",
        "school",
        "scheduleId",
        "scheduleName",
        "status",
        "points",
        "maxPoints",
        "percent",
        "top40",
        "tieAtCutoff",
      ],
      rows.map((r) => [
        r.rank,
        r.candidateCode,
        r.fullName,
        r.school,
        r.scheduleId,
        r.scheduleName,
        r.status,
        r.points === null ? "" : Number(r.points),
        r.maxPoints === null ? "" : Number(r.maxPoints),
        r.percent === null ? "" : r.percent,
        r.top40 ? "YES" : "NO",
        r.tieAtCutoff ? "REVIEW" : "",
      ]),
      "xlsx",
    );
    await this.record(
      this.prisma,
      req,
      "admin.round1.exported",
      "result",
      undefined,
      { count: rows.length },
    );
    return buffer;
  }

  createPolicy(dto: PolicyDto, req: AuthenticatedRequest) {
    validatePolicy(dto);
    return this.transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM competitions WHERE id=${dto.competitionId}::uuid FOR UPDATE`;
      if (
        !(await tx.competitions.findUnique({
          where: { id: dto.competitionId },
        }))
      )
        throw AppException.notFound("Cuộc thi không tồn tại");
      const latest = await tx.admin_score_policies.findFirst({
        where: { competition_id: dto.competitionId, round: dto.round },
        orderBy: { version: "desc" },
      });
      const config = {
        label: dto.label,
        maxScore: dto.maxScore,
        criteria: dto.criteria.map((c) => ({
          code: c.code,
          weight: c.weight,
          max: c.max,
        })),
      };
      const policy = await tx.admin_score_policies.create({
        data: {
          competition_id: dto.competitionId,
          round: dto.round,
          version: (latest?.version ?? 0) + 1,
          config: config as Prisma.InputJsonValue,
          created_by_user_id: req.auth!.userId,
        },
      });
      await this.record(
        tx,
        req,
        "admin.score_policy.created",
        "score_policy",
        policy.id,
        { version: policy.version, round: policy.round },
      );
      return policy;
    });
  }
  createTeam(dto: TeamDto, req: AuthenticatedRequest) {
    if (!dto.code.trim())
      throw AppException.validation("Mã đội không được trống");
    return this.transaction(async (tx) => {
      const team = await tx.team_code_references.create({
        data: {
          competition_id: dto.competitionId,
          team_code: dto.code.trim(),
          approved_by_user_id: req.auth!.userId,
        },
      });
      await this.record(tx, req, "admin.team.created", "team", team.id);
      return team;
    });
  }

  async importScores(
    file: Express.Multer.File,
    policyId: string,
    commit: boolean,
    req: AuthenticatedRequest,
  ) {
    const parsed = await this.sheets.scores(file);
    return this.transaction(async (tx) => {
      const policyRow = await tx.admin_score_policies.findUnique({
        where: { id: policyId },
      });
      if (!policyRow)
        throw AppException.notFound("Chưa cấu hình công thức BCM cho vòng này");
      await tx.$queryRaw`SELECT id FROM admin_score_policies WHERE id=${policyId}::uuid FOR UPDATE`;
      const policy = policyRow.config as unknown as ScorePolicy;
      const codes = [...new Set(parsed.rows.map((r) => r.code))];
      const [candidates, teams, existing] = await Promise.all([
        tx.candidates.findMany({ where: { candidate_code: { in: codes } } }),
        tx.team_code_references.findMany({
          where: {
            competition_id: policyRow.competition_id,
            team_code: { in: codes },
          },
        }),
        tx.admin_judge_scores.findMany({ where: { policy_id: policyId } }),
      ]);
      const linked = await tx.registrations.findMany({
        where: {
          competition_id: policyRow.competition_id,
          candidate_id: { in: candidates.map((c) => c.id) },
          state: "SUBMITTED",
        },
      });
      const subjectKeys = new Map<
        string,
        { candidateId?: string; teamId?: string }
      >();
      const seen = new Set<string>();
      for (let i = 0; i < parsed.rows.length; i++) {
        const r = parsed.rows[i],
          criterion = policy.criteria.find((c) => c.code === r.criterion);
        const c = candidates.find((c) => c.candidate_code === r.code),
          team = teams.find((t) => t.team_code === r.code);
        if (
          r.subjectType === "CANDIDATE" &&
          (!c || !linked.some((l) => l.candidate_id === c.id))
        )
          parsed.errors.push({
            row: parsed.rows[i].sourceRow ?? i + 2,
            message: `Mã thí sinh không thuộc hồ sơ đã nộp của cuộc thi: ${r.code}`,
          });
        else if (r.subjectType === "TEAM" && !team)
          parsed.errors.push({
            row: parsed.rows[i].sourceRow ?? i + 2,
            message: `Mã đội chưa được đăng ký: ${r.code}`,
          });
        else
          subjectKeys.set(
            `${r.subjectType}:${r.code}`,
            r.subjectType === "CANDIDATE"
              ? { candidateId: c!.id }
              : { teamId: team!.id },
          );
        if (!criterion || r.score > criterion.max)
          parsed.errors.push({
            row: parsed.rows[i].sourceRow ?? i + 2,
            message: "Tiêu chí không tồn tại hoặc điểm vượt thang điểm",
          });
        const key = JSON.stringify([
          r.subjectType,
          r.code,
          r.judge,
          r.criterion,
        ]);
        if (seen.has(key))
          parsed.errors.push({
            row: parsed.rows[i].sourceRow ?? i + 2,
            message: "Trùng điểm của giám khảo/tiêu chí",
          });
        seen.add(key);
      }
      const subjects = await tx.scoring_subjects.findMany({
        where: { competition_id: policyRow.competition_id },
      });
      for (let i = 0; i < parsed.rows.length; i++) {
        const row = parsed.rows[i],
          link = subjectKeys.get(`${row.subjectType}:${row.code}`);
        const subject =
          link &&
          subjects.find((s) =>
            link.candidateId
              ? s.candidate_id === link.candidateId
              : s.team_code_reference_id === link.teamId,
          );
        if (
          subject &&
          existing.some(
            (e) =>
              e.subject_id === subject.id &&
              e.judge === row.judge &&
              e.criterion === row.criterion,
          )
        )
          parsed.errors.push({
            row: parsed.rows[i].sourceRow ?? i + 2,
            message: "Điểm này đã được nhập; không ghi đè dữ liệu giám khảo",
          });
      }
      let summary: ReturnType<typeof aggregateScores> = [];
      if (!parsed.errors.length) {
        try {
          summary = aggregateScores(policy, parsed.rows);
        } catch (e) {
          parsed.errors.push({ row: 0, message: (e as Error).message });
        }
      }
      if (!commit || parsed.errors.length)
        return { ...parsed, summary, committed: false };
      const batchId = randomUUID();
      for (const [key, link] of subjectKeys) {
        let subject = subjects.find((s) =>
          link.candidateId
            ? s.candidate_id === link.candidateId
            : s.team_code_reference_id === link.teamId,
        );
        if (!subject)
          subject = await tx.scoring_subjects.create({
            data: {
              competition_id: policyRow.competition_id,
              candidate_id: link.candidateId,
              team_code_reference_id: link.teamId,
            },
          });
        const subjectRows = parsed.rows.filter(
          (r) => `${r.subjectType}:${r.code}` === key,
        );
        await tx.admin_judge_scores.createMany({
          data: subjectRows.map((r) => ({
            policy_id: policyId,
            subject_id: subject!.id,
            judge: r.judge,
            criterion: r.criterion,
            score: r.score,
            batch_id: batchId,
            imported_by_user_id: req.auth!.userId,
          })),
        });
      }
      await this.record(
        tx,
        req,
        "admin.scores.imported",
        "score_policy",
        policyId,
        { batchId, count: parsed.rows.length },
      );
      return { ...parsed, summary, committed: true };
    });
  }
  async manualResults(policyId: string) {
    const policy = await this.prisma.admin_score_policies.findUnique({
      where: { id: policyId },
    });
    if (!policy)
      throw AppException.notFound("Công thức tính điểm không tồn tại");
    const rows = await this.prisma.$queryRaw<ScoreRow[]>`
      SELECT CASE WHEN s.candidate_id IS NOT NULL THEN 'CANDIDATE' ELSE 'TEAM' END AS "subjectType",
        COALESCE(c.candidate_code,t.team_code) AS code,j.judge,j.criterion,j.score::float8 AS score
      FROM admin_judge_scores j JOIN scoring_subjects s ON s.id=j.subject_id
      LEFT JOIN candidates c ON c.id=s.candidate_id LEFT JOIN team_code_references t ON t.id=s.team_code_reference_id
      WHERE j.policy_id=${policyId}::uuid ORDER BY code,j.judge,j.criterion`;
    const summary = aggregateScores(
      policy.config as unknown as ScorePolicy,
      rows,
    ).sort((a, b) => b.points - a.points || a.code.localeCompare(b.code));
    return { policy, rows, summary };
  }
  async manualExport(policyId: string, req: AuthenticatedRequest) {
    const result = await this.manualResults(policyId);
    const config = result.policy.config as unknown as ScorePolicy;
    const buffer = await this.sheets.export(
      [
        "subjectType",
        "code",
        "round",
        "judges",
        "points",
        "maxScore",
        "policy",
        "policyVersion",
      ],
      result.summary.map((r) => [
        r.subjectType,
        r.code,
        result.policy.round,
        r.judges,
        r.points,
        config.maxScore,
        config.label,
        result.policy.version,
      ]),
      "xlsx",
    );
    await this.record(
      this.prisma,
      req,
      "admin.manual_scores.exported",
      "score_policy",
      policyId,
    );
    return buffer;
  }
}
