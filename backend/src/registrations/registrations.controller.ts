import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AppException } from '../common/errors/app-error';
import type { AuthenticatedRequest } from '../common/http/request-context';
import {
  CreateRegistrationDraftDto,
  SubmissionResponse,
  UpdateRegistrationDto,
  type RegistrationResponse,
} from './dto/registration.dto';
import { RegistrationsService } from './registrations.service';
import {
  RegistrationCapabilityGuard,
  RequireRegistrationScope,
} from './registration-capability.guard';

@ApiTags('registrations')
@Controller()
export class RegistrationsController {
  constructor(private readonly registrations: RegistrationsService) {}

  /** FR-13: anonymous draft registration; capability tokens authorize later access. */
  @Post('registration-drafts')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async createDraft(
    @Body() dto: CreateRegistrationDraftDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ registrationId: string; status: string; capability: Record<string, string> }> {
    return this.registrations.createDraft(dto, req.correlationId ?? 'unknown');
  }

  @Get('registrations/:registrationId')
  @ApiSecurity('registrationToken')
  @UseGuards(RegistrationCapabilityGuard)
  @RequireRegistrationScope('READ_EDIT_PROFILE')
  async getRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
  ): Promise<RegistrationResponse> {
    return this.registrations.getRegistration(registrationId);
  }

  @Patch('registrations/:registrationId')
  @ApiSecurity('registrationToken')
  @UseGuards(RegistrationCapabilityGuard)
  @RequireRegistrationScope('READ_EDIT_PROFILE')
  async updateRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() dto: UpdateRegistrationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<RegistrationResponse> {
    return this.registrations.updateRegistration(registrationId, dto, req.correlationId ?? 'unknown');
  }

  /** FR-16: authoritative submission; Idempotency-Key makes it replay-safe. */
  @Post('registrations/:registrationId/submission')
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('registrationToken')
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @UseGuards(RegistrationCapabilityGuard)
  @RequireRegistrationScope('READ_EDIT_PROFILE')
  @SkipThrottle()
  async submit(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SubmissionResponse> {
    const idempotencyKey = req.header('idempotency-key');
    if (!idempotencyKey || idempotencyKey.length < 16 || idempotencyKey.length > 128 || !/^[\w.-]+$/.test(idempotencyKey)) {
      throw AppException.validation('Idempotency-Key header must be 16-128 word characters');
    }
    return this.registrations.submitRegistration(
      registrationId,
      idempotencyKey,
      { registrationId },
      req.correlationId ?? 'unknown',
    );
  }
}
