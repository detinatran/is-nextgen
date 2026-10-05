import { ApiProperty } from '@nestjs/swagger';
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
}

/** Submission accepts no answer properties; enforced by the global whitelist. */
export class EmptySubmissionDto {}

export class ReviewFlagDto {
  @ApiProperty()
  @IsBoolean()
  flagged!: boolean;

  @ApiProperty()
  @IsInt()
  @Min(0)
  expectedRevision!: number;
}

export interface AttemptView {
  attempt: {
    id: string;
    ordinal: number;
    state: 'ACTIVE' | 'FINALIZED';
    startedAt: string;
    deadlineAt: string;
    serverTime: string;
  };
  form: {
    deliveredQuestionId: string;
    position: number;
    prompt: string;
    points: number;
    options: { deliveredOptionId: string; position: number; text: string }[];
  }[];
  candidateState: {
    deliveredQuestionId: string;
    selectedOptionId: string | null;
    answerRevision: number;
    reviewFlag: boolean;
  }[];
}

export interface AnswerSavedResponse {
  revision: number;
  savedAt: string;
  serverTime: string;
}

export interface SubmissionResponse {
  attemptId: string;
  state: 'FINALIZED';
  cause: 'MANUAL' | 'TIMEOUT';
  submittedAt: string;
  score: { points: string; maxPoints: string } | null;
}

export interface TakeoverResponse {
  attemptId: string;
  writerGeneration: number;
  boundAt: string;
}
