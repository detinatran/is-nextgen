import { Body, Controller, HttpCode, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsString, Matches } from 'class-validator';
import type { Response } from 'express';
import type { AppConfig } from '../config/configuration';
import { CSRF_COOKIE, SESSION_COOKIE, type AuthenticatedRequest } from '../common/http/request-context';
import { ConfigService } from '@nestjs/config';
import { AppException } from '../common/errors/app-error';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { CsrfGuard, LogoutCsrfGuard } from './guards/csrf.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthContext } from '../common/http/request-context';
import {
  ActivationDto,
  EmailRequestDto,
  LoginDto,
  PasswordResetDto,
  ReauthenticationDto,
  VerificationDto,
} from './dto/auth.dto';

export class MfaVerificationDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be a 6-digit OTP' })
  code!: string;
}

export class MfaRequiredResponse {
  @ApiProperty({ example: 'MFA_REQUIRED', description: 'Machine-readable intermediate login state' })
  status!: 'MFA_REQUIRED';

  @ApiProperty({ format: 'uuid', description: 'Exact MFA challenge locator for the verification call' })
  challengeId!: string;
}

export class SessionResponse {
  user!: { id: string; email: string; roles: string[] };
  csrfToken!: string;
  mfaVerifiedAt?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<AppConfig>,
  ) {}

  private cookieOptions() {
    return {
      httpOnly: true as const,
      secure: this.config.get('cookieSecure', false),
      sameSite: 'lax' as const,
      path: '/',
    };
  }

  private setSessionCookies(res: Response, token: string, csrfToken: string): void {
    const ttlHours = this.config.get('sessionTtlHours', 24);
    res.cookie(SESSION_COOKIE, token, { ...this.cookieOptions(), maxAge: ttlHours * 3_600_000 });
    res.cookie(CSRF_COOKIE, csrfToken, {
      httpOnly: false,
      secure: this.config.get('cookieSecure', false),
      sameSite: 'lax' as const,
      path: '/',
      maxAge: ttlHours * 3_600_000,
    });
  }

  @Post('activation')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async activate(@Body() dto: ActivationDto, @Req() req: AuthenticatedRequest): Promise<{ status: string }> {
    await this.authService.activate(dto.challengeId, dto.code, dto.password, req.correlationId ?? 'unknown');
    return { status: 'activated' };
  }

  /**
   * F05: Student login opens a session directly; ADMIN login returns the
   * machine-readable MFA_REQUIRED intermediate state with the exact challenge
   * locator and issues NO session until the MFA verification succeeds.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOkResponse({ type: SessionResponse, description: 'Student session (Admins receive MFA_REQUIRED instead)' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponse | MfaRequiredResponse> {
    const result = await this.authService.login(dto.identifier, dto.password, req.correlationId ?? 'unknown');
    if (result.kind === 'mfa_required') {
      return { status: 'MFA_REQUIRED', challengeId: result.challengeId };
    }
    this.setSessionCookies(res, result.sessionToken, result.csrfToken);
    return { user: { id: result.userId, email: result.email, roles: result.roles }, csrfToken: result.csrfToken };
  }

  /**
   * F05 step 2: exact MFA challenge + OTP promote to a full Admin session.
   * Wrong/expired/replayed OTPs are rejected without creating authority.
   */
  @Post('admin/mfa-challenges/:challenge/verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOkResponse({ type: SessionResponse })
  async verifyAdminMfa(
    @Param('challenge') challenge: string,
    @Body() dto: MfaVerificationDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SessionResponse> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(challenge)) {
      // Malformed locators fail closed as auth failures, never 404/500.
      throw AppException.authRequired('Invalid or expired verification code');
    }
    const result = await this.authService.verifyAdminMfa(challenge, dto.code, req.correlationId ?? 'unknown');
    this.setSessionCookies(res, result.sessionToken, result.csrfToken);
    return { user: { id: result.userId, email: result.email, roles: result.roles }, csrfToken: result.csrfToken };
  }

  /** FR-18: logout never destroys attempt data; the active attempt survives. */
  @Post('logout')
  @UseGuards(LogoutCsrfGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response): Promise<void> {
    const token = req.cookies?.[SESSION_COOKIE] as string | undefined;
    await this.authService.logout(token, req.correlationId ?? 'unknown');
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    res.clearCookie(CSRF_COOKIE, { path: '/' });
  }

  @Post('email-verification-requests')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async requestEmailVerification(
    @Body() dto: EmailRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ status: string; challengeId: string }> {
    const { challengeId } = await this.authService.requestEmailVerification(dto.email, req.correlationId ?? 'unknown');
    // challengeId is a locator only (decoy for unknown accounts — no enumeration).
    return { status: 'accepted', challengeId };
  }

  @Post('email-verifications')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerificationDto): Promise<{ status: string }> {
    await this.authService.verifyEmail(dto.challengeId, dto.code);
    return { status: 'verified' };
  }

  @Post('password-reset-requests')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async requestPasswordReset(
    @Body() dto: EmailRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ status: string; challengeId: string }> {
    const { challengeId } = await this.authService.requestPasswordReset(dto.email, req.correlationId ?? 'unknown');
    return { status: 'accepted', challengeId };
  }

  /** F01: challengeId + code identify one challenge; token-only requests fail closed. */
  @Post('password-resets')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: PasswordResetDto, @Req() req: AuthenticatedRequest): Promise<{ status: string }> {
    await this.authService.resetPassword(
      dto.challengeId ?? null,
      dto.code ?? dto.token ?? '',
      dto.newPassword,
      req.correlationId ?? 'unknown',
    );
    return { status: 'ok' };
  }

  @Post('reauthentication')
  @HttpCode(HttpStatus.OK)
  @ApiSecurity('cookie')
  @UseGuards(AuthGuard, CsrfGuard)
  async reauthenticate(
    @Body() dto: ReauthenticationDto,
    @CurrentUser() user: AuthContext,
  ): Promise<{ reauthenticatedAt: string }> {
    const at = await this.authService.reauthenticate(user.userId, user.sessionId, dto.password);
    return { reauthenticatedAt: at.toISOString() };
  }
}
