import { Injectable, Logger } from '@nestjs/common';
import { randomBytes, createHash, randomUUID } from 'node:crypto';
import type { Prisma, registration_access_grants, registrations } from '@prisma/client';
import { AppException } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { AuditService } from '../common/audit/audit.service';
import { IdempotencyService, type Tx } from '../common/idempotency/idempotency.service';
import { PrismaService } from '../database/prisma.service';
import { ChallengeService } from '../identity-access/challenge.service';
import type { RegistrationAuthContext } from '../common/http/request-context';
import type {
  CreateRegistrationDraftDto,
  RegistrationResponse,
  SubmissionResponse,
  UpdateRegistrationDto,
} from './dto/registration.dto';

const GRANT_TTL_MS = 14 * 24 * 3_600_000;
/**
 * F03: the anonymous initial capability is NOT a registration_access_grants
 * row — that frozen table's verified_email_normalized/email_verified_at are
 * NOT NULL and only ever describe a proven email. The limited initial
 * capability is bound through append-only audit evidence instead (the same
 * challenge-binding mechanism the verified recovery flow uses). The guard
 * resolves it by token hash from this action's metadata.
 */
export const DRAFT_CAPABILITY_AUDIT_ACTION = 'registration.draft_capability_issued';
export const DRAFT_CAPABILITY_TTL_MS = GRANT_TTL_MS;
const NEXT_STEPS = [
  'Kiểm tra hộp thư email để nhận thư xác nhận đăng ký.',
  'Chờ Ban Tổ chức cấp tài khoản thí sinh (thông tin sẽ được gửi qua email).',
  'Đăng nhập và vào bài thi đúng theo lịch thi được phân.',
];

export type ConsentPurpose = 'DATA_PROCESSING' | 'MEDIA_USAGE' | 'EVENT_COVERAGE';

interface ConsentSnapshot {
  granted: boolean;
  wordingVersion: string;
  recordedAt: Date;
}

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
 * FR-13 competition registration and FR-16 authoritative confirmation,
 * extended with the PR-media requirements: one personal photo (validated by
 * magic bytes, exactly one READY per registration) and append-only consent
 * evidence (MEDIA_USAGE may be declined; EVENT_COVERAGE is the commitment).
 * Duplicate signals only flag a review; they never merge or reject.
 */
@Injectable()
export class RegistrationsService {
  private readonly logger = new Logger(RegistrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly idempotency: IdempotencyService,
    private readonly audit: AuditService,
    private readonly challenges: ChallengeService,
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
      await this.recordConsents(tx, registration.id, [
        { purpose: 'DATA_PROCESSING', granted: true, wordingVersion: dto.consent.wordingVersion },
        ...(dto.eventCoverageConsent ? [{
          purpose: 'EVENT_COVERAGE' as const,
          granted: dto.eventCoverageConsent.granted,
          wordingVersion: dto.eventCoverageConsent.wordingVersion,
        }] : []),
        {
          purpose: 'MEDIA_USAGE',
          granted: dto.mediaUsageConsent.granted,
          wordingVersion: dto.mediaUsageConsent.wordingVersion,
        },
      ]);

      // F03: the anonymous initial flow receives ONE limited capability with
      // the DRAFT_UPLOAD (initial submission) scope, bound via append-only
      // audit evidence. It never asserts verified email, never touches the
      // verified grant table, and never becomes long-lived private edit
      // authority; later read/edit requires the verified recovery flow below.
      const draftCapability = await this.issueDraftCapability(tx, registration.id, correlationId);
      await this.flagDuplicates(tx, registration.id, emailNormalized, cleanText(dto.studentId));
      await this.audit.record(tx, {
        action: 'registration.draft_created',
        target_type: 'registration',
        target_id: registration.id,
        correlation_id: correlationId,
        metadata: { competitionCode: competition.code },
      });
      return { registration, expiresAt: draftCapability.expiresAt, draftToken: draftCapability.token };
    });

    this.logger.log(`registration draft created correlationId=${correlationId}`);
    return {
      registrationId: result.registration.id,
      status: 'DRAFT',
      capability: {
        uploadToken: result.draftToken,
        // Deprecated alias of uploadToken kept for initial-flow clients;
        // both carry the DRAFT_UPLOAD scope only.
        profileToken: result.draftToken,
        expiresAt: result.expiresAt.toISOString(),
      },
    };
  }

  /**
   * F03: private profile read. A DRAFT_UPLOAD initial capability may read its
   * own registration only while it is still a draft; once submitted (and
   * possibly edited via verified recovery), only the verified
   * READ_EDIT_PROFILE grant may read the private profile. Internal callers
   * pass no auth and are not subject to this check.
   */
  async getRegistration(
    registrationId: string,
    auth?: RegistrationAuthContext,
  ): Promise<RegistrationResponse> {
    const registration = await this.loadRegistration(registrationId);
    if (
      auth &&
      auth.registrationId === registration.id &&
      auth.scopes.includes('DRAFT_UPLOAD') &&
      !auth.scopes.includes('READ_EDIT_PROFILE') &&
      registration.state !== 'DRAFT'
    ) {
      throw AppException.forbidden(
        'Initial upload capability cannot read the submitted profile; use verified recovery',
      );
    }
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
    const photo = await this.prisma.media_uploads.findFirst({
      where: { registration_id: registration.id, state: 'READY', object_key: { startsWith: 'p/' } },
      orderBy: { created_at: 'desc' },
    });
    const consents = await this.resolveCurrentConsentsInTx(this.prisma, registration.id);
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
      photo: photo ? { uploadId: photo.id, state: 'READY' as const } : null,
      consents: [...consents.entries()].map(([purpose, c]) => ({
        purpose: purpose as ConsentPurpose,
        granted: c.granted,
        wordingVersion: c.wordingVersion,
        recordedAt: c.recordedAt.toISOString(),
      })),
      favoriteCandidateEligible: consents.get('MEDIA_USAGE')?.granted === true,
      candidateCode: candidate.candidate_code,
    };
  }

  async updateRegistration(
    registrationId: string,
    dto: UpdateRegistrationDto,
    grantId: string,
    correlationId: string,
  ): Promise<RegistrationResponse> {
    await this.prisma.$transaction(async (tx) => {
      const registration = await this.lockRegistration(tx, registrationId);

      // F03-REVOCATION: the pre-request guard result is stale once the row
      // lock is held. The verified grant identity is re-checked INSIDE this
      // transaction against current time, so a grant expired or revoked while
      // the edit waited on the lock can never commit.
      const grant = await tx.registration_access_grants.findUnique({ where: { id: grantId } });
      const grantValidAt = new Date();
      if (
        !grant ||
        grant.registration_id !== registrationId ||
        grant.scope !== 'READ_EDIT_PROFILE' ||
        grant.revoked_at !== null ||
        grant.expires_at <= grantValidAt
      ) {
        throw AppException.authRequired('Registration capability token is invalid or expired');
      }

      // F04: server-authoritative deadline (competition close time) applies
      // to DRAFT and SUBMITTED registrations alike.
      const competition = await tx.competitions.findUniqueOrThrow({
        where: { id: registration.competition_id },
      });
      if (new Date() >= competition.registration_closes_at) {
        throw AppException.conflict(ErrorCodes.DEADLINE_PASSED, 'Registration deadline has passed');
      }

      // F04: optimistic concurrency. An absent or stale revision is a
      // fail-closed conflict, never a silent overwrite.
      const currentRevision = Number(registration.revision);
      if (dto.expectedRevision === undefined || dto.expectedRevision !== currentRevision) {
        throw AppException.conflict(ErrorCodes.REVISION_CONFLICT, 'Registration revision conflict', {
          currentRevision,
        });
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
        if (registration.state === 'SUBMITTED') {
          // Submitted evidence references the submitted email; changing it
          // requires a fresh verified channel, so it is rejected explicitly.
          throw AppException.validation('Email cannot be changed after submission');
        }
        patch.email = cleanText(dto.email);
        patch.email_normalized = normalizeEmail(dto.email);
      }
      if (dto.phone !== undefined) {
        patch.phone = cleanText(dto.phone);
        patch.phone_normalized = normalizePhone(dto.phone);
      }

      // Consent rows are append-only evidence; answers may change while the
      // registration is still a draft. Submitted consents are withdrawn by
      // email (recorded by the BTC), never rewritten here.
      const consentAppends: {
        purpose: 'MEDIA_USAGE' | 'EVENT_COVERAGE';
        granted: boolean;
        wordingVersion: string;
      }[] = [];
      if (dto.mediaUsageConsent !== undefined) {
        consentAppends.push({
          purpose: 'MEDIA_USAGE',
          granted: dto.mediaUsageConsent.granted,
          wordingVersion: dto.mediaUsageConsent.wordingVersion,
        });
      }
      if (dto.eventCoverageConsent !== undefined) {
        consentAppends.push({
          purpose: 'EVENT_COVERAGE',
          granted: dto.eventCoverageConsent.granted,
          wordingVersion: dto.eventCoverageConsent.wordingVersion,
        });
      }
      if (registration.state === 'SUBMITTED' && consentAppends.length > 0) {
        throw AppException.conflict(
          ErrorCodes.STATE_CONFLICT,
          'Submitted consent evidence is immutable; withdraw by email',
        );
      }
      if (Object.keys(patch).length === 0 && consentAppends.length === 0) {
        throw AppException.validation('At least one profile field or consent answer is required');
      }
      if (consentAppends.length > 0) {
        await this.recordConsents(tx, registration.id, consentAppends);
      }
      if (Object.keys(patch).length > 0) {
        await tx.candidate_profiles.update({
          where: { candidate_id: registration.candidate_id },
          data: { ...patch, revision: { increment: 1 }, updated_at: new Date() },
        });
      }
      // The frozen trigger keeps submitted_profile/submitted_at immutable;
      // only the mutable current profile and the registration revision move.
      await tx.registrations.update({
        where: { id: registration.id },
        data: { revision: { increment: 1 }, updated_at: new Date() },
      });
      await this.audit.record(tx, {
        action: 'registration.profile_updated',
        target_type: 'registration',
        target_id: registration.id,
        correlation_id: correlationId,
        metadata: {
          fields: Object.keys(patch),
          consents: consentAppends.map((c) => c.purpose),
          state: registration.state,
        },
      });
    });
    return this.getRegistration(registrationId);
  }

  /**
   * FR-16: one transaction establishes the authoritative submission.
   * Preconditions: complete profile, consents resolved (DATA_PROCESSING and
   * EVENT_COVERAGE granted; MEDIA_USAGE either), exactly one READY bound
   * video AND exactly one READY personal photo. The candidate code, evidence
   * snapshot and notification intent commit atomically; the response is only
   * returned after PostgreSQL COMMIT.
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
          const committedConsents = await this.resolveCurrentConsentsInTx(tx, committed.id);
          return this.buildSubmissionResponse(
            candidate.candidate_code as string,
            committed.submitted_at as Date,
            committedConsents.get('MEDIA_USAGE')?.granted === true,
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
        const consents = await this.resolveCurrentConsentsInTx(tx, registration.id);
        return this.buildSubmissionResponse(
          candidate.candidate_code as string,
          registration.submitted_at as Date,
          consents.get('MEDIA_USAGE')?.granted === true,
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

      // Consents (latest answer per purpose wins; rows are append-only evidence):
      // - DATA_PROCESSING must be granted (registration itself)
      // - EVENT_COVERAGE is legacy evidence, never a general registration gate.
      // - MEDIA_USAGE may be true or false; declining only excludes the
      //   Favorite Candidate award (favoriteCandidateEligible derives from it).
      const consents = await this.resolveCurrentConsentsInTx(tx, registration.id);
      const dataProcessing = consents.get('DATA_PROCESSING');
      const mediaUsage = consents.get('MEDIA_USAGE');
      if (!dataProcessing) throw AppException.validation('Data processing consent is required');
      if (!dataProcessing.granted) throw AppException.validation('Data processing consent must be granted');
      if (!mediaUsage) throw AppException.validation('Media usage consent answer is required');

      const readyVideoCount = await tx.media_uploads.count({
        where: { registration_id: registration.id, state: 'READY', object_key: { startsWith: 'v/' } },
      });
      const binding = await tx.registration_videos.findUnique({
        where: { registration_id: registration.id },
      });
      if (readyVideoCount !== 1 || !binding) {
        throw AppException.conflict(
          ErrorCodes.STATE_CONFLICT,
          'Submission requires exactly one READY private video',
        );
      }
      const readyPhotoCount = await tx.media_uploads.count({
        where: { registration_id: registration.id, state: 'READY', object_key: { startsWith: 'p/' } },
      });
      if (readyPhotoCount !== 1) {
        throw AppException.conflict(
          ErrorCodes.STATE_CONFLICT,
          'Submission requires exactly one READY personal photo',
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

      const photoUpload = await tx.media_uploads.findFirstOrThrow({
        where: { registration_id: registration.id, state: 'READY', object_key: { startsWith: 'p/' } },
        select: { id: true },
      });

      const submittedAt = new Date();
      await tx.registrations.update({
        where: { id: registration.id },
        data: {
          state: 'SUBMITTED',
          submitted_at: submittedAt,
          submitted_profile: {
            ...this.submittedProfileSnapshot(profile),
            photoUploadId: photoUpload.id,
            consents: Object.fromEntries(
              [...consents.entries()].map(([purpose, c]) => [
                purpose,
                { granted: c.granted, wordingVersion: c.wordingVersion },
              ]),
            ),
            favoriteCandidateEligible: mediaUsage?.granted === true,
          } as Prisma.InputJsonValue,
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

      const response = this.buildSubmissionResponse(candidateCode, submittedAt, mediaUsage?.granted === true);
      return response;
    });

    this.logger.log(`registration submitted correlationId=${correlationId}`);
    return outcome;
  }

  private buildSubmissionResponse(
    candidateCode: string,
    submittedAt: Date,
    favoriteCandidateEligible: boolean,
  ): SubmissionResponse {
    return {
      candidateCode,
      status: 'SUBMITTED',
      submittedAt: submittedAt.toISOString(),
      favoriteCandidateEligible,
      nextSteps: NEXT_STEPS,
    };
  }

  /**
   * Records append-only consent evidence. Explicit recorded_at values offset
   * by 1ms keep same-transaction appends strictly ordered (PG timestamptz is
   * microsecond-precision; `now()` within one transaction would tie).
   */
  private async recordConsents(
    tx: Tx,
    registrationId: string,
    list: { purpose: ConsentPurpose; granted: boolean; wordingVersion: string }[],
  ): Promise<void> {
    const base = Date.now();
    await Promise.all(
      list.map((c, index) =>
        tx.consents.create({
          data: {
            registration_id: registrationId,
            purpose: c.purpose,
            wording_version: c.wordingVersion,
            granted: c.granted,
            recorded_at: new Date(base + index),
          },
        }),
      ),
    );
  }

  private async resolveCurrentConsentsInTx(
    tx: Tx,
    registrationId: string,
  ): Promise<Map<ConsentPurpose, ConsentSnapshot>> {
    const rows = await tx.consents.findMany({
      where: { registration_id: registrationId },
      orderBy: [{ recorded_at: 'desc' }],
    });
    const latest = new Map<ConsentPurpose, ConsentSnapshot>();
    for (const row of rows) {
      const purpose = row.purpose as ConsentPurpose;
      if (!latest.has(purpose)) {
        latest.set(purpose, {
          granted: row.granted,
          wordingVersion: row.wording_version,
          recordedAt: row.recorded_at,
        });
      }
    }
    return latest;
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
  }): Record<string, unknown> {
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
    };
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

  /**
   * F03: issues a VERIFIED recovery grant. email_verified_at is the actual
   * email-ownership proof time — never an issue/delivery timestamp, and this
   * is the only writer of registration_access_grants rows.
   */
  private async issueGrant(
    tx: Tx,
    registrationId: string,
    emailNormalized: string,
    scope: 'READ_EDIT_PROFILE',
    verifiedAt: Date,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + GRANT_TTL_MS);
    await tx.registration_access_grants.create({
      data: {
        registration_id: registrationId,
        token_hash: sha256(token),
        verified_email_normalized: emailNormalized,
        email_verified_at: verifiedAt,
        scope,
        expires_at: expiresAt,
      },
    });
    return { token, expiresAt };
  }

  /**
   * F03: issues the limited anonymous initial capability (DRAFT_UPLOAD only).
   * Stored as audit evidence — registration binding, issue time and expiry —
   * without writing any verified-email columns. It allows photo/video upload,
   * binding and the initial submission; it never reads the private profile
   * after submission and never PATCHes (enforced by guard + service state
   * checks).
   */
  private async issueDraftCapability(
    tx: Tx,
    registrationId: string,
    correlationId: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + DRAFT_CAPABILITY_TTL_MS);
    await this.audit.record(tx, {
      action: DRAFT_CAPABILITY_AUDIT_ACTION,
      target_type: 'registration',
      target_id: registrationId,
      correlation_id: correlationId,
      metadata: { tokenHash: sha256(token) },
    });
    return { token, expiresAt };
  }

  /**
   * F03: verified registration recovery, step 1. The request binds a
   * REGISTRATION_RECOVERY challenge to the EXACT registration through
   * immutable audit evidence (same transaction). An unknown or mismatching
   * email gets a random decoy locator — no account/registration enumeration.
   */
  async requestRegistrationRecovery(
    registrationId: string,
    email: string,
    correlationId: string,
  ): Promise<{ challengeId: string }> {
    const normalized = normalizeEmail(email);
    let issued: string | null = null;
    const registration = await this.prisma.registrations.findUnique({
      where: { id: registrationId },
    });
    if (registration) {
      const profile = await this.prisma.candidate_profiles.findUnique({
        where: { candidate_id: registration.candidate_id },
      });
      if (profile && profile.email_normalized === normalized) {
        issued = await this.prisma.$transaction(async (tx) => {
          const { challengeId } = await this.challenges.issue(
            tx,
            'REGISTRATION_RECOVERY',
            normalized,
            null,
          );
          // The binding row is append-only evidence: this exact challenge
          // can only ever resolve to this exact registration.
          await this.audit.record(tx, {
            action: 'registration.recovery_requested',
            target_type: 'registration',
            target_id: registration.id,
            correlation_id: correlationId,
            metadata: { challengeId },
          });
          return challengeId;
        });
      }
    }
    return { challengeId: issued ?? randomUUID() };
  }

  /**
   * F03: verified registration recovery, step 2. The exact challenge + OTP
   * resolve the bound registration (never "newest with this email"); the
   * current registration email must still match the challenge identity.
   * Issues an opaque, expiring, revocable READ_EDIT_PROFILE grant whose
   * email_verified_at is the actual proof time. No User is created and no
   * exam access is granted.
   */
  async verifyRegistrationRecovery(
    challengeId: string,
    code: string,
    correlationId: string,
  ): Promise<{ registrationId: string; profileToken: string; expiresAt: string }> {
    const consumed = await this.challenges.consumeById(challengeId, 'REGISTRATION_RECOVERY', code);
    return this.prisma.$transaction(async (tx) => {
      const bindings = await tx.audit_events.findMany({
        where: {
          action: 'registration.recovery_requested',
          metadata: { path: ['challengeId'], equals: challengeId },
        },
        orderBy: { occurred_at: 'desc' },
        take: 2,
      });
      const registrationId = bindings[0]?.target_id ?? null;
      if (!registrationId) {
        throw AppException.authRequired('Invalid or expired verification code');
      }
      const registration = await tx.registrations.findUnique({
        where: { id: registrationId },
      });
      if (!registration) {
        throw AppException.authRequired('Invalid or expired verification code');
      }
      const profile = await tx.candidate_profiles.findUniqueOrThrow({
        where: { candidate_id: registration.candidate_id },
      });
      if (profile.email_normalized !== consumed.emailNormalized) {
        throw AppException.conflict(
          ErrorCodes.STATE_CONFLICT,
          'Registration email changed since the recovery request',
        );
      }
      const grant = await this.issueGrant(
        tx,
        registration.id,
        profile.email_normalized,
        'READ_EDIT_PROFILE',
        new Date(),
      );
      await this.audit.record(tx, {
        action: 'registration.recovery_granted',
        target_type: 'registration',
        target_id: registration.id,
        correlation_id: correlationId,
        metadata: { challengeId },
      });
      return {
        registrationId: registration.id,
        profileToken: grant.token,
        expiresAt: grant.expiresAt.toISOString(),
      };
    });
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
