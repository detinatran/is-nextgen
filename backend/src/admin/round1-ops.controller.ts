import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards, UseInterceptors } from "@nestjs/common";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsUUID } from "class-validator";
import { AuthGuard } from "../identity-access/guards/auth.guard";
import { AdminGuard } from "../identity-access/guards/admin.guard";
import { CsrfGuard } from "../identity-access/guards/csrf.guard";
import type { AuthenticatedRequest } from "../common/http/request-context";
import { AdminJsonInterceptor } from "./admin-json.interceptor";
import { Round1OpsService } from "./round1-ops.service";

class Round1BatchDto {
  @IsOptional()
  @IsUUID()
  competitionId?: string;

  @IsOptional()
  @IsUUID()
  scheduleId?: string;
}

/** Thao tác hàng loạt Vòng 1: xếp ca tự động, gửi email mời thi. */
@ApiTags("admin-operations")
@ApiSecurity("cookie")
@Controller("admin")
@UseGuards(AuthGuard, AdminGuard, CsrfGuard)
@UseInterceptors(AdminJsonInterceptor)
export class Round1OpsController {
  constructor(private readonly ops: Round1OpsService) {}

  @Post("assignments/auto")
  @HttpCode(HttpStatus.OK)
  autoAssign(@Body() dto: Round1BatchDto, @Req() req: AuthenticatedRequest) {
    return this.ops.autoAssign(dto.competitionId, req);
  }

  @Post("invitations")
  @HttpCode(HttpStatus.OK)
  invite(@Body() dto: Round1BatchDto, @Req() req: AuthenticatedRequest) {
    return this.ops.invite(dto.scheduleId, dto.competitionId, req);
  }
}
