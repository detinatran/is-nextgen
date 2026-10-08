import { ApiProperty } from '@nestjs/swagger';

export interface AssignmentSummary {
  assignmentId: string;
  exam: { id: string; round: number; name: string; durationSeconds: number };
  schedule: { opensAt: string; closesAt: string; capacity: number };
  attemptsUsed: number;
  attemptQuota: number;
  activeAttemptId: string | null;
  finalScore: { points: string; winningAttemptId: string } | null;
}

export interface AvailabilityResponse {
  assignmentId: string;
  canStart: boolean;
  reasons: string[];
  schedule: { opensAt: string; closesAt: string };
  attemptQuota: { used: number; max: number };
  serverTime: string;
}

export class AttemptStartedResponse {
  @ApiProperty({ format: 'uuid' })
  attemptId!: string;
  @ApiProperty({ format: 'uuid' })
  assignmentId!: string;
  @ApiProperty()
  ordinal!: number;
  @ApiProperty({ enum: ['ACTIVE'] })
  state!: 'ACTIVE';
  @ApiProperty({ format: 'date-time' })
  startedAt!: string;
  @ApiProperty({ format: 'date-time' })
  deadlineAt!: string;
  @ApiProperty({ format: 'date-time' })
  serverTime!: string;
  @ApiProperty({ example: 1 })
  writerGeneration!: number | null;
}
