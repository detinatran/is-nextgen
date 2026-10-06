import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { AuthenticatedRequest } from '../common/http/request-context';
import { AuthGuard } from '../identity-access/guards/auth.guard';
import { CsrfGuard } from '../identity-access/guards/csrf.guard';
import { requireIdempotencyKey } from '../exam-operations/assignments.controller';
import { AttemptsService } from './attempts.service';
import {
  AnswerSavedResponse,
  AttemptView,
  SaveAnswerDto,
  ReviewFlagDto,
  SubmissionDto,
  SubmissionResponse,
  TakeoverResponse,
} from './dto/attempt.dto';

@ApiTags('attempts')
@ApiSecurity('cookie')
@UseGuards(AuthGuard)
@Controller('me/attempts')
export class AttemptsController {
  constructor(private readonly attempts: AttemptsService) {}

  /** Sanitized FR-20 contract — never exposes correctness data. */
  @Get(':attemptId')
  @ApiOkResponse({ type: AttemptView, description: 'Sanitized attempt view for the owning candidate' })
  async getAttempt(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AttemptView> {
    return this.attempts.getAttemptView(req.auth!.userId, attemptId);
  }

  @Put(':attemptId/answers/:deliveredQuestionId')
  @UseGuards(CsrfGuard)
  @SkipThrottle()
  @ApiOkResponse({ type: AnswerSavedResponse })
  async saveAnswer(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('deliveredQuestionId', ParseUUIDPipe) deliveredQuestionId: string,
    @Body() dto: SaveAnswerDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AnswerSavedResponse> {
    return this.attempts.saveAnswer(req.auth!.userId, req.auth!.sessionId, attemptId, deliveredQuestionId, dto, req.correlationId ?? 'unknown');
  }

  @Put(':attemptId/review-flags/:deliveredQuestionId')
  @UseGuards(CsrfGuard)
  async setReviewFlag(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Param('deliveredQuestionId', ParseUUIDPipe) deliveredQuestionId: string,
    @Body() dto: ReviewFlagDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ flagged: boolean; revision: number }> {
    return this.attempts.setReviewFlag(req.auth!.userId, req.auth!.sessionId, attemptId, deliveredQuestionId, dto);
  }

  /** Reconnect: same attempt, next writer generation, fresh reauthentication. */
  @Post(':attemptId/session-takeover')
  @HttpCode(HttpStatus.OK)
  @UseGuards(CsrfGuard)
  @ApiOkResponse({ type: TakeoverResponse })
  async takeover(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<TakeoverResponse> {
    return this.attempts.takeoverSession(req.auth!.userId, req.auth!.sessionId, attemptId, req.correlationId ?? 'unknown');
  }

  /** FR-22 manual submission. No answer payload accepted by design. */
  @Post(':attemptId/submission')
  @HttpCode(HttpStatus.OK)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @UseGuards(CsrfGuard)
  @SkipThrottle()
  @ApiOkResponse({ type: SubmissionResponse })
  async submit(
    @Body() dto: SubmissionDto,
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SubmissionResponse> {
    const idempotencyKey = requireIdempotencyKey(req);
    return this.attempts.submitAttempt(req.auth!.userId, req.auth!.sessionId, attemptId, idempotencyKey, req.correlationId ?? 'unknown', dto.writerGeneration);
  }
}
