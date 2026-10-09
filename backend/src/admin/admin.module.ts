import { Module } from "@nestjs/common";
import { IdentityAccessModule } from "../identity-access/identity-access.module";
import { AdminOperationsController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { SpreadsheetsService } from "./spreadsheets.service";
import { DriveReadService } from "../media/drive/drive-read.service";
import { Round1OpsController } from "./round1-ops.controller";
import { Round1OpsService } from "./round1-ops.service";

@Module({
  imports: [IdentityAccessModule],
  controllers: [AdminOperationsController, Round1OpsController],
  providers: [AdminService, SpreadsheetsService, DriveReadService, Round1OpsService],
})
export class AdminModule {}
