-- PostgreSQL 16+; empty database only. Prisma migration baseline, not application code.
-- No extensions needed: gen_random_uuid() is built in. No cascading evidence deletion.
BEGIN;
SET LOCAL TIME ZONE 'UTC';

CREATE TABLE users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL,
 email_normalized text NOT NULL UNIQUE CHECK(email_normalized = lower(btrim(email)) AND email_normalized <> ''),
 password_hash text, status text NOT NULL DEFAULT 'PROVISIONED' CHECK(status IN ('PROVISIONED','ACTIVE','DISABLED')),
 email_verified_at timestamptz, mfa_enabled boolean NOT NULL DEFAULT false,
 revision bigint NOT NULL DEFAULT 1 CHECK(revision > 0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(status <> 'ACTIVE' OR password_hash IS NOT NULL)
);
CREATE TABLE roles (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE CHECK(code IN ('ADMIN','STUDENT')), description text NOT NULL);
CREATE TABLE permissions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, description text NOT NULL);
CREATE TABLE user_roles (
 user_id uuid NOT NULL REFERENCES users(id), role_id uuid NOT NULL REFERENCES roles(id),
 granted_by_user_id uuid REFERENCES users(id), granted_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,role_id)
);
CREATE TABLE role_permissions (
 role_id uuid NOT NULL REFERENCES roles(id), permission_id uuid NOT NULL REFERENCES permissions(id),
 granted_by_user_id uuid REFERENCES users(id), granted_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(role_id,permission_id)
);
CREATE INDEX user_roles_role_idx ON user_roles(role_id);
CREATE INDEX role_permissions_permission_idx ON role_permissions(permission_id);
CREATE TABLE auth_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id),
 token_hash text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 revoked_at timestamptz, reauthenticated_at timestamptz, mfa_verified_at timestamptz,
 UNIQUE(id,user_id), CHECK(expires_at > created_at)
);
CREATE INDEX auth_sessions_user_idx ON auth_sessions(user_id);
CREATE TABLE auth_challenges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id),
 email_normalized text NOT NULL, purpose text NOT NULL CHECK(purpose IN ('ACTIVATION','EMAIL_VERIFY','PASSWORD_RESET','MFA','REGISTRATION_RECOVERY')),
 verifier_hash text NOT NULL, attempts_used integer NOT NULL DEFAULT 0, attempts_limit integer NOT NULL DEFAULT 5,
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, consumed_at timestamptz,
 CHECK(expires_at > created_at), CHECK(attempts_used BETWEEN 0 AND attempts_limit AND attempts_limit > 0)
);
CREATE INDEX auth_challenges_user_idx ON auth_challenges(user_id);
CREATE TABLE candidates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE REFERENCES users(id),
 candidate_code text UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), CHECK(candidate_code IS NULL OR candidate_code <> '')
);
COMMENT ON COLUMN candidates.candidate_code IS 'Nullable draft; stable public code issued atomically on registration submission. Internal UUID is not the public identifier.';
CREATE TABLE candidate_profiles (
 candidate_id uuid PRIMARY KEY REFERENCES candidates(id), full_name text NOT NULL, date_of_birth date,
 student_id text, school text, department text, major text, email text NOT NULL,
 email_normalized text NOT NULL CHECK(email_normalized=lower(btrim(email))), phone text, phone_normalized text, facebook text,
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX candidate_profiles_student_idx ON candidate_profiles(student_id);
CREATE INDEX candidate_profiles_email_idx ON candidate_profiles(email_normalized);
CREATE INDEX candidate_profiles_school_idx ON candidate_profiles(school);
COMMENT ON TABLE candidate_profiles IS 'Draft may be incomplete; submit transaction validates FR-13 fields. Duplicate signals are non-unique and flag-only.';
CREATE TABLE competitions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL,
 registration_opens_at timestamptz NOT NULL, registration_closes_at timestamptz NOT NULL,
 official_completed_at timestamptz, final_result_published_at timestamptz,
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0), CHECK(registration_closes_at>registration_opens_at)
);
CREATE TABLE registrations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), competition_id uuid NOT NULL REFERENCES competitions(id),
 candidate_id uuid NOT NULL REFERENCES candidates(id), state text NOT NULL DEFAULT 'DRAFT' CHECK(state IN ('DRAFT','SUBMITTED')),
 submitted_profile jsonb, submitted_at timestamptz, revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(candidate_id,competition_id), UNIQUE(id,candidate_id),
 CHECK((state='DRAFT' AND submitted_at IS NULL AND submitted_profile IS NULL) OR
       (state='SUBMITTED' AND submitted_at IS NOT NULL AND submitted_profile IS NOT NULL AND jsonb_typeof(submitted_profile)='object'))
);
CREATE INDEX registrations_competition_state_idx ON registrations(competition_id,state);
COMMENT ON COLUMN registrations.submitted_profile IS 'Intentional immutable original-submission evidence; current profile remains normalized and editable before deadline.';
CREATE TABLE consents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), registration_id uuid NOT NULL REFERENCES registrations(id),
 purpose text NOT NULL, wording_version text NOT NULL, granted boolean NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX consents_registration_idx ON consents(registration_id);
CREATE TABLE registration_access_grants (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), registration_id uuid NOT NULL REFERENCES registrations(id),
 token_hash text NOT NULL UNIQUE, verified_email_normalized text NOT NULL, email_verified_at timestamptz NOT NULL,
 scope text NOT NULL CHECK(scope IN ('READ_EDIT_PROFILE','DRAFT_UPLOAD')), created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL, revoked_at timestamptz, CHECK(expires_at>created_at)
);
CREATE INDEX registration_access_grants_registration_idx ON registration_access_grants(registration_id);
CREATE TABLE duplicate_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), signals jsonb NOT NULL,
 state text NOT NULL DEFAULT 'OPEN' CHECK(state IN ('OPEN','RESOLVED')), disposition text,
 reviewed_by_user_id uuid REFERENCES users(id), reviewed_at timestamptz, revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 CHECK(state<>'RESOLVED' OR (disposition IS NOT NULL AND reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL))
);
CREATE TABLE duplicate_review_registrations (
 review_id uuid NOT NULL REFERENCES duplicate_reviews(id), registration_id uuid NOT NULL REFERENCES registrations(id), PRIMARY KEY(review_id,registration_id)
);
CREATE INDEX duplicate_review_registration_idx ON duplicate_review_registrations(registration_id);
CREATE TABLE media_uploads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), registration_id uuid NOT NULL REFERENCES registrations(id),
 object_key text NOT NULL UNIQUE CHECK(object_key !~ '^[a-zA-Z]+://'),
 state text NOT NULL DEFAULT 'INITIATED' CHECK(state IN ('INITIATED','UPLOADING','VALIDATING','READY','REJECTED','EXPIRED')),
 created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, rejection_reason text,
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0), UNIQUE(id,registration_id), CHECK(expires_at>created_at)
);
CREATE INDEX media_uploads_registration_state_idx ON media_uploads(registration_id,state);
CREATE TABLE media_objects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), upload_id uuid NOT NULL UNIQUE, registration_id uuid NOT NULL,
 object_key text NOT NULL UNIQUE CHECK(object_key !~ '^[a-zA-Z]+://'), checksum_sha256 text NOT NULL CHECK(checksum_sha256 ~ '^[a-f0-9]{64}$'),
 mime_type text NOT NULL CHECK(mime_type='video/mp4'), size_bytes bigint NOT NULL CHECK(size_bytes BETWEEN 1 AND 500000000),
 duration_seconds numeric(8,3) NOT NULL CHECK(duration_seconds>0 AND duration_seconds<=120),
 is_private boolean NOT NULL DEFAULT true CHECK(is_private), validated_at timestamptz NOT NULL, sealed_at timestamptz NOT NULL,
 FOREIGN KEY(upload_id,registration_id) REFERENCES media_uploads(id,registration_id), UNIQUE(id,registration_id)
);
COMMENT ON TABLE media_objects IS 'Validated sealed private metadata only; bytes live in private storage. 500 MB is decimal 500000000 bytes; validator verifies actual bytes.';
CREATE TABLE registration_videos (
 registration_id uuid PRIMARY KEY REFERENCES registrations(id), media_object_id uuid NOT NULL UNIQUE,
 bound_at timestamptz NOT NULL DEFAULT now(), FOREIGN KEY(media_object_id,registration_id) REFERENCES media_objects(id,registration_id)
);

CREATE TABLE competition_contents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), competition_id uuid NOT NULL REFERENCES competitions(id), slot text NOT NULL,
 UNIQUE(competition_id,slot)
);
CREATE TABLE content_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_id uuid NOT NULL REFERENCES competition_contents(id), version integer NOT NULL CHECK(version>0),
 locale text NOT NULL CHECK(locale IN ('vi','en')), body jsonb NOT NULL,
 state text NOT NULL DEFAULT 'DRAFT' CHECK(state IN ('DRAFT','APPROVED','PUBLISHED')),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0), created_by_user_id uuid NOT NULL REFERENCES users(id),
 approved_by_user_id uuid REFERENCES users(id), approved_at timestamptz,
 UNIQUE(content_id,version,locale), UNIQUE(id,content_id,locale),
 CHECK(state='DRAFT' OR (approved_by_user_id IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE TABLE content_publications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), content_id uuid NOT NULL, content_version_id uuid NOT NULL UNIQUE, locale text NOT NULL,
 is_current boolean NOT NULL DEFAULT true, published_by_user_id uuid NOT NULL REFERENCES users(id), published_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(content_version_id,content_id,locale) REFERENCES content_versions(id,content_id,locale)
);
CREATE UNIQUE INDEX content_publications_current_idx ON content_publications(content_id,locale) WHERE is_current;

CREATE TABLE questions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), archived_at timestamptz, created_by_user_id uuid NOT NULL REFERENCES users(id));
CREATE TABLE question_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), question_id uuid NOT NULL REFERENCES questions(id), version integer NOT NULL CHECK(version>0),
 state text NOT NULL DEFAULT 'DRAFT' CHECK(state IN ('DRAFT','FROZEN')), prompt text NOT NULL,
 difficulty text NOT NULL CHECK(difficulty IN ('EASY','MEDIUM','HARD')), revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 created_by_user_id uuid NOT NULL REFERENCES users(id), frozen_at timestamptz, UNIQUE(question_id,version),
 CHECK((state='DRAFT' AND frozen_at IS NULL) OR (state='FROZEN' AND frozen_at IS NOT NULL))
);
CREATE INDEX question_versions_question_state_idx ON question_versions(question_id,state);
CREATE TABLE question_options (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), question_version_id uuid NOT NULL REFERENCES question_versions(id),
 position integer NOT NULL CHECK(position>0), text text NOT NULL, is_correct boolean NOT NULL DEFAULT false,
 UNIQUE(question_version_id,position), UNIQUE(id,question_version_id)
);
CREATE UNIQUE INDEX question_options_one_correct_idx ON question_options(question_version_id) WHERE is_correct;
CREATE TABLE question_pools (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE, name text NOT NULL);
CREATE TABLE question_pool_memberships (
 pool_id uuid NOT NULL REFERENCES question_pools(id), question_version_id uuid NOT NULL REFERENCES question_versions(id), PRIMARY KEY(pool_id,question_version_id)
);
CREATE INDEX question_pool_memberships_version_idx ON question_pool_memberships(question_version_id);
CREATE TABLE exams (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), competition_id uuid NOT NULL REFERENCES competitions(id), round integer NOT NULL CHECK(round BETWEEN 1 AND 4),
 name text NOT NULL, duration_seconds integer NOT NULL DEFAULT 3600 CHECK(duration_seconds>0), UNIQUE(id,competition_id),
 CHECK(round<>1 OR duration_seconds=3600)
);
CREATE TABLE blueprint_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), exam_id uuid NOT NULL REFERENCES exams(id), version integer NOT NULL CHECK(version>0),
 state text NOT NULL DEFAULT 'DRAFT' CHECK(state IN ('DRAFT','FROZEN')), question_count integer NOT NULL CHECK(question_count>0),
 selection_policy jsonb NOT NULL CHECK(jsonb_typeof(selection_policy)='object'), scoring_policy_code text NOT NULL DEFAULT 'SINGLE_CHOICE_CONFIGURED_POINTS_V1',
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0), UNIQUE(exam_id,version), UNIQUE(id,exam_id)
);
COMMENT ON COLUMN blueprint_versions.selection_policy IS 'Owned versioned VO: pool UUIDs, difficulty counts, eligible versions and configured points. Validate exact shape/feasibility in Start transaction; not a replacement for question/option relations.';
CREATE TABLE exam_schedules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), exam_id uuid NOT NULL REFERENCES exams(id), opens_at timestamptz NOT NULL,
 closes_at timestamptz NOT NULL, capacity integer NOT NULL CHECK(capacity>0), revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 UNIQUE(id,exam_id), CHECK(closes_at>opens_at)
);
CREATE INDEX exam_schedules_admission_idx ON exam_schedules(exam_id,opens_at,closes_at);
CREATE TABLE candidate_assignments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), candidate_id uuid NOT NULL REFERENCES candidates(id), exam_id uuid NOT NULL REFERENCES exams(id),
 schedule_id uuid NOT NULL, blueprint_version_id uuid NOT NULL, assigned_by_user_id uuid NOT NULL REFERENCES users(id),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(candidate_id,exam_id), UNIQUE(id,candidate_id), UNIQUE(id,blueprint_version_id),
 FOREIGN KEY(schedule_id,exam_id) REFERENCES exam_schedules(id,exam_id),
 FOREIGN KEY(blueprint_version_id,exam_id) REFERENCES blueprint_versions(id,exam_id)
);
CREATE INDEX candidate_assignments_schedule_idx ON candidate_assignments(schedule_id);
CREATE TABLE assignment_schedule_history (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid NOT NULL REFERENCES candidate_assignments(id),
 old_schedule_id uuid NOT NULL REFERENCES exam_schedules(id), new_schedule_id uuid NOT NULL REFERENCES exam_schedules(id),
 changed_by_user_id uuid NOT NULL REFERENCES users(id), reason text NOT NULL, changed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX assignment_history_assignment_idx ON assignment_schedule_history(assignment_id,changed_at);
CREATE TABLE attempts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid NOT NULL, candidate_id uuid NOT NULL,
 ordinal integer NOT NULL CHECK(ordinal BETWEEN 1 AND 3), state text NOT NULL DEFAULT 'ACTIVE' CHECK(state IN ('ACTIVE','FINALIZED')),
 started_at timestamptz NOT NULL, deadline_at timestamptz NOT NULL, finalized_at timestamptz,
 finalization_cause text CHECK(finalization_cause IN ('MANUAL','TIMEOUT')),
 FOREIGN KEY(assignment_id,candidate_id) REFERENCES candidate_assignments(id,candidate_id),
 UNIQUE(assignment_id,ordinal), UNIQUE(id,candidate_id), UNIQUE(id,assignment_id),
 CHECK(deadline_at>started_at),
 CHECK((state='ACTIVE' AND finalized_at IS NULL AND finalization_cause IS NULL) OR
       (state='FINALIZED' AND finalized_at IS NOT NULL AND finalization_cause IS NOT NULL AND finalized_at>=started_at))
);
CREATE UNIQUE INDEX attempts_one_active_candidate_idx ON attempts(candidate_id) WHERE state='ACTIVE';
CREATE UNIQUE INDEX attempts_one_active_assignment_idx ON attempts(assignment_id) WHERE state='ACTIVE';
CREATE INDEX attempts_candidate_state_idx ON attempts(candidate_id,state);
CREATE INDEX attempts_deadline_idx ON attempts(deadline_at) WHERE state='ACTIVE';
CREATE TABLE active_exam_sessions (
 candidate_id uuid PRIMARY KEY REFERENCES candidates(id), attempt_id uuid NOT NULL UNIQUE, user_id uuid NOT NULL,
 auth_session_id uuid NOT NULL, writer_generation bigint NOT NULL DEFAULT 1 CHECK(writer_generation>0),
 bound_at timestamptz NOT NULL DEFAULT now(), reauthenticated_at timestamptz NOT NULL,
 FOREIGN KEY(attempt_id,candidate_id) REFERENCES attempts(id,candidate_id),
 FOREIGN KEY(auth_session_id,user_id) REFERENCES auth_sessions(id,user_id)
);
CREATE TABLE delivered_exam_forms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attempt_id uuid NOT NULL UNIQUE REFERENCES attempts(id),
 assignment_id uuid NOT NULL, blueprint_version_id uuid NOT NULL, blueprint_revision bigint NOT NULL CHECK(blueprint_revision>0),
 scoring_policy_code text NOT NULL, sealed_at timestamptz,
 FOREIGN KEY(attempt_id,assignment_id) REFERENCES attempts(id,assignment_id),
 FOREIGN KEY(assignment_id,blueprint_version_id) REFERENCES candidate_assignments(id,blueprint_version_id), UNIQUE(id,attempt_id)
);
CREATE TABLE delivered_questions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), form_id uuid NOT NULL, attempt_id uuid NOT NULL,
 question_version_id uuid NOT NULL REFERENCES question_versions(id), position integer NOT NULL CHECK(position>0),
 configured_points numeric(12,4) NOT NULL CHECK(configured_points>=0),
 FOREIGN KEY(form_id,attempt_id) REFERENCES delivered_exam_forms(id,attempt_id),
 UNIQUE(form_id,position), UNIQUE(form_id,question_version_id), UNIQUE(id,attempt_id), UNIQUE(id,question_version_id)
);
CREATE TABLE delivered_options (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), delivered_question_id uuid NOT NULL, question_version_id uuid NOT NULL,
 question_option_id uuid NOT NULL, position integer NOT NULL CHECK(position>0),
 FOREIGN KEY(delivered_question_id,question_version_id) REFERENCES delivered_questions(id,question_version_id),
 FOREIGN KEY(question_option_id,question_version_id) REFERENCES question_options(id,question_version_id),
 UNIQUE(delivered_question_id,position), UNIQUE(delivered_question_id,question_option_id), UNIQUE(id,delivered_question_id)
);
CREATE TABLE answers (
 attempt_id uuid NOT NULL REFERENCES attempts(id), delivered_question_id uuid NOT NULL,
 selected_delivered_option_id uuid, revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 last_mutation_id uuid NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(attempt_id,delivered_question_id),
 FOREIGN KEY(delivered_question_id,attempt_id) REFERENCES delivered_questions(id,attempt_id),
 FOREIGN KEY(selected_delivered_option_id,delivered_question_id) REFERENCES delivered_options(id,delivered_question_id)
);
CREATE TABLE review_flags (
 attempt_id uuid NOT NULL REFERENCES attempts(id), delivered_question_id uuid NOT NULL, flagged boolean NOT NULL,
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0), updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(attempt_id,delivered_question_id),
 FOREIGN KEY(delivered_question_id,attempt_id) REFERENCES delivered_questions(id,attempt_id)
);
CREATE TABLE submissions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attempt_id uuid NOT NULL UNIQUE REFERENCES attempts(id),
 cause text NOT NULL CHECK(cause IN ('MANUAL','TIMEOUT')), submitted_at timestamptz NOT NULL DEFAULT now(), UNIQUE(id,attempt_id)
);
CREATE TABLE attempt_scores (
 attempt_id uuid PRIMARY KEY REFERENCES attempts(id), submission_id uuid NOT NULL UNIQUE,
 points numeric(12,4) NOT NULL CHECK(points>=0), max_points numeric(12,4) NOT NULL CHECK(max_points>=0 AND points<=max_points),
 policy_code text NOT NULL, scored_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(submission_id,attempt_id) REFERENCES submissions(id,attempt_id)
);
CREATE TABLE candidate_final_scores (
 assignment_id uuid PRIMARY KEY REFERENCES candidate_assignments(id), winning_attempt_id uuid NOT NULL REFERENCES attempt_scores(attempt_id),
 points numeric(12,4) NOT NULL CHECK(points>=0), rebuilt_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(winning_attempt_id,assignment_id) REFERENCES attempts(id,assignment_id)
);
COMMENT ON TABLE candidate_final_scores IS 'Rebuildable MAX finalized scored attempt projection; source is attempt_scores + immutable form/submission/answers. MAX and pending completeness validated by Scoring transaction.';
CREATE TABLE scoring_rubric_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), competition_id uuid NOT NULL REFERENCES competitions(id), round integer NOT NULL CHECK(round BETWEEN 1 AND 4),
 version integer NOT NULL CHECK(version>0), rubric jsonb NOT NULL, difference_metric text NOT NULL,
 difference_threshold numeric(12,4) NOT NULL CHECK(difference_threshold>=0), max_score numeric(12,4) NOT NULL CHECK(max_score>0),
 approved_by_user_id uuid NOT NULL REFERENCES users(id), approved_at timestamptz NOT NULL, UNIQUE(competition_id,round,version), UNIQUE(id,competition_id,round)
);
CREATE TABLE team_code_references (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), competition_id uuid NOT NULL REFERENCES competitions(id), team_code text NOT NULL,
 approved_by_user_id uuid NOT NULL REFERENCES users(id), UNIQUE(competition_id,team_code), UNIQUE(id,competition_id)
);
CREATE TABLE scoring_subjects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), competition_id uuid NOT NULL REFERENCES competitions(id),
 candidate_id uuid REFERENCES candidates(id), team_code_reference_id uuid,
 CHECK(num_nonnulls(candidate_id,team_code_reference_id)=1),
 FOREIGN KEY(team_code_reference_id,competition_id) REFERENCES team_code_references(id,competition_id), UNIQUE(id,competition_id),
 UNIQUE(competition_id,candidate_id), UNIQUE(competition_id,team_code_reference_id)
);
CREATE TABLE manual_scoring_cases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), competition_id uuid NOT NULL REFERENCES competitions(id), round integer NOT NULL CHECK(round BETWEEN 1 AND 4),
 subject_id uuid NOT NULL, rubric_version_id uuid NOT NULL,
 state text NOT NULL DEFAULT 'AWAITING_REVIEWERS' CHECK(state IN ('AWAITING_REVIEWERS','SCORING','NEEDS_THIRD','COMPLETED')),
 final_points numeric(12,4) CHECK(final_points>=0), revision bigint NOT NULL DEFAULT 1 CHECK(revision>0),
 FOREIGN KEY(subject_id,competition_id) REFERENCES scoring_subjects(id,competition_id),
 FOREIGN KEY(rubric_version_id,competition_id,round) REFERENCES scoring_rubric_versions(id,competition_id,round),
 UNIQUE(subject_id,round), CHECK((state='COMPLETED')=(final_points IS NOT NULL))
);
CREATE TABLE reviewer_assignments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), case_id uuid NOT NULL REFERENCES manual_scoring_cases(id),
 reviewer_user_id uuid NOT NULL REFERENCES users(id), slot text NOT NULL CHECK(slot IN ('A','B','C')),
 assigned_by_user_id uuid NOT NULL REFERENCES users(id), assigned_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(case_id,slot), UNIQUE(case_id,reviewer_user_id)
);
CREATE INDEX reviewer_assignments_reviewer_idx ON reviewer_assignments(reviewer_user_id);
CREATE TABLE manual_scores (
 reviewer_assignment_id uuid PRIMARY KEY REFERENCES reviewer_assignments(id), points numeric(12,4) NOT NULL CHECK(points>=0),
 rubric_inputs jsonb NOT NULL, revision bigint NOT NULL DEFAULT 1 CHECK(revision>0), submitted_at timestamptz NOT NULL DEFAULT now(),
 updated_by_user_id uuid NOT NULL REFERENCES users(id)
);
CREATE TABLE result_revisions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), competition_id uuid NOT NULL REFERENCES competitions(id), round integer NOT NULL CHECK(round BETWEEN 1 AND 4),
 version integer NOT NULL CHECK(version>0), state text NOT NULL DEFAULT 'CALCULATED' CHECK(state IN ('CALCULATED','IN_REVIEW','APPROVED')),
 calculation_policy jsonb NOT NULL, calculated_at timestamptz NOT NULL DEFAULT now(),
 reviewed_by_user_id uuid REFERENCES users(id), reviewed_at timestamptz, approved_by_user_id uuid REFERENCES users(id), approved_at timestamptz,
 UNIQUE(competition_id,round,version), UNIQUE(id,competition_id,round),
 CHECK(state='CALCULATED' OR (reviewed_by_user_id IS NOT NULL AND reviewed_at IS NOT NULL)),
 CHECK(state<>'APPROVED' OR (approved_by_user_id IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE TABLE result_revision_rows (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), revision_id uuid NOT NULL REFERENCES result_revisions(id), candidate_id uuid NOT NULL REFERENCES candidates(id),
 assignment_id uuid REFERENCES candidate_assignments(id), manual_case_id uuid REFERENCES manual_scoring_cases(id),
 points numeric(12,4) NOT NULL CHECK(points>=0), progression_status text NOT NULL, rank integer CHECK(rank>0),
 UNIQUE(revision_id,candidate_id), UNIQUE(id,revision_id,candidate_id), CHECK(num_nonnulls(assignment_id,manual_case_id)=1)
);
CREATE TABLE result_publications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), competition_id uuid NOT NULL REFERENCES competitions(id), round integer NOT NULL CHECK(round BETWEEN 1 AND 4),
 result_revision_id uuid NOT NULL UNIQUE, is_current boolean NOT NULL DEFAULT true,
 supersedes_publication_id uuid UNIQUE REFERENCES result_publications(id),
 published_by_user_id uuid NOT NULL REFERENCES users(id), published_at timestamptz NOT NULL DEFAULT now(), sealed_at timestamptz,
 withdrawn_at timestamptz, withdrawal_reason text,
 FOREIGN KEY(result_revision_id,competition_id,round) REFERENCES result_revisions(id,competition_id,round),
 UNIQUE(id,result_revision_id), CHECK(withdrawn_at IS NULL OR (NOT is_current AND withdrawal_reason IS NOT NULL))
);
CREATE UNIQUE INDEX result_publications_current_idx ON result_publications(competition_id,round) WHERE is_current;
CREATE TABLE published_result_rows (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), publication_id uuid NOT NULL, result_revision_id uuid NOT NULL, result_revision_row_id uuid NOT NULL,
 candidate_id uuid NOT NULL, candidate_code text NOT NULL, full_name text NOT NULL, school text NOT NULL, round_status text NOT NULL,
 FOREIGN KEY(publication_id,result_revision_id) REFERENCES result_publications(id,result_revision_id),
 FOREIGN KEY(result_revision_row_id,result_revision_id,candidate_id) REFERENCES result_revision_rows(id,revision_id,candidate_id),
 UNIQUE(publication_id,candidate_id), UNIQUE(publication_id,candidate_code)
);
COMMENT ON TABLE published_result_rows IS 'Immutable public allowlist snapshot; lineage UUIDs are backend-only, not public DTO fields. Never raw scores/email/phone/student ID/video.';
CREATE TABLE notification_intents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id), candidate_id uuid REFERENCES candidates(id),
 template_code text NOT NULL, destination_email text NOT NULL, payload jsonb NOT NULL, deduplication_key text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','SENDING','SENT','RETRY_PENDING','FAILED')),
 available_at timestamptz NOT NULL DEFAULT now(), lease_until timestamptz, attempts_used integer NOT NULL DEFAULT 0 CHECK(attempts_used>=0),
 created_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz
);
CREATE INDEX notification_intents_dispatch_idx ON notification_intents(status,available_at);
CREATE TABLE async_intents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL CHECK(kind IN ('SCORING','MEDIA_VALIDATE','MEDIA_CLEANUP','EXPORT','CACHE_INVALIDATE','RETENTION')),
 resource_id uuid NOT NULL, payload jsonb NOT NULL, deduplication_key text NOT NULL UNIQUE,
 status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','RUNNING','SUCCEEDED','RETRY_PENDING','FAILED')),
 available_at timestamptz NOT NULL DEFAULT now(), lease_until timestamptz, attempts_used integer NOT NULL DEFAULT 0 CHECK(attempts_used>=0),
 created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE INDEX async_intents_dispatch_idx ON async_intents(status,available_at);
CREATE TABLE command_receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), scope_key text NOT NULL, idempotency_key text NOT NULL,
 command_code text NOT NULL CHECK(command_code IN ('REGISTRATION_SUBMIT','USER_PROVISION','ATTEMPT_START','ATTEMPT_SUBMIT','QUESTION_IMPORT','RESULT_PUBLISH','DELETION_REQUEST')),
 request_hash text NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'), actor_user_id uuid REFERENCES users(id),
 resource_type text NOT NULL, resource_id uuid NOT NULL, result_metadata jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(scope_key,idempotency_key)
);
COMMENT ON TABLE command_receipts IS 'Critical commands only. Logical resource identity validated by producing domain, not polymorphic FK. Replay rechecks current access; same key/different hash is service conflict.';
CREATE TABLE audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id uuid REFERENCES users(id), action text NOT NULL,
 target_type text NOT NULL, target_id uuid, occurred_at timestamptz NOT NULL DEFAULT now(), reason text,
 correlation_id uuid NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(metadata)='object')
);
CREATE INDEX audit_events_target_idx ON audit_events(target_type,target_id,occurred_at);
COMMENT ON TABLE audit_events IS 'Append-only for normal runtime DML; retention uses dedicated restricted maintenance role/workflow. No raw secrets/OTP/session token/answer-key dumps. Target may be erased so target_id is logical, not cascading FK.';
CREATE TABLE deletion_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), candidate_id uuid REFERENCES candidates(id), subject_reference_hash text NOT NULL,
 requested_by_user_id uuid NOT NULL REFERENCES users(id), reason text NOT NULL,
 state text NOT NULL DEFAULT 'REQUESTED' CHECK(state IN ('REQUESTED','DEPENDENCY_CHECK','BLOCKED','APPROVED','EXECUTING','COMPLETED')),
 revision bigint NOT NULL DEFAULT 1 CHECK(revision>0), dependency_report jsonb, requested_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);

-- DB-native protection. Authentication, RBAC, audited orchestration and policy calculations
-- remain owner-service responsibilities; no SECURITY DEFINER or business endpoint functions.
CREATE FUNCTION reject_evidence_mutation() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'immutable evidence: %', TG_TABLE_NAME USING ERRCODE='23514'; END $$;

CREATE FUNCTION protect_question_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP <> 'INSERT' AND OLD.state='FROZEN' THEN RAISE EXCEPTION 'frozen question version' USING ERRCODE='23514'; END IF;
 IF TG_OP<>'DELETE' AND NEW.state='FROZEN' THEN
  IF (SELECT count(*) FROM question_options WHERE question_version_id=NEW.id AND is_correct)<>1
     OR (SELECT count(*) FROM question_options WHERE question_version_id=NEW.id)<2 THEN
   RAISE EXCEPTION 'freeze requires >=2 options and exactly one correct' USING ERRCODE='23514';
  END IF;
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER question_version_guard BEFORE INSERT OR UPDATE OR DELETE ON question_versions FOR EACH ROW EXECUTE FUNCTION protect_question_version();
CREATE FUNCTION protect_question_option() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_state text; v_id uuid;
BEGIN
 v_id := CASE WHEN TG_OP='DELETE' THEN OLD.question_version_id ELSE NEW.question_version_id END;
 IF TG_OP='UPDATE' AND NEW.question_version_id<>OLD.question_version_id THEN RAISE EXCEPTION 'option reparent forbidden' USING ERRCODE='23514'; END IF;
 SELECT state INTO v_state FROM question_versions WHERE id=v_id FOR UPDATE;
 IF v_state='FROZEN' THEN RAISE EXCEPTION 'frozen question options' USING ERRCODE='23514'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER question_option_guard BEFORE INSERT OR UPDATE OR DELETE ON question_options FOR EACH ROW EXECUTE FUNCTION protect_question_option();
CREATE FUNCTION protect_blueprint() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.state='FROZEN' THEN RAISE EXCEPTION 'frozen blueprint' USING ERRCODE='23514'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER blueprint_guard BEFORE UPDATE OR DELETE ON blueprint_versions FOR EACH ROW EXECUTE FUNCTION protect_blueprint();

CREATE FUNCTION protect_form() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.sealed_at IS NOT NULL THEN RAISE EXCEPTION 'sealed form' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (to_jsonb(NEW)-'sealed_at')<>(to_jsonb(OLD)-'sealed_at') THEN
  RAISE EXCEPTION 'form mapping immutable' USING ERRCODE='23514'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER form_guard BEFORE UPDATE OR DELETE ON delivered_exam_forms FOR EACH ROW EXECUTE FUNCTION protect_form();
CREATE FUNCTION protect_delivered_child() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_form uuid; v_sealed timestamptz; v_state text;
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'delivered evidence immutable' USING ERRCODE='23514'; END IF;
 IF TG_TABLE_NAME='delivered_questions' THEN
  v_form:=NEW.form_id;
  SELECT state INTO v_state FROM question_versions WHERE id=NEW.question_version_id;
  IF v_state IS DISTINCT FROM 'FROZEN' THEN RAISE EXCEPTION 'delivery requires frozen version' USING ERRCODE='23514'; END IF;
 ELSE SELECT form_id INTO v_form FROM delivered_questions WHERE id=NEW.delivered_question_id; END IF;
 SELECT sealed_at INTO v_sealed FROM delivered_exam_forms WHERE id=v_form FOR UPDATE;
 IF v_sealed IS NOT NULL THEN RAISE EXCEPTION 'sealed form children' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER delivered_question_guard BEFORE INSERT OR UPDATE OR DELETE ON delivered_questions FOR EACH ROW EXECUTE FUNCTION protect_delivered_child();
CREATE TRIGGER delivered_option_guard BEFORE INSERT OR UPDATE OR DELETE ON delivered_options FOR EACH ROW EXECUTE FUNCTION protect_delivered_child();

CREATE FUNCTION protect_attempt() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' OR OLD.state='FINALIZED' THEN RAISE EXCEPTION 'no reset/delete/refund/finalized mutation' USING ERRCODE='23514'; END IF;
 IF (to_jsonb(NEW)-ARRAY['state','finalized_at','finalization_cause'])<>(to_jsonb(OLD)-ARRAY['state','finalized_at','finalization_cause']) THEN
  RAISE EXCEPTION 'attempt binding/time/quota immutable' USING ERRCODE='23514'; END IF;
 IF NEW.state<>'FINALIZED' THEN RAISE EXCEPTION 'only finalization changes attempt' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER attempt_guard BEFORE UPDATE OR DELETE ON attempts FOR EACH ROW EXECUTE FUNCTION protect_attempt();
CREATE FUNCTION check_attempt_boundary() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_id uuid; v_attempt attempts%ROWTYPE; v_form delivered_exam_forms%ROWTYPE; v_count integer; v_expected integer;
BEGIN
 IF TG_TABLE_NAME='attempts' THEN v_id:=NEW.id;
 ELSIF TG_OP='DELETE' THEN v_id:=OLD.attempt_id;
 ELSE v_id:=NEW.attempt_id; END IF;
 SELECT * INTO v_attempt FROM attempts WHERE id=v_id;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT * INTO v_form FROM delivered_exam_forms WHERE attempt_id=v_id;
 IF NOT FOUND OR v_form.sealed_at IS NULL THEN RAISE EXCEPTION 'attempt requires one complete sealed form at commit' USING ERRCODE='23514'; END IF;
 SELECT question_count INTO v_expected FROM blueprint_versions WHERE id=v_form.blueprint_version_id AND state='FROZEN' AND revision=v_form.blueprint_revision;
 SELECT count(*) INTO v_count FROM delivered_questions WHERE form_id=v_form.id;
 IF v_expected IS NULL OR v_count<>v_expected THEN RAISE EXCEPTION 'form question count/blueprint revision mismatch' USING ERRCODE='23514'; END IF;
 IF EXISTS(SELECT 1 FROM delivered_questions q WHERE q.form_id=v_form.id AND
    (SELECT count(*) FROM delivered_options o WHERE o.delivered_question_id=q.id)<>
    (SELECT count(*) FROM question_options o WHERE o.question_version_id=q.question_version_id)) THEN
  RAISE EXCEPTION 'form requires exact complete option permutation' USING ERRCODE='23514'; END IF;
 IF v_attempt.state='FINALIZED' THEN
  IF NOT EXISTS(SELECT 1 FROM submissions s WHERE s.attempt_id=v_id AND s.cause=v_attempt.finalization_cause AND s.submitted_at=v_attempt.finalized_at)
     OR EXISTS(SELECT 1 FROM active_exam_sessions WHERE attempt_id=v_id) THEN
   RAISE EXCEPTION 'finalized requires matching unique submission and no writer' USING ERRCODE='23514'; END IF;
 ELSE
  IF EXISTS(SELECT 1 FROM submissions WHERE attempt_id=v_id) THEN RAISE EXCEPTION 'active cannot have submission' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER attempt_boundary AFTER INSERT OR UPDATE ON attempts DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_attempt_boundary();
CREATE CONSTRAINT TRIGGER form_boundary AFTER INSERT OR UPDATE OR DELETE ON delivered_exam_forms DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_attempt_boundary();
CREATE CONSTRAINT TRIGGER submission_boundary AFTER INSERT ON submissions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_attempt_boundary();

CREATE FUNCTION protect_answer() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_attempt attempts%ROWTYPE;
BEGIN
 SELECT * INTO v_attempt FROM attempts WHERE id=CASE WHEN TG_OP='DELETE' THEN OLD.attempt_id ELSE NEW.attempt_id END FOR UPDATE;
 IF v_attempt.state IS DISTINCT FROM 'ACTIVE' OR clock_timestamp()>=v_attempt.deadline_at THEN
  RAISE EXCEPTION 'answer/flag cutoff or finalized' USING ERRCODE='23514'; END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'clear via nullable option/false flag, not deletion' USING ERRCODE='23514'; END IF;
 IF TG_OP='INSERT' AND NEW.revision<>1 THEN RAISE EXCEPTION 'initial revision must be 1' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW.attempt_id<>OLD.attempt_id OR NEW.delivered_question_id<>OLD.delivered_question_id OR NEW.revision<>OLD.revision+1) THEN
  RAISE EXCEPTION 'answer/flag revision or reparent conflict' USING ERRCODE='23514'; END IF;
 NEW.updated_at:=clock_timestamp(); RETURN NEW;
END $$;
CREATE TRIGGER answer_guard BEFORE INSERT OR UPDATE OR DELETE ON answers FOR EACH ROW EXECUTE FUNCTION protect_answer();
CREATE TRIGGER review_flag_guard BEFORE INSERT OR UPDATE OR DELETE ON review_flags FOR EACH ROW EXECUTE FUNCTION protect_answer();
CREATE FUNCTION protect_writer() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_attempt attempts%ROWTYPE; v_user uuid;
BEGIN
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 SELECT * INTO v_attempt FROM attempts WHERE id=NEW.attempt_id FOR UPDATE;
 SELECT user_id INTO v_user FROM candidates WHERE id=NEW.candidate_id;
 IF v_attempt.state IS DISTINCT FROM 'ACTIVE' OR v_user IS DISTINCT FROM NEW.user_id THEN
  RAISE EXCEPTION 'writer must own active attempt' USING ERRCODE='23514'; END IF;
 IF TG_OP='UPDATE' AND (NEW.candidate_id<>OLD.candidate_id OR NEW.attempt_id<>OLD.attempt_id OR NEW.user_id<>OLD.user_id OR NEW.writer_generation<>OLD.writer_generation+1) THEN
  RAISE EXCEPTION 'takeover same attempt, next generation only' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER writer_guard BEFORE INSERT OR UPDATE OR DELETE ON active_exam_sessions FOR EACH ROW EXECUTE FUNCTION protect_writer();

CREATE FUNCTION enforce_roster_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_capacity integer;
BEGIN
 IF TG_OP='UPDATE' AND (NEW.id<>OLD.id OR NEW.candidate_id<>OLD.candidate_id OR NEW.exam_id<>OLD.exam_id OR NEW.blueprint_version_id<>OLD.blueprint_version_id) THEN RAISE EXCEPTION 'canonical assignment and blueprint immutable' USING ERRCODE='23514'; END IF;
 SELECT capacity INTO v_capacity FROM exam_schedules WHERE id=NEW.schedule_id FOR UPDATE;
 IF (SELECT count(*) FROM candidate_assignments WHERE schedule_id=NEW.schedule_id AND id<>NEW.id)>=v_capacity THEN
  RAISE EXCEPTION 'schedule roster capacity exceeded' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER roster_guard BEFORE INSERT OR UPDATE ON candidate_assignments FOR EACH ROW EXECUTE FUNCTION enforce_roster_capacity();
CREATE FUNCTION protect_schedule_capacity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.exam_id<>OLD.exam_id OR NEW.capacity<(SELECT count(*) FROM candidate_assignments WHERE schedule_id=OLD.id) THEN
  RAISE EXCEPTION 'schedule scope/capacity conflict' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER schedule_guard BEFORE UPDATE ON exam_schedules FOR EACH ROW EXECUTE FUNCTION protect_schedule_capacity();

CREATE FUNCTION protect_registration() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' AND OLD.state='SUBMITTED' AND (NEW.state<>'SUBMITTED' OR NEW.submitted_at IS DISTINCT FROM OLD.submitted_at OR NEW.submitted_profile IS DISTINCT FROM OLD.submitted_profile OR NEW.candidate_id<>OLD.candidate_id OR NEW.competition_id<>OLD.competition_id) THEN
  RAISE EXCEPTION 'submitted evidence immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER registration_guard BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION protect_registration();
CREATE FUNCTION protect_video_binding() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_registration uuid; v_state text;
BEGIN
 v_registration:=CASE WHEN TG_OP='DELETE' THEN OLD.registration_id ELSE NEW.registration_id END;
 IF TG_OP='UPDATE' AND NEW.registration_id<>OLD.registration_id THEN RAISE EXCEPTION 'video reparent forbidden' USING ERRCODE='23514'; END IF;
 SELECT state INTO v_state FROM registrations WHERE id=v_registration FOR UPDATE;
 IF v_state='SUBMITTED' THEN RAISE EXCEPTION 'submitted video sealed' USING ERRCODE='23514'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER video_guard BEFORE INSERT OR UPDATE OR DELETE ON registration_videos FOR EACH ROW EXECUTE FUNCTION protect_video_binding();
CREATE FUNCTION check_submitted_registration() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.state='SUBMITTED' AND (NOT EXISTS(SELECT 1 FROM registration_videos WHERE registration_id=NEW.id) OR
     NOT EXISTS(SELECT 1 FROM candidates WHERE id=NEW.candidate_id AND candidate_code IS NOT NULL)) THEN
  RAISE EXCEPTION 'submission requires video and public candidate code' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER registration_boundary AFTER INSERT OR UPDATE ON registrations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_submitted_registration();

CREATE FUNCTION protect_result_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.state='APPROVED' THEN RAISE EXCEPTION 'approved result revision immutable' USING ERRCODE='23514'; END IF;
 IF (to_jsonb(NEW)-ARRAY['state','reviewed_by_user_id','reviewed_at','approved_by_user_id','approved_at'])<>(to_jsonb(OLD)-ARRAY['state','reviewed_by_user_id','reviewed_at','approved_by_user_id','approved_at']) THEN
  RAISE EXCEPTION 'new calculation needs new revision' USING ERRCODE='23514'; END IF;
 IF NOT ((OLD.state='CALCULATED' AND NEW.state='IN_REVIEW') OR (OLD.state='IN_REVIEW' AND NEW.state='APPROVED')) THEN
  RAISE EXCEPTION 'invalid result review transition' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER result_revision_guard BEFORE UPDATE ON result_revisions FOR EACH ROW EXECUTE FUNCTION protect_result_revision();
CREATE FUNCTION protect_result_row() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_state text; v_id uuid;
BEGIN
 v_id:=CASE WHEN TG_OP='DELETE' THEN OLD.revision_id ELSE NEW.revision_id END;
 IF TG_OP='UPDATE' AND NEW.revision_id<>OLD.revision_id THEN RAISE EXCEPTION 'result reparent forbidden' USING ERRCODE='23514'; END IF;
 SELECT state INTO v_state FROM result_revisions WHERE id=v_id FOR UPDATE;
 IF v_state IS DISTINCT FROM 'CALCULATED' THEN RAISE EXCEPTION 'reviewed/approved rows immutable' USING ERRCODE='23514'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER result_row_guard BEFORE INSERT OR UPDATE OR DELETE ON result_revision_rows FOR EACH ROW EXECUTE FUNCTION protect_result_row();
CREATE FUNCTION protect_publication() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_state text;
BEGIN
 IF TG_OP='INSERT' THEN
  SELECT state INTO v_state FROM result_revisions WHERE id=NEW.result_revision_id FOR UPDATE;
  IF v_state IS DISTINCT FROM 'APPROVED' THEN RAISE EXCEPTION 'publication requires approval' USING ERRCODE='23514'; END IF;
  IF NEW.supersedes_publication_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM result_publications WHERE id=NEW.supersedes_publication_id AND competition_id=NEW.competition_id AND round=NEW.round AND NOT is_current) THEN
   RAISE EXCEPTION 'supersession scope/current conflict' USING ERRCODE='23514'; END IF;
 ELSE
  IF TG_OP='UPDATE' AND OLD.sealed_at IS NULL AND NEW.sealed_at IS NOT NULL AND
    (to_jsonb(NEW)-'sealed_at')=(to_jsonb(OLD)-'sealed_at') THEN RETURN NEW; END IF;
  IF TG_OP='DELETE' OR (to_jsonb(NEW)-ARRAY['is_current','withdrawn_at','withdrawal_reason'])<>(to_jsonb(OLD)-ARRAY['is_current','withdrawn_at','withdrawal_reason']) OR NOT OLD.is_current OR NEW.is_current THEN
   RAISE EXCEPTION 'publication only supersede/withdraw current' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER publication_guard BEFORE INSERT OR UPDATE OR DELETE ON result_publications FOR EACH ROW EXECUTE FUNCTION protect_publication();
CREATE FUNCTION protect_published_row() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_sealed timestamptz;
BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'published snapshot immutable' USING ERRCODE='23514'; END IF;
 SELECT sealed_at INTO v_sealed FROM result_publications WHERE id=NEW.publication_id FOR UPDATE;
 IF v_sealed IS NOT NULL THEN RAISE EXCEPTION 'sealed publication cannot append rows' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER published_row_guard BEFORE INSERT OR UPDATE OR DELETE ON published_result_rows FOR EACH ROW EXECUTE FUNCTION protect_published_row();
CREATE FUNCTION check_sealed_publication() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM result_publications WHERE id=NEW.id AND sealed_at IS NULL) THEN
  RAISE EXCEPTION 'publication must seal snapshot in same transaction' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER publication_boundary AFTER INSERT OR UPDATE ON result_publications DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_sealed_publication();
CREATE FUNCTION protect_candidate_code() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.candidate_code IS NOT NULL AND NEW.candidate_code IS DISTINCT FROM OLD.candidate_code THEN
  RAISE EXCEPTION 'public candidate code immutable' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER candidate_code_guard BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION protect_candidate_code();
CREATE FUNCTION protect_content_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='UPDATE' AND OLD.state='DRAFT' AND NEW.state NOT IN ('DRAFT','APPROVED') THEN
  RAISE EXCEPTION 'content must approve before publishing' USING ERRCODE='23514'; END IF;
 IF OLD.state<>'DRAFT' THEN
  IF TG_OP='DELETE' OR NOT (OLD.state='APPROVED' AND NEW.state='PUBLISHED' AND (to_jsonb(NEW)-'state')=(to_jsonb(OLD)-'state')) THEN
   RAISE EXCEPTION 'approved content bytes immutable' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER content_version_guard BEFORE UPDATE OR DELETE ON content_versions FOR EACH ROW EXECUTE FUNCTION protect_content_version();
CREATE FUNCTION check_content_publication() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM content_versions WHERE id=NEW.content_version_id AND state IN ('APPROVED','PUBLISHED')) THEN
  RAISE EXCEPTION 'content publication requires approval' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER content_publication_guard BEFORE INSERT ON content_publications FOR EACH ROW EXECUTE FUNCTION check_content_publication();
CREATE FUNCTION protect_content_publication() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP='DELETE' OR (to_jsonb(NEW)-'is_current')<>(to_jsonb(OLD)-'is_current') OR NOT OLD.is_current OR NEW.is_current THEN
  RAISE EXCEPTION 'content publication only supersede current' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER content_publication_immutable BEFORE UPDATE OR DELETE ON content_publications FOR EACH ROW EXECUTE FUNCTION protect_content_publication();
CREATE TRIGGER submission_immutable BEFORE UPDATE OR DELETE ON submissions FOR EACH ROW EXECUTE FUNCTION reject_evidence_mutation();
CREATE TRIGGER media_object_immutable BEFORE UPDATE OR DELETE ON media_objects FOR EACH ROW EXECUTE FUNCTION reject_evidence_mutation();
CREATE TRIGGER rubric_immutable BEFORE UPDATE OR DELETE ON scoring_rubric_versions FOR EACH ROW EXECUTE FUNCTION reject_evidence_mutation();
CREATE TRIGGER audit_immutable BEFORE UPDATE OR DELETE ON audit_events FOR EACH ROW EXECUTE FUNCTION reject_evidence_mutation();
CREATE TRIGGER receipt_immutable BEFORE UPDATE OR DELETE ON command_receipts FOR EACH ROW EXECUTE FUNCTION reject_evidence_mutation();
CREATE TRIGGER consent_immutable BEFORE UPDATE OR DELETE ON consents FOR EACH ROW EXECUTE FUNCTION reject_evidence_mutation();
CREATE TRIGGER attempt_score_immutable BEFORE UPDATE OR DELETE ON attempt_scores FOR EACH ROW EXECUTE FUNCTION reject_evidence_mutation();
COMMENT ON TABLE active_exam_sessions IS 'One durable current writer per candidate. Service checks live session/user/role/email/MFA and fresh reauth; generation checked inside attempt lock. Logout may remove writer while ACTIVE remains.';
COMMIT;
-- Safe reference data only; no login accounts or credentials. Idempotent.
BEGIN;
INSERT INTO roles(code,description) VALUES
 ('ADMIN','Privileged user; permission and domain assignment checks still required'),
 ('STUDENT','Provisioned candidate user; own resources only')
ON CONFLICT(code) DO NOTHING;
INSERT INTO permissions(code,description) VALUES
 ('candidate.read','Read candidates within authorized scope'), ('candidate.manage','Manage candidate profiles'),
 ('account.manage','Provision, disable and recover users'),
 ('question.read','Read private question bank'), ('question.manage','Author/import question versions'), ('question.publish','Freeze question versions'),
 ('exam.manage','Manage exam configuration and schedules'), ('assignment.manage','Assign/reschedule candidates'), ('exam.monitor','Monitor exams'),
 ('reviewer.score','Score assigned manual cases'), ('reviewer.assign','Assign distinct reviewers'),
 ('result.review','Review calculated results'), ('result.approve','Approve reviewed revision'), ('result.publish','Publish/supersede/withdraw approved results'),
 ('content.manage','Manage competition content'), ('content.approve','Approve exact content version'), ('content.publish','Publish approved content'),
 ('media.view','View private media within domain scope'), ('media.download','Download private media with audit'),
 ('export.execute','Execute scoped private exports'), ('audit.read','Read authorized audit evidence'), ('data.delete','Request coordinated deletion'),
 ('self.profile','Read/edit own profile before deadline'), ('self.exam','Access own assigned exam and attempt')
ON CONFLICT(code) DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p
WHERE (r.code='ADMIN' AND p.code NOT LIKE 'self.%') OR (r.code='STUDENT' AND p.code LIKE 'self.%')
ON CONFLICT(role_id,permission_id) DO NOTHING;
-- ADMIN capability never bypasses ownership, MFA, assignment, approval, cutoff or audit.
COMMIT;
