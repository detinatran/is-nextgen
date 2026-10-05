# FR13_FR22 IMPLEMENTATION REPORT

## Result

PASS

## Implemented FRs

- FR-13 Competition registration (anonymous draft, scoped capability tokens, duplicate flagging)
- FR-14 Private video submission (direct upload to private storage adapter)
- FR-15 Submission validation (real ffprobe validation in Docker: MP4 container, ≤120 s, ≤500,000,000 bytes; frontend error codes)
- FR-16 Registration confirmation (one authoritative transaction; candidate code + next steps only after COMMIT; Idempotency-Key replay)
- FR-17 Candidate authentication (activation/login/logout/email verification/password reset/reauthentication; Argon2id; opaque server-side sessions; hashed OTP challenges)
- FR-18 Logout without losing answers (session revoked + writer released; attempt, answers, deadline, quota untouched)
- FR-19 Exam access (assignments view, availability, atomic Start: attempt + sealed delivered form + writer session + receipt in one transaction)
- FR-20 Online assessment (sanitized attempt view; single choice; no correctness leakage)
- FR-21 Answer saving (optimistic revisions, REVISION_CONFLICT, review flags, reload/reconnect recovery)
- FR-22 Manual submission + timeout finalization (shared finalizer; worker sweep + opportunistic reconcile) + automatic scoring (MAX rule)

## Architecture compliance

- Thin controllers (parse/auth/call service/map response) — all business rules in services
- Service-driven transactions; Prisma + parameterized raw SQL (`FOR UPDATE`, `SKIP LOCKED`) for concurrency-critical paths
- Frozen PostgreSQL integrity: verbatim baseline migration; every trigger/constraint honored (immutable evidence tables included); zero schema changes
- Redis intentionally not used as any source of truth; candidate flow does not depend on it

## API

Base URL: `http://localhost:3001/api/v1` — full artifact: `backend/openapi.json` (28 paths)

- POST /registration-drafts
- GET|PATCH /registrations/:registrationId
- POST /registrations/:registrationId/uploads
- PUT /registrations/:registrationId/video-binding
- POST /registrations/:registrationId/submission (Idempotency-Key)
- POST /uploads/:uploadId/finalization; GET /uploads/:uploadId
- POST /auth/activation | /auth/login | /auth/logout | /auth/email-verification-requests | /auth/email-verifications | /auth/password-reset-requests | /auth/password-resets | /auth/reauthentication
- GET /me/assignments; GET /me/assignments/:assignmentId/availability; POST /me/assignments/:assignmentId/attempts (Idempotency-Key)
- GET /me/attempts/:attemptId; PUT /me/attempts/:id/answers/:dqId; PUT /me/attempts/:id/review-flags/:dqId; POST /me/attempts/:id/session-takeover; POST /me/attempts/:id/submission (Idempotency-Key)
- GET /health/live; GET /health/ready
- POST /internal/fixtures/* (dev/test only, token-guarded, 404 in production mode)

## Test evidence

- Build: PASS (`nest build`)
- Lint: PASS (`eslint --max-warnings 0`, zero warnings)
- Typecheck: PASS (`tsc --noEmit`)
- Unit: PASS 9/9
- Integration: PASS 62/62 (run in Docker; includes ffprobe media validation; Windows host runs the same suite with media tests skipped when ffmpeg is absent)
- Contract: PASS 1/1 (journey snapshot; 8 sanitized fixtures in `backend/test/fixtures/api/`)
- Concurrency: PASS 5/5 (C1 double-start, C2 cross-assignment, C3 save-vs-submit, C4 save-vs-timeout, C5 takeover-vs-old-writer)
- Frozen DB regression: PASS 103/103 (`database/test/run_validation.py`, PostgreSQL 16.13, disposable container)
- Docker smoke: PASS (`docker compose up backend`; /health/ready OK; workers processed scoring + email intents end-to-end via MailPit)

## Security checks

- Candidate A cannot read/modify candidate B registration or attempt (404, no existence leak)
- Unverified email cannot start exam; revoked/expired sessions and capabilities are denied
- Registration access only via opaque scoped capability tokens (never by id/email/candidateCode)
- CSRF double-submit enforced for cookie-authenticated mutations; HttpOnly + SameSite=Lax session cookie, Secure forced in production
- OTPs stored hashed, attempt-budgeted, single-use; passwords Argon2id
- Idempotency-Key reuse with different payload → IDEMPOTENCY_CONFLICT
- No correctness data (isCorrect/correctOptionId) in candidate responses, DTOs, or logs
- Private video bytes never served anonymously; object keys/paths never exposed
- Malformed UUIDs → 400 VALIDATION_FAILED (no SQL error leaks)

## Frontend readiness

READY — artifacts for integration:

- OpenAPI: `backend/openapi.json`
- Base URL: `http://localhost:3001/api/v1` (`docker compose up` in `backend/`)
- Auth: `isng_session` HttpOnly cookie + `isng_csrf` cookie; send `x-csrf-token` header on mutations; registration endpoints use `x-registration-token`; commands need `Idempotency-Key` header
- Errors: single envelope `{ "error": { "code", "message", "correlationId", "details } }`; branch on machine codes
- Fixtures: `backend/test/fixtures/api/*.json` (registration-submitted, login-success, assignments, attempt-started, attempt-active, answer-saved, error-revision-conflict, attempt-finalized)

## Remaining blockers

None for this scope. Notes (not blockers):

- Upload size boundary (>500,000,000 bytes) is enforced by config + service check; a real >500 MB fixture was intentionally not generated (validator limits unit-verified; boundary code path covered by multer cap + service check).
- Rate limiting uses the in-memory throttler store (per-instance). Multi-instance deployments would add a shared store; Redis remains optional.
- Deadline comparisons use the app clock alongside the DB's `clock_timestamp()` triggers; single-host clock skew is negligible, cross-host deployment should keep NTP.

## Files changed

- `backend/` (new): NestJS 11 app — `src/` (identity-access, registrations, media, exam-operations, attempts, scoring, notifications, fixtures, health, common, config, database), `prisma/` (introspected schema + verbatim baseline migration), `test/` (unit, integration, contract, helpers, fixtures/api), `Dockerfile`, `docker-compose.yml`, `eslint.config.mjs`, `tsconfig*.json`, `.env.example`, `openapi.json`
- `docs/FR13_FR22_IMPLEMENTATION_TRACEABILITY.md` (new)
- Frontend (`src/`, Next.js landing page): untouched

## Database changes

NONE to frozen schema. Baseline migration is a verbatim concatenation of `database/001_schema_v1.sql` + `database/002_seed_reference_data.sql`; a schema diff proved `migrate deploy` output identical to SQL-init (excluding `_prisma_migrations` bookkeeping).

## Next recommended action

Wire the Next.js candidate UI to the running backend using `backend/test/fixtures/api/` and `backend/openapi.json` (start with the registration + upload form against `docker compose up`).
