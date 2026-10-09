# BLOCKER_REMEDIATION_F01_F05_REPORT

**Result: findings from `POST_REMEDIATION_INSPECTION_REPORT.md` (V2/F03/FR14/F06 + obsolete fixtures) remediated in targeted scope; F05-AUTHORIZATION remains PARTIAL. NOT claimed production READY: full regression, frozen-DB validation and Docker build/smoke were NOT re-run in this batch.**

## Batch 3 — remediation of the 0830ff7 post-inspection findings (this commit)

Baseline `0830ff7`, branch `backend_candidate`. Scope limited to: F02-SUBMIT, FR14-BINDING, F03-CAPABILITY, F03-REVOCATION, F06-CONTRACT, two obsolete security fixtures. Frozen SQL/seed, Prisma schema/migrations, verification evidence, and the review tests (`review-0830ff7.spec.ts`, `review-0830ff7-smoke.cjs`) were not modified. F01/F04/MFA PASS behavior untouched.

| Finding | Fix (file → change) | Targeted test(s) | Result |
| --- | --- | --- | --- |
| F02-SUBMIT (HIGH): optional `writerGeneration` let an old same-cookie logical writer finalize after takeover with an empty body | `src/attempts/dto/attempt.dto.ts` → `SubmissionDto.writerGeneration` required (`@ApiProperty`, `@IsInt @Min(1)`); `src/attempts/attempts.service.ts` → `submitAttempt` takes a required generation and always asserts it against the authoritative writer after the attempt lock (no omission bypass); `src/attempts/attempts.controller.ts` wires it. Affected test inputs updated to the new contract (submission-scoring submit helper, exam-access quota, concurrency C3, post-zcode release-gate, post-remediation V-F02-current-submit) — no bypass kept for old tests | `V2-F02` | PASS |
| FR14-BINDING (HIGH): controller required `DRAFT_UPLOAD`, `bindVideo` service required `READ_EDIT_PROFILE` → every binding 403 | `src/media/media.service.ts` → `bindVideo` `assertGrant` scope `DRAFT_UPLOAD` (matches controller). Registration DRAFT/sealed, object ownership and READY checks unchanged; no guard removed; no edit authority granted to the initial capability | `V2-F03-initial-video-binding`; media.spec `accepts a valid small MP4` | PASS |
| F03-CAPABILITY (HIGH): anonymous draft wrote `verified_email_normalized`/`email_verified_at` without proof; the unverified 14-day token could read the submitted (and later edited) profile | `src/registrations/registrations.service.ts` → initial capability is no longer a `registration_access_grants` row: `issueDraftCapability` binds it via append-only audit evidence (`registration.draft_capability_issued` metadata `tokenHash`, target registration, TTL); `issueGrant` is verified-recovery-only with the actual proof time mandatory. `src/registrations/registration-capability.guard.ts` → resolves both token kinds (verified grants table, audit-bound DRAFT_UPLOAD capability). `src/registrations/{registrations.service,registrations.controller}.ts` → `GET /registrations/:id` denies the DRAFT_UPLOAD capability once state ≠ DRAFT (no private profile read after submission; PATCH already scope-gated). Photo/video upload, binding and initial submission still work with the initial token; no User/exam access created | `V2-F03-01`; `V2-F03-private-read` | PASS |
| F03-REVOCATION (HIGH): a grant revoked while PATCH waited on the registration row lock still committed | `src/registrations/registrations.service.ts` → `updateRegistration` receives the verified grant identity (`registrationAuth.grantId`) and re-checks resource/scope/expiry/revocation against the current time INSIDE the transaction immediately after `lockRegistration`; a grant revoked during the lock wait now fails closed (401) with revision/profile unchanged | `V2-F04-revoked-grant` | PASS |
| F06-CONTRACT (MEDIUM): submission generation optional in Swagger; `SessionResponse` empty; no login union; recovery verification had no response schema; attempt DTOs unwired | `src/attempts/dto/attempt.dto.ts` → submission schema requires `writerGeneration`; `src/identity-access/auth.controller.ts` → `SessionResponse` concrete fields (nested user/csrfToken/mfaVerifiedAt), login 200 `oneOf: [SessionResponse, MfaRequiredResponse]` via `@ApiExtraModels`; `src/registrations/{registrations.controller,dto/registration.dto}.ts` → recovery request 202 + verification 200 response schemas matching runtime; `src/attempts/attempts.controller.ts` → existing `AttemptView`/`AnswerSavedResponse`/`SubmissionResponse`/`TakeoverResponse` wired to their endpoints. No runtime change made for Swagger's sake | `V2-contract-submission`; `V2-contract-login`; `V2-contract-recovery` | PASS |
| LOW: `security.spec.ts` expired/revoked fixtures searched a `READ_EDIT_PROFILE` grant right after anonymous draft → Prisma P2025 | `test/integration/security.spec.ts` → setups obtain the grant through real verified recovery (`recoverRegistration`), then expire/revoke that grant; the 401 rejection assertions are unchanged | `expired registration capability`; `revoked registration capability` | PASS |

### Batch 3 targeted results (disposable PostgreSQL 16 container, tmpfs PGDATA; Jest independent + integration + release-gate configs)

| Run | Result |
| --- | --- |
| `review-0830ff7.spec.ts` — the 8 originally-failing finding cases | **8 PASS / 0 FAIL** |
| `review-0830ff7.spec.ts` — directly-affected preservation cases (V2-F03-expiry/resource/replay/grant-expired/grant-revoked, V2-F04-CAS/deadline-at-lock/submitted-deadline) | **8 PASS / 0 FAIL** |
| media.spec + security.spec targeted fixtures (`accepts a valid small MP4`, expired, revoked) | **3 PASS / 0 FAIL** |
| Behavior-preservation picks: registration draft-read, remediation-flows F03-01..09 + F04-02..08 (10), attempt-submission contract picks (4), post-remediation V-F03 (4) + V-F02 (2), release-gate picks (5) | **25 PASS / 0 FAIL** |
| Build / Typecheck / Lint | PASS / PASS / PASS |

Targeted total: **44 PASS / 0 FAIL** (no skips inside the selected sets). F05 MFA cases (`V2-F05-*`) intentionally not re-run — that flow was not modified. Distinguish: the above are exactly the tests executed; everything else in the repo was not run in this batch.

### Batch 3 remaining limits

- **F05-AUTHORIZATION remains PARTIAL:** the AdminGuard permission / reviewer-assignment layer is still absent (out of this batch's scope per instruction).
- `V2-F05-*`, full integration suites, frozen-DB validation (103), Docker production build/smoke, full contract suite: NOT re-run — no full-regression or production-READY claim is made.
- The initial DRAFT_UPLOAD capability is TTL-bound and audit-bound (no DB row → no row-level revocation; it grants no private read/edit and every upload/bind/submit remains state-gated); the verified grant keeps binding/expiry/revocation.
- Operational withdrawal/retention workflows remain documented gaps (previous batches).

Remediation of the five blockers from `POST_ZCODE_INSPECTION_REPORT.md` and the follow-up findings from `POST_REMEDIATION_INSPECTION_REPORT.md` (F01-E, F06, F07). Baseline: commit `a033ac9` + the prior uncommitted remediation. Branch: `backend_candidate`.

## Finding → cause → fix → targeted test → result

### F01 — CRITICAL: OTP identity ambiguity → **RESOLVED (previous batch) + F01-E resolved now**
- **Cause:** `ChallengeService.consume` located challenges by purpose + newest-N OTP comparison; two accounts receiving the same six-digit code could reset the wrong account.
- **Fix (already reviewed PASS by the independent verifier):** exact `challengeId` + code consumption (`consumeById`), user identity derived only from the consumed row's `user_id`, no global OTP lookup anywhere, purpose binding, row-locked consumption, durable attempt budgets, decoy locators for unknown accounts (no enumeration). Files: `src/identity-access/challenge.service.ts`, `src/identity-access/auth.service.ts`, `src/identity-access/dto/auth.dto.ts`, `src/identity-access/auth.controller.ts`, `src/fixtures/fixtures.controller.ts`.
- **F01-E (this batch):** expiry was evaluated with an application timestamp captured *before* the transaction, so a challenge expiring while its consumer waited on the row lock was still accepted (verifier: 200 instead of 401).
- **Fix:** the authoritative PostgreSQL clock is read **after** `FOR UPDATE` is held (`SELECT clock_timestamp()`) and drives the expiry decision and `consumed_at`. File: `src/identity-access/challenge.service.ts`.
- **Targeted tests:** `V-F01-0A/0B`, `V-F01-03/04`, `V-F01-05`, `V-F01-06`, `V-F01-07`, `V-F01-08`, **`V-F01-expiry-at-lock`**, `V-F01-other-*` (4 purposes), `V-F01-no-locator`, `V-F01-09`, `GAP-OTP-IDENTITY`, `GAP-OTP-BUDGET`, `GAP-OTP-RACE` — all PASS (see `docs/post-remediation-fixes/independent.json`, `release-gate.json`).

### F02 — HIGH: writer generation and current authority → **RESOLVED**
- **Cause:** `start`/active-attempt responses omitted `writerGeneration`; save/flag treated it as optional (omitted accepted); submission had no generation contract (and `EmptySubmissionDto` made the field impossible); session revocation / user disablement between the guard and the in-transaction lock acquisition was not rechecked.
- **Fix:** `writerGeneration` exposed in the start response, the active-attempt view and the takeover response; save/flag DTOs **require** it (missing → 400; mismatch → 409 `STATE_CONFLICT` with `details.reason = STALE_WRITER_GENERATION`); submission accepts an optional generation (omitted = current-writer binding check, supplied stale = 409) so the current writer can always submit through the existing empty-body API; every candidate mutation (save, flag, takeover, submit) re-validates current session validity (not revoked, not expired) and ACTIVE user status **inside the transaction, after the authoritative attempt lock**. Files: `src/attempts/dto/attempt.dto.ts`, `src/attempts/attempts.service.ts`, `src/attempts/attempts.controller.ts`, `src/exam-operations/exam-access.service.ts`, `src/exam-operations/dto/exam-access.dto.ts`.
- **Targeted tests:** `V-F02-01`, `V-F02-02/03/04/10`, `V-F02-05`, `V-F02-required-answer`, `V-F02-required-flag`, `V-F02-06`, `V-F02-current-submit` (FR-22 regression), `V-F02-09`, `V-F02-07/08-revoked`, `V-F02-07/08-disabled`, `V-F02-race-takeover-first`, `V-F02-race-save-first`, `GAP-WRITER-GENERATION` — all PASS (real PostgreSQL lock-wait observation included).

### F03 — HIGH: verified registration recovery → **RESOLVED**
- **Cause:** anonymous draft creation issued a 14-day `READ_EDIT_PROFILE` grant recording `email_verified_at` without any proof; no recovery flow existed, so unverified tokens were the only path to private edit authority.
- **Fix:** the anonymous initial flow now receives exactly **one** capability with the `DRAFT_UPLOAD` (initial submission) scope — uploads, binding, own-registration read and first submission work unchanged (the response keeps `profileToken` as a documented deprecated alias of `uploadToken`); `READ_EDIT_PROFILE` authority is issued **only** by the new verified recovery flow: `POST /registrations/:registrationId/recovery-requests` (binds a `REGISTRATION_RECOVERY` challenge to the EXACT registration via an append-only `audit_events` binding row written in the same transaction; decoy locator for unknown/mismatching emails) and `POST /registrations/recovery/verifications` (exact challenge + OTP; current registration email must still match; issues an opaque, expiring, revocable `READ_EDIT_PROFILE` grant whose `email_verified_at` is the actual proof time). No User is created; no exam access is granted; wrong-resource + valid OTP cannot grant anything. Files: `src/registrations/registrations.service.ts`, `src/registrations/registrations.controller.ts`, `src/registrations/dto/registration.dto.ts`, `src/media/media.controller.ts` (binding scope → `DRAFT_UPLOAD`), `src/identity-access/challenge.service.ts` (injected).
- **Schema note:** `registration_access_grants.email_verified_at` is NOT NULL in the frozen DDL; initial draft capabilities record their issue time as delivery evidence, recovery grants record the real proof time. No fake verification claims remain: no `READ_EDIT_PROFILE` grant exists without proof.
- **Targeted tests:** `V-F03-01`, `V-F03-02/09/10`, `V-F03-03`, `V-F03-05/06/07`, `V-F03-04/08-contract`, plus new `F03-01..F03-09`, `F03-decoy` in `test/integration/remediation-flows.spec.ts` — all PASS.

### F04 — HIGH: registration deadline + optimistic concurrency → **RESOLVED**
- **Cause:** `PATCH /registrations/:id` had no server-authoritative deadline and no revision CAS; submitted registrations were rejected wholesale, conflating the mutable current profile with the immutable submitted evidence.
- **Fix:** `expectedRevision` is in the contract (schema-required; an absent or stale revision fails closed with 409 `REVISION_CONFLICT` + `details.currentRevision`); the competition close time is enforced server-side for DRAFT and SUBMITTED alike (409 `DEADLINE_PASSED`); SUBMITTED registrations now allow current-profile edits before the deadline while `submitted_profile`, the submitted video binding and the READY photo stay untouched (frozen trigger + explicit service guards); email changes and consent rewrites are rejected after submission. File: `src/registrations/registrations.service.ts`.
- **Setup adaptation (documented per remediation contract):** F04 test setups — including the independent verifier's — obtain the edit grant through the real recovery flow (`recoverRegistration` helper) instead of the initial draft capability, because the initial capability no longer carries edit authority. `V-F04-05/06/07/08` additionally posts `expectedRevision` now that the contract requires it. All assertions are unchanged.
- **Targeted tests:** `V-F04-01..V-F04-09`, `V-F04-legacy-concurrent`, plus new `F04-02/03/04` and `F04-05/06/07/08` in `remediation-flows.spec.ts` — all PASS.

### F05 — HIGH: Admin MFA → **RESOLVED**
- **Cause:** ADMIN password login issued a full session with `mfa_verified_at = null`; no MFA state, verification endpoint or authorization gate existed; the legacy session survived restarts.
- **Fix:** ADMIN login returns the machine-readable **`MFA_REQUIRED`** intermediate state with the exact challenge locator and issues **no session** (not even a limited one); `POST /auth/admin/mfa-challenges/:challenge/verification` consumes the exact user-bound `MFA` challenge and creates the session with `mfa_verified_at` committed at creation (mail delivery failure can never promote authority — the OTP lives in the durable notification intent); the new `AdminGuard` requires valid session + ACTIVE user + ADMIN role + **current-session MFA proof** (the `mfa_enabled` flag is enrollment metadata, never proof; legacy `mfa_verified_at = null` sessions are denied, including after restart — truth is the PostgreSQL column); a minimal `GET /admin/session` probe exposes the authorization boundary without adding Admin business features. Students log in normally. Files: `src/identity-access/auth.service.ts`, `auth.controller.ts`, `session.service.ts`, `guards/admin.guard.ts`, `admin.controller.ts`, `src/common/http/request-context.ts`.
- **Targeted tests:** `V-F05-01`, `V-F05-02..07-contract`, `V-F05-08/09`, `V-F05-10` (restart), `V-F05-11`, plus new `F05-01..F05-11`, `F05-csrf` in `remediation-flows.spec.ts` — all PASS.

### F06 — MEDIUM: API contract freeze → **RESOLVED (for changed flows)**
- Concrete Swagger response schemas replace erased interfaces for the changed flows: login/MFA (`SessionResponse`, `MfaRequiredResponse`), challenge locators, attempt start/active/save/submit/takeover (incl. `writerGeneration`), registration response + PATCH, recovery request/verification. `PasswordResetDto.token` is no longer schema-required; `SaveAnswerDto`/`ReviewFlagDto` require `writerGeneration`; `UpdateRegistrationDto` requires `expectedRevision`. Generated artifact: `openapi.json` — 34 paths / 20 schemas.
- Targeted tests: `V-contract`, `V-F03-04/08-contract`, `V-F05-02..07-contract` — PASS.

### F07 — LOW: stale release-gate test → **RESOLVED**
- `SEC-OTP-EXPIRY` setup now sends `{challengeId, code}` per the current exact-challenge API (adaptation documented; the assertion — real expiry denied, proof unconsumed — is unchanged). Release gate: 29/29.

## Test evidence (targeted scope only)

| Suite | Result | Evidence |
| --- | --- | --- |
| Independent verification (`post-remediation.spec.ts`) | **43/43 PASS** (was 22/21) | `docs/post-remediation-fixes/independent.json` |
| Existing release gate (`post-zcode.spec.ts`) | **29/29 PASS** (was 28/1) | `docs/post-remediation-fixes/release-gate.json` |
| Targeted flows (remediation-flows, registration, submission-scoring, concurrency, autosave, auth) | **79/79 PASS** | `docs/post-remediation-fixes/targeted-flows.json` |
| Contract | 2/2 PASS (fixtures regenerated incl. `writerGeneration`) | `backend/test/fixtures/api/` |
| Unit | 17/17 PASS | container run |
| Build / Typecheck / Lint | PASS / PASS / PASS (0 warnings) | host |

**Not re-run in this batch (previously PASS, out of targeted scope):** exam-access, media, security integration suites, full frozen-DB validator (103), Docker production smoke, full OpenAPI hardening (F07 of the original inspection), withdrawal/retention Admin workflows (F06 original). The frozen DDL is untouched: SHA-256 `100cab3c310f0908f8b21fbdb6d6b97e1ec6a65e7e41a8d4783ee5fcb09a0e86` verified.

## API contract changes (frontend-visible)

1. **Password reset / activation / email verification:** request endpoints return `{status, challengeId}` (decoy locator for unknown accounts); verification endpoints take `{challengeId, code}`; `password-resets` keeps deprecated `token` only to fail closed (401) for legacy token-only calls.
2. **Writer generation:** start response, active-attempt view (`attempt.writerGeneration`) and takeover response expose it; `PUT answers`, `PUT review-flags` require it in the body (missing → 400, mismatch → 409 + `reason: STALE_WRITER_GENERATION`); `POST submission` requires `{writerGeneration}` since Batch 3 (missing/stale → rejected; see Batch 3 table).
3. **Registration edit:** `PATCH` requires `expectedRevision` (schema-required; absent/stale → 409 `REVISION_CONFLICT`); deadline → 409 `DEADLINE_PASSED`; submitted registrations allow current-profile edits (email/consent/video/photo excluded).
4. **Registration recovery:** `POST /registrations/:registrationId/recovery-requests` → `{status, challengeId}`; `POST /registrations/recovery/verifications` → `{registrationId, profileToken, expiresAt}`.
5. **Admin login:** `MFA_REQUIRED` + `challengeId` (no cookies); `POST /auth/admin/mfa-challenges/:challenge/verification` → full session with server-committed MFA proof; `GET /admin/session` authorization probe.
6. **Registration draft capability:** one limited initial capability (audit-bound `DRAFT_UPLOAD`, Batch 3 modeling — no grants row, no verified-email columns); `profileToken` returned as a deprecated alias of `uploadToken`; uploads/binding/initial submission and DRAFT-state reads accept it; private profile read after submission and PATCH require the verified recovery grant.

## Database

**UNCHANGED.** No frozen DDL, seed, Prisma schema or migration edits; SHA-256 verified above.

## Remaining findings (not in this batch's scope)

- Original-inspection F06 (withdrawal Admin workflow) and F08 (retention cleanup) remain disclosed operational gaps; original F07 (complete OpenAPI response governance beyond changed flows) remains partial.
- Full-suite re-runs (exam-access, media, security integration; frozen validator; production Docker smoke) were intentionally not repeated in this targeted batch; a fresh independent release gate is the recommended next step.
