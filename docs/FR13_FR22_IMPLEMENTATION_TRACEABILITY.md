# FR-13 → FR-22 Implementation Traceability

Status legend: PASS = code + unit/integration/contract/concurrency tests green.

| FR | Module | Endpoint(s) | Service | Database tables | Tests | Status |
|----|--------|-------------|---------|-----------------|-------|--------|
| FR-13 | registrations | POST /api/v1/registration-drafts; GET/PATCH /api/v1/registrations/:id | RegistrationsService.createDraft/updateRegistration/getRegistration; RegistrationCapabilityGuard | candidates, candidate_profiles, registrations, consents, registration_access_grants, duplicate_reviews(+_registrations), competitions | integration/registration.spec.ts (8) | PASS |
| FR-14 | media | POST /api/v1/registrations/:registrationId/uploads | MediaService.createUpload + LocalStorageService | media_uploads, registrations | integration/media.spec.ts | PASS |
| FR-15 | media | POST /api/v1/uploads/:uploadId/finalization; GET /api/v1/uploads/:uploadId | MediaService.finalizeUpload + MediaValidationService (ffprobe) | media_uploads, media_objects | integration/media.spec.ts (5, in-container) | PASS |
| FR-15 | media | PUT /api/v1/registrations/:registrationId/video-binding | MediaService.bindVideo | registration_videos, media_objects | integration/media.spec.ts | PASS |
| FR-16 | registrations | POST /api/v1/registrations/:registrationId/submission | RegistrationsService.submitRegistration (Idempotency-Key) | registrations, candidates.candidate_code, command_receipts, notification_intents, consents, media_uploads/objects/videos | integration/registration.spec.ts | PASS |
| FR-17 | identity-access | POST /auth/activation, /auth/login, /auth/email-verification-requests, /auth/email-verifications, /auth/password-reset-requests, /auth/password-resets, /auth/reauthentication | AuthService, ChallengeService, SessionService (Argon2id, opaque sessions, hashed OTP) | users, roles, user_roles, auth_sessions, auth_challenges | integration/auth.spec.ts (11) | PASS |
| FR-18 | identity-access | POST /auth/logout | AuthService.logout | auth_sessions, active_exam_sessions (writer release only) | integration/auth.spec.ts + autosave.spec.ts | PASS |
| FR-19 | exam-operations | GET /me/assignments; GET /me/assignments/:id/availability; POST /me/assignments/:id/attempts | ExamAccessService.startAttempt (atomic tx) | candidate_assignments, exams, exam_schedules, blueprint_versions, attempts, delivered_exam_forms/questions/options, active_exam_sessions, command_receipts | integration/exam-access.spec.ts (8) | PASS |
| FR-20 | attempts | GET /me/attempts/:attemptId | AttemptsService.getAttemptView (sanitized projection) | attempts, delivered_exam_forms/questions/options, question_versions, answers, review_flags | integration/autosave.spec.ts | PASS |
| FR-21 | attempts | PUT /me/attempts/:id/answers/:dqId; PUT /me/attempts/:id/review-flags/:dqId; POST /me/attempts/:id/session-takeover | AttemptsService.saveAnswer/setReviewFlag/takeoverSession | answers, review_flags, active_exam_sessions, auth_sessions | integration/autosave.spec.ts (8) | PASS |
| FR-22 | attempts | POST /me/attempts/:attemptId/submission | AttemptsService.submitAttempt + AttemptFinalizationService (shared MANUAL/TIMEOUT) | attempts, submissions, active_exam_sessions, async_intents, command_receipts | integration/submission-scoring.spec.ts | PASS |
| §20 timeout | attempts | worker (sweep + opportunistic reconcile) | TimeoutWorker, AttemptFinalizationService.sweepOverdue/finalizeOverdueAttempt | attempts, submissions, async_intents | integration/submission-scoring.spec.ts | PASS |
| §21 scoring | scoring | worker | ScoringService.scoreAttempt/rebuildFinalScore (MAX rule) | attempt_scores, candidate_final_scores, async_intents | integration/submission-scoring.spec.ts | PASS |
| §32 concurrency | — | C1–C5 | service-level races | attempts, answers, active_exam_sessions, command_receipts | integration/concurrency.spec.ts (5) | PASS |
| §33/§40 contract | — | full journey snapshots | — | — | contract/api-contract.spec.ts → test/fixtures/api/*.json | PASS |
| §35 health | health | GET /health/live, /health/ready | HealthController | — | Docker smoke | PASS |
| §34 OpenAPI | scripts | openapi.json | generate-openapi.ts (28 paths) | — | artifact exists | PASS |

## Invariants honored (frozen schema)

- `command_receipts`, `submissions`, `attempt_scores`, `media_objects`, `consents`, `audit_events`: inserted once, never updated.
- Replay of idempotent commands reconstructs outcomes from domain state (receipts are immutable evidence).
- `attempts` rows are insert-only; finalization is the only transition (attempt_guard).
- Answer/flag writes respect revision arithmetic enforced by `answer_guard` (revision 1 on insert, +1 on update, cutoff by `clock_timestamp()`).
- Writer authority: one `active_exam_sessions` row per candidate; takeover only increments generation; logout releases the writer without touching attempt/answers.
- `candidate_code` issued once and immutable after.
- Final score projection: `MAX(finalized scored attempts)`, rebuilt by the scoring transaction.
- Database change to frozen schema: **NONE** (baseline migration = verbatim `001_schema_v1.sql` + `002_seed_reference_data.sql`; frozen regression 103/103 PASS).
