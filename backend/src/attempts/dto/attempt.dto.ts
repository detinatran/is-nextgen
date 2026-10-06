import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class SaveAnswerDto {
  @ApiProperty({ nullable: true, description: 'Delivered option id or null to clear' })
  @IsOptional()
  @IsUUID()
  selectedOptionId!: string | null;

  @ApiProperty({ description: 'Revision the client last saw (0 = none saved yet)' })
  @IsInt()
  @Min(0)
  expectedRevision!: number;

  @ApiProperty({ format: 'uuid', description: 'Client-generated unique mutation id' })
  @IsUUID()
  mutationId!: string;

  @ApiProperty({ description: 'Writer generation the client holds (from start/GET/takeover)' })
  @IsInt()
  @Min(1)
  writerGeneration!: number;
}

/**
 * FR-22: submission carries no answer properties (enforced by the global
 * whitelist). The writer generation may be supplied; a stale supplied
 * generation is rejected while the current writer may always submit.
 */
export class SubmissionDto {
  @ApiPropertyOptional({ description: 'Writer generation of the active session; omitted = current-writer check only' })
  @IsOptional()
  @IsInt()
  @Min(1)
  writerGeneration?: number;
}

export class ReviewFlagDto {
  @ApiProperty()
  @IsBoolean()
  flagged!: boolean;

  @ApiProperty()
  @IsInt()
  @Min(0)
  expectedRevision!: number;

  @ApiProperty({ description: 'Writer generation the client holds (from start/GET/takeover)' })
  @IsInt()
  @Min(1)
  writerGeneration!: number;
}

class AttemptInfoDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
  @ApiProperty()
  ordinal!: number;
  @ApiProperty({ enum: ['ACTIVE', 'FINALIZED'] })
  state!: 'ACTIVE' | 'FINALIZED';
  @ApiProperty({ format: 'date-time' })
  startedAt!: string;
  @ApiProperty({ format: 'date-time' })
  deadlineAt!: string;
  @ApiProperty({ format: 'date-time', description: 'Authoritative server time for countdown alignment' })
  serverTime!: string;
  @ApiProperty({ nullable: true, type: Number, description: 'Current writer generation; null after finalization' })
  writerGeneration!: number | null;
}

class DeliveredOptionDto {
  @ApiProperty({ format: 'uuid' })
  deliveredOptionId!: string;
  @ApiProperty()
  position!: number;
  @ApiProperty()
  text!: string;
}

class DeliveredQuestionDto {
  @ApiProperty({ format: 'uuid' })
  deliveredQuestionId!: string;
  @ApiProperty()
  position!: number;
  @ApiProperty()
  prompt!: string;
  @ApiProperty()
  points!: number;
  @ApiProperty({ type: [DeliveredOptionDto] })
  options!: DeliveredOptionDto[];
}

class CandidateAnswerStateDto {
  @ApiProperty({ format: 'uuid' })
  deliveredQuestionId!: string;
  @ApiProperty({ nullable: true, type: String })
  selectedOptionId!: string | null;
  @ApiProperty()
  answerRevision!: number;
  @ApiProperty()
  reviewFlag!: boolean;
}

export class AttemptView {
  @ApiProperty({ type: AttemptInfoDto })
  attempt!: AttemptInfoDto;
  @ApiProperty({ type: [DeliveredQuestionDto] })
  form!: DeliveredQuestionDto[];
  @ApiProperty({ type: [CandidateAnswerStateDto] })
  candidateState!: CandidateAnswerStateDto[];
}

export class AnswerSavedResponse {
  @ApiProperty({ example: 3 })
  revision!: number;
  @ApiProperty({ format: 'date-time' })
  savedAt!: string;
  @ApiProperty({ format: 'date-time' })
  serverTime!: string;
}

export class SubmissionScoreDto {
  @ApiProperty({ example: '2.0000' })
  points!: string;
  @ApiProperty({ example: '6.0000' })
  maxPoints!: string;
}

export class SubmissionResponse {
  @ApiProperty({ format: 'uuid' })
  attemptId!: string;
  @ApiProperty({ enum: ['FINALIZED'] })
  state!: 'FINALIZED';
  @ApiProperty({ enum: ['MANUAL', 'TIMEOUT'] })
  cause!: 'MANUAL' | 'TIMEOUT';
  @ApiProperty({ format: 'date-time' })
  submittedAt!: string;
  @ApiProperty({ nullable: true, type: SubmissionScoreDto })
  score!: SubmissionScoreDto | null;
}

export class TakeoverResponse {
  @ApiProperty({ format: 'uuid' })
  attemptId!: string;
  @ApiProperty({ example: 2 })
  writerGeneration!: number;
  @ApiProperty({ format: 'date-time' })
  boundAt!: string;
}
