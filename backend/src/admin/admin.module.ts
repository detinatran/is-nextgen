import { Module } from "@nestjs/common";
import { IdentityAccessModule } from "../identity-access/identity-access.module";
import { AdminOperationsController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { SpreadsheetsService } from "./spreadsheets.service";

@Module({
  imports: [IdentityAccessModule],
  controllers: [AdminOperationsController],
  providers: [AdminService, SpreadsheetsService],
})
export class AdminModule {}
