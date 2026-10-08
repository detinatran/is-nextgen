import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AppException } from '../common/errors/app-error';
import type { AuthenticatedRequest } from '../common/http/request-context';
import {
  CreateRegistrationDraftDto,
  RegistrationRecoveryGrantResponse,
  RegistrationRecoveryRequestDto,
  RegistrationRecoveryRequestResponse,
  RegistrationRecoveryVerificationDto,
  SubmissionResponse,
  UpdateRegistrationDto,
  type RegistrationResponse,
} from './dto/registration.dto';
import { RegistrationsService } from './registrations.service';
import { RegistrationFormService } from './registration-form.service';
import {
  RegistrationCapabilityGuard,
  RequireRegistrationScope,
} from './registration-capability.guard';

@ApiTags('registrations')
@Controller()
export class RegistrationsController {
  constructor(
    private readonly registrations: RegistrationsService,
    private readonly registrationForm: RegistrationFormService,
  ) {}

  /** Public form copy: consent statements, withdrawal notice, media limits. */
  @Get('registration-form-config')
  async formConfig(): Promise<Record<string, unknown>> {
    return this.registrationForm.getFormConfig();
  }

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

  /**
   * F03: private profile read. The DRAFT_UPLOAD initial capability may read
   * the registration only while it is a draft; reading the submitted (and
   * possibly verified-recovery-edited) profile requires the verified
   * READ_EDIT_PROFILE grant — enforced in the service on current state.
   */
  @Get('registrations/:registrationId')
  @ApiSecurity('registrationToken')
  @UseGuards(RegistrationCapabilityGuard)
  async getRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<RegistrationResponse> {
    return this.registrations.getRegistration(registrationId, req.registrationAuth);
  }

  /** F03/F04: private edit authority — verified recovery grant + CAS + deadline. */
  @Patch('registrations/:registrationId')
  @ApiSecurity('registrationToken')
  @UseGuards(RegistrationCapabilityGuard)
  @RequireRegistrationScope('READ_EDIT_PROFILE')
  async updateRegistration(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() dto: UpdateRegistrationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<RegistrationResponse> {
    return this.registrations.updateRegistration(
      registrationId,
      dto,
      req.registrationAuth!.grantId,
      req.correlationId ?? 'unknown',
    );
  }

  /** F03: the initial submission belongs to the initial DRAFT_UPLOAD flow. */
  @Post('registrations/:registrationId/submission')
  @HttpCode(HttpStatus.CREATED)
  @ApiSecurity('registrationToken')
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @UseGuards(RegistrationCapabilityGuard)
  @RequireRegistrationScope('DRAFT_UPLOAD')
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

  /**
   * F03 step 1: request a verified recovery challenge bound to this exact
   * registration. Unknown or mismatching emails receive a decoy locator.
   */
  @Post('registrations/:registrationId/recovery-requests')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: RegistrationRecoveryRequestResponse })
  async requestRecovery(
    @Param('registrationId', ParseUUIDPipe) registrationId: string,
    @Body() dto: RegistrationRecoveryRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<RegistrationRecoveryRequestResponse> {
    const { challengeId } = await this.registrations.requestRegistrationRecovery(
      registrationId,
      dto.email,
      req.correlationId ?? 'unknown',
    );
    return { status: 'accepted', challengeId };
  }

  /**
   * F03 step 2: exact challenge + OTP grant a scoped READ_EDIT_PROFILE
   * capability for the bound registration only.
   */
  @Post('registrations/recovery/verifications')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOkResponse({ type: RegistrationRecoveryGrantResponse })
  async verifyRecovery(
    @Body() dto: RegistrationRecoveryVerificationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<RegistrationRecoveryGrantResponse> {
    return this.registrations.verifyRegistrationRecovery(
      dto.challengeId,
      dto.code,
      req.correlationId ?? 'unknown',
    );
  }
}
