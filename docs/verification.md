# Phase 1 verification

Verified locally on 26 October 2026 (Asia/Kolkata). This report distinguishes actual execution from future work.

## Executed checks

| Check | Result |
|---|---|
| Fast backend run (`pytest -q`, without infrastructure flags) | 19 passed; 11 infrastructure tests explicitly skipped |
| Full backend run with `AEL_TEST_DOCKER=1` and the local PostgreSQL test URL | 30 passed; real containers and temporary PostgreSQL schemas |
| React/Vitest component and API-client tests | 11 passed |
| Playwright against Vite on port 5174 | 3 passed |
| Playwright against built Nginx frontend on port 8080 | 3 passed; repeated on the final content version |
| Ruff lint and format checks | Passed; 33 Python source/test files formatted |
| Strict mypy | Passed; 13 application modules |
| ESLint, TypeScript, Vite production build | Passed |
| Alembic initial upgrade and `alembic check` | Passed; no schema drift |
| Sandbox, API, and web Docker builds | Passed |
| Compose startup | PostgreSQL, API, and Nginx started successfully with loopback ports |
| Saved executions after API/database container replacement/restart | All 10 checkpointed execution IDs and statuses preserved |
| Worker database-interruption recovery | Fresh heartbeat and exactly one live advisory lease after PostgreSQL restart |
| Duplicate worker | Refused with `A local worker is already running`, exit status 1 |
| npm dependency advisory check / clean container install | Zero reported advisories at verification time |

The browser tests use the actual Monaco editor, API, database and Docker runner. They paste a starter and observe failure, paste the trusted reference, run public checks, submit full verification, revisit history, filter the catalog, switch theme, and check a 390-pixel viewport. No API mocking is used in E2E. The final cosine suite contains 6 public and 12 private cases; RRF contains 5 public and 9 private cases.

Container probes verify infinite-loop termination, ordinary and raw excessive output, memory exhaustion, syntax/runtime exceptions, maximum 32 KiB source input, UID 65534, denied root writes, denied networking, kernel CPU/memory/PID settings, and cleanup. API tests cover request sizes, malformed requests, origin/host restrictions, unavailable execution, queue capacity, content changes, private-result redaction, correct/incorrect results, Run versus Submit credit, and persistence. PostgreSQL tests cover concurrent queue claims and real submission lifecycles.

## Acceptance evidence

| Requested Phase 1 criterion | Evidence |
|---|---|
| 1–5: local commands, connected UI, real catalog/detail, editable Monaco | Documented development and Compose modes; real browser flows |
| 6–10: correct Python submission, isolated execution, deterministic verification, distinct correct/incorrect feedback | Both challenges exercised through Monaco and the real worker |
| 11: timeout does not hang the application | Infinite loop killed and container removed within the bounded runner test |
| 12–13: PostgreSQL persistence and restart survival | Real lifecycle tests plus saved-ID checkpoint across container restarts |
| 14–15: two usable challenges and backend/frontend tests | Both full verification suites; 30 backend and 11 frontend tests passed |
| 16–18: setup docs, no provider secrets, explicit unavailable behavior | README/security/development docs; no model integration; 503 and disabled-control tests |

## Practical limits and remaining work

- This is a local, single-user release. The container configuration is not an independent security audit or authorization to expose hostile execution publicly. Abrupt host/worker termination may require removing specifically labeled orphan containers as documented.
- CI is configured but has not been executed on a hosted GitHub runner in this session. Nothing was pushed or deployed.
- Monaco is loaded on demand; its approximately 2.3 MB uncompressed editor chunk produces a non-failing Vite size warning. Further bundle tuning is deferred.
- The current Starlette test client emits a non-failing deprecation warning about its httpx adapter. All test assertions pass.
- Browser verification writes genuine test runs and trusted-reference submissions to the active local history. These are verification activity, not evidence of the user's own mastery. Use a separate database for future isolated E2E runs if preserving personal statistics matters.
- Solution reveal, expanded curriculum, spaced revision, study-goal settings, system design, practical labs, and AI mentoring remain on the prioritized roadmap. The dashboard reports stored execution evidence, not interview readiness.

## Minimal workspace redesign

The frontend now uses horizontal navigation, a challenge-first overview, a compact progress column, and a light theme by default with an optional dark theme. The catalog and Monaco workspace share the same restrained styling and larger reading text. Theme preferences use a new storage key; challenge drafts and saved submissions retain their existing keys and records.

The redesign passed all 11 frontend tests, ESLint, TypeScript, the production build, and the three existing real-browser flows. The browser navigation check also covers both themes and a 390-pixel layout. No backend, grading, content, or database behavior changed.


## Richer practice workbench

The clean layout now exposes working global search, topic/status filtering, challenge bookmarks, engineering notes, a paginated Activity page with execution inspection and Python export, and a dedicated Progress page. The overview includes the actual starter-code preview, concept shortcuts, stored execution counts, track completion and runtime status. Bookmarks and notes are browser-local; execution history remains in PostgreSQL.

All 11 frontend tests, ESLint, TypeScript, and the production build passed. The real browser suite was expanded to five passing tests: the two original challenge lifecycles, navigation/theme/mobile filtering, bookmark/search/note persistence, and execution inspection/export/progress. No backend grading or database schema changes were required.

## First-twelve curriculum milestone

The requested order is now R01, R02, R04, R05, R08, R09, G03, E01, E02, G06, P03, A02. All twelve have original complete packages, including a production failure variant, real public/private pytest contracts, a trusted reference and a deliberately buggy implementation.

Executed evidence:

- 211 case fixtures: **61 public + 150 private**. Standalone public/hidden pytest files parameterize the same contracts used by the external container grader.
- **254 backend/content/infrastructure tests passed**, including real PostgreSQL submission lifecycles for every challenge and sandbox resource probes.
- A subsequent focused run of **12 Docker reference/starter/mutant tests passed**, including the newly added realistic mutants for the original cosine and RRF packages.
- **11 frontend tests passed**; Ruff, formatting, strict mypy, ESLint, TypeScript and production builds passed.
- **16 browser tests passed**: twelve failing-starter → passing-reference → Run → Submit → persisted-history flows, plus navigation/theme/mobile behavior, bookmark/search/note persistence, execution export/progress, and curriculum/manual-review persistence.
- Browser tests used a separate uniquely named local PostgreSQL database on API port 8001 and frontend port 5175. They did not insert reference runs into the personal database.
- The updated built frontend on port 8080 passed a further navigation, theme and mobile smoke check. All 59 pre-existing personal submission IDs, content versions and statuses matched the saved checkpoint after the update. The temporary test services and database were removed; the personal worker remains ready.
- The 88-entry curriculum has exact module targets **64 coding / 10 design / 6 labs / 8 debugging**. Availability is **12 / 0 / 0 / 0**. The other 76 entries are explicitly planned metadata.
- Migration 0002 adds PostgreSQL engineering self-review separately from automated submissions. `alembic check` reports no drift. The original two challenge grading hashes are preserved by attaching curriculum identity/order outside those digests.

Review tasks cover performance reasoning, security boundaries, incident analysis, alternatives, quality and interview explanation. Completion is learner self-report, not objective certification. Algorithm-specific benchmarking beyond the declared suite deadline remains a review task rather than an invented performance score. Citation reference integrity does not claim semantic entailment. Tool eligibility does not authenticate human approval provenance or execute tools.

Existing warnings remain non-failing: Starlette's httpx test-client deprecation and Monaco's on-demand chunk size. Hosted CI has not been run in this local session. No repository push, external deployment, model call or financial spending was performed.
