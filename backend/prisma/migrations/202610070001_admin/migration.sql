ALTER TABLE exam_schedules ADD COLUMN name text NOT NULL DEFAULT 'Ca thi Vòng 1';
ALTER TABLE exam_schedules ADD COLUMN duration_seconds integer NOT NULL DEFAULT 3600 CHECK(duration_seconds BETWEEN 60 AND 14400);
CREATE TABLE admin_schedule_blueprints (
 schedule_id uuid PRIMARY KEY REFERENCES exam_schedules(id), blueprint_version_id uuid NOT NULL REFERENCES blueprint_versions(id)
);

CREATE TABLE admin_account_deletions (
 user_id uuid PRIMARY KEY REFERENCES users(id), deleted_by_user_id uuid NOT NULL REFERENCES users(id),
 reason text NOT NULL, deleted_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE admin_score_policies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), competition_id uuid NOT NULL REFERENCES competitions(id),
 round integer NOT NULL CHECK(round IN (2,4)), version integer NOT NULL CHECK(version>0),
 config jsonb NOT NULL, created_by_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(competition_id,round,version)
);
CREATE TABLE admin_judge_scores (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), policy_id uuid NOT NULL REFERENCES admin_score_policies(id),
 subject_id uuid NOT NULL REFERENCES scoring_subjects(id), judge text NOT NULL, criterion text NOT NULL,
 score numeric(12,4) NOT NULL CHECK(score>=0), batch_id uuid NOT NULL,
 imported_by_user_id uuid NOT NULL REFERENCES users(id), imported_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(policy_id,subject_id,judge,criterion)
);
CREATE TRIGGER admin_policy_immutable BEFORE UPDATE OR DELETE ON admin_score_policies FOR EACH ROW EXECUTE FUNCTION reject_evidence_mutation();
CREATE TRIGGER admin_score_immutable BEFORE UPDATE OR DELETE ON admin_judge_scores FOR EACH ROW EXECUTE FUNCTION reject_evidence_mutation();
CREATE TRIGGER admin_deleted_account_immutable BEFORE UPDATE OR DELETE ON admin_account_deletions FOR EACH ROW EXECUTE FUNCTION reject_evidence_mutation();
