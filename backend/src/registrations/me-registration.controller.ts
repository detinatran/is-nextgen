import { Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../common/http/request-context';
import { AuthGuard } from '../identity-access/guards/auth.guard';
import { CsrfGuard } from '../identity-access/guards/csrf.guard';
import { RegistrationsService } from './registrations.service';

/** Hồ sơ của thí sinh đã đăng nhập; nộp bổ sung video sau khi đăng ký. */
@ApiTags('registrations')
@ApiSecurity('cookie')
@UseGuards(AuthGuard)
@Controller('me/registration')
export class MeRegistrationController {
  constructor(private readonly registrations: RegistrationsService) {}

  @Get()
  async mine(@Req() req: AuthenticatedRequest) {
    return this.registrations.myRegistration(req.auth!.userId);
  }

  /**
   * Quyền tải video tạm thời (x-registration-token) cho hồ sơ của chính thí sinh; dùng với
   * POST registrations/:id/uploads → uploads/:id/finalization → PUT registrations/:id/video-binding.
   */
  @Post('video-capability')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(CsrfGuard)
  async videoCapability(@Req() req: AuthenticatedRequest) {
    return this.registrations.issueLateVideoCapability(req.auth!.userId, req.correlationId ?? 'unknown');
  }
}
