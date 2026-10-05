import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import type { AppConfig } from '../config/configuration';
import { CSRF_COOKIE, SESSION_COOKIE, type AuthenticatedRequest } from '../common/http/request-context';
import { ConfigService } from '@nestjs/config';
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
  TokenDto,
} from './dto/auth.dto';

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

  @Post('activation')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async activate(@Body() dto: ActivationDto, @Req() req: AuthenticatedRequest): Promise<{ status: string }> {
    await this.authService.activate(dto.token, dto.password, req.correlationId ?? 'unknown');
    return { status: 'activated' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: { id: string; email: string; roles: string[] }; csrfToken: string }> {
    const result = await this.authService.login(dto.identifier, dto.password, req.correlationId ?? 'unknown');
    const ttlHours = this.config.get('sessionTtlHours', 24);
    res.cookie(SESSION_COOKIE, result.sessionToken, {
      ...this.cookieOptions(),
      maxAge: ttlHours * 3_600_000,
    });
    res.cookie(CSRF_COOKIE, result.csrfToken, {
      httpOnly: false,
      secure: this.config.get('cookieSecure', false),
      sameSite: 'lax' as const,
      path: '/',
      maxAge: ttlHours * 3_600_000,
    });
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
  ): Promise<{ status: string }> {
    await this.authService.requestEmailVerification(dto.email, req.correlationId ?? 'unknown');
    return { status: 'accepted' };
  }

  @Post('email-verifications')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: TokenDto): Promise<{ status: string }> {
    await this.authService.verifyEmail(dto.token);
    return { status: 'verified' };
  }

  @Post('password-reset-requests')
  @HttpCode(HttpStatus.ACCEPTED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async requestPasswordReset(
    @Body() dto: EmailRequestDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ status: string }> {
    await this.authService.requestPasswordReset(dto.email, req.correlationId ?? 'unknown');
    return { status: 'accepted' };
  }

  @Post('password-resets')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: PasswordResetDto, @Req() req: AuthenticatedRequest): Promise<{ status: string }> {
    await this.authService.resetPassword(dto.token, dto.newPassword, req.correlationId ?? 'unknown');
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
