import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiSecurity, ApiTags } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Readable } from "node:stream";
import { AuthGuard } from "../identity-access/guards/auth.guard";
import { AdminGuard } from "../identity-access/guards/admin.guard";
import { CsrfGuard } from "../identity-access/guards/csrf.guard";
import type { AuthenticatedRequest } from "../common/http/request-context";
import { LocalStorageService } from "../media/storage/local-storage.service";
import { DriveReadService } from "../media/drive/drive-read.service";
import { PrismaService } from "../database/prisma.service";
import { AppException } from "../common/errors/app-error";
import { AdminService } from "./admin.service";
import {
  SpreadsheetsService,
  QUESTION_HEADERS,
  SCORE_HEADERS,
} from "./spreadsheets.service";
import {
  AccountActionDto,
  AssignmentDto,
  CandidateDto,
  PolicyDto,
  QuestionDto,
  ScheduleDto,
  TeamDto,
} from "./admin.dto";
import { AdminJsonInterceptor } from "./admin-json.interceptor";

@ApiTags("admin-operations")
@ApiSecurity("cookie")
@Controller("admin")
@UseGuards(AuthGuard, AdminGuard, CsrfGuard)
@UseInterceptors(AdminJsonInterceptor)
export class AdminOperationsController {
  constructor(
    private readonly admin: AdminService,
    private readonly sheets: SpreadsheetsService,
    private readonly config: ConfigService,
    private readonly drive: DriveReadService,
    private readonly prisma: PrismaService,
  ) {}
  private competition(value?: string) {
    if (
      value &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    )
      throw AppException.validation("Mã cuộc thi không hợp lệ");
    return value || undefined;
  }
  private async download(
    res: Response,
    buffer: Buffer,
    name: string,
    format = "xlsx",
  ) {
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader(
      "Content-Type",
      format === "csv"
        ? "text/csv; charset=utf-8"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${name}.${format}"`,
    );
    res.send(buffer);
  }
  @Get("configuration") configuration() {
    return this.admin.configuration();
  }
  @Get("registrations") registrations(
    @Query("search") search = "",
    @Query("school") school = "",
    @Query("competitionId") competitionId?: string,
  ) {
    return this.admin.registrations(
      search,
      school,
      this.competition(competitionId),
    );
  }
  @Post("candidates") createCandidate(
    @Body() dto: CandidateDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.admin.createCandidate(dto, req);
  }
  @Post("candidates/:id/account") account(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AccountActionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.admin.account(id, dto, req);
  }
  @Get("registrations/export") async registrationExport(
    @Query("format") format = "xlsx",
    @Query("search") search = "",
    @Query("school") school = "",
    @Query("competitionId") competitionId: string | undefined,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    return this.download(
      res,
      await this.admin.registrationExport(
        format,
        search,
        school,
        this.competition(competitionId),
        req,
      ),
      "registrations",
      format,
    );
  }
  @Get("registrations/:id/video") async video(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const media = await this.admin.video(id, req);
    const storage = new LocalStorageService(
      resolve(this.config.get("mediaStorageDir", "./.data/media")),
    );
    const localPath = storage.pathFor(media.object_key);
    // Video đã chép sang Google Drive và xoá khỏi máy chủ: phát thẳng từ Drive (hỗ trợ tua)
    if (!existsSync(localPath)) {
      const copy = await this.prisma.$queryRaw<{ drive_file_id: string; size_bytes: bigint }[]>`
        SELECT drive_file_id, size_bytes FROM media_drive_copies WHERE media_object_id = ${media.id}::uuid`;
      if (copy[0] && this.drive.enabled) {
        await this.fromDrive(copy[0].drive_file_id, Number(copy[0].size_bytes), media.mime_type, req, res);
        return;
      }
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Type", media.mime_type);
    res.setHeader("X-Content-Type-Options", "nosniff");
    await new Promise<void>((done, fail) => {
      res.sendFile(
        storage.pathFor(media.object_key),
        { dotfiles: "allow" },
        (error) => {
          if (error)
            fail(
              AppException.notFound("Không tìm thấy video trong kho lưu trữ"),
            );
          else done();
        },
      );
    });
  }
  private async fromDrive(fileId: string, size: number, mimeType: string, req: AuthenticatedRequest, res: Response) {
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.header("range") ?? "");
    let start = 0;
    let end = size - 1;
    if (range) {
      if (range[1]) start = Number(range[1]);
      if (range[2]) end = Math.min(Number(range[2]), size - 1);
      if (!range[1] && range[2]) start = Math.max(0, size - Number(range[2]));
      if (start > end || start >= size) {
        res.status(416).setHeader("Content-Range", `bytes */${size}`).end();
        return;
      }
    }
    // Lấy luồng từ Drive trước khi gửi header để lỗi trả đúng mã
    const remote = await this.drive.download(fileId, start, end).catch((e: { status?: number }) => {
      if (e?.status === 404) throw AppException.notFound("Không tìm thấy video trên Google Drive");
      throw AppException.dependencyUnavailable("Google Drive tạm thời không phản hồi");
    });
    res.status(range ? 206 : 200);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", String(end - start + 1));
    res.setHeader("Accept-Ranges", "bytes");
    if (range) res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    const body = Readable.fromWeb(remote.body as import("node:stream/web").ReadableStream);
    body.on("error", () => res.destroy());
    body.pipe(res);
  }
  @Get("questions") questions() {
    return this.admin.questions();
  }
  @Get("questions/:id/history") questionHistory(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.admin.questions(id);
  }
  @Post("questions") createQuestion(
    @Body() dto: QuestionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.admin.saveQuestion(dto, req);
  }
  @Put("questions/:id") updateQuestion(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: QuestionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.admin.saveQuestion(dto, req, id);
  }
  @Delete("questions/:id") archiveQuestion(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.admin.archiveQuestion(id, req);
  }
  @Get("questions/template") async questionTemplate(@Res() res: Response) {
    return this.download(
      res,
      await this.sheets.export(
        QUESTION_HEADERS,
        [["1 + 1 = ?", "1", "2", "3", "4", "B", "EASY", "General"]],
        "xlsx",
      ),
      "questions-template",
    );
  }
  @Get("questions/template.docx") docxTemplate(@Res() res: Response) {
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="questions-template.docx"',
    );
    res.send(this.sheets.docxTemplate());
  }
  @Post("questions/import")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 5_000_000, files: 1 } }),
  )
  importQuestions(
    @UploadedFile() file: Express.Multer.File,
    @Query("commit") commit: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.admin.importQuestions(file, commit === "true", req);
  }
  @Get("schedules") schedules() {
    return this.admin.schedules();
  }
  @Post("schedules") createSchedule(
    @Body() dto: ScheduleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.admin.createSchedule(dto, req);
  }
  @Get("assignments") assignments(
    @Query("competitionId") competitionId?: string,
  ) {
    return this.admin.assignments(this.competition(competitionId));
  }
  @Post("assignments") assign(
    @Body() dto: AssignmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.admin.assign(dto, req);
  }
  @Get("assignments/:id/history") history(
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.admin.history(id);
  }
  @Get("monitor") monitor(@Query("competitionId") competitionId?: string) {
    return this.admin.assignments(this.competition(competitionId));
  }
  @Get("results/round-1") round1(
    @Query("competitionId") competitionId?: string,
  ) {
    return this.admin.round1(this.competition(competitionId));
  }
  @Get("results/round-1/export") async round1Export(
    @Query("competitionId") competitionId: string | undefined,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    return this.download(
      res,
      await this.admin.round1Export(this.competition(competitionId), req),
      "round-1",
    );
  }
  @Post("score-policies") createPolicy(
    @Body() dto: PolicyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.admin.createPolicy(dto, req);
  }
  @Post("teams") createTeam(
    @Body() dto: TeamDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.admin.createTeam(dto, req);
  }
  @Get("scores/template") async scoreTemplate(@Res() res: Response) {
    return this.download(
      res,
      await this.sheets.export(SCORE_HEADERS, [], "xlsx"),
      "scores-template",
    );
  }
  @Post("scores/import")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 5_000_000, files: 1 } }),
  )
  importScores(
    @UploadedFile() file: Express.Multer.File,
    @Query("policyId", ParseUUIDPipe) policyId: string,
    @Query("commit") commit: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.admin.importScores(file, policyId, commit === "true", req);
  }
  @Get("scores/:id") scores(@Param("id", ParseUUIDPipe) id: string) {
    return this.admin.manualResults(id);
  }
  @Get("scores/:id/export") async manualExport(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    return this.download(
      res,
      await this.admin.manualExport(id, req),
      "manual-scores",
    );
  }
}
