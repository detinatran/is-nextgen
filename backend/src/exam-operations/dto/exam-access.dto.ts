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

export interface AttemptStartedResponse {
  attemptId: string;
  assignmentId: string;
  ordinal: number;
  state: 'ACTIVE';
  startedAt: string;
  deadlineAt: string;
  serverTime: string;
}
