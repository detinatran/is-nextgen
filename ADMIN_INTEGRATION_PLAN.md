# ADMIN FRONTEND → BACKEND API INTEGRATION PLAN
**IS-NextGen Manager Challenge 2026** | Strictly Admin Subsystem Only

---

## 📋 EXECUTIVE SUMMARY

The backend APIs (`/api/v1/admin/*`) are **100% complete** on `origin/main` for all 12 functional requirements (FR-01 to FR-12). The frontend Admin Dashboard currently uses **mock data** via `useResource()` hook that fetches from `/api/v1/admin/*` but the mock files are unused — the real integration is already wired via `adminApi()` in `src/lib/admin/api.ts`.

**This plan replaces all mock data with live backend calls**, adds missing UI components, and implements the complete admin workflow.

---

## 🎯 SCOPE BOUNDARY (CRITICAL)

| IN SCOPE (Admin Only) | OUT OF SCOPE (Candidate Team) |
|------------------------|-------------------------------|
| `src/app/admin/**` | `src/app/(auth)/register/**` |
| `src/components/admin/**` | `src/app/(dashboard)/exam/**` |
| `src/lib/admin/api.ts` → `/api/v1/admin/*` | `src/lib/exam/*` |
| Admin authentication (MFA login) | Candidate authentication (OTP email) |
| All FR-01 to FR-12 backend APIs | Candidate-facing flows |

---

## 🔌 BACKEND API ENDPOINTS VERIFIED (All on `main`)

### FR-01/02: Configuration & Authentication
```
GET    /api/v1/admin/configuration          → Configuration (competitions, pools, teams, policies)
GET    /api/v1/admin/session                → Session validation (used by proxy.ts)
POST   /api/v1/auth/login                   → Admin login → returns MFA_REQUIRED + challengeId
POST   /api/v1/auth/admin/mfa-challenges/:challenge/verification  → Verify OTP, sets cookies
POST   /api/v1/auth/logout                  → Clear session
```

### FR-03/04/05: Candidate Management
```
GET    /api/v1/admin/registrations?search=&school=    → Paginated/filtered list
GET    /api/v1/admin/registrations/export?format=csv|xlsx&search=&school=  → Export
POST   /api/v1/admin/candidates/:id/account           → {action: PROVISION|ENABLE|DISABLE|RESET|DELETE, reason?}
GET    /api/v1/admin/registrations/:id/video          → Stream video (S3 presigned)
```

### FR-06/07: Question Bank
```
GET    /api/v1/admin/questions                      → List with filters
POST   /api/v1/admin/questions                      → Create
PUT    /api/v1/admin/questions/:questionId          → Update (expects expectedVersion)
DELETE /api/v1/admin/questions/:questionId          → Archive
GET    /api/v1/admin/questions/:questionId/history  → Version history
POST   /api/v1/admin/questions/import               → FormData (xlsx|docx), ?commit=true
GET    /api/v1/admin/questions/template             → Download xlsx template
GET    /api/v1/admin/questions/template.docx        → Download docx template
```

### FR-08: Exam Schedules
```
GET    /api/v1/admin/schedules                      → List
POST   /api/v1/admin/schedules                      → Create
```

### FR-09: Assignments
```
GET    /api/v1/admin/assignments                    → List with filters
POST   /api/v1/admin/assignments                    → Assign/Reassign
GET    /api/v1/admin/assignments/:id/history        → Reassignment history
```

### FR-10: Live Monitoring
```
GET    /api/v1/admin/monitor                        → Real-time exam attempts
```

### FR-11: Round-1 Results
```
GET    /api/v1/admin/results/round-1?competitionId= → Leaderboard (MAX of finalized attempts)
GET    /api/v1/admin/results/round-1/export?competitionId= → Excel export
```

### FR-12: Manual Scoring (Rubric)
```
GET    /api/v1/admin/configuration                  → Policies for round 2/4
POST   /api/v1/admin/score-policies                 → Create policy version
GET    /api/v1/admin/scores/:policyId               → Aggregated scores + judge sheets
POST   /api/v1/admin/scores/import?policyId=        → FormData (xlsx), ?commit=true
GET    /api/v1/admin/scores/:policyId/export        → Excel export
POST   /api/v1/admin/teams                          → Create team code
```

---

## 📦 PHASE BREAKDOWN

### PHASE 1: CANDIDATE MANAGEMENT (Week 1) — FR-03, FR-04, FR-05
**Files to modify:** `src/components/admin/operations/Registrations.tsx`, create `VideoReviewModal.tsx` (already exists but needs wiring)

| Task | Description | Files |
|------|-------------|-------|
| 1.1 | **Live search & pagination** — Replace `useResource` with debounced server-side search via `adminApi('admin/registrations?search=...&school=...&page=...&limit=...')` | `Registrations.tsx` |
| 1.2 | **Account actions wiring** — Verify `POST /admin/candidates/:id/account` with all 5 actions (PROVISION, ENABLE, DISABLE, RESET, DELETE) | `Registrations.tsx` |
| 1.3 | **Video review modal** — Wire existing `VideoReviewModal` to `GET /admin/registrations/:id/video` for streaming playback | `Registrations.tsx` + `VideoReviewModal.tsx` |
| 1.4 | **CSV/Excel export** — Connect download buttons to `downloadAdmin('registrations/export?format=csv&...')` | `Registrations.tsx` |
| 1.5 | **Duplicate detection UI** — Client-side dedup on `RegistrationItem[]` (same email, MSSV, phone) → navigate to `/admin/candidates/duplicate-reviews` with selected conflicts | `Registrations.tsx` + `duplicate-reviews/page.tsx` |

**Acceptance:**
- [ ] Search by candidateCode, fullName, email, MSSV returns results < 500ms
- [ ] School filter dropdown populated from live data
- [ ] All 5 account actions work end-to-end with toast feedback
- [ ] Video modal plays streamed video from S3 presigned URL
- [ ] Export downloads correct filtered dataset
- [ ] Duplicate detection finds exact/near matches, links to review page

---

### PHASE 2: QUESTION BANK (Week 2) — FR-06, FR-07
**Files to modify:** `src/components/admin/operations/Questions.tsx`, `src/components/admin/operations/ImportPanel.tsx`

| Task | Description | Files |
|------|-------------|-------|
| 2.1 | **CRUD with optimistic locking** — PUT includes `expectedVersion`; handle 409 conflict with re-fetch prompt | `Questions.tsx` |
| 2.2 | **Server-side search** — Move filter to `adminApi('admin/questions?search=...&pool=...&difficulty=...')` | `Questions.tsx` |
| 2.3 | **Version history modal** — Fetch `GET /admin/questions/:id/history` on "Lịch sử" click | `Questions.tsx` |
| 2.4 | **Import panel (questions)** — Wire `ImportPanel kind="questions"` to `POST /admin/questions/import` with FormData | `ImportPanel.tsx` |
| 2.5 | **Template downloads** — Connect "Tải mẫu Excel/DOCX" to `downloadAdmin('questions/template')` | `ImportPanel.tsx` |

**Acceptance:**
- [ ] Create/Update/Delete/Archive all work with version conflict handling
- [ ] Search/filter hits backend, not client-side
- [ ] History modal shows all versions with diffs
- [ ] Import validates file, shows errors/preview, commits on confirm
- [ ] Both .xlsx and .docx templates download correctly

---

### PHASE 3: EXAM SCHEDULES & ASSIGNMENTS (Week 3) — FR-08, FR-09
**Files to modify:** `src/components/admin/operations/Exams.tsx` (Schedules, Assignments, Monitor, Round1)

| Task | Description | Files |
|------|-------------|-------|
| 3.1 | **Schedule CRUD** — POST `admin/schedules` with ISO datetime conversion (VN UTC+7) | `Exams.tsx:Schedules` |
| 3.2 | **Assignment flow** — POST `admin/assignments` with candidateId, scheduleId, reason | `Exams.tsx:Assignments` |
| 3.3 | **Capacity validation** — Disable full schedules in dropdown (already client-side, verify backend rejects over-capacity) | `Exams.tsx:Assignments` |
| 3.4 | **Reassignment history** — Fetch `GET /admin/assignments/:id/history` | `Exams.tsx:Assignments` |
| 3.5 | **Schedule filter** — Server-side filter on assignments list | `Exams.tsx:Assignments` |

**Acceptance:**
- [ ] Create schedule with pool validation (enough questions)
- [ ] Assign candidate to available schedule; reject if full
- [ ] Reassign with mandatory reason, history tracked
- [ ] Filter assignments by schedule works via backend

---

### PHASE 4: LIVE MONITORING & ROUND-1 SCORING (Week 4) — FR-10, FR-11
**Files to modify:** `src/components/admin/operations/Exams.tsx` (Monitor, Round1)

| Task | Description | Files |
|------|-------------|-------|
| 4.1 | **Auto-refresh monitor** — Keep 5s polling via `useEffect` calling `list.reload()` on `admin/monitor` | `Exams.tsx:Monitor` |
| 4.2 | **Server-side filters** — Move status/schedule filters to query params on `admin/monitor` | `Exams.tsx:Monitor` |
| 4.3 | **Round-1 leaderboard** — Fetch `admin/results/round-1?competitionId=` with rank, points, top40, tieAtCutoff | `Exams.tsx:Round1` |
| 4.4 | **Excel export** — Connect "Xuất Excel" to `downloadAdmin('results/round-1/export?competitionId=...')` | `Exams.tsx:Round1` |

**Acceptance:**
- [ ] Monitor updates every 5s without full page reload
- [ ] Filters reduce payload via backend query
- [ ] Leaderboard shows correct MAX(finalized attempts) scoring
- [ ] Tie-at-cutoff flagged for BTC review
- [ ] Export matches on-screen data

---

### PHASE 5: MANUAL SCORING (RUBRIC) (Week 5) — FR-12
**Files to modify:** `src/components/admin/operations/ManualScores.tsx`, `src/components/admin/operations/ImportPanel.tsx`

| Task | Description | Files |
|------|-------------|-------|
| 5.1 | **Policy versioning** — POST `admin/score-policies` with criteria array, weight sum = 1 | `ManualScores.tsx` |
| 5.2 | **Team codes** — POST `admin/teams` for TEAM subjectType | `ManualScores.tsx` |
| 5.3 | **Import scores** — `ImportPanel kind="scores"` → `POST /admin/scores/import?policyId=` with FormData | `ImportPanel.tsx` + `ManualScores.tsx` |
| 5.4 | **Score deviation UI** — After import, show warning if any candidate/team has >20% difference between judges on same criterion | `ManualScores.tsx` |
| 5.5 | **Aggregated view** — GET `admin/scores/:policyId` shows summary + raw judge rows | `ManualScores.tsx` |
| 5.6 | **Export** — `downloadAdmin('scores/:policyId/export')` | `ManualScores.tsx` |

**Acceptance:**
- [ ] Create policy with validated weights (sum = 1.0)
- [ ] Import validates all judges entered all criteria per subject
- [ ] Deviation >20% highlighted in results table
- [ ] Aggregated scores = average of judges, rounded 4dp
- [ ] Export includes summary + detail sheets

---

### PHASE 6: SHARED INFRASTRUCTURE & POLISH (Week 6)

| Task | Description | Files |
|------|-------------|-------|
| 6.1 | **Global error handling** — `adminApi` already redirects 401/403 to `/admin/login`; add toast for 5xx | `src/lib/admin/api.ts` |
| 6.2 | **Loading skeletons** — Replace "Đang tải…" with shimmer on all tables | `common.tsx` (Table, Panel) |
| 6.3 | **Empty states** — Illustrations + action buttons when no data | `common.tsx` (Table) |
| 6.4 | **Debounce utility** — Extract reusable `useDebounce` hook for search inputs | `src/hooks/useDebounce.ts` (new) |
| 6.5 | **Pagination component** — Replace infinite scroll with page controls (backend supports `page`, `limit`) | `common.tsx` (new Pagination) |
| 6.6 | **Type sync** — Ensure `RegistrationItem`, `QuestionItem`, `AssignmentItem`, `ScheduleItem`, `ScorePolicy` match backend DTOs exactly | `src/lib/admin/api.ts` |
| 6.7 | **Remove mock files** — Delete `src/mocks/admin/` after verifying no imports remain | `src/mocks/admin/*.ts` |

---

## 🧪 TESTING CHECKLIST PER PHASE

| Phase | E2E Scenarios |
|-------|---------------|
| 1 | Login → Candidates → Search "Nguyen" → Filter school → Provision account → Copy credentials → View video → Export CSV |
| 2 | Questions → Search "case study" → Create question → Edit (version bump) → Delete → Import 50 questions from Excel → Download template |
| 3 | Schedules → Create schedule → Assign 5 candidates → Reassign 1 with reason → View history |
| 4 | Start exam attempt (via candidate FE) → Monitor shows IN_PROGRESS → Submit → Monitor shows SUBMITTED → Round-1 shows score |
| 5 | Create policy v1 → Import scores for 3 judges × 5 criteria × 10 candidates → Verify deviation alerts → Export |

---

## 📁 FILES TOUCH SUMMARY

| File | Phase | Change Type |
|------|-------|-------------|
| `src/components/admin/operations/Registrations.tsx` | 1 | Major rewrite (live search, pagination, video modal, export) |
| `src/components/admin/candidate/VideoReviewModal.tsx` | 1 | Wire to real video URL |
| `src/app/admin/(dashboard)/candidates/duplicate-reviews/page.tsx` | 1 | Connect to live duplicate detection |
| `src/components/admin/operations/Questions.tsx` | 2 | Server search, optimistic locking, history |
| `src/components/admin/operations/ImportPanel.tsx` | 2, 5 | FormData upload, template downloads |
| `src/components/admin/operations/Exams.tsx` | 3, 4 | All 4 exports (Schedules, Assignments, Monitor, Round1) |
| `src/components/admin/operations/ManualScores.tsx` | 5 | Policy CRUD, team codes, deviation UI, import/export |
| `src/lib/admin/api.ts` | 6 | Error handling, type sync |
| `src/components/admin/operations/common.tsx` | 6 | Table, Pagination, skeletons, empty states |
| `src/hooks/useDebounce.ts` | 6 | New utility |
| `src/mocks/admin/` | 6 | Delete after verification |

---

## ⚠️ RISKS & MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend pagination params differ from frontend expectation | Phase 1,3,4 blocked | Verify exact query params: `page`, `limit`, `search`, `school` via Swagger or test call |
| Video streaming requires Range requests / CORS | Phase 1.3 broken | Test `GET /registrations/:id/video` returns proper `Accept-Ranges`, `Content-Type: video/mp4` |
| Optimistic locking 409 not handled gracefully | Phase 2 UX poor | Show modal: "Đã có người sửa. Tải lại phiên bản mới?" with diff |
| Score deviation calculation unclear | Phase 5.4 spec gap | Confirm with BTC: deviation = \|judge1 - judge2\| / max(criterion) > 20%? |
| Large Excel imports timeout | Phase 2,5 slow | Backend processes async? If so, add polling for import status |

---

## 🚀 START ORDER

**Begin with Phase 1.1** — Replace `useResource` in `Registrations.tsx` with debounced server search. This is the highest-impact, lowest-risk change that unblocks all other candidate workflows.

```typescript
// Current (mock-like):
const list = useResource<RegistrationItem[]>(`admin/registrations?${query}`, [])

// Target (live):
const [page, setPage] = useState(1)
const list = useResource<PaginationResponse<RegistrationItem>>(
  `admin/registrations?search=${search}&school=${school}&page=${page}&limit=20`,
  { data: [], total: 0, page: 1, limit: 20 }
)
```

---

## ✅ DEFINITION OF DONE (Per Phase)

- [ ] All mock data removed from touched components
- [ ] TypeScript compiles with `strict: true`, zero `any`
- [ ] `npm run build` passes (Next.js 16 + Turbopack)
- [ ] Manual E2E test against local backend (`npm run dev:backend` + `npm run dev`)
- [ ] No console errors/warnings in browser DevTools
- [ ] Accessibility: keyboard navigation, ARIA labels, color contrast maintained

---

**Next Action:** Begin Phase 1.1 — Refactor `Registrations.tsx` for live server-side search + pagination.