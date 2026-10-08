// TypeScript definitions mapping 100% to PostgreSQL Schema (001_schema_v1.sql)
// Dedicated for IS-NextGen Manager Challenge 2026 Admin Dashboard

export type UUID = string;
export type ISODateString = string;

// ==========================================
// 1. USERS & ACCESS CONTROL (FR-01, FR-02, FR-03)
// ==========================================

export type UserStatus = 'PROVISIONED' | 'ACTIVE' | 'DISABLED';

export interface User {
  id: UUID;
  email: string;
  email_normalized: string;
  status: UserStatus;
  email_verified_at: ISODateString | null;
  mfa_enabled: boolean;
  revision: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export type RoleCode = 'ADMIN' | 'STUDENT';

export interface Role {
  id: UUID;
  code: RoleCode;
  description: string;
}

export interface Permission {
  id: UUID;
  code: string;
  description: string;
}

export interface UserRole {
  user_id: UUID;
  role_id: UUID;
  granted_by_user_id: UUID | null;
  granted_at: ISODateString;
}

export interface AuthSession {
  id: UUID;
  user_id: UUID;
  created_at: ISODateString;
  expires_at: ISODateString;
  revoked_at: ISODateString | null;
  reauthenticated_at: ISODateString | null;
  mfa_verified_at: ISODateString | null;
}

export type ChallengePurpose = 'ACTIVATION' | 'EMAIL_VERIFY' | 'PASSWORD_RESET' | 'MFA' | 'REGISTRATION_RECOVERY';

export interface AuthChallenge {
  id: UUID;
  user_id: UUID | null;
  email_normalized: string;
  purpose: ChallengePurpose;
  attempts_used: number;
  attempts_limit: number;
  created_at: ISODateString;
  expires_at: ISODateString;
  consumed_at: ISODateString | null;
}

// ==========================================
// 2. CANDIDATES & REGISTRATIONS (FR-04, FR-05, FR-13 - FR-16)
// ==========================================

export interface Candidate {
  id: UUID;
  user_id: UUID | null;
  candidate_code: string | null;
  created_at: ISODateString;
}

export interface CandidateProfile {
  candidate_id: UUID;
  full_name: string;
  date_of_birth: string | null;
  student_id: string | null;
  school: string | null;
  department: string | null;
  major: string | null;
  email: string;
  email_normalized: string;
  phone: string | null;
  phone_normalized: string | null;
  facebook: string | null;
  revision: number;
  updated_at: ISODateString;
}

export type RegistrationState = 'DRAFT' | 'SUBMITTED';

export interface Registration {
  id: UUID;
  competition_id: UUID;
  candidate_id: UUID;
  state: RegistrationState;
  submitted_profile: Record<string, any> | null;
  submitted_at: ISODateString | null;
  revision: number;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export type DuplicateReviewState = 'OPEN' | 'RESOLVED';

export interface DuplicateReview {
  id: UUID;
  signals: {
    matched_fields?: string[];
    candidates?: {
      candidate_id: UUID;
      candidate_code?: string;
      full_name: string;
      student_id?: string;
      school?: string;
      email: string;
      phone?: string;
    }[];
    similarity_score?: number;
    [key: string]: any;
  };
  state: DuplicateReviewState;
  disposition: string | null;
  reviewed_by_user_id: UUID | null;
  reviewed_at: ISODateString | null;
  revision: number;
}

export type MediaUploadState = 'INITIATED' | 'UPLOADING' | 'VALIDATING' | 'READY' | 'REJECTED' | 'EXPIRED';

export interface MediaUpload {
  id: UUID;
  registration_id: UUID;
  object_key: string;
  state: MediaUploadState;
  created_at: ISODateString;
  expires_at: ISODateString;
  rejection_reason: string | null;
  revision: number;
}

export interface MediaObject {
  id: UUID;
  upload_id: UUID;
  registration_id: UUID;
  object_key: string;
  checksum_sha256: string;
  mime_type: string;
  size_bytes: number;
  duration_seconds: number;
  is_private: boolean;
  validated_at: ISODateString;
  sealed_at: ISODateString;
}

export interface RegistrationVideo {
  registration_id: UUID;
  media_object_id: UUID;
  bound_at: ISODateString;
}

// ==========================================
// 3. COMPETITIONS & CONTENT (FR-1.1 - FR-1.4, FR-23 - FR-28)
// ==========================================

export interface Competition {
  id: UUID;
  code: string;
  name: string;
  registration_opens_at: ISODateString;
  registration_closes_at: ISODateString;
  official_completed_at: ISODateString | null;
  final_result_published_at: ISODateString | null;
  revision: number;
}

export interface CompetitionContent {
  id: UUID;
  competition_id: UUID;
  slot: string;
}

export type ContentVersionState = 'DRAFT' | 'APPROVED' | 'PUBLISHED';

export interface ContentVersion {
  id: UUID;
  content_id: UUID;
  version: number;
  locale: 'vi' | 'en';
  body: Record<string, any>;
  state: ContentVersionState;
  revision: number;
  created_by_user_id: UUID;
  approved_by_user_id: UUID | null;
  approved_at: ISODateString | null;
}

export interface ContentPublication {
  id: UUID;
  content_id: UUID;
  content_version_id: UUID;
  locale: 'vi' | 'en';
  is_current: boolean;
  published_by_user_id: UUID;
  published_at: ISODateString;
}

// ==========================================
// 4. QUESTION BANK (FR-06, FR-07)
// ==========================================

export interface Question {
  id: UUID;
  archived_at: ISODateString | null;
  created_by_user_id: UUID;
}

export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuestionVersionState = 'DRAFT' | 'FROZEN';

export interface QuestionVersion {
  id: UUID;
  question_id: UUID;
  version: number;
  state: QuestionVersionState;
  prompt: string;
  difficulty: QuestionDifficulty;
  revision: number;
  created_by_user_id: UUID;
  frozen_at: ISODateString | null;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: UUID;
  question_version_id: UUID;
  position: number;
  text: string;
  is_correct: boolean;
}

export interface QuestionPool {
  id: UUID;
  code: string;
  name: string;
}

export interface QuestionPoolMembership {
  pool_id: UUID;
  question_version_id: UUID;
}

// ==========================================
// 5. EXAM, BLUEPRINTS & SCHEDULES (FR-08, FR-09)
// ==========================================

export interface Exam {
  id: UUID;
  competition_id: UUID;
  round: number; // 1 to 4
  name: string;
  duration_seconds: number;
}

export type BlueprintState = 'DRAFT' | 'FROZEN';

export interface BlueprintSelectionPolicy {
  pool_ids?: UUID[];
  distribution?: {
    difficulty: QuestionDifficulty;
    count: number;
    points_per_question: number;
  }[];
  total_questions?: number;
  [key: string]: any;
}

export interface BlueprintVersion {
  id: UUID;
  exam_id: UUID;
  version: number;
  state: BlueprintState;
  question_count: number;
  selection_policy: BlueprintSelectionPolicy;
  scoring_policy_code: string;
  revision: number;
}

export interface ExamSchedule {
  id: UUID;
  exam_id: UUID;
  opens_at: ISODateString;
  closes_at: ISODateString;
  capacity: number;
  revision: number;
  // Computed client-side fields for admin:
  assigned_count?: number;
}

export interface CandidateAssignment {
  id: UUID;
  candidate_id: UUID;
  exam_id: UUID;
  schedule_id: UUID;
  blueprint_version_id: UUID;
  assigned_by_user_id: UUID;
  revision: number;
  created_at: ISODateString;
  // Joined fields
  candidate?: Candidate & { profile?: CandidateProfile };
  schedule?: ExamSchedule;
}

export interface AssignmentScheduleHistory {
  id: UUID;
  assignment_id: UUID;
  old_schedule_id: UUID;
  new_schedule_id: UUID;
  changed_by_user_id: UUID;
  reason: string;
  changed_at: ISODateString;
}

// ==========================================
// 6. ONLINE EXAM RUNTIME & MONITORING (FR-10, FR-20, FR-21, FR-22)
// ==========================================

export type AttemptState = 'ACTIVE' | 'FINALIZED';
export type FinalizationCause = 'MANUAL' | 'TIMEOUT';

export interface Attempt {
  id: UUID;
  assignment_id: UUID;
  candidate_id: UUID;
  ordinal: number; // 1 to 3
  state: AttemptState;
  started_at: ISODateString;
  deadline_at: ISODateString;
  finalized_at: ISODateString | null;
  finalization_cause: FinalizationCause | null;
}

export interface ActiveExamSession {
  candidate_id: UUID;
  attempt_id: UUID;
  user_id: UUID;
  auth_session_id: UUID;
  writer_generation: number;
  bound_at: ISODateString;
  reauthenticated_at: ISODateString;
}

export interface DeliveredExamForm {
  id: UUID;
  attempt_id: UUID;
  assignment_id: UUID;
  blueprint_version_id: UUID;
  blueprint_revision: number;
  scoring_policy_code: string;
  sealed_at: ISODateString | null;
}

export interface DeliveredQuestion {
  id: UUID;
  form_id: UUID;
  attempt_id: UUID;
  question_version_id: UUID;
  position: number;
  configured_points: number;
}

export interface DeliveredOption {
  id: UUID;
  delivered_question_id: UUID;
  question_version_id: UUID;
  question_option_id: UUID;
  position: number;
}

export interface Answer {
  attempt_id: UUID;
  delivered_question_id: UUID;
  selected_delivered_option_id: UUID | null;
  revision: number;
  last_mutation_id: UUID;
  updated_at: ISODateString;
}

export interface ReviewFlag {
  attempt_id: UUID;
  delivered_question_id: UUID;
  flagged: boolean;
  revision: number;
  updated_at: ISODateString;
}

export interface Submission {
  id: UUID;
  attempt_id: UUID;
  cause: FinalizationCause;
  submitted_at: ISODateString;
}

export interface AttemptScore {
  attempt_id: UUID;
  submission_id: UUID;
  points: number;
  max_points: number;
  policy_code: string;
  scored_at: ISODateString;
}

export interface CandidateFinalScore {
  assignment_id: UUID;
  winning_attempt_id: UUID;
  points: number;
  rebuilt_at: ISODateString;
}

// Live Monitoring DTO for Proctoring Dashboard (FR-10)
export interface CandidateProctorStatus {
  candidate_id: UUID;
  candidate_code: string;
  full_name: string;
  student_id: string;
  school: string;
  schedule_id: UUID;
  attempt_id: UUID | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'DISCONNECTED';
  started_at: ISODateString | null;
  answered_count: number;
  total_questions: number;
  tab_switch_count: number;
  copy_paste_count: number;
  last_activity_at: ISODateString | null;
}

// ==========================================
// 7. MANUAL SCORING & RUBRICS (FR-12)
// ==========================================

export interface ScoringRubricVersion {
  id: UUID;
  competition_id: UUID;
  round: number; // 1 to 4
  version: number;
  rubric: {
    competencies: {
      id: string;
      code: string;
      name: string;
      weight: number;
      max_score: number;
      levels: {
        level: number;
        description: string;
        points: number;
      }[];
    }[];
  };
  difference_metric: string;
  difference_threshold: number; // e.g. 0.20 (20%)
  max_score: number;
  approved_by_user_id: UUID;
  approved_at: ISODateString;
}

export type ManualScoringCaseState = 'AWAITING_REVIEWERS' | 'SCORING' | 'NEEDS_THIRD' | 'COMPLETED';

export interface ManualScoringCase {
  id: UUID;
  competition_id: UUID;
  round: number;
  subject_id: UUID;
  rubric_version_id: UUID;
  state: ManualScoringCaseState;
  final_points: number | null;
  revision: number;
  // Joined data
  candidate_profile?: CandidateProfile;
  reviewers?: ReviewerAssignmentWithScore[];
}

export type ReviewerSlot = 'A' | 'B' | 'C';

export interface ReviewerAssignment {
  id: UUID;
  case_id: UUID;
  reviewer_user_id: UUID;
  slot: ReviewerSlot;
  assigned_by_user_id: UUID;
  assigned_at: ISODateString;
}

export interface ManualScore {
  reviewer_assignment_id: UUID;
  points: number;
  rubric_inputs: Record<string, number>; // competency_id -> score
  revision: number;
  submitted_at: ISODateString;
  updated_by_user_id: UUID;
}

export interface ReviewerAssignmentWithScore extends ReviewerAssignment {
  reviewer_email?: string;
  score?: ManualScore;
}

// ==========================================
// 8. RESULTS, RANKING & PUBLICATIONS (FR-11, FR-12)
// ==========================================

export type ResultRevisionState = 'CALCULATED' | 'IN_REVIEW' | 'APPROVED';

export interface ResultRevision {
  id: UUID;
  competition_id: UUID;
  round: number;
  version: number;
  state: ResultRevisionState;
  calculation_policy: Record<string, any>;
  calculated_at: ISODateString;
  reviewed_by_user_id: UUID | null;
  reviewed_at: ISODateString | null;
  approved_by_user_id: UUID | null;
  approved_at: ISODateString | null;
}

export interface ResultRevisionRow {
  id: UUID;
  revision_id: UUID;
  candidate_id: UUID;
  assignment_id: UUID | null;
  manual_case_id: UUID | null;
  points: number;
  progression_status: 'QUALIFIED' | 'ELIMINATED' | 'RESERVE';
  rank: number | null;
  // Joined fields
  candidate_code?: string;
  full_name?: string;
  school?: string;
}

export interface ResultPublication {
  id: UUID;
  competition_id: UUID;
  round: number;
  result_revision_id: UUID;
  is_current: boolean;
  supersedes_publication_id: UUID | null;
  published_by_user_id: UUID;
  published_at: ISODateString;
  sealed_at: ISODateString | null;
  withdrawn_at: ISODateString | null;
  withdrawal_reason: string | null;
}

// ==========================================
// 9. AUDIT & LOGS
// ==========================================

export interface AuditEvent {
  id: UUID;
  actor_user_id: UUID | null;
  action: string;
  target_type: string;
  target_id: UUID | null;
  occurred_at: ISODateString;
  reason: string | null;
  correlation_id: UUID;
  metadata: Record<string, any>;
}
