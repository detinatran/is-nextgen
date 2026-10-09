import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req, Res,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { AppException } from '../common/errors/app-error';
import type { AuthenticatedRequest } from '../common/http/request-context';
import { AdminGuard } from '../identity-access/guards/admin.guard';
import { AuthGuard } from '../identity-access/guards/auth.guard';
import { CsrfGuard } from '../identity-access/guards/csrf.guard';
import { PermissionGuard, RequirePermission } from '../identity-access/guards/permission.guard';
import { AdminExamsService } from './admin-exams.service';
import { AdminQuestionsService } from './admin-questions.service';
import {
  BlueprintDto, CreateExamDto, CreatePoolDto, InviteDto, MoveAssignmentDto, QuestionDto, ScheduleDto, ScheduleUpdateDto,
} from './dto/admin-exams.dto';

const xlsxUpload = FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const cid = (req: AuthenticatedRequest) => req.correlationId ?? 'unknown';

function sendXlsx(res: Response, buffer: Buffer, name: string) {
  res
    .status(200)
    .setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .setHeader('Content-Disposition', `attachment; filename="${name}"`)
    .setHeader('Cache-Control', 'no-store')
    .send(buffer);
}

/** FR-4.3 question bank + FR-3.1/4.3/4.4 Round 1 exam administration. */
@ApiTags('admin')
@ApiSecurity('cookie')
@Controller('admin-legacy')
@UseGuards(AuthGuard, AdminGuard, PermissionGuard)
export class AdminExamsController {
  constructor(
    private readonly questions: AdminQuestionsService,
    private readonly exams: AdminExamsService,
  ) {}

  // ---- Ngân hàng câu hỏi ----
  @Get('question-pools')
  @RequirePermission('question.read')
  pools() {
    return this.questions.pools();
  }

  @Post('question-pools')
  @UseGuards(CsrfGuard)
  @RequirePermission('question.manage')
  createPool(@Body() dto: CreatePoolDto, @Req() req: AuthenticatedRequest) {
    return this.questions.createPool(dto.code, dto.name, req.auth!.userId, cid(req));
  }

  @Get('questions')
  @RequirePermission('question.read')
  list(@Query('poolId') poolId?: string) {
    if (poolId && !/^[0-9a-f-]{36}$/i.test(poolId)) throw AppException.validation('poolId must be a UUID');
    return this.questions.list(poolId);
  }

  @Get('questions/template')
  @RequirePermission('question.read')
  async template(@Res() res: Response) {
    sendXlsx(res, await this.questions.template(), 'mau-cau-hoi-vong-1.xlsx');
  }

  @Post('questions/import')
  @UseGuards(CsrfGuard)
  @RequirePermission('question.manage')
  @UseInterceptors(xlsxUpload)
  importQuestions(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: AuthenticatedRequest) {
    if (!file) throw AppException.validation('Attach an .xlsx file in field "file"');
    return this.questions.importXlsx(file.buffer, req.auth!.userId, cid(req));
  }

  @Post('questions')
  @UseGuards(CsrfGuard)
  @RequirePermission('question.manage')
  createQuestion(@Body() dto: QuestionDto, @Req() req: AuthenticatedRequest) {
    return this.questions.create(dto, req.auth!.userId, cid(req));
  }

  @Put('questions/:questionId')
  @UseGuards(CsrfGuard)
  @RequirePermission('question.manage')
  updateQuestion(@Param('questionId', ParseUUIDPipe) id: string, @Body() dto: QuestionDto, @Req() req: AuthenticatedRequest) {
    return this.questions.update(id, dto, req.auth!.userId, cid(req));
  }

  @Delete('questions/:questionId')
  @UseGuards(CsrfGuard)
  @RequirePermission('question.manage')
  archiveQuestion(@Param('questionId', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.questions.archive(id, req.auth!.userId, cid(req));
  }

  // ---- Vòng 1: đề thi, ca thi, phân ca, mời thi, điểm ----
  @Get('exams/round1')
  @RequirePermission('exam.monitor')
  overview(@Query('competition') competition?: string) {
    return this.exams.overview(competition?.trim() || 'ISNG-2026');
  }

  @Post('exams/round1')
  @UseGuards(CsrfGuard)
  @RequirePermission('exam.manage')
  createExam(@Body() dto: CreateExamDto, @Req() req: AuthenticatedRequest) {
    return this.exams.createExam(dto.competition?.trim() || 'ISNG-2026', dto.name ?? '', req.auth!.userId, cid(req));
  }

  @Put('exams/:examId/blueprint')
  @UseGuards(CsrfGuard)
  @RequirePermission('exam.manage')
  blueprint(@Param('examId', ParseUUIDPipe) examId: string, @Body() dto: BlueprintDto, @Req() req: AuthenticatedRequest) {
    return this.exams.setBlueprint(examId, dto.items, req.auth!.userId, cid(req));
  }

  @Post('exams/:examId/schedules')
  @UseGuards(CsrfGuard)
  @RequirePermission('exam.manage')
  createSchedule(@Param('examId', ParseUUIDPipe) examId: string, @Body() dto: ScheduleDto, @Req() req: AuthenticatedRequest) {
    return this.exams.createSchedule(examId, new Date(dto.opensAt), new Date(dto.closesAt), dto.capacity, req.auth!.userId, cid(req));
  }

  @Patch('exam-schedules/:scheduleId')
  @UseGuards(CsrfGuard)
  @RequirePermission('exam.manage')
  updateSchedule(@Param('scheduleId', ParseUUIDPipe) id: string, @Body() dto: ScheduleUpdateDto, @Req() req: AuthenticatedRequest) {
    return this.exams.updateSchedule(
      id,
      { opensAt: dto.opensAt ? new Date(dto.opensAt) : undefined, closesAt: dto.closesAt ? new Date(dto.closesAt) : undefined, capacity: dto.capacity },
      req.auth!.userId,
      cid(req),
    );
  }

  @Delete('exam-schedules/:scheduleId')
  @UseGuards(CsrfGuard)
  @RequirePermission('exam.manage')
  deleteSchedule(@Param('scheduleId', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.exams.deleteSchedule(id, req.auth!.userId, cid(req));
  }

  @Post('exams/:examId/assignments/auto')
  @UseGuards(CsrfGuard)
  @RequirePermission('assignment.manage')
  @HttpCode(HttpStatus.OK)
  autoAssign(@Param('examId', ParseUUIDPipe) examId: string, @Req() req: AuthenticatedRequest) {
    return this.exams.autoAssign(examId, req.auth!.userId, cid(req));
  }

  @Get('exams/:examId/assignments')
  @RequirePermission('exam.monitor')
  roster(@Param('examId', ParseUUIDPipe) examId: string, @Query('scheduleId') scheduleId?: string) {
    if (scheduleId && !/^[0-9a-f-]{36}$/i.test(scheduleId)) throw AppException.validation('scheduleId must be a UUID');
    return this.exams.roster(examId, scheduleId);
  }

  @Get('exams/:examId/assignments/export')
  @RequirePermission('export.execute')
  async rosterXlsx(@Param('examId', ParseUUIDPipe) examId: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    sendXlsx(res, await this.exams.rosterXlsx(examId, req.auth!.userId, cid(req)), 'phan-ca-vong-1.xlsx');
  }

  @Post('exams/:examId/assignments/import')
  @UseGuards(CsrfGuard)
  @RequirePermission('assignment.manage')
  @UseInterceptors(xlsxUpload)
  importRoster(@Param('examId', ParseUUIDPipe) examId: string, @UploadedFile() file: Express.Multer.File | undefined, @Req() req: AuthenticatedRequest) {
    if (!file) throw AppException.validation('Attach an .xlsx file in field "file"');
    return this.exams.importRoster(examId, file.buffer, req.auth!.userId, cid(req));
  }

  @Patch('assignments/:assignmentId')
  @UseGuards(CsrfGuard)
  @RequirePermission('assignment.manage')
  move(@Param('assignmentId', ParseUUIDPipe) id: string, @Body() dto: MoveAssignmentDto, @Req() req: AuthenticatedRequest) {
    return this.exams.moveAssignment(id, dto.scheduleId, dto.reason ?? '', req.auth!.userId, cid(req));
  }

  @Post('exams/:examId/invitations')
  @UseGuards(CsrfGuard)
  @RequirePermission('account.manage')
  @HttpCode(HttpStatus.OK)
  invite(@Param('examId', ParseUUIDPipe) examId: string, @Body() dto: InviteDto, @Req() req: AuthenticatedRequest) {
    return this.exams.invite(examId, dto.scheduleId, req.auth!.userId, cid(req));
  }

  @Get('exams/:examId/scores/export')
  @RequirePermission('export.execute')
  async scores(@Param('examId', ParseUUIDPipe) examId: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
    sendXlsx(res, await this.exams.scoresXlsx(examId, req.auth!.userId, cid(req)), 'diem-vong-1.xlsx');
  }
}
