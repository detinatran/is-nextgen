import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { open } from 'node:fs/promises';
import ExcelJS from 'exceljs';
import { AuditService } from '../common/audit/audit.service';
import { AppException } from '../common/errors/app-error';
import type { AppConfig } from '../config/configuration';
import { PrismaService } from '../database/prisma.service';
import { DriveService } from '../media/drive/drive.service';
import { LocalStorageService } from '../media/storage/local-storage.service';

export interface RegistrationFilter {
  competition: string;
  state?: 'SUBMITTED' | 'DRAFT';
  school?: string;
  q?: string;
}

export interface RegistrationRow {
  registrationId: string;
  candidateCode: string | null;
  state: string;
  submittedAt: string | null;
  createdAt: string;
  fullName: string;
  dateOfBirth: string | null;
  studentId: string | null;
  school: string | null;
  department: string | null;
  major: string | null;
  email: string;
  phone: string | null;
  facebook: string | null;
  /** Latest MEDIA_USAGE answer: true = agrees (eligible for the Favorite Candidate award). */
  mediaConsent: boolean | null;
  duplicateFlagged: boolean;
  hasPhoto: boolean;
  hasVideo: boolean;
  videoSizeBytes: number | null;
  videoDurationSeconds: number | null;
}

type RawRow = {
  registration_id: string;
  candidate_code: string | null;
  state: string;
  submitted_at: Date | null;
  created_at: Date;
  full_name: string;
  date_of_birth: Date | null;
  student_id: string | null;
  school: string | null;
  department: string | null;
  major: string | null;
  email: string;
  phone: string | null;
  facebook: string | null;
  media_consent: boolean | null;
  duplicate_flagged: boolean;
  has_photo: boolean;
  video_size: bigint | null;
  video_duration: Prisma.Decimal | null;
};

const PHOTO_SIGNATURES: [string, (b: Buffer) => boolean][] = [
  ['image/jpeg', (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff],
  ['image/png', (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))],
  ['image/webp', (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP'],
];

/**
 * Admin read model over candidate registrations (FR-4.2): list/filter,
 * detail, private media access and Excel export. Read-only — registrations,
 * consents and media are immutable evidence; every media view and export
 * leaves an audit_events row.
 */
@Injectable()
export class AdminRegistrationsService {
  private readonly storage: LocalStorageService;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly drive: DriveService,
    config: ConfigService<AppConfig>,
  ) {
    this.storage = new LocalStorageService(config.get('mediaStorageDir', './.data/media'));
  }

  private where(f: RegistrationFilter): Prisma.Sql {
    const parts: Prisma.Sql[] = [Prisma.sql`comp.code = ${f.competition}`];
    if (f.state) parts.push(Prisma.sql`r.state = ${f.state}`);
    if (f.school) parts.push(Prisma.sql`p.school = ${f.school}`);
    if (f.q) {
      const like = `%${f.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      parts.push(Prisma.sql`(p.full_name ILIKE ${like} OR p.email ILIKE ${like} OR p.student_id ILIKE ${like}
        OR p.phone ILIKE ${like} OR c.candidate_code ILIKE ${like})`);
    }
    return Prisma.join(parts, ' AND ');
  }

  private async query(f: RegistrationFilter, limit: number | null, offset: number): Promise<RawRow[]> {
    const page = limit === null ? Prisma.empty : Prisma.sql`LIMIT ${limit} OFFSET ${offset}`;
    return this.prisma.$queryRaw<RawRow[]>`
      SELECT r.id AS registration_id, c.candidate_code, r.state, r.submitted_at, r.created_at,
             p.full_name, p.date_of_birth, p.student_id, p.school, p.department, p.major,
             p.email, p.phone, p.facebook,
             (SELECT k.granted FROM consents k
               WHERE k.registration_id = r.id AND k.purpose = 'MEDIA_USAGE'
               ORDER BY k.recorded_at DESC LIMIT 1) AS media_consent,
             EXISTS (SELECT 1 FROM duplicate_review_registrations d WHERE d.registration_id = r.id) AS duplicate_flagged,
             EXISTS (SELECT 1 FROM media_uploads mu WHERE mu.registration_id = r.id
                       AND mu.state = 'READY' AND mu.object_key LIKE 'p/%') AS has_photo,
             mo.size_bytes AS video_size, mo.duration_seconds AS video_duration
      FROM registrations r
      JOIN competitions comp ON comp.id = r.competition_id
      JOIN candidates c ON c.id = r.candidate_id
      JOIN candidate_profiles p ON p.candidate_id = c.id
      LEFT JOIN registration_videos rv ON rv.registration_id = r.id
      LEFT JOIN media_objects mo ON mo.id = rv.media_object_id
      WHERE ${this.where(f)}
      ORDER BY COALESCE(r.submitted_at, r.created_at) DESC, r.id
      ${page}`;
  }

  private toRow(r: RawRow): RegistrationRow {
    return {
      registrationId: r.registration_id,
      candidateCode: r.candidate_code,
      state: r.state,
      submittedAt: r.submitted_at?.toISOString() ?? null,
      createdAt: r.created_at.toISOString(),
      fullName: r.full_name,
      dateOfBirth: r.date_of_birth ? r.date_of_birth.toISOString().slice(0, 10) : null,
      studentId: r.student_id,
      school: r.school,
      department: r.department,
      major: r.major,
      email: r.email,
      phone: r.phone,
      facebook: r.facebook,
      mediaConsent: r.media_consent,
      duplicateFlagged: r.duplicate_flagged,
      hasPhoto: r.has_photo,
      hasVideo: r.video_size !== null,
      videoSizeBytes: r.video_size === null ? null : Number(r.video_size),
      videoDurationSeconds: r.video_duration === null ? null : Number(r.video_duration),
    };
  }

  async list(f: RegistrationFilter, page: number, pageSize: number) {
    const [rows, totals, schools] = await Promise.all([
      this.query(f, pageSize, (page - 1) * pageSize),
      this.prisma.$queryRaw<{ total: bigint }[]>`
        SELECT count(*) AS total FROM registrations r
        JOIN competitions comp ON comp.id = r.competition_id
        JOIN candidates c ON c.id = r.candidate_id
        JOIN candidate_profiles p ON p.candidate_id = c.id
        WHERE ${this.where(f)}`,
      // Facet trường học (không áp bộ lọc trường để admin còn chuyển qua lại)
      this.prisma.$queryRaw<{ school: string | null; total: bigint }[]>`
        SELECT p.school, count(*) AS total FROM registrations r
        JOIN competitions comp ON comp.id = r.competition_id
        JOIN candidates c ON c.id = r.candidate_id
        JOIN candidate_profiles p ON p.candidate_id = c.id
        WHERE ${this.where({ ...f, school: undefined, q: undefined })}
        GROUP BY p.school ORDER BY count(*) DESC, p.school`,
    ]);
    return {
      items: rows.map((r) => this.toRow(r)),
      total: Number(totals[0]?.total ?? 0),
      page,
      pageSize,
      schools: schools.map((s) => ({ school: s.school ?? '', total: Number(s.total) })),
    };
  }

  async detail(registrationId: string): Promise<RegistrationRow & { competition: string }> {
    const rows = await this.prisma.$queryRaw<(RawRow & { competition: string })[]>`
      SELECT r.id AS registration_id, comp.code AS competition, c.candidate_code, r.state, r.submitted_at, r.created_at,
             p.full_name, p.date_of_birth, p.student_id, p.school, p.department, p.major,
             p.email, p.phone, p.facebook,
             (SELECT k.granted FROM consents k
               WHERE k.registration_id = r.id AND k.purpose = 'MEDIA_USAGE'
               ORDER BY k.recorded_at DESC LIMIT 1) AS media_consent,
             EXISTS (SELECT 1 FROM duplicate_review_registrations d WHERE d.registration_id = r.id) AS duplicate_flagged,
             EXISTS (SELECT 1 FROM media_uploads mu WHERE mu.registration_id = r.id
                       AND mu.state = 'READY' AND mu.object_key LIKE 'p/%') AS has_photo,
             mo.size_bytes AS video_size, mo.duration_seconds AS video_duration
      FROM registrations r
      JOIN competitions comp ON comp.id = r.competition_id
      JOIN candidates c ON c.id = r.candidate_id
      JOIN candidate_profiles p ON p.candidate_id = c.id
      LEFT JOIN registration_videos rv ON rv.registration_id = r.id
      LEFT JOIN media_objects mo ON mo.id = rv.media_object_id
      WHERE r.id = ${registrationId}::uuid`;
    if (!rows[0]) throw AppException.notFound('Registration not found');
    return { ...this.toRow(rows[0]), competition: rows[0].competition };
  }

  /** Resolves the private file of a registration's photo or bound video (never exposes the path). */
  async media(
    registrationId: string,
    kind: 'photo' | 'video',
  ): Promise<{ path?: string; driveFileId?: string; contentType: string; objectKey: string; size: number }> {
    let objectKey: string | undefined;
    let driveFileId: string | undefined;
    let driveSize = 0;
    let contentType = 'video/mp4';
    if (kind === 'video') {
      const rows = await this.prisma.$queryRaw<{ object_key: string; mime_type: string; drive_file_id: string | null; drive_size: bigint | null; local_deleted_at: Date | null }[]>`
        SELECT mo.object_key, mo.mime_type, d.drive_file_id, d.size_bytes AS drive_size, d.local_deleted_at
        FROM registration_videos rv
        JOIN media_objects mo ON mo.id = rv.media_object_id
        LEFT JOIN media_drive_copies d ON d.media_object_id = mo.id
        WHERE rv.registration_id = ${registrationId}::uuid`;
      objectKey = rows[0]?.object_key;
      contentType = rows[0]?.mime_type ?? contentType;
      // Bản trên máy chủ đã xoá sau khi chép sang Google Drive: phát từ Drive
      if (rows[0]?.drive_file_id && rows[0].local_deleted_at && this.drive.enabled) {
        driveFileId = rows[0].drive_file_id;
        driveSize = Number(rows[0].drive_size);
      }
    } else {
      const upload = await this.prisma.media_uploads.findFirst({
        where: { registration_id: registrationId, state: 'READY', object_key: { startsWith: 'p/' } },
        orderBy: { created_at: 'desc' },
      });
      objectKey = upload?.object_key;
    }
    if (!objectKey) throw AppException.notFound(kind === 'video' ? 'Video not found' : 'Photo not found');
    if (driveFileId) return { driveFileId, contentType, objectKey, size: driveSize };
    const path = this.storage.pathFor(objectKey);
    const handle = await open(path, 'r').catch(() => {
      throw AppException.notFound('Media file is missing from storage');
    });
    try {
      const { size } = await handle.stat();
      if (kind === 'photo') {
        const head = Buffer.alloc(12);
        await handle.read(head, 0, 12, 0);
        contentType = PHOTO_SIGNATURES.find(([, test]) => test(head))?.[0] ?? 'application/octet-stream';
      }
      return { path, contentType, objectKey, size };
    } finally {
      await handle.close();
    }
  }

  /** Một đoạn video từ Google Drive (đã xác thực quyền ở controller). */
  driveStream(fileId: string, start: number, end: number) {
    return this.drive.download(fileId, start, end);
  }

  async recordMediaView(actorUserId: string, registrationId: string, kind: 'photo' | 'video', correlationId: string) {
    await this.prisma.$transaction((tx) =>
      this.audit.record(tx, {
        actor_user_id: actorUserId,
        action: 'media.viewed',
        target_type: 'registration',
        target_id: registrationId,
        correlation_id: correlationId,
        metadata: { kind },
      }),
    );
  }

  /** FR-4.2: Excel export of the filtered list, with links to the private media endpoints. */
  async exportXlsx(f: RegistrationFilter, baseUrl: string, actorUserId: string, correlationId: string): Promise<Buffer> {
    const rows = (await this.query(f, null, 0)).map((r) => this.toRow(r));
    const wb = new ExcelJS.Workbook();
    wb.creator = 'NextGen Manager';
    wb.created = new Date();
    const ws = wb.addWorksheet('Thi sinh', { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = [
      { header: 'STT', key: 'no', width: 6 },
      { header: 'Mã thí sinh', key: 'candidateCode', width: 22 },
      { header: 'Trạng thái', key: 'state', width: 12 },
      { header: 'Thời điểm nộp', key: 'submittedAt', width: 20 },
      { header: 'Họ và tên', key: 'fullName', width: 26 },
      { header: 'Ngày sinh', key: 'dateOfBirth', width: 12 },
      { header: 'MSSV', key: 'studentId', width: 14 },
      { header: 'Trường', key: 'school', width: 30 },
      { header: 'Khoa/Viện', key: 'department', width: 26 },
      { header: 'Ngành', key: 'major', width: 22 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Số điện thoại', key: 'phone', width: 15 },
      { header: 'Facebook', key: 'facebook', width: 34 },
      { header: 'Đồng ý dùng hình ảnh', key: 'mediaConsent', width: 14 },
      { header: 'Nghi trùng', key: 'duplicate', width: 10 },
      { header: 'Độ dài video (giây)', key: 'duration', width: 12 },
      { header: 'Link video', key: 'videoLink', width: 40 },
      { header: 'Link ảnh', key: 'photoLink', width: 40 },
    ];
    ws.getRow(1).font = { bold: true };
    rows.forEach((r, i) => {
      const media = `${baseUrl}/api/v1/admin/registrations/${r.registrationId}`;
      ws.addRow({
        no: i + 1,
        candidateCode: r.candidateCode ?? '',
        state: r.state === 'SUBMITTED' ? 'Đã nộp' : 'Nháp',
        submittedAt: r.submittedAt ? new Date(r.submittedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '',
        fullName: r.fullName,
        dateOfBirth: r.dateOfBirth ?? '',
        studentId: r.studentId ?? '',
        school: r.school ?? '',
        department: r.department ?? '',
        major: r.major ?? '',
        email: r.email,
        phone: r.phone ?? '',
        facebook: r.facebook ?? '',
        mediaConsent: r.mediaConsent === null ? '' : r.mediaConsent ? 'Có' : 'Không',
        duplicate: r.duplicateFlagged ? 'Có' : '',
        duration: r.videoDurationSeconds === null ? '' : Math.round(r.videoDurationSeconds),
        videoLink: r.hasVideo ? { text: 'Xem video', hyperlink: `${media}/video` } : '',
        photoLink: r.hasPhoto ? { text: 'Xem ảnh', hyperlink: `${media}/photo` } : '',
      });
    });
    ws.autoFilter = { from: 'A1', to: 'R1' };
    await this.prisma.$transaction((tx) =>
      this.audit.record(tx, {
        actor_user_id: actorUserId,
        action: 'registrations.exported',
        target_type: 'competition',
        correlation_id: correlationId,
        metadata: { competition: f.competition, state: f.state ?? null, school: f.school ?? null, q: f.q ?? null, rows: rows.length },
      }),
    );
    return Buffer.from(await wb.xlsx.writeBuffer());
  }
}
