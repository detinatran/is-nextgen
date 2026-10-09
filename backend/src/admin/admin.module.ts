import { Module } from "@nestjs/common";
import { IdentityAccessModule } from "../identity-access/identity-access.module";
import { DriveModule } from "../media/drive/drive.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AdminOperationsController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { SpreadsheetsService } from "./spreadsheets.service";
import { DriveReadService } from "../media/drive/drive-read.service";
import { Round1OpsController } from "./round1-ops.controller";
import { Round1OpsService } from "./round1-ops.service";
// Trang quản trị cũ (/quan-tri-cu/): API riêng dưới /admin-legacy để không trùng route với admin mới
import { AdminExamsController } from "./admin-exams.controller";
import { AdminExamsService } from "./admin-exams.service";
import { AdminQuestionsService } from "./admin-questions.service";
import { AdminRegistrationsController } from "./admin-registrations.controller";
import { AdminRegistrationsService } from "./admin-registrations.service";

@Module({
  imports: [IdentityAccessModule, NotificationsModule, DriveModule],
  controllers: [AdminOperationsController, Round1OpsController, AdminRegistrationsController, AdminExamsController],
  providers: [
    AdminService,
    SpreadsheetsService,
    DriveReadService,
    Round1OpsService,
    AdminRegistrationsService,
    AdminQuestionsService,
    AdminExamsService,
  ],
})
export class AdminModule {}
