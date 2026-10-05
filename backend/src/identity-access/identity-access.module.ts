import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ChallengeService } from './challenge.service';
import { SessionService } from './session.service';
import { AuthGuard } from './guards/auth.guard';
import { CsrfGuard } from './guards/csrf.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AuthController],
  providers: [AuthService, ChallengeService, SessionService, AuthGuard, CsrfGuard],
  exports: [AuthService, ChallengeService, SessionService, AuthGuard, CsrfGuard],
})
export class IdentityAccessModule {}
