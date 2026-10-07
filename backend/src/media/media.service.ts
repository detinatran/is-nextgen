import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { AppConfig } from '../config/configuration';
import { AppException } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import { AuditService } from '../common/audit/audit.service';
import { PrismaService } from '../database/prisma.service';
import { MediaValidationService } from './media-validation.service';
import { LocalStorageService } from './storage/local-storage.service';
import type { RegistrationAuthContext } from '../common/http/request-context';
import type { Tx } from '../common/idempotency/idempotency.service';

const UPLOAD_TTL_MS = 48 * 3_600_000;

export interface UploadStatus {
  uploadId: string;
  kind: 'VIDEO' | 'PHOTO';
  state: 'INITIATED' | 'UPLOADING' | 'VALIDATING' | 'READY' | 'REJECTED' | 'EXPIRED';
  rejectionReason?: string;
  mediaObjectId?: string;
  sizeBytes?: number;
  durationSeconds?: number;
}

/**
 * FR-14/15 private video submission. Bytes flow browser → scoped upload →
 * private storage adapter → server-side validation → READY/REJECTED.
 * Video binaries never enter PostgreSQL.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly storage: LocalStorageService;
  private readonly uploadTmpDir = join(tmpdir(), 'isng-uploads');

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: MediaValidationService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<AppConfig>,
  ) {
    this.storage = new LocalStorageService(config.getOrThrow('mediaStorageDir'));
    void mkdir(this.uploadTmpDir, { recursive: true }).catch(() => undefined);
  }

  uploadLimits() {
    return {
      maxBytes: this.config.getOrThrow('uploadMaxBytes'),
      maxDurationSeconds: this.config.getOrThrow('videoMaxDurationSeconds'),
    };
  }

  async createUpload(
    registrationId: string,
    tmpFilePath: string,
    grant: RegistrationAuthContext,
    correlationId: string,
  ): Promise<{ uploadId: string; state: 'VALIDATING' }> {
    this.assertGrant(grant, registrationId, 'DRAFT_UPLOAD');
    if ((await stat(tmpFilePath)).size > this.config.getOrThrow<number>('uploadMaxBytes')) {
      throw new AppException(413, ErrorCodes.VIDEO_TOO_LARGE, 'Video exceeds the size limit');
    }
    const registration = await this.prisma.registrations.findUnique({ where: { id: registrationId } });
    if (!registration) throw AppException.notFound('Registration not found');
    if (registration.state !== 'DRAFT') {
      throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Submitted registration video is sealed');
    }

    const objectKey = `v/${randomUUID()}`;
    const upload = await this.prisma.media_uploads.create({
      data: {
        registration_id: registrationId,
        object_key: objectKey,
        state: 'INITIATED',
        expires_at: new Date(Date.now() + UPLOAD_TTL_MS),
      },
    });

    try {
      await this.storage.store(tmpFilePath, objectKey);
      await this.prisma.media_uploads.update({
        where: { id: upload.id },
        data: { state: 'VALIDATING' },
      });
    } catch (e) {
      await this.prisma.media_uploads.update({
        where: { id: upload.id },
        data: { state: 'REJECTED', rejection_reason: 'STORAGE_FAILURE' },
      }).catch(() => undefined);
      this.logger.warn(`media storage failure correlationId=${correlationId}`);
      throw e;
    }
    this.logger.log(`media upload stored correlationId=${correlationId}`);
    return { uploadId: upload.id, state: 'VALIDATING' };
  }

  /**
   * One-shot personal photo upload (PR usage, max 1 READY per registration).
   * Validated server-side by magic bytes; the new READY photo supersedes the
   * previous one (old row → EXPIRED) so exactly-one always holds. Bytes are
   * sealed against overwrite exactly like video evidence.
   */
  async createPhotoUpload(
    registrationId: string,
    tmpFilePath: string,
    grant: RegistrationAuthContext,
    correlationId: string,
  ): Promise<UploadStatus> {
    this.assertGrant(grant, registrationId, 'DRAFT_UPLOAD');
    const registration = await this.prisma.registrations.findUnique({ where: { id: registrationId } });
    if (!registration) throw AppException.notFound('Registration not found');
    if (registration.state !== 'DRAFT') {
      throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Submitted registration is sealed');
    }

    const outcome = await this.validator.validatePhoto(tmpFilePath, {
      maxBytes: this.config.getOrThrow('photoMaxBytes'),
    });
    if (outcome.status === 'REJECTED') {
      // No evidence row for garbage bytes; the frontend gets a machine code to fix.
      this.logger.log(`photo rejected reason=${outcome.reason} correlationId=${correlationId}`);
      if (outcome.reason === 'PHOTO_TOO_LARGE') {
        throw new AppException(413, ErrorCodes.PHOTO_TOO_LARGE, 'Photo exceeds the size limit');
      }
      throw new AppException(400, ErrorCodes.PHOTO_INVALID_FORMAT, 'Photo must be JPEG or PNG');
    }

    const objectKey = `p/${randomUUID()}`;
    return this.prisma.$transaction(async (tx) => {
      // Serialize replacement and submission on the registration boundary.
      const [locked] = await tx.$queryRaw<{ state: string }[]>`
        SELECT state FROM registrations WHERE id=${registrationId}::uuid FOR UPDATE`;
      if (!locked || locked.state !== 'DRAFT') {
        throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Submitted registration is sealed');
      }
      const upload = await tx.media_uploads.create({
        data: {
          registration_id: registrationId,
          object_key: objectKey,
          state: 'READY',
          expires_at: new Date(Date.now() + UPLOAD_TTL_MS),
        },
      });
      // Exactly-one READY photo: supersede any previous one.
      await tx.media_uploads.updateMany({
        where: {
          registration_id: registrationId,
          state: 'READY',
          object_key: { startsWith: 'p/' },
          id: { not: upload.id },
        },
        data: { state: 'EXPIRED' },
      });
      await this.audit.record(tx, {
        action: 'media.photo_ready',
        target_type: 'media_upload',
        target_id: upload.id,
        correlation_id: correlationId,
        metadata: { sizeBytes: outcome.sizeBytes, mimeType: outcome.mimeType },
      });
      await this.storage.store(tmpFilePath, objectKey);
      return this.statusFor(upload.id, tx);
    });
  }

  async finalizeUpload(
    uploadId: string,
    grant: RegistrationAuthContext,
    correlationId: string,
  ): Promise<UploadStatus> {
    const upload = await this.prisma.media_uploads.findUnique({ where: { id: uploadId } });
    if (!upload) throw AppException.notFound('Upload not found');
    this.assertGrant(grant, upload.registration_id, 'DRAFT_UPLOAD');

    const now = new Date();
    if (
      upload.expires_at <= now &&
      ['INITIATED', 'UPLOADING', 'VALIDATING'].includes(upload.state)
    ) {
      await this.prisma.media_uploads.update({
        where: { id: upload.id },
        data: { state: 'EXPIRED' },
      });
      throw AppException.conflict(ErrorCodes.UPLOAD_INCOMPLETE, 'Upload expired before finalization');
    }

    if (upload.state === 'READY' || upload.state === 'REJECTED') {
      return this.statusFor(upload.id);
    }
    if (upload.state === 'INITIATED') {
      throw AppException.conflict(ErrorCodes.UPLOAD_INCOMPLETE, 'Upload has no stored bytes yet');
    }

    const outcome = await this.validator.validate(this.storage.pathFor(upload.object_key), this.uploadLimits());

    if (outcome.status === 'REJECTED') {
      await this.storage.delete(upload.object_key);
      await this.prisma.media_uploads.update({
        where: { id: upload.id },
        data: { state: 'REJECTED', rejection_reason: outcome.reason },
      });
      this.logger.log(`media rejected reason=${outcome.reason} correlationId=${correlationId}`);
      return this.statusFor(upload.id);
    }

    const sealedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.media_objects.create({
        data: {
          upload_id: upload.id,
          registration_id: upload.registration_id,
          object_key: upload.object_key,
          checksum_sha256: outcome.checksumSha256,
          mime_type: 'video/mp4',
          size_bytes: outcome.sizeBytes,
          duration_seconds: outcome.durationSeconds.toFixed(3),
          is_private: true,
          validated_at: sealedAt,
          sealed_at: sealedAt,
        },
      });
      await tx.media_uploads.update({
        where: { id: upload.id },
        data: { state: 'READY' },
      });
      await this.audit.record(tx, {
        action: 'media.validated',
        target_type: 'media_upload',
        target_id: upload.id,
        correlation_id: correlationId,
        metadata: { sizeBytes: outcome.sizeBytes, durationSeconds: outcome.durationSeconds },
      });
    });
    this.logger.log(`media ready correlationId=${correlationId}`);
    return this.statusFor(upload.id);
  }

  async getUploadStatus(uploadId: string, grant: RegistrationAuthContext): Promise<UploadStatus> {
    const upload = await this.prisma.media_uploads.findUnique({ where: { id: uploadId } });
    if (!upload) throw AppException.notFound('Upload not found');
    // Either capability scope may read status.
    if (grant.registrationId !== upload.registration_id) {
      throw AppException.forbidden('Upload belongs to a different registration');
    }
    return this.statusFor(upload.id);
  }

  async bindVideo(
    registrationId: string,
    mediaObjectId: string,
    grant: RegistrationAuthContext,
    correlationId: string,
  ): Promise<{ videoBound: boolean; mediaObjectId: string }> {
    // FR-14: binding belongs to the initial upload flow — the same DRAFT_UPLOAD
    // capability that uploads and finalizes the video. Private profile edit
    // authority (READ_EDIT_PROFILE) is a separate, verified-recovery scope.
    this.assertGrant(grant, registrationId, 'DRAFT_UPLOAD');
    const registration = await this.prisma.registrations.findUnique({ where: { id: registrationId } });
    if (!registration) throw AppException.notFound('Registration not found');
    if (registration.state !== 'DRAFT') {
      throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Submitted registration video is sealed');
    }
    const mediaObject = await this.prisma.media_objects.findUnique({
      where: { id: mediaObjectId },
    });
    if (!mediaObject || mediaObject.registration_id !== registrationId) {
      throw AppException.notFound('Media object not found for this registration');
    }
    const ownerUpload = await this.prisma.media_uploads.findUniqueOrThrow({
      where: { id: mediaObject.upload_id },
    });
    if (ownerUpload.state !== 'READY') {
      throw AppException.conflict(ErrorCodes.STATE_CONFLICT, 'Media object is not READY');
    }

    await this.prisma.registration_videos.upsert({
      where: { registration_id: registrationId },
      create: { registration_id: registrationId, media_object_id: mediaObjectId },
      update: { media_object_id: mediaObjectId, bound_at: new Date() },
    });
    await this.audit.record(this.prisma, {
      action: 'media.video_bound',
      target_type: 'registration',
      target_id: registrationId,
      correlation_id: correlationId,
      metadata: { mediaObjectId },
    });
    return { videoBound: true, mediaObjectId };
  }

  private async statusFor(uploadId: string, client: Tx | PrismaService = this.prisma): Promise<UploadStatus> {
    const upload = await client.media_uploads.findUniqueOrThrow({
      where: { id: uploadId },
    });
    const mediaObject = await client.media_objects.findUnique({
      where: { upload_id: uploadId },
    });
    return {
      uploadId: upload.id,
      kind: upload.object_key.startsWith('p/') ? 'PHOTO' : 'VIDEO',
      state: upload.state as UploadStatus['state'],
      rejectionReason: upload.rejection_reason ?? undefined,
      mediaObjectId: mediaObject?.id,
      sizeBytes: mediaObject ? Number(mediaObject.size_bytes) : undefined,
      durationSeconds: mediaObject ? Number(mediaObject.duration_seconds) : undefined,
    };
  }

  private assertGrant(
    grant: RegistrationAuthContext,
    registrationId: string,
    requiredScope: 'READ_EDIT_PROFILE' | 'DRAFT_UPLOAD',
  ): void {
    if (grant.registrationId !== registrationId) {
      throw AppException.forbidden('Capability token does not cover this registration');
    }
    if (!grant.scopes.includes(requiredScope)) {
      throw AppException.forbidden('Capability token lacks the required scope', { requiredScope });
    }
  }
}
