import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedRequest } from '../common/http/request-context';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('admin')
@ApiSecurity('cookie')
@Controller('admin')
export class AdminController {
  /**
   * Authorization probe for the Admin domain (F05): reachable only with a
   * full session that carries current-session MFA proof and the ADMIN role.
   * The frontend uses it to distinguish MFA_REQUIRED from an Admin session.
   */
  @Get('session')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOkResponse({ type: Object, description: 'Current Admin session is fully authorized' })
  session(@Req() req: AuthenticatedRequest): { admin: true; userId: string; mfaVerifiedAt: string } {
    return {
      admin: true,
      userId: req.auth!.userId,
      mfaVerifiedAt: req.auth!.mfaVerifiedAt!.toISOString(),
    };
  }
}
