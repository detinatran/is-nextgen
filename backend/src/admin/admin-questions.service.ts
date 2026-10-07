import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import { AuditService } from '../common/audit/audit.service';
import { AppException } from '../common/errors/app-error';
import type { Tx } from '../common/idempotency/idempotency.service';
import { PrismaService } from '../database/prisma.service';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionInput {
  poolId: string;
  prompt: string;
  difficulty: Difficulty;
  options: { text: string; isCorrect: boolean }[];
}

const DIFFICULTY_LABELS: Record<string, Difficulty> = {
  'dễ': 'EASY',
  de: 'EASY',
  easy: 'EASY',
  'trung bình': 'MEDIUM',
  'trung binh': 'MEDIUM',
  medium: 'MEDIUM',
  'khó': 'HARD',
  kho: 'HARD',
  hard: 'HARD',
};

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'richText' in v) return v.richText.map((r) => r.text).join('').trim();
  if (typeof v === 'object' && 'text' in v) return String(v.text).trim();
  if (typeof v === 'object' && 'result' in v) return String(v.result ?? '').trim();
  return String(v).trim();
}

/**
 * FR-4.3 question bank. Versions are FROZEN as soon as they are written
 * (delivery only uses FROZEN versions, and the DB forbids touching a FROZEN
 * version): editing creates version N+1 and moves pool memberships to it,
 * so attempts already delivered keep their exact historical wording.
 */
@Injectable()
export class AdminQuestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async pools() {
    const rows = await this.prisma.$queryRaw<{ id: string; code: string; name: string; questions: bigint }[]>`
      SELECT p.id, p.code, p.name,
             (SELECT count(*) FROM question_pool_memberships m
                JOIN question_versions qv ON qv.id = m.question_version_id
                JOIN questions q ON q.id = qv.question_id
              WHERE m.pool_id = p.id AND qv.state = 'FROZEN' AND q.archived_at IS NULL) AS questions
      FROM question_pools p ORDER BY p.code`;
    return rows.map((r) => ({ id: r.id, code: r.code, name: r.name, questionCount: Number(r.questions) }));
  }

  async createPool(code: string, name: string, actorUserId: string, correlationId: string) {
    const clean = code.trim().toUpperCase();
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.question_pools.findUnique({ where: { code: clean } });
      if (existing) throw AppException.conflict('STATE_CONFLICT', `Pool ${clean} already exists`);
      const pool = await tx.question_pools.create({ data: { code: clean, name: name.trim() } });
      await this.audit.record(tx, { actor_user_id: actorUserId, action: 'question_pool.created', target_type: 'question_pool', target_id: pool.id, correlation_id: correlationId });
      return { id: pool.id, code: pool.code, name: pool.name, questionCount: 0 };
    });
  }

  async list(poolId?: string) {
    const rows = await this.prisma.$queryRaw<
      { question_id: string; version_id: string; version: number; prompt: string; difficulty: string; pool_id: string; pool_code: string; created_at: Date }[]
    >`
      SELECT q.id AS question_id, qv.id AS version_id, qv.version, qv.prompt, qv.difficulty,
             p.id AS pool_id, p.code AS pool_code, qv.frozen_at AS created_at
      FROM question_pool_memberships m
      JOIN question_versions qv ON qv.id = m.question_version_id
      JOIN questions q ON q.id = qv.question_id
      JOIN question_pools p ON p.id = m.pool_id
      WHERE q.archived_at IS NULL AND qv.state = 'FROZEN'
        ${poolId ? Prisma.sql`AND m.pool_id = ${poolId}::uuid` : Prisma.empty}
      ORDER BY p.code, qv.frozen_at, q.id`;
    const options = rows.length
      ? await this.prisma.question_options.findMany({
          where: { question_version_id: { in: rows.map((r) => r.version_id) } },
          orderBy: { position: 'asc' },
        })
      : [];
    return rows.map((r) => ({
      questionId: r.question_id,
      versionId: r.version_id,
      version: r.version,
      poolId: r.pool_id,
      poolCode: r.pool_code,
      prompt: r.prompt,
      difficulty: r.difficulty,
      options: options
        .filter((o) => o.question_version_id === r.version_id)
        .map((o) => ({ position: o.position, text: o.text, isCorrect: o.is_correct })),
    }));
  }

  private validate(input: QuestionInput): void {
    const prompt = input.prompt.trim();
    if (prompt.length < 3) throw AppException.validation('Question text is required');
    const options = input.options.filter((o) => o.text.trim());
    if (options.length < 2) throw AppException.validation('A question needs at least 2 options');
    if (options.filter((o) => o.isCorrect).length !== 1) throw AppException.validation('Exactly one option must be correct');
  }

  /** Writes one FROZEN version (insert DRAFT + options, then freeze — the DB trigger re-checks the options). */
  private async writeVersion(tx: Tx, questionId: string, version: number, input: QuestionInput, actorUserId: string) {
    const qv = await tx.question_versions.create({
      data: {
        question_id: questionId,
        version,
        state: 'DRAFT',
        prompt: input.prompt.trim(),
        difficulty: input.difficulty,
        created_by_user_id: actorUserId,
      },
    });
    const options = input.options.filter((o) => o.text.trim());
    for (let i = 0; i < options.length; i++) {
      await tx.question_options.create({
        data: { question_version_id: qv.id, position: i + 1, text: options[i].text.trim(), is_correct: options[i].isCorrect },
      });
    }
    await tx.question_versions.update({ where: { id: qv.id }, data: { state: 'FROZEN', frozen_at: new Date() } });
    return qv.id;
  }

  async create(input: QuestionInput, actorUserId: string, correlationId: string, client?: Tx) {
    this.validate(input);
    const run = async (tx: Tx) => {
      const pool = await tx.question_pools.findUnique({ where: { id: input.poolId } });
      if (!pool) throw AppException.notFound('Question pool not found');
      const question = await tx.questions.create({ data: { created_by_user_id: actorUserId } });
      const versionId = await this.writeVersion(tx, question.id, 1, input, actorUserId);
      await tx.question_pool_memberships.create({ data: { pool_id: pool.id, question_version_id: versionId } });
      await this.audit.record(tx, { actor_user_id: actorUserId, action: 'question.created', target_type: 'question', target_id: question.id, correlation_id: correlationId });
      return { questionId: question.id, versionId };
    };
    return client ? run(client) : this.prisma.$transaction(run);
  }

  async update(questionId: string, input: QuestionInput, actorUserId: string, correlationId: string) {
    this.validate(input);
    return this.prisma.$transaction(async (tx) => {
      const question = await tx.questions.findUnique({ where: { id: questionId } });
      if (!question || question.archived_at) throw AppException.notFound('Question not found');
      const pool = await tx.question_pools.findUnique({ where: { id: input.poolId } });
      if (!pool) throw AppException.notFound('Question pool not found');
      const latest = await tx.question_versions.findFirst({ where: { question_id: questionId }, orderBy: { version: 'desc' } });
      const versionId = await this.writeVersion(tx, questionId, (latest?.version ?? 0) + 1, input, actorUserId);
      // Chuyển câu hỏi sang phiên bản mới trong ngân hàng; bài đã thi vẫn giữ phiên bản cũ.
      const versionIds = (await tx.question_versions.findMany({ where: { question_id: questionId }, select: { id: true } })).map((v) => v.id);
      await tx.question_pool_memberships.deleteMany({ where: { question_version_id: { in: versionIds.filter((id) => id !== versionId) } } });
      await tx.question_pool_memberships.create({ data: { pool_id: pool.id, question_version_id: versionId } });
      await this.audit.record(tx, { actor_user_id: actorUserId, action: 'question.revised', target_type: 'question', target_id: questionId, correlation_id: correlationId, metadata: { versionId } });
      return { questionId, versionId };
    });
  }

  async archive(questionId: string, actorUserId: string, correlationId: string) {
    return this.prisma.$transaction(async (tx) => {
      const question = await tx.questions.findUnique({ where: { id: questionId } });
      if (!question || question.archived_at) throw AppException.notFound('Question not found');
      await tx.questions.update({ where: { id: questionId }, data: { archived_at: new Date() } });
      const versionIds = (await tx.question_versions.findMany({ where: { question_id: questionId }, select: { id: true } })).map((v) => v.id);
      await tx.question_pool_memberships.deleteMany({ where: { question_version_id: { in: versionIds } } });
      await this.audit.record(tx, { actor_user_id: actorUserId, action: 'question.archived', target_type: 'question', target_id: questionId, correlation_id: correlationId });
      return { archived: true };
    });
  }

  async template(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Cau hoi');
    ws.columns = [
      { header: 'Nhóm câu hỏi', key: 'pool', width: 16 },
      { header: 'Câu hỏi', key: 'prompt', width: 60 },
      { header: 'Đáp án A', key: 'a', width: 28 },
      { header: 'Đáp án B', key: 'b', width: 28 },
      { header: 'Đáp án C', key: 'c', width: 28 },
      { header: 'Đáp án D', key: 'd', width: 28 },
      { header: 'Đáp án đúng (A/B/C/D)', key: 'correct', width: 14 },
      { header: 'Độ khó (Dễ/Trung bình/Khó)', key: 'difficulty', width: 16 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.addRow({ pool: 'SOLIEU', prompt: 'Doanh thu quý I là 120 tỷ, quý II tăng 25%. Doanh thu quý II là bao nhiêu?', a: '145 tỷ', b: '150 tỷ', c: '155 tỷ', d: '160 tỷ', correct: 'B', difficulty: 'Dễ' });
    ws.addRow({ pool: 'LOGIC', prompt: 'Mọi quản lý đều họp giao ban. An không họp giao ban. Kết luận nào chắc chắn đúng?', a: 'An là quản lý', b: 'An không phải quản lý', c: 'An là nhân viên mới', d: 'Không kết luận được', correct: 'B', difficulty: 'Trung bình' });
    const guide = wb.addWorksheet('Huong dan');
    guide.addRows([
      ['Mỗi dòng một câu hỏi. Nhóm câu hỏi là mã ngắn, viết liền không dấu (ví dụ SOLIEU, LOGIC, QUANTRI); nhóm chưa có sẽ được tạo mới.'],
      ['Cần ít nhất 2 đáp án; ô Đáp án đúng ghi một chữ cái A, B, C hoặc D.'],
      ['File được kiểm tra toàn bộ trước khi lưu: có một dòng lỗi thì không dòng nào được thêm.'],
    ]);
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  /** All-or-nothing import from the template layout. */
  async importXlsx(buffer: Buffer, actorUserId: string, correlationId: string) {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    } catch {
      throw AppException.validation('File is not a valid .xlsx workbook');
    }
    const ws = wb.worksheets[0];
    if (!ws) throw AppException.validation('Workbook has no sheet');
    const parsed: { row: number; pool: string; input: Omit<QuestionInput, 'poolId'> }[] = [];
    const errors: { row: number; message: string }[] = [];
    ws.eachRow((row, n) => {
      if (n === 1) return;
      const v = (i: number) => cellText(row.getCell(i).value);
      const pool = v(1).toUpperCase();
      const prompt = v(2);
      if (!pool && !prompt) return;
      const options = [3, 4, 5, 6].map((i) => v(i));
      const correct = v(7).toUpperCase();
      const difficulty = DIFFICULTY_LABELS[v(8).toLowerCase()] ?? (v(8) ? undefined : 'MEDIUM');
      if (!/^[A-Z0-9_-]{2,30}$/.test(pool)) errors.push({ row: n, message: 'Nhóm câu hỏi phải là mã viết liền không dấu (2-30 ký tự)' });
      if (prompt.length < 3) errors.push({ row: n, message: 'Thiếu nội dung câu hỏi' });
      const idx = 'ABCD'.indexOf(correct);
      if (idx < 0 || !options[idx]) errors.push({ row: n, message: 'Đáp án đúng phải là A, B, C hoặc D và ô đáp án đó không được trống' });
      if (options.filter(Boolean).length < 2) errors.push({ row: n, message: 'Cần ít nhất 2 đáp án' });
      if (!difficulty) errors.push({ row: n, message: 'Độ khó phải là Dễ, Trung bình hoặc Khó' });
      parsed.push({
        row: n,
        pool,
        input: {
          prompt,
          difficulty: difficulty ?? 'MEDIUM',
          options: options.map((text, i) => ({ text, isCorrect: i === idx })).filter((o) => o.text),
        },
      });
    });
    if (parsed.length === 0 && errors.length === 0) errors.push({ row: 0, message: 'File không có câu hỏi nào' });
    if (errors.length) return { created: 0, errors };
    const created = await this.prisma.$transaction(
      async (tx) => {
        const poolIds = new Map<string, string>();
        for (const item of parsed) {
          if (!poolIds.has(item.pool)) {
            const pool =
              (await tx.question_pools.findUnique({ where: { code: item.pool } })) ??
              (await tx.question_pools.create({ data: { code: item.pool, name: item.pool } }));
            poolIds.set(item.pool, pool.id);
          }
          await this.create({ ...item.input, poolId: poolIds.get(item.pool)! }, actorUserId, correlationId, tx);
        }
        await this.audit.record(tx, { actor_user_id: actorUserId, action: 'question.imported', target_type: 'question_pool', correlation_id: correlationId, metadata: { rows: parsed.length } });
        return parsed.length;
      },
      { timeout: 120_000 },
    );
    return { created, errors: [] };
  }
}
