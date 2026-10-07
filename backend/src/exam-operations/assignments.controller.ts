import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AppException } from '../common/errors/app-error';
import type { AuthenticatedRequest, AuthContext } from '../common/http/request-context';
import { AuthGuard } from '../identity-access/guards/auth.guard';
import { CsrfGuard } from '../identity-access/guards/csrf.guard';
import { ExamAccessService } from './exam-access.service';
import type { AssignmentSummary, AttemptStartedResponse, AvailabilityResponse } from './dto/exam-access.dto';

@ApiTags('exam-access')
@ApiSecurity('cookie')
@UseGuards(AuthGuard)
@Controller('me/assignments')
export class AssignmentsController {
  constructor(private readonly examAccess: ExamAccessService) {}

  @Get()
  async listAssignments(@Req() req: AuthenticatedRequest): Promise<{ assignments: AssignmentSummary[] }> {
    return this.examAccess.listAssignments(req.auth!.userId);
  }

  @Get(':assignmentId/availability')
  async availability(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AvailabilityResponse> {
    return this.examAccess.availability(req.auth!.userId, assignmentId);
  }

  /** FR-19 Start. Idempotency-Key required; atomic; rollback consumes nothing. */
  @Post(':assignmentId/attempts')
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @UseGuards(CsrfGuard)
  @SkipThrottle()
  async startAttempt(
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<AttemptStartedResponse> {
    const idempotencyKey = requireIdempotencyKey(req);
    const auth: AuthContext = req.auth!;
    try {
      return await this.examAccess.startAttempt(
        auth.userId,
        auth.sessionId,
        assignmentId,
        idempotencyKey,
        req.correlationId ?? 'unknown',
      );
    } catch (e) {
      const mapped = ExamAccessService.mapStartWriteError(e);
      if (mapped) throw mapped;
      throw e;
    }
  }
}

export function requireIdempotencyKey(req: AuthenticatedRequest): string {
  const key = req.header('idempotency-key');
  if (!key || key.length < 16 || key.length > 128 || !/^[\w.-]+$/.test(key)) {
    throw AppException.validation('Idempotency-Key header must be 16-128 word characters');
  }
  return key;
}
