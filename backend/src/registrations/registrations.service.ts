import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import type { Prisma, registration_access_grants, registrations } from '@prisma/client';
import { AppException } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { AuditService } from '../common/audit/audit.service';
import { IdempotencyService, type Tx } from '../common/idempotency/idempotency.service';
import { PrismaService } from '../database/prisma.service';
import type {
  CreateRegistrationDraftDto,
  RegistrationResponse,
  SubmissionResponse,
  UpdateRegistrationDto,
} from './dto/registration.dto';

const GRANT_TTL_MS = 14 * 24 * 3_600_000;
const NEXT_STEPS = [
  'Kiểm tra hộp thư email để nhận thư xác nhận đăng ký.',
  'Chờ Ban Tổ chức cấp tài khoản thí sinh (thông tin sẽ được gửi qua email).',
  'Đăng nhập và vào bài thi đúng theo lịch thi được phân.',
];

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  const trimmed = phone.replace(/[\s()-]/g, '');
  return trimmed.startsWith('+') ? `+${trimmed.slice(1)}` : trimmed;
}

function cleanText(value: string): string {
  // eslint-disable-next-line no-control-regex -- deliberate control-character strip
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, '');
}

/**
 * FR-13 competition registration and FR-16 authoritative confirmation.
 * Duplicate signals only flag a review; they never merge or reject.
 */
@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly audit: AuditService,
  ) {}

  async createDraft(
    dto: CreateRegistrationDraftDto,
    correlationId: string,
  ): Promise<{ registrationId: string; status: 'DRAFT'; capability: { profileToken: string; uploadToken: string; expiresAt: string } }> {
    if (!dto.consent.granted) {
      throw AppException.validation('Consent must be granted to register', { field: 'consent.granted' });
    }
    const email = cleanText(dto.email);
    const emailNormalized = normalizeEmail(email);
    const phone = cleanText(dto.phone);

    const result = await this.prisma.$transaction(async (tx) => {
      const competition = await tx.competitions.findUnique({ where: { code: dto.competitionCode.trim() } });
      if (!competition) throw AppException.notFound('Unknown competition');
      if (new Date() >= competition.registration_closes_at) {
        throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Registration window has closed');
      }

      const candidate = await tx.candidates.create({ data: {} });
      await tx.candidate_profiles.create({
        data: {
          candidate_id: candidate.id,
          full_name: cleanText(dto.fullName),
          date_of_birth: new Date(`${dto.dateOfBirth}T00:00:00Z`),
          student_id: cleanText(dto.studentId),
          school: cleanText(dto.school),
          department: cleanText(dto.department),
          major: cleanText(dto.major),
          email,
          email_normalized: emailNormalized,
          phone,
          phone_normalized: normalizePhone(phone),
          facebook: cleanText(dto.facebook),
        },
      });
      const registration = await tx.registrations.create({
        data: { competition_id: competition.id, candidate_id: candidate.id, state: 'DRAFT' },
      });
      await tx.consents.create({
        data: {
          registration_id: registration.id,
          purpose: 'DATA_PROCESSING',
          wording_version: dto.consent.wordingVersion,
          granted: true,
        },
      });

      const profileGrant = await this.issueGrant(tx, registration.id, emailNormalized, 'READ_EDIT_PROFILE');
      const uploadGrant = await this.issueGrant(tx, registration.id, emailNormalized, 'DRAFT_UPLOAD');
      await this.flagDuplicates(tx, registration.id, emailNormalized, cleanText(dto.studentId));
      await this.audit.record(tx, {
        action: 'registration.draft_created',
        target_type: 'registration',
        target_id: registration.id,
        correlation_id: correlationId,
        metadata: { competitionCode: competition.code },
      });
      return { registration, expiresAt: profileGrant.expiresAt, profileToken: profileGrant.token, uploadToken: uploadGrant.token };
    });

    this.logger.log(`registration draft created correlationId=${correlationId}`);
    return {
      registrationId: result.registration.id,
      status: 'DRAFT',
      capability: {
        profileToken: result.profileToken,
        uploadToken: result.uploadToken,
        expiresAt: result.expiresAt.toISOString(),
      },
    };
  }

  async getRegistration(registrationId: string): Promise<RegistrationResponse> {
    const registration = await this.loadRegistration(registrationId);
    const profile = await this.prisma.candidate_profiles.findUniqueOrThrow({
      where: { candidate_id: registration.candidate_id },
    });
    const competition = await this.prisma.competitions.findUniqueOrThrow({
      where: { id: registration.competition_id },
    });
    const candidate = await this.prisma.candidates.findUniqueOrThrow({
      where: { id: registration.candidate_id },
    });
    const video = await this.prisma.registration_videos.findUnique({
      where: { registration_id: registration.id },
    });
    const videoObject = video
      ? await this.prisma.media_objects.findUnique({ where: { id: video.media_object_id } })
      : null;
    return {
      registrationId: registration.id,
      status: registration.state as 'DRAFT' | 'SUBMITTED',
      revision: Number(registration.revision),
      competition: {
        code: competition.code,
        registrationClosesAt: competition.registration_closes_at.toISOString(),
      },
      profile: {
        fullName: profile.full_name,
        dateOfBirth: profile.date_of_birth ? profile.date_of_birth.toISOString().slice(0, 10) : null,
        studentId: profile.student_id ?? '',
        school: profile.school ?? '',
        department: profile.department ?? '',
        major: profile.major ?? '',
        email: profile.email,
        phone: profile.phone ?? '',
        facebook: profile.facebook ?? '',
        revision: Number(profile.revision),
      },
      video: videoObject
        ? {
            state: 'BOUND',
            mediaObjectId: videoObject.id,
            sizeBytes: Number(videoObject.size_bytes),
            durationSeconds: Number(videoObject.duration_seconds),
          }
        : null,
      candidateCode: candidate.candidate_code,
    };
  }

  async updateRegistration(
    registrationId: string,
    dto: UpdateRegistrationDto,
    correlationId: string,
  ): Promise<RegistrationResponse> {
    await this.prisma.$transaction(async (tx) => {
      const registration = await this.lockRegistration(tx, registrationId);
      if (registration.state !== 'DRAFT') {
        throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Submitted registration is immutable');
      }
      const patch: Prisma.candidate_profilesUpdateInput = {};
      if (dto.fullName !== undefined) patch.full_name = cleanText(dto.fullName);
      if (dto.dateOfBirth !== undefined) patch.date_of_birth = new Date(`${dto.dateOfBirth}T00:00:00Z`);
      if (dto.studentId !== undefined) patch.student_id = cleanText(dto.studentId);
      if (dto.school !== undefined) patch.school = cleanText(dto.school);
      if (dto.department !== undefined) patch.department = cleanText(dto.department);
      if (dto.major !== undefined) patch.major = cleanText(dto.major);
      if (dto.facebook !== undefined) patch.facebook = cleanText(dto.facebook);
      if (dto.email !== undefined) {
        patch.email = cleanText(dto.email);
        patch.email_normalized = normalizeEmail(dto.email);
      }
      if (dto.phone !== undefined) {
        patch.phone = cleanText(dto.phone);
        patch.phone_normalized = normalizePhone(dto.phone);
      }
      if (Object.keys(patch).length === 0) {
        throw AppException.validation('At least one profile field is required');
      }
      await tx.candidate_profiles.update({
        where: { candidate_id: registration.candidate_id },
        data: { ...patch, revision: { increment: 1 }, updated_at: new Date() },
      });
      await tx.registrations.update({
        where: { id: registration.id },
        data: { revision: { increment: 1 }, updated_at: new Date() },
      });
      await this.audit.record(tx, {
        action: 'registration.profile_updated',
        target_type: 'registration',
        target_id: registration.id,
        correlation_id: correlationId,
        metadata: { fields: Object.keys(patch) },
      });
    });
    return this.getRegistration(registrationId);
  }

  /**
   * FR-16: one transaction establishes the authoritative submission.
   * The candidate code, submission evidence and notification intent commit
   * atomically; the response is only returned after PostgreSQL COMMIT.
   */
  async submitRegistration(
    registrationId: string,
    idempotencyKey: string,
    requestPayload: Record<string, unknown>,
    correlationId: string,
  ): Promise<SubmissionResponse> {
    const requestHash = this.idempotency.hashRequest(requestPayload);
    const outcome = await this.prisma.$transaction(async (tx) => {
      const claim = {
        scope_key: `registration:${registrationId}`,
        idempotency_key: idempotencyKey,
        command_code: 'REGISTRATION_SUBMIT' as const,
        resource_type: 'registration',
        resource_id: registrationId,
      };
      const receipt = await this.idempotency.claim(tx, claim, requestHash);
      if (receipt.replayed) {
        // Immutable receipt: rebuild the committed outcome from domain state.
        const committed = await this.lockRegistration(tx, registrationId);
        if (committed.state === 'SUBMITTED') {
          const candidate = await tx.candidates.findUniqueOrThrow({
            where: { id: committed.candidate_id },
          });
          return this.buildSubmissionResponse(
            candidate.candidate_code as string,
            committed.submitted_at as Date,
          );
        }
        throw AppException.conflict(
          ErrorCodes.IDEMPOTENCY_CONFLICT,
          'Idempotent submit could not resolve the committed outcome',
        );
      }

      const registration = await this.lockRegistration(tx, registrationId);
      if (registration.state === 'SUBMITTED') {
        // Already committed (e.g. earlier key lost its response): return committed truth.
        const candidate = await tx.candidates.findUniqueOrThrow({
          where: { id: registration.candidate_id },
        });
        return this.buildSubmissionResponse(
          candidate.candidate_code as string,
          registration.submitted_at as Date,
        );
      }

      const competition = await tx.competitions.findUniqueOrThrow({
        where: { id: registration.competition_id },
      });
      const now = new Date();
      if (now < competition.registration_opens_at || now >= competition.registration_closes_at) {
        throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Registration is not currently allowed');
      }

      const profile = await tx.candidate_profiles.findUniqueOrThrow({
        where: { candidate_id: registration.candidate_id },
      });
      const missing = this.mandatoryProfileFields(profile);
      if (missing.length > 0) {
        throw AppException.validation('Registration profile is incomplete', { missingFields: missing });
      }
      const consent = await tx.consents.findFirst({
        where: { registration_id: registration.id, granted: true },
      });
      if (!consent) {
        throw AppException.validation('Consent record is required');
      }

      const readyCount = await tx.media_uploads.count({
        where: { registration_id: registration.id, state: 'READY' },
      });
      const binding = await tx.registration_videos.findUnique({
        where: { registration_id: registration.id },
      });
      if (readyCount !== 1 || !binding) {
        throw AppException.conflict(
          ErrorCodes.STATE_CONFLICT,
          'Submission requires exactly one READY private video',
        );
      }

      const candidate = await tx.candidates.findUniqueOrThrow({
        where: { id: registration.candidate_id },
      });
      let candidateCode = candidate.candidate_code;
      if (!candidateCode) {
        candidateCode = await this.generateUniqueCandidateCode(tx);
        await tx.candidates.update({
          where: { id: candidate.id },
          data: { candidate_code: candidateCode },
        });
      }

      const submittedAt = new Date();
      await tx.registrations.update({
        where: { id: registration.id },
        data: {
          state: 'SUBMITTED',
          submitted_at: submittedAt,
          submitted_profile: this.submittedProfileSnapshot(profile),
          revision: { increment: 1 },
          updated_at: submittedAt,
        },
      });
      await tx.notification_intents.create({
        data: {
          template_code: 'REGISTRATION_CONFIRMED',
          destination_email: profile.email,
          payload: { candidateCode },
          deduplication_key: `reg-confirmed:${registration.id}`,
          candidate_id: candidate.id,
        },
      });
      await this.flagDuplicates(
        tx,
        registration.id,
        profile.email_normalized,
        profile.student_id ?? '',
      );
      await this.audit.record(tx, {
        action: 'registration.submitted',
        target_type: 'registration',
        target_id: registration.id,
        correlation_id: correlationId,
        metadata: { candidateCode },
      });

      const response = this.buildSubmissionResponse(candidateCode, submittedAt);
      return response;
    });

    this.logger.log(`registration submitted correlationId=${correlationId}`);
    return outcome;
  }

  private buildSubmissionResponse(candidateCode: string, submittedAt: Date): SubmissionResponse {
    return {
      candidateCode,
      status: 'SUBMITTED',
      submittedAt: submittedAt.toISOString(),
      nextSteps: NEXT_STEPS,
    };
  }

  private mandatoryProfileFields(profile: {
    full_name: string;
    date_of_birth: Date | null;
    student_id: string | null;
    school: string | null;
    department: string | null;
    major: string | null;
    email: string;
    phone: string | null;
    facebook: string | null;
  }): string[] {
    const missing: string[] = [];
    if (!profile.full_name?.trim()) missing.push('fullName');
    if (!profile.date_of_birth) missing.push('dateOfBirth');
    if (!profile.student_id?.trim()) missing.push('studentId');
    if (!profile.school?.trim()) missing.push('school');
    if (!profile.department?.trim()) missing.push('department');
    if (!profile.major?.trim()) missing.push('major');
    if (!profile.email?.trim()) missing.push('email');
    if (!profile.phone?.trim()) missing.push('phone');
    if (!profile.facebook?.trim()) missing.push('facebook');
    return missing;
  }

  private submittedProfileSnapshot(profile: {
    full_name: string;
    date_of_birth: Date | null;
    student_id: string | null;
    school: string | null;
    department: string | null;
    major: string | null;
    email: string;
    phone: string | null;
    phone_normalized: string | null;
    facebook: string | null;
  }): Prisma.InputJsonValue {
    return {
      fullName: profile.full_name,
      dateOfBirth: profile.date_of_birth ? profile.date_of_birth.toISOString().slice(0, 10) : null,
      studentId: profile.student_id,
      school: profile.school,
      department: profile.department,
      major: profile.major,
      email: profile.email,
      phone: profile.phone,
      phoneNormalized: profile.phone_normalized,
      facebook: profile.facebook,
    } as Prisma.InputJsonValue;
  }

  /** Duplicate heuristics flag review rows only — never auto-merge or auto-reject. */
  private async flagDuplicates(
    tx: Tx,
    registrationId: string,
    emailNormalized: string,
    studentId: string,
  ): Promise<void> {
    const matches = await tx.candidate_profiles.findMany({
      where: {
        OR: [
          { email_normalized: emailNormalized },
          ...(studentId ? [{ student_id: studentId }] : []),
        ],
      },
      select: { candidate_id: true },
    });
    const candidateIds = matches.map((p) => p.candidate_id);
    const otherRegistrations = candidateIds.length
      ? await tx.registrations.findMany({
          where: { candidate_id: { in: candidateIds }, id: { not: registrationId } },
          select: { id: true },
        })
      : [];
    const otherRegistrationIds = otherRegistrations.map((r) => r.id);
    if (otherRegistrationIds.length === 0) return;

    const alreadyFlagged = await tx.duplicate_review_registrations.findFirst({
      where: { registration_id: registrationId },
    });
    if (alreadyFlagged) return;

    const review = await tx.duplicate_reviews.create({
      data: {
        signals: {
          reasons: ['EMAIL_OR_STUDENT_ID_MATCH'],
          matchedRegistrationIds: otherRegistrationIds,
        },
      },
    });
    await tx.duplicate_review_registrations.create({
      data: { review_id: review.id, registration_id: registrationId },
    });
    for (const otherId of otherRegistrationIds) {
      await tx.duplicate_review_registrations
        .create({ data: { review_id: review.id, registration_id: otherId } })
        .catch(() => undefined); // link may already exist for the other registration
    }
  }

  private async generateUniqueCandidateCode(tx: Tx): Promise<string> {
    const year = new Date().getFullYear();
    for (let attempt = 0; attempt < 3; attempt++) {
      const code = `ISNG-${year}-${randomBytes(4).toString('hex').toUpperCase()}`;
      const exists = await tx.candidates.findUnique({ where: { candidate_code: code } });
      if (!exists) return code;
    }
    throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Could not allocate a candidate code');
  }

  private async issueGrant(
    tx: Tx,
    registrationId: string,
    emailNormalized: string,
    scope: 'READ_EDIT_PROFILE' | 'DRAFT_UPLOAD',
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + GRANT_TTL_MS);
    await tx.registration_access_grants.create({
      data: {
        registration_id: registrationId,
        token_hash: sha256(token),
        verified_email_normalized: emailNormalized,
        email_verified_at: new Date(),
        scope,
        expires_at: expiresAt,
      },
    });
    return { token, expiresAt };
  }

  private async loadRegistration(registrationId: string): Promise<registrations> {
    const registration = await this.prisma.registrations.findUnique({
      where: { id: registrationId },
    });
    if (!registration) throw AppException.notFound('Registration not found');
    return registration;
  }

  private async lockRegistration(tx: Tx, registrationId: string): Promise<registrations> {
    const rows = await tx.$queryRaw<registrations[]>`
      SELECT * FROM registrations WHERE id = ${registrationId}::uuid FOR UPDATE`;
    if (rows.length === 0) throw AppException.notFound('Registration not found');
    return rows[0];
  }
}

export type RegistrationGrant = registration_access_grants;
