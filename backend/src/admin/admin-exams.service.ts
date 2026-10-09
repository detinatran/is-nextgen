import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import { AuditService } from '../common/audit/audit.service';
import { AppException } from '../common/errors/app-error';
import type { Tx } from '../common/idempotency/idempotency.service';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const VN = 'Asia/Ho_Chi_Minh';
const fmt = (d: Date) => d.toLocaleString('vi-VN', { timeZone: VN, hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

export interface BlueprintItem {
  poolId: string;
  count: number;
  points: number;
}

/**
 * FR-3.1 / FR-4.3 / FR-4.4 Admin for the Round 1 online exam:
 * exam + frozen blueprint, schedules (slot roster capacity), candidate
 * assignment (auto-distribute, move, Excel import/export), account
 * provisioning + invitation email, live monitor and score export.
 */
@Injectable()
export class AdminExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  private async competitionId(code: string): Promise<string> {
    const c = await this.prisma.competitions.findUnique({ where: { code } });
    if (!c) throw AppException.notFound(`Competition ${code} not found`);
    return c.id;
  }

  private async latestBlueprint(client: Tx | PrismaService, examId: string) {
    return client.blueprint_versions.findFirst({ where: { exam_id: examId, state: 'FROZEN' }, orderBy: { version: 'desc' } });
  }

  /** Overview: exam, latest frozen blueprint, schedules with roster/account/attempt counters. */
  async overview(competition: string) {
    const competitionId = await this.competitionId(competition);
    const exam = await this.prisma.exams.findFirst({ where: { competition_id: competitionId, round: 1 } });
    const submitted = await this.prisma.registrations.count({ where: { competition_id: competitionId, state: 'SUBMITTED' } });
    if (!exam) return { competition, exam: null, blueprint: null, schedules: [], totals: { submitted, assigned: 0, unassigned: submitted } };
    const blueprint = await this.latestBlueprint(this.prisma, exam.id);
    const pools = await this.prisma.question_pools.findMany();
    const items = ((blueprint?.selection_policy as { items?: BlueprintItem[] } | null)?.items ?? []).map((it) => ({
      ...it,
      poolCode: pools.find((p) => p.id === it.poolId)?.code ?? '?',
    }));
    const schedules = await this.prisma.$queryRaw<
      { id: string; opens_at: Date; closes_at: Date; capacity: number; assigned: bigint; active_accounts: bigint; invited: bigint; started: bigint; finalized: bigint }[]
    >`
      SELECT s.id, s.opens_at, s.closes_at, s.capacity,
             count(a.id) AS assigned,
             count(u.id) FILTER (WHERE u.status = 'ACTIVE') AS active_accounts,
             count(u.id) AS invited,
             count(DISTINCT t.assignment_id) AS started,
             count(DISTINCT t.assignment_id) FILTER (WHERE t.state = 'FINALIZED') AS finalized
      FROM exam_schedules s
      LEFT JOIN candidate_assignments a ON a.schedule_id = s.id
      LEFT JOIN candidates c ON c.id = a.candidate_id
      LEFT JOIN users u ON u.id = c.user_id
      LEFT JOIN attempts t ON t.assignment_id = a.id
      WHERE s.exam_id = ${exam.id}::uuid
      GROUP BY s.id ORDER BY s.opens_at`;
    const assigned = schedules.reduce((n, s) => n + Number(s.assigned), 0);
    return {
      competition,
      exam: { id: exam.id, name: exam.name, durationSeconds: exam.duration_seconds },
      blueprint: blueprint ? { id: blueprint.id, version: blueprint.version, questionCount: blueprint.question_count, items } : null,
      schedules: schedules.map((s, i) => ({
        id: s.id,
        label: `Ca ${i + 1}`,
        opensAt: s.opens_at.toISOString(),
        closesAt: s.closes_at.toISOString(),
        capacity: s.capacity,
        assigned: Number(s.assigned),
        invited: Number(s.invited),
        activeAccounts: Number(s.active_accounts),
        started: Number(s.started),
        finalized: Number(s.finalized),
      })),
      totals: { submitted, assigned, unassigned: Math.max(0, submitted - assigned) },
    };
  }

  async createExam(competition: string, name: string, actorUserId: string, correlationId: string) {
    const competitionId = await this.competitionId(competition);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.exams.findFirst({ where: { competition_id: competitionId, round: 1 } });
      if (existing) return { id: existing.id };
      const exam = await tx.exams.create({ data: { competition_id: competitionId, round: 1, name: name.trim() || 'Vòng 1 · Trắc nghiệm năng lực', duration_seconds: 3600 } });
      await this.audit.record(tx, { actor_user_id: actorUserId, action: 'exam.created', target_type: 'exam', target_id: exam.id, correlation_id: correlationId });
      return { id: exam.id };
    });
  }

  /** New FROZEN blueprint version. Existing assignments keep their blueprint (DB-immutable). */
  async setBlueprint(examId: string, items: BlueprintItem[], actorUserId: string, correlationId: string) {
    if (items.length === 0) throw AppException.validation('Blueprint needs at least one pool');
    return this.prisma.$transaction(async (tx) => {
      const exam = await tx.exams.findUnique({ where: { id: examId } });
      if (!exam) throw AppException.notFound('Exam not found');
      for (const it of items) {
        const [{ n }] = await tx.$queryRaw<{ n: bigint }[]>`
          SELECT count(*) AS n FROM question_pool_memberships m
          JOIN question_versions qv ON qv.id = m.question_version_id
          JOIN questions q ON q.id = qv.question_id
          WHERE m.pool_id = ${it.poolId}::uuid AND qv.state = 'FROZEN' AND q.archived_at IS NULL`;
        if (Number(n) < it.count) {
          const pool = await tx.question_pools.findUnique({ where: { id: it.poolId } });
          throw AppException.validation(`Pool ${pool?.code ?? it.poolId} has only ${Number(n)} questions, needs ${it.count}`);
        }
      }
      const latest = await tx.blueprint_versions.findFirst({ where: { exam_id: examId }, orderBy: { version: 'desc' } });
      const bp = await tx.blueprint_versions.create({
        data: {
          exam_id: examId,
          version: (latest?.version ?? 0) + 1,
          state: 'FROZEN',
          question_count: items.reduce((n, it) => n + it.count, 0),
          selection_policy: { items } as unknown as Prisma.InputJsonValue,
        },
      });
      await this.audit.record(tx, { actor_user_id: actorUserId, action: 'exam.blueprint_frozen', target_type: 'exam', target_id: examId, correlation_id: correlationId, metadata: { blueprintVersionId: bp.id, items } as unknown as Record<string, unknown> });
      return { id: bp.id, version: bp.version, questionCount: bp.question_count };
    });
  }

  async createSchedule(examId: string, opensAt: Date, closesAt: Date, capacity: number, actorUserId: string, correlationId: string) {
    if (closesAt <= opensAt) throw AppException.validation('closesAt must be after opensAt');
    return this.prisma.$transaction(async (tx) => {
      const s = await tx.exam_schedules.create({ data: { exam_id: examId, opens_at: opensAt, closes_at: closesAt, capacity } });
      await this.audit.record(tx, { actor_user_id: actorUserId, action: 'exam.schedule_created', target_type: 'exam_schedule', target_id: s.id, correlation_id: correlationId });
      return { id: s.id };
    });
  }

  async updateSchedule(id: string, patch: { opensAt?: Date; closesAt?: Date; capacity?: number }, actorUserId: string, correlationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const s = await tx.exam_schedules.findUnique({ where: { id } });
      if (!s) throw AppException.notFound('Schedule not found');
      const opens = patch.opensAt ?? s.opens_at;
      const closes = patch.closesAt ?? s.closes_at;
      if (closes <= opens) throw AppException.validation('closesAt must be after opensAt');
      const assigned = await tx.candidate_assignments.count({ where: { schedule_id: id } });
      if (patch.capacity !== undefined && patch.capacity < assigned) {
        throw AppException.validation(`Capacity cannot be below the ${assigned} assigned candidates`);
      }
      await tx.exam_schedules.update({ where: { id }, data: { opens_at: opens, closes_at: closes, capacity: patch.capacity ?? s.capacity, revision: { increment: 1 } } });
      await this.audit.record(tx, { actor_user_id: actorUserId, action: 'exam.schedule_updated', target_type: 'exam_schedule', target_id: id, correlation_id: correlationId });
      return { id };
    });
  }

  async deleteSchedule(id: string, actorUserId: string, correlationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const assigned = await tx.candidate_assignments.count({ where: { schedule_id: id } });
      if (assigned > 0) throw AppException.conflict('STATE_CONFLICT', 'Schedule still has assigned candidates');
      await tx.exam_schedules.delete({ where: { id } });
      await this.audit.record(tx, { actor_user_id: actorUserId, action: 'exam.schedule_deleted', target_type: 'exam_schedule', target_id: id, correlation_id: correlationId });
      return { deleted: true };
    });
  }

  /** Spreads unassigned SUBMITTED candidates over the schedules by remaining capacity (earliest slot first). */
  async autoAssign(examId: string, actorUserId: string, correlationId: string) {
    return this.prisma.$transaction(
      async (tx) => {
        const exam = await tx.exams.findUnique({ where: { id: examId } });
        if (!exam) throw AppException.notFound('Exam not found');
        const blueprint = await this.latestBlueprint(tx, examId);
        if (!blueprint) throw AppException.validation('Freeze the exam structure (blueprint) before assigning candidates');
        const candidates = await tx.$queryRaw<{ candidate_id: string }[]>`
          SELECT r.candidate_id FROM registrations r
          WHERE r.competition_id = ${exam.competition_id}::uuid AND r.state = 'SUBMITTED'
            AND NOT EXISTS (SELECT 1 FROM candidate_assignments a WHERE a.candidate_id = r.candidate_id AND a.exam_id = ${examId}::uuid)
          ORDER BY r.submitted_at, r.id`;
        const slots = await tx.$queryRaw<{ id: string; free: bigint }[]>`
          SELECT s.id, s.capacity - count(a.id) AS free FROM exam_schedules s
          LEFT JOIN candidate_assignments a ON a.schedule_id = s.id
          WHERE s.exam_id = ${examId}::uuid GROUP BY s.id ORDER BY s.opens_at`;
        const free = slots.map((s) => ({ id: s.id, free: Number(s.free) }));
        let assigned = 0;
        for (const c of candidates) {
          // Chia đều: chọn ca còn nhiều chỗ trống nhất
          const slot = free.filter((s) => s.free > 0).sort((a, b) => b.free - a.free)[0];
          if (!slot) break;
          await tx.candidate_assignments.create({
            data: { candidate_id: c.candidate_id, exam_id: examId, schedule_id: slot.id, blueprint_version_id: blueprint.id, assigned_by_user_id: actorUserId },
          });
          slot.free--;
          assigned++;
        }
        await this.audit.record(tx, { actor_user_id: actorUserId, action: 'exam.auto_assigned', target_type: 'exam', target_id: examId, correlation_id: correlationId, metadata: { assigned, waiting: candidates.length - assigned } });
        return { assigned, notAssigned: candidates.length - assigned };
      },
      { timeout: 120_000 },
    );
  }

  async moveAssignment(assignmentId: string, scheduleId: string, reason: string, actorUserId: string, correlationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const a = await tx.candidate_assignments.findUnique({ where: { id: assignmentId } });
      if (!a) throw AppException.notFound('Assignment not found');
      if (a.schedule_id === scheduleId) return { moved: false };
      const started = await tx.attempts.count({ where: { assignment_id: assignmentId } });
      if (started > 0) throw AppException.conflict('STATE_CONFLICT', 'Candidate has already started this exam');
      const target = await tx.exam_schedules.findUnique({ where: { id: scheduleId } });
      if (!target || target.exam_id !== a.exam_id) throw AppException.notFound('Schedule not found');
      if ((await tx.candidate_assignments.count({ where: { schedule_id: scheduleId } })) >= target.capacity) throw AppException.validation('Schedule is full');
      await tx.candidate_assignments.update({ where: { id: assignmentId }, data: { schedule_id: scheduleId, revision: { increment: 1 } } });
      await tx.assignment_schedule_history.create({
        data: { assignment_id: assignmentId, old_schedule_id: a.schedule_id, new_schedule_id: scheduleId, changed_by_user_id: actorUserId, reason: reason || 'Đổi ca' },
      });
      await this.audit.record(tx, { actor_user_id: actorUserId, action: 'exam.assignment_moved', target_type: 'assignment', target_id: assignmentId, correlation_id: correlationId });
      return { moved: true };
    });
  }

  /** Roster with account/attempt/score/focus status — also the live monitor (FR-3.2). */
  async roster(examId: string, scheduleId?: string) {
    const rows = await this.prisma.$queryRaw<
      {
        assignment_id: string; schedule_id: string; candidate_code: string | null; full_name: string; school: string | null; email: string;
        account: string | null; attempt_state: string | null; finalized_at: Date | null; cause: string | null;
        points: Prisma.Decimal | null; max_points: Prisma.Decimal | null; focus_lost: bigint;
      }[]
    >`
      SELECT a.id AS assignment_id, a.schedule_id, c.candidate_code, p.full_name, p.school, p.email,
             u.status AS account, t.state AS attempt_state, t.finalized_at, t.finalization_cause AS cause,
             fs.points, sc.max_points,
             (SELECT count(*) FROM audit_events e WHERE e.action = 'exam.focus_lost'
                AND e.target_id IN (SELECT id FROM attempts WHERE assignment_id = a.id)) AS focus_lost
      FROM candidate_assignments a
      JOIN candidates c ON c.id = a.candidate_id
      JOIN candidate_profiles p ON p.candidate_id = c.id
      LEFT JOIN users u ON u.id = c.user_id
      LEFT JOIN LATERAL (SELECT * FROM attempts x WHERE x.assignment_id = a.id ORDER BY x.ordinal DESC LIMIT 1) t ON true
      LEFT JOIN candidate_final_scores fs ON fs.assignment_id = a.id
      LEFT JOIN attempt_scores sc ON sc.attempt_id = fs.winning_attempt_id
      WHERE a.exam_id = ${examId}::uuid ${scheduleId ? Prisma.sql`AND a.schedule_id = ${scheduleId}::uuid` : Prisma.empty}
      ORDER BY p.full_name`;
    return rows.map((r) => ({
      assignmentId: r.assignment_id,
      scheduleId: r.schedule_id,
      candidateCode: r.candidate_code,
      fullName: r.full_name,
      school: r.school,
      email: r.email,
      account: (r.account ?? 'NONE') as 'NONE' | 'PROVISIONED' | 'ACTIVE' | 'DISABLED',
      attemptState: r.attempt_state as 'ACTIVE' | 'FINALIZED' | null,
      finalizedAt: r.finalized_at?.toISOString() ?? null,
      finalizationCause: r.cause,
      points: r.points === null ? null : Number(r.points),
      maxPoints: r.max_points === null ? null : Number(r.max_points),
      focusLost: Number(r.focus_lost),
    }));
  }

  /**
   * Provisions a STUDENT account for each assigned candidate (email from the
   * registration profile), links candidates.user_id, and emails the
   * invitation (candidate code, slot, activation link). Re-sending only
   * re-emails accounts still waiting for activation.
   */
  async invite(examId: string, scheduleId: string | undefined, actorUserId: string, correlationId: string) {
    const roster = await this.prisma.$queryRaw<
      { assignment_id: string; candidate_id: string; user_id: string | null; candidate_code: string | null; full_name: string; email: string; email_normalized: string; opens_at: Date; closes_at: Date }[]
    >`
      SELECT a.id AS assignment_id, c.id AS candidate_id, c.user_id, c.candidate_code, p.full_name, p.email, p.email_normalized,
             s.opens_at, s.closes_at
      FROM candidate_assignments a
      JOIN candidates c ON c.id = a.candidate_id
      JOIN candidate_profiles p ON p.candidate_id = c.id
      JOIN exam_schedules s ON s.id = a.schedule_id
      WHERE a.exam_id = ${examId}::uuid ${scheduleId ? Prisma.sql`AND a.schedule_id = ${scheduleId}::uuid` : Prisma.empty}`;
    let invited = 0;
    let alreadyActive = 0;
    const problems: { candidateCode: string | null; message: string }[] = [];
    const student = await this.prisma.roles.findUniqueOrThrow({ where: { code: 'STUDENT' } });
    const batch = Date.now();
    for (const r of roster) {
      try {
        await this.prisma.$transaction(async (tx) => {
          let userId = r.user_id;
          if (!userId) {
            const existing = await tx.users.findUnique({ where: { email_normalized: r.email_normalized } });
            if (existing) {
              const owner = await tx.candidates.findUnique({ where: { user_id: existing.id } });
              if (owner && owner.id !== r.candidate_id) throw new Error('Email đã gắn với một thí sinh khác (hồ sơ trùng)');
              userId = existing.id;
            } else {
              userId = (await tx.users.create({ data: { email: r.email, email_normalized: r.email_normalized, status: 'PROVISIONED' } })).id;
            }
            await tx.user_roles.upsert({
              where: { user_id_role_id: { user_id: userId, role_id: student.id } },
              create: { user_id: userId, role_id: student.id, granted_by_user_id: actorUserId },
              update: {},
            });
            await tx.candidates.update({ where: { id: r.candidate_id }, data: { user_id: userId } });
          }
          const user = await tx.users.findUniqueOrThrow({ where: { id: userId } });
          // Đã kích hoạt tài khoản thì không gửi lại lời mời
          if (user.status === 'ACTIVE') {
            alreadyActive++;
            return;
          }
          await this.notifications.enqueue(tx, {
            templateCode: 'EXAM_INVITATION',
            destinationEmail: r.email_normalized,
            payload: {
              fullName: r.full_name,
              candidateCode: r.candidate_code ?? '',
              schedule: `${fmt(r.opens_at)} – ${fmt(r.closes_at)} (giờ Việt Nam)`,
            },
            deduplicationKey: `exam-invite:${r.assignment_id}:${batch}`,
            userId,
          });
          await this.audit.record(tx, { actor_user_id: actorUserId, action: 'exam.invitation_sent', target_type: 'assignment', target_id: r.assignment_id, correlation_id: correlationId });
          invited++;
        });
      } catch (e) {
        problems.push({ candidateCode: r.candidate_code, message: e instanceof Error ? e.message : 'Lỗi không xác định' });
      }
    }
    return { invited, alreadyActive, problems };
  }

  async rosterXlsx(examId: string, actorUserId: string, correlationId: string): Promise<Buffer> {
    const overview = await this.prisma.exam_schedules.findMany({ where: { exam_id: examId }, orderBy: { opens_at: 'asc' } });
    const label = new Map(overview.map((s, i) => [s.id, `Ca ${i + 1}`]));
    const time = new Map(overview.map((s) => [s.id, `${fmt(s.opens_at)} – ${fmt(s.closes_at)}`]));
    const rows = await this.roster(examId);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Phan ca', { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = [
      { header: 'Mã thí sinh', key: 'code', width: 22 },
      { header: 'Họ và tên', key: 'name', width: 26 },
      { header: 'Trường', key: 'school', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Ca thi', key: 'slot', width: 8 },
      { header: 'Thời gian', key: 'time', width: 34 },
      { header: 'Tài khoản', key: 'account', width: 14 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const r of rows) {
      ws.addRow({
        code: r.candidateCode, name: r.fullName, school: r.school, email: r.email,
        slot: label.get(r.scheduleId), time: time.get(r.scheduleId),
        account: r.account === 'ACTIVE' ? 'Đã kích hoạt' : r.account === 'PROVISIONED' ? 'Đã mời' : 'Chưa mời',
      });
    }
    await this.prisma.$transaction((tx) => this.audit.record(tx, { actor_user_id: actorUserId, action: 'exam.roster_exported', target_type: 'exam', target_id: examId, correlation_id: correlationId, metadata: { rows: rows.length } }));
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  /** Import "Mã thí sinh | Ca thi (số)" to assign or move candidates (all-or-nothing). */
  async importRoster(examId: string, buffer: Buffer, actorUserId: string, correlationId: string) {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    } catch {
      throw AppException.validation('File is not a valid .xlsx workbook');
    }
    const ws = wb.worksheets[0];
    const schedules = await this.prisma.exam_schedules.findMany({ where: { exam_id: examId }, orderBy: { opens_at: 'asc' } });
    const blueprint = await this.latestBlueprint(this.prisma, examId);
    if (!blueprint) throw AppException.validation('Freeze the exam structure (blueprint) before assigning candidates');
    const errors: { row: number; message: string }[] = [];
    const wanted: { row: number; code: string; scheduleId: string }[] = [];
    ws?.eachRow((row, n) => {
      if (n === 1) return;
      const code = String(row.getCell(1).text ?? '').trim().toUpperCase();
      const slotText = String(row.getCell(5).text || row.getCell(2).text || '').trim();
      if (!code) return;
      const slotNo = Number(slotText.replace(/[^0-9]/g, ''));
      const schedule = schedules[slotNo - 1];
      if (!schedule) errors.push({ row: n, message: `Ca thi "${slotText}" không tồn tại (có ${schedules.length} ca)` });
      else wanted.push({ row: n, code, scheduleId: schedule.id });
    });
    const exam = await this.prisma.exams.findUniqueOrThrow({ where: { id: examId } });
    const candidates = await this.prisma.$queryRaw<{ id: string; code: string }[]>`
      SELECT c.id, c.candidate_code AS code FROM candidates c JOIN registrations r ON r.candidate_id = c.id
      WHERE r.competition_id = ${exam.competition_id}::uuid AND r.state = 'SUBMITTED' AND c.candidate_code = ANY(${wanted.map((w) => w.code)})`;
    for (const w of wanted) if (!candidates.find((c) => c.code === w.code)) errors.push({ row: w.row, message: `Không có thí sinh đã nộp hồ sơ với mã ${w.code}` });
    if (errors.length) return { applied: 0, errors };
    // Sĩ số mỗi ca sau khi áp dụng file không được vượt sức chứa
    const current = await this.prisma.candidate_assignments.findMany({ where: { exam_id: examId }, select: { candidate_id: true, schedule_id: true } });
    const slotOf = new Map(current.map((a) => [a.candidate_id, a.schedule_id]));
    for (const w of wanted) slotOf.set(candidates.find((c) => c.code === w.code)!.id, w.scheduleId);
    schedules.forEach((sc, i) => {
      const n = [...slotOf.values()].filter((id) => id === sc.id).length;
      if (n > sc.capacity) errors.push({ row: 0, message: `Ca ${i + 1} sẽ có ${n} thí sinh, vượt sức chứa ${sc.capacity}` });
    });
    if (errors.length) return { applied: 0, errors };
    const applied = await this.prisma.$transaction(
      async (tx) => {
        let n = 0;
        for (const w of wanted) {
          const candidateId = candidates.find((c) => c.code === w.code)!.id;
          const existing = await tx.candidate_assignments.findFirst({ where: { candidate_id: candidateId, exam_id: examId } });
          if (!existing) {
            await tx.candidate_assignments.create({ data: { candidate_id: candidateId, exam_id: examId, schedule_id: w.scheduleId, blueprint_version_id: blueprint.id, assigned_by_user_id: actorUserId } });
            n++;
          } else if (existing.schedule_id !== w.scheduleId) {
            if ((await tx.attempts.count({ where: { assignment_id: existing.id } })) > 0) continue;
            await tx.candidate_assignments.update({ where: { id: existing.id }, data: { schedule_id: w.scheduleId, revision: { increment: 1 } } });
            await tx.assignment_schedule_history.create({ data: { assignment_id: existing.id, old_schedule_id: existing.schedule_id, new_schedule_id: w.scheduleId, changed_by_user_id: actorUserId, reason: 'Nhập file phân ca' } });
            n++;
          }
        }
        await this.audit.record(tx, { actor_user_id: actorUserId, action: 'exam.roster_imported', target_type: 'exam', target_id: examId, correlation_id: correlationId, metadata: { rows: wanted.length, applied: n } });
        return n;
      },
      { timeout: 120_000 },
    );
    return { applied, errors: [] };
  }

  /** FR-3.4 / FR-4.4: ranking of Round 1 final scores (best attempt), Top 40 marked. */
  async scoresXlsx(examId: string, actorUserId: string, correlationId: string): Promise<Buffer> {
    const rows = (await this.roster(examId)).sort((a, b) => (b.points ?? -1) - (a.points ?? -1) || (a.finalizedAt ?? '').localeCompare(b.finalizedAt ?? ''));
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Diem Vong 1', { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = [
      { header: 'Hạng', key: 'rank', width: 7 },
      { header: 'Mã thí sinh', key: 'code', width: 22 },
      { header: 'Họ và tên', key: 'name', width: 26 },
      { header: 'Trường', key: 'school', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Điểm', key: 'points', width: 9 },
      { header: 'Điểm tối đa', key: 'max', width: 11 },
      { header: 'Nộp bài', key: 'cause', width: 14 },
      { header: 'Số lần rời trang', key: 'focus', width: 14 },
      { header: 'Top 40', key: 'top', width: 8 },
    ];
    ws.getRow(1).font = { bold: true };
    rows.forEach((r, i) => {
      const scored = r.points !== null;
      ws.addRow({
        rank: scored ? i + 1 : '',
        code: r.candidateCode, name: r.fullName, school: r.school, email: r.email,
        points: r.points == null ? '' : Math.round(r.points * 100) / 100, max: r.maxPoints == null ? '' : Math.round(r.maxPoints * 100) / 100,
        cause: r.finalizationCause === 'TIMEOUT' ? 'Hết giờ' : r.finalizationCause === 'MANUAL' ? 'Tự nộp' : r.attemptState === 'ACTIVE' ? 'Đang thi' : 'Chưa thi',
        focus: r.focusLost,
        top: scored && i < 40 ? 'Có' : '',
      });
    });
    await this.prisma.$transaction((tx) => this.audit.record(tx, { actor_user_id: actorUserId, action: 'exam.scores_exported', target_type: 'exam', target_id: examId, correlation_id: correlationId, metadata: { rows: rows.length } }));
    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}
