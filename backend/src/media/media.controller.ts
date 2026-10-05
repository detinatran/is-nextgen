import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { ParseUUIDPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../common/errors/app-error';
import { ErrorCodes } from '../common/errors/error-codes';
import type { AuthenticatedRequest } from '../common/http/request-context';
import { MediaService, type UploadStatus } from './media.service';
import { MediaValidationService } from './media-validation.service';
import { RegistrationCapabilityGuard, RequireRegistrationScope } from '../registrations/registration-capability.guard';

// Multer hard cap; the configured limit is enforced precisely after receipt.
const MULTER_HARD_CAP_BYTES = 600_000_000;

@ApiTags('media')
@Controller()
export class MediaController {
  constructor(
    private readonly media: MediaService,
    private readonly validator: MediaValidationService,
    private readonly config: ConfigService,
  ) {}

  /** FR-14: direct private upload (multipart). MP4, <=120 s, <=500,000,000 bytes. */
  @Post('registrations/:registrationId/uploads')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiSecurity('registrationToken')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseGuards(RegistrationCapabilityGuard)
  @RequireRegistrationScope('DRAFT_UPLOAD')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, join(tmpdir(), 'isng-uploads')),
        filename: (_req, _file, cb) => cb(null, `${randomUUID()}.upload`),
      }),
      limits: { files: 1, fileSize: MULTER_HARD_CAP_BYTES },
    }),
  )
  @SkipThrottle()
  async createUpload(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ uploadId: string; state: string }> {
    if (!file) throw AppException.validation('Multipart field "file" is required');
    const maxBytes = this.config.getOrThrow<number>('uploadMaxBytes');
    if (file.size > maxBytes) {
      throw new AppException(413, ErrorCodes.VIDEO_TOO_LARGE, 'Video exceeds the size limit');
    }
    try {
      return await this.media.createUpload(
        registrationId,
        file.path,
        req.registrationAuth!,
        req.correlationId ?? 'unknown',
      );
    } finally {
      await this.validator.cleanupTemp(file.path);
    }
  }

  /** Personal photo for PR usage (multipart). JPEG/PNG/WebP, one READY photo per registration. */
  @Post('registrations/:registrationId/photos')
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('registrationToken')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseGuards(RegistrationCapabilityGuard)
  @RequireRegistrationScope('DRAFT_UPLOAD')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, join(tmpdir(), 'isng-uploads')),
        filename: (_req, _file, cb) => cb(null, `${randomUUID()}.upload`),
      }),
      limits: { files: 1, fileSize: MULTER_HARD_CAP_BYTES },
    }),
  )
  @SkipThrottle()
  async createPhotoUpload(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadStatus> {
    if (!file) throw AppException.validation('Multipart field "file" is required');
    const maxBytes = this.config.getOrThrow<number>('photoMaxBytes');
    if (file.size > maxBytes) {
      throw new AppException(413, ErrorCodes.PHOTO_TOO_LARGE, 'Photo exceeds the size limit');
    }
    try {
      return await this.media.createPhotoUpload(
        registrationId,
        file.path,
        req.registrationAuth!,
        req.correlationId ?? 'unknown',
      );
    } finally {
      await this.validator.cleanupTemp(file.path);
    }
  }

  @Post('uploads/:uploadId/finalization')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('registrationToken')
  @UseGuards(RegistrationCapabilityGuard)
  async finalizeUpload(
    @Param('uploadId', ParseUUIDPipe) uploadId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<UploadStatus> {
    return this.media.finalizeUpload(uploadId, req.registrationAuth!, req.correlationId ?? 'unknown');
  }

  @Get('uploads/:uploadId')
  @ApiSecurity('registrationToken')
  @UseGuards(RegistrationCapabilityGuard)
  async getUpload(@Param('uploadId', ParseUUIDPipe) uploadId: string, @Req() req: AuthenticatedRequest): Promise<UploadStatus> {
    return this.media.getUploadStatus(uploadId, req.registrationAuth!);
  }

  /** Bind/replace the READY video on the (still draft) registration. */
  @Put('registrations/:registrationId/video-binding')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('registrationToken')
  @UseGuards(RegistrationCapabilityGuard)
  @RequireRegistrationScope('READ_EDIT_PROFILE')
  async bindVideo(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() body: { mediaObjectId?: string },
    @Req() req: AuthenticatedRequest,
  ): Promise<{ videoBound: boolean; mediaObjectId: string }> {
    if (!body?.mediaObjectId || typeof body.mediaObjectId !== 'string') {
      throw AppException.validation('mediaObjectId is required');
    }
    return this.media.bindVideo(registrationId, body.mediaObjectId, req.registrationAuth!, req.correlationId ?? 'unknown');
  }
}
