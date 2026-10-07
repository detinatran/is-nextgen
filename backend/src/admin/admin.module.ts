import { Module } from '@nestjs/common';
import { IdentityAccessModule } from '../identity-access/identity-access.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminExamsController } from './admin-exams.controller';
import { AdminExamsService } from './admin-exams.service';
import { AdminQuestionsService } from './admin-questions.service';
import { AdminRegistrationsController } from './admin-registrations.controller';
import { AdminRegistrationsService } from './admin-registrations.service';

@Module({
  imports: [IdentityAccessModule, NotificationsModule],
  controllers: [AdminRegistrationsController, AdminExamsController],
  providers: [AdminRegistrationsService, AdminQuestionsService, AdminExamsService],
})
export class AdminModule {}
