# Admin FR-01–FR-12

Branch: `feature/admin-fr-01-12`, based on `origin/feature/admin`. The shared NestJS/PostgreSQL backend was brought from `origin/backend_candidate` without replacing the public frontend.

## Run locally

Requirements: Node.js 22.9+ (tested with 24), PostgreSQL 16+, and FFmpeg/FFprobe on PATH for the shared registration media validation. The existing backend Dockerfile supplies FFmpeg. Use a persistent database and media volume outside disposable tests.

```powershell
# Frontend, from the repository root
npm ci
Copy-Item .env.example .env.local
# BACKEND_URL=http://127.0.0.1:3001

# Backend, in a second terminal
cd backend
npm ci
Copy-Item .env.example .env
# Set DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD in .env.
# Set REGISTRATION_OPENS_AT / REGISTRATION_CLOSES_AT to official ISO dates
# to create the competition during bootstrap. Set SMTP_URL for email delivery.
npm run db:generate
npm run db:deploy
npm run admin:bootstrap
npm run build
npm start

# Frontend, root directory
npm run dev
```

Open `http://localhost:3000/admin/login`. Login requires the provisioned password plus the emailed OTP. Invalid passwords, expired/revoked sessions, students and Admin sessions without MFA are denied by the server. The initial bootstrap refuses to overwrite an existing account.

Without SMTP, the development mailer captures notification metadata. For local inspection only, set `ALLOW_LOCAL_OTP=1` and run `npm run admin:otp` in `backend` after submitting the login form. This helper is disabled in production and is never exposed as an HTTP endpoint. Production needs working SMTP.

This branch uses a Next.js server with an API proxy, rather than static export. Run `npm run build` and `npm start` for production; GitHub Pages cannot host the authenticated server features. Production requires HTTPS and secure cookies. Configure `BACKEND_URL` when building/deploying the frontend.

## Coverage

| FR | UI | Server behavior |
| --- | --- | --- |
| 01 | `/admin/login` | Argon2 password verification, email OTP MFA, opaque HttpOnly session |
| 02 | Header logout | Revokes the database session, clears cookies, rejects replay |
| 03 | `/admin/candidates` | Provision/reset random credentials, lock/unlock, account deletion, session/challenge revocation; cannot manage Admin accounts here |
| 04 | `/admin/candidates` | Search student ID/name/email/code, school filter, full profile, protected submitted video streaming |
| 05 | Same page | UTF-8 CSV / real XLSX; candidate code, personal fields, registration state, video URL; respects applied filters |
| 06 | `/admin/questions` | Add/edit/archive; edits create immutable frozen versions; stale edits rejected; all options and answer retained |
| 07 | `/admin/questions/import` | XLSX / DOCX templates, row validation preview, all-or-nothing commit; invalid files never insert questions |
| 08 | `/admin/exams/schedules` | Open/close times, capacity, duration, question count/pool, pinned blueprint; validates pool feasibility |
| 09 | `/admin/exams/assignments` | Roster per schedule, transactional capacity enforcement, mandatory change reason/history, no reschedule after first attempt |
| 10 | `/admin/exams/monitor` | Database attempt state, answer count, start/submission times; polls every 5 seconds |
| 11 | `/admin/scoring/round-1` | Highest scored attempt, candidate/schedule mapping, ranking and XLSX; cutoff ties flagged for review |
| 12 | `/admin/scoring/manual` | Registered candidate/team validation, complete per-judge criterion import, versioned weighted scoring configuration, detailed and summary XLSX |

Account deletion removes login authority and password while retaining submitted registration, exam and scoring evidence. Deleted accounts cannot be reopened. Deleting a question archives it; previously delivered exam forms still point to their immutable version.

Schedules use Vietnam time (UTC+7) in the UI. Opening/closing bound admission to the exam. An admitted attempt receives the full configured duration from its start, preserving the candidate flow's 60-minute default. Existing schedules default to 60 minutes. Rescheduling preserves the assignment's original frozen blueprint.

Top 40 ranking is advisory: equal raw scores share a rank. If the 40th place is tied, those rows are marked for organizer review instead of silently choosing a candidate by name or code.

The optional tab/copy/paste event collection in FR-10 is not enabled. No fabricated event counts are shown.

## Question templates

Columns: `prompt, A, B, C, D, answer, difficulty, pool`.

`answer` is A/B/C/D; `difficulty` is EASY/MEDIUM/HARD. At least two populated options are required, with no gaps; answer must point to a populated option. DOCX contains one table with this header. Import accepts at most 5,000 rows and 5 MB uploads, rejects spreadsheet formulas, and checks unpacked archive size. UI supports 2–8 options when editing directly.

## Manual scores and BCM

Columns: `subjectType, code, judge, criterion, score`.

`subjectType` is CANDIDATE or TEAM. Candidate codes must belong to submitted registrations in the selected competition. Team codes must already be registered by Admin. Every subject/judge sheet must contain exactly one score for every configured criterion. Unknown subjects/criteria, out-of-range scores, missing criteria and duplicate/imported score cells prevent the whole file from committing. Scores support up to four decimal places.

Supported configurable formula:

`judgePoints = maxScore × Σ(score[criterion] / max[criterion] × weight[criterion])`

`finalPoints = average(judgePoints)` rounded to 4 decimal places.

Weights must be positive and sum to 1. A scoring policy and its imported score cells are immutable; new policy versions retain earlier data and exports. No official BCM weights are prefilled. **The shared task sheet gives no official BCM formula, weights, judge aggregation or tie-break rules. Organizer confirmation is still required to certify that the configured formula matches BCM.** If BCM requires another aggregation rule, that rule must be added before official score publication. This feature exports internal summaries and does not publish results publicly.

## Verification

```powershell
# Root
npm run typecheck
npm run build

# Backend
npm run typecheck
npm run lint
npm run build
npm test

# Only an explicitly disposable database; never the application database.
$env:DATABASE_URL='postgresql://USER:PASSWORD@HOST:PORT/isnextgen_integration_test_admin'
$env:ISNEXTGEN_DISPOSABLE_TEST='1'
npm run test:admin
npm run test:integration
npm run test:contract
```

Integration tests apply both migrations and clear the explicitly marked disposable database between tests. They exercise real PostgreSQL constraints, session revocation, access control, account lifecycle, imports/exports, concurrent capacity enforcement, version retention, monitoring and weighted score calculations.
