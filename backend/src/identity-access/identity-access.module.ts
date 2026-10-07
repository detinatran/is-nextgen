import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ChallengeService } from './challenge.service';
import { SessionService } from './session.service';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { AdminController } from './admin.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AuthController, AdminController],
  providers: [AuthService, ChallengeService, SessionService, AuthGuard, CsrfGuard, AdminGuard],
  exports: [AuthService, ChallengeService, SessionService, AuthGuard, CsrfGuard, AdminGuard],
})
export class IdentityAccessModule {}
