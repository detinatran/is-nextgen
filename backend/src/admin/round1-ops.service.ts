import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { AuditService } from "../common/audit/audit.service";
import { AppException } from "../common/errors/app-error";
import type { AuthenticatedRequest } from "../common/http/request-context";

type Tx = Prisma.TransactionClient;

const vnTime = (d: Date) =>
  d.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/**
 * Vòng 1 hàng loạt: xếp ca tự động cho hồ sơ đã nộp và gửi email mời thi.
 * Email mời (EXAM_INVITATION) chứa ca thi và link kích hoạt tài khoản; thí sinh tự đặt mật khẩu,
 * BTC không phải phát mật khẩu. Email do backend trang chính gửi (bảng notification_intents).
 */
@Injectable()
export class Round1OpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async competitionId(competitionId?: string) {
    if (competitionId) return competitionId;
    const c = await this.prisma.competitions.findFirst({ orderBy: { registration_opens_at: "desc" } });
    if (!c) throw AppException.notFound("Chưa có cuộc thi");
    return c.id;
  }

  /** Tài khoản thí sinh: dùng tài khoản có sẵn, chưa có thì tạo ở trạng thái chờ kích hoạt (không mật khẩu). */
  async ensureAccount(tx: Tx, candidateId: string, actorUserId: string): Promise<{ userId: string; status: string } | null> {
    const c = await tx.candidates.findUniqueOrThrow({ where: { id: candidateId } });
    if (c.user_id) {
      const u = await tx.users.findUniqueOrThrow({ where: { id: c.user_id } });
      const deleted = await tx.admin_account_deletions.findUnique({ where: { user_id: u.id } });
      return deleted || u.status === "DISABLED" ? null : { userId: u.id, status: u.status };
    }
    const p = await tx.candidate_profiles.findUniqueOrThrow({ where: { candidate_id: candidateId } });
    const existing = await tx.users.findUnique({ where: { email_normalized: p.email_normalized } });
    if (existing) {
      // Email đã thuộc một thí sinh khác (hồ sơ trùng): để BTC xử lý tay
      const owner = await tx.candidates.findUnique({ where: { user_id: existing.id } });
      if (owner && owner.id !== candidateId) return null;
    }
    const user =
      existing ??
      (await tx.users.create({ data: { email: p.email, email_normalized: p.email_normalized, status: "PROVISIONED" } }));
    const student = await tx.roles.findUniqueOrThrow({ where: { code: "STUDENT" } });
    await tx.user_roles.upsert({
      where: { user_id_role_id: { user_id: user.id, role_id: student.id } },
      create: { user_id: user.id, role_id: student.id, granted_by_user_id: actorUserId },
      update: {},
    });
    await tx.candidates.update({ where: { id: candidateId }, data: { user_id: user.id } });
    return { userId: user.id, status: user.status };
  }

  /** Xếp các hồ sơ đã nộp chưa có ca vào ca còn nhiều chỗ nhất (chỉ ca chưa mở). */
  async autoAssign(competitionId: string | undefined, req: AuthenticatedRequest) {
    const compId = await this.competitionId(competitionId);
    const actor = req.auth!.userId;
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM competitions WHERE id=${compId}::uuid FOR UPDATE`;
        const slots = await tx.$queryRaw<{ id: string; exam_id: string; capacity: number; assigned: bigint; blueprint_id: string | null }[]>`
          SELECT s.id, s.exam_id, s.capacity,
            (SELECT count(*) FROM candidate_assignments a WHERE a.schedule_id=s.id) AS assigned,
            COALESCE(
              (SELECT pb.blueprint_version_id FROM admin_schedule_blueprints pb WHERE pb.schedule_id=s.id),
              (SELECT b.id FROM blueprint_versions b WHERE b.exam_id=s.exam_id AND b.state='FROZEN' ORDER BY b.version DESC LIMIT 1)
            ) AS blueprint_id
          FROM exam_schedules s JOIN exams e ON e.id=s.exam_id
          WHERE e.competition_id=${compId}::uuid AND e.round=1 AND s.opens_at > now()
          FOR UPDATE OF s`;
        const free = slots
          .filter((s) => s.blueprint_id)
          .map((s) => ({ ...s, left: s.capacity - Number(s.assigned) }))
          .filter((s) => s.left > 0);
        if (!slots.length) throw AppException.validation("Chưa có ca thi nào sắp diễn ra để xếp");
        const candidates = await tx.$queryRaw<{ candidate_id: string }[]>`
          SELECT r.candidate_id FROM registrations r JOIN candidates c ON c.id=r.candidate_id
          WHERE r.competition_id=${compId}::uuid AND r.state='SUBMITTED' AND c.candidate_code IS NOT NULL
            AND NOT EXISTS (SELECT 1 FROM candidate_assignments a JOIN exams e ON e.id=a.exam_id
                            WHERE a.candidate_id=r.candidate_id AND e.round=1)
          ORDER BY r.submitted_at, r.id`;
        let assigned = 0;
        let skipped = 0;
        for (const { candidate_id } of candidates) {
          const slot = free.sort((a, b) => b.left - a.left)[0];
          if (!slot || slot.left <= 0) break;
          const account = await this.ensureAccount(tx, candidate_id, actor);
          if (!account) {
            skipped++;
            continue;
          }
          const a = await tx.candidate_assignments.create({
            data: {
              candidate_id,
              exam_id: slot.exam_id,
              schedule_id: slot.id,
              blueprint_version_id: slot.blueprint_id!,
              assigned_by_user_id: actor,
            },
          });
          await this.audit.record(tx, {
            actor_user_id: actor,
            action: "admin.assignment.auto_created",
            target_type: "assignment",
            target_id: a.id,
            correlation_id: req.correlationId ?? "unknown",
          });
          slot.left--;
          assigned++;
        }
        const waiting = candidates.length - assigned - skipped;
        return { assigned, skipped, waiting };
      },
      { timeout: 120_000 },
    );
  }

  /** Gửi email mời thi cho thí sinh đã xếp ca mà chưa kích hoạt tài khoản (lọc theo ca nếu có). */
  async invite(scheduleId: string | undefined, competitionId: string | undefined, req: AuthenticatedRequest) {
    const compId = await this.competitionId(competitionId);
    const actor = req.auth!.userId;
    const rows = await this.prisma.$queryRaw<
      { assignment_id: string; candidate_id: string; candidate_code: string | null; full_name: string; email_normalized: string; opens_at: Date; closes_at: Date; duration_seconds: number | null }[]
    >`
      SELECT a.id AS assignment_id, a.candidate_id, c.candidate_code, p.full_name, p.email_normalized, s.opens_at, s.closes_at,
        COALESCE(s.duration_seconds, e.duration_seconds) AS duration_seconds
      FROM candidate_assignments a
      JOIN exams e ON e.id=a.exam_id AND e.round=1 AND e.competition_id=${compId}::uuid
      JOIN exam_schedules s ON s.id=a.schedule_id
      JOIN candidates c ON c.id=a.candidate_id
      JOIN candidate_profiles p ON p.candidate_id=c.id
      WHERE (${scheduleId ?? null}::uuid IS NULL OR a.schedule_id=${scheduleId ?? null}::uuid)
      ORDER BY s.opens_at, c.candidate_code`;
    let invited = 0;
    let alreadyActive = 0;
    const problems: { candidateCode: string | null; message: string }[] = [];
    const batch = Date.now();
    for (const r of rows) {
      try {
        const outcome = await this.prisma.$transaction(async (tx) => {
          const account = await this.ensureAccount(tx, r.candidate_id, actor);
          if (!account) return "skip";
          if (account.status === "ACTIVE") return "active";
          await tx.notification_intents.create({
            data: {
              template_code: "EXAM_INVITATION",
              destination_email: r.email_normalized,
              payload: {
                fullName: r.full_name,
                candidateCode: r.candidate_code ?? "",
                schedule: `${vnTime(r.opens_at)} – ${vnTime(r.closes_at)} (giờ Việt Nam)`,
                durationMinutes: String(Math.round(Number(r.duration_seconds ?? 3600) / 60)),
              },
              deduplication_key: `exam-invite:${r.assignment_id}:${batch}`,
              user_id: account.userId,
              candidate_id: r.candidate_id,
            },
          });
          await this.audit.record(tx, {
            actor_user_id: actor,
            action: "exam.invitation_sent",
            target_type: "assignment",
            target_id: r.assignment_id,
            correlation_id: req.correlationId ?? "unknown",
          });
          return "sent";
        });
        if (outcome === "sent") invited++;
        else if (outcome === "active") alreadyActive++;
        else problems.push({ candidateCode: r.candidate_code, message: "Tài khoản bị khoá/xoá hoặc email trùng với thí sinh khác" });
      } catch (e) {
        problems.push({ candidateCode: r.candidate_code, message: e instanceof Error ? e.message : "Lỗi không xác định" });
      }
    }
    return { invited, alreadyActive, problems };
  }
}
