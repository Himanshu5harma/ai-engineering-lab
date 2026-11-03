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

## System Design Studio milestone

D01 enterprise RAG, D02 durable document ingestion and D03 version-aware support are implemented as original architecture exercises. Each has requirements, synthetic scale assumptions, constraints, five deliverable prompts, six scenario-specific rubric criteria and senior follow-ups. The curriculum now reports **12 coding / 3 design / 0 lab / 0 debugging** available, with 73 other entries planned.

Executed evidence:

- **273 backend/content/infrastructure tests passed**, including all existing coding verification, real PostgreSQL/Docker lifecycles, design persistence across API restart, rejected incomplete/invalid designs and concurrent initial/update saves with exactly one winning revision.
- **13 frontend tests passed**, including escaped SVG export and structural completeness boundaries.
- **22 browser tests passed** against a fresh temporary PostgreSQL database: all previous coding flows plus all three complete design workflows, drag positions, both connection forms and actual canvas handles, dependent-edge deletion, text/rubric persistence, SVG/Markdown/JSON downloads, conflicting tabs, browser draft recovery, mobile layouts and both themes. No browser API mocks were used.
- Ruff lint/format, strict mypy (16 application modules), ESLint, TypeScript and production builds passed. API/web Docker images built successfully; the clean npm install reported no advisories at verification time.
- Migration 0003 creates the additive design workspace table; `alembic check` reports no schema drift.
- The updated built frontend/API on port 8080 passed two additional navigation/theme/mobile smoke flows. All 59 personal submissions, 500 stored test-result records and existing review records matched a full saved checkpoint after the migration and container replacement. No test designs entered the personal database. Temporary browser services and their database were removed; the personal worker remains available.

Readiness checks structural completeness only: two connected components and four nonblank written sections. They do not judge architecture quality or grant coding credit. Rubric ratings are explicit learner self-assessments. Design saves are bounded to 80 KB, use content versions and optimistic revisions, and return HTTP 409 rather than overwrite a newer draft. Unsaved browser recovery is best effort; PostgreSQL persistence requires explicit save. JSON export is implemented; JSON import, automatic architecture grading and multi-user collaboration are not.

## Coding theme and editor milestone

The light/dark workspace theme is refined, with Midnight and Paper editor themes. The coding workspace now uses viewport height, supports fullscreen/focus modes, accessible draggable dividers, collapsible/resizable results and mobile Problem/Code views. The editor adds real local Ruff formatting and advisory diagnostics, find/replace, undo/redo, snippets, folding, command palette, starter comparison, copy/download and saved preferences.

Executed evidence:

- **15 frontend tests passed**. ESLint, TypeScript and production builds passed; the frontend container rebuilt successfully with locally bundled WASM and workers.
- **26 real-browser flows passed** against the isolated PostgreSQL/API/worker environment: all twelve coding lifecycles, existing catalog/history/review flows, all three design exercises and four new editor workflows. The new cases verify actual formatting, one-step undo/redo, the format shortcut, syntax-error preservation, lint findings/navigation, find, download, viewport sizing, keyboard resizing, focus/fullscreen/Escape, comparison preservation, preferences across reload, mobile editing and delayed-format stale-edit protection.
- A further **four focused browser flows passed** after final UI adjustments, including opening the command palette from shortcut help. The API, schema, content packages, queue and judge were unchanged; the backend-only suite was not rerun for this frontend change.
- The same **four editor flows passed against the rebuilt Nginx frontend on port 8080**, proving that its local WASM and workers load in the built app. Every checkpointed personal record was preserved: 60 submissions and 506 test results, with no review/design records added by these checks. Temporary browser services and their database were removed.
- The personal execution worker was restarted after the final availability check found it stopped; `/api/v1/execution` then reported ready.

Formatting/linting run in a WebAssembly browser worker, without Python execution or a formatter service. Diagnostics do not certify correctness or block deterministic verification. The first-use WASM asset is approximately 10.9 MB uncompressed; the larger on-demand Monaco chunk retains the non-failing build warning. Python language-server/type analysis, JSON/project-file editing and AI completions are not implemented.

## Simplified editor milestone

The current editor replaces the previous expanded controls with one file row: font size, Format and Reset, alongside saved-draft status. The app theme controls the editor appearance. Removed comparison, background lint/problems, separate editor theme/settings, shortcut dialogs, extra action buttons and the redundant statusbar. Keyboard undo/redo, find/replace and formatting remain. Fullscreen/focus, workspace splits, Run/Submit, results and saved execution history remain available.

- **15 frontend tests passed**, with ESLint, TypeScript and production builds passing.
- **26 real-browser flows passed** against the isolated test database. The four updated editor cases verify the minimal toolbar, no WASM request before Format, formatting/keyboard undo/redo, syntax-error preservation, fullscreen/focus, resizing, migration of legacy font preferences, theme inheritance, reload/draft preservation, mobile layout and delayed-format protection.
- The formatter worker and WASM now load on request, with no background lint work. Its error, timeout and stale-edit protections remain. Old code draft keys are unchanged; old editor preferences retain font size only.
- All four simplified-editor flows also passed against the rebuilt frontend on port 8080. All 60 personal submissions and 506 test-result records matched the saved checkpoint; no test review/design records were added. The personal worker remained ready, and the temporary test services/database were removed.

This is a frontend-only simplification. The API, schema, curriculum and deterministic grading are unchanged; the backend-only suite was not rerun.

## Site alignment and visible output milestone

The execution output pane now opens by default with an explicit empty state, visible Hide/Show controls, resize limits and independent scrolling. The challenge breadcrumb, title/ID/difficulty and save/focus/fullscreen actions occupy aligned rows. Shared layout styles align navigation and content gutters, page headings, cards and section spacing across Overview, Coding Arena, Activity, Progress, Curriculum and Design Studio. The simplified editor remains in place; mobile topic filters use a single scrollable row.

- **16 frontend tests passed**, including a regression for default-visible output and hide/reopen behavior.
- **28 browser flows passed** in the isolated PostgreSQL/API/worker environment. The two added layout flows exercise the annotated 1477×871 desktop view, visible output within desktop/mobile viewports, non-overlapping title/actions, button baselines, shared section edges, six page layouts at desktop and 390-pixel widths, and aligned design-card actions.
- ESLint, TypeScript and production builds passed. No API, schema, content package or judge changes were required.
- Six focused editor/layout browser flows also passed against the updated built frontend on port 8080. The annotated in-app browser tab was refreshed and visually confirmed to show the simplified editor, aligned header and expanded output. All 60 personal submissions and 506 test-result records matched the saved checkpoint; the temporary test services/database were removed and the personal worker stayed ready.

## Architecture, reliability and design refinement — 2026-10-30

Implemented the approved incremental conventions from the inspected official FastAPI template: focused routers/shared dependencies, explicit Pydantic responses, an OpenAPI-generated TypeScript SDK, locally owned Radix/shadcn controls, semantic theme tokens and reproducible checks. See [the decision record](decisions/2026-10-refinement.md).

Resolved design-detail cache staleness, review draft loss on unmount, conflicting-tab recovery deletion, inaccessible previous-version designs, unsafe refresh/load races, the proxy's fixed Host header and unbounded progress ORM loading. The editor remains minimal; results start compact and keep code space. Design Studio uses the remaining viewport with scrollable/collapsible instructions and independently scrollable writing, review and inspector panels. Mobile Activity's hidden table header is contained within its scrolling region.

| Verification | Actual result |
| --- | --- |
| Complete Python/content/PostgreSQL/Docker suite | **280 passed, 8 skipped**. The eight actual-proxy tests are intentionally run separately below. Includes real isolated grading, resource/network boundary probes, first-save/update races, UTC aggregation and 0003→0004 preservation of existing review/design records. |
| Actual production Nginx Host/Origin tests | **8 passed**, separately, through a temporary loopback proxy. Both valid hosts reach the API and retain hostname/port in redirects; invalid static/SPA/API hosts are rejected and write origins remain restricted. |
| Frontend component/unit suite | **21 passed**. Includes default-visible output, clean/dirty refresh behavior, independent recovery, late saves after navigation, load-versus-typing protection and content-version refresh preservation. |
| Full isolated browser suite | **41 passed** on a fresh temporary PostgreSQL database. Includes all twelve coding lifecycles, three design workflows, saved-design navigation/reopen, failed review saves, tab/navigation drafts, conflicts/recovery, delayed save edits, previous-version export/carry-forward, real formatter behavior and keyboard/layout checks. |
| Built application through Nginx | **6 browser flows passed** against current production assets on temporary port 8081: formatting/undo/find, stale-format protection, focus/fullscreen/resizing, preferences/themes/mobile and shared site layouts. No personal deployment update was performed. |
| Static/build checks | Ruff lint/format, strict mypy, ESLint, TypeScript, Vite production build, generated API freshness and whitespace checks passed. An intentional generated-SDK modification was correctly rejected, then restored. |
| Workflow | CI YAML parsed and was updated to reproduce the isolated database, browser, build and actual-proxy checks. Hosted GitHub Actions was not run; no changes were committed or pushed. |

Captured and visually inspected representative coding, design and website pages in light/dark themes at **1366×768, 1477×871, 820×1180 and 390×844**. Eight pages across all combinations produced 64 screenshots. Checks cover usable code width, font/format/reset/run/submit controls, output, minimum twelve default-font code lines on the laptop, canvas allocation, keyboard tab navigation, mobile Activity inspection and save/export access. The gallery is `output/playwright/refinement/index.html`; dimensions are recorded in `screenshots.json`. Screenshots show isolated test data, not personal progress.

All checkpointed personal values matched after verification: **60 submissions, 506 test-result rows, zero review/design rows**, with all **12 grading identities** unchanged. The personal database remains at migration **0003** and its original API/frontend remain running on 8080 with the execution worker ready. Migration 0004 and revised source were exercised only in isolated verification databases. Temporary test services, the proxy and database were removed afterward.

Non-failing warnings remain: Starlette's httpx TestClient deprecation, Alembic's legacy path-separator default during migration tests, and Vite's large lazy editor/runtime chunk warning. The formatter WASM remains approximately 10.9 MB uncompressed and loads only on demand. Browser recovery is best effort; missing original briefs for legacy previous-version drafts cannot be reconstructed. JSON import, public multi-user ownership and automated architecture-quality grading remain outside this pass.

## Local server refresh after user request

The user subsequently requested a fresh server. Rebuilt the API/frontend images, backed up PostgreSQL, applied additive migration **0004**, recreated the local API/frontend containers and restarted the trusted host worker. A web test fixture was made self-contained after the container build exposed its dependency on content outside the web build context; its regression test and ESLint passed, and the container production build then passed.

The refreshed application on **http://127.0.0.1:8080** serves the current frontend and API contracts. Health, worker availability, localhost access and unexpected-Host rejection passed. Every checkpointed value in all **60 submissions and 506 test results** was preserved, as were all twelve grading identities. The database backup and refresh metadata are retained in ignored `.cache/` files.

## shadcn/ui theme pass — 2026-10-31

Adopted Tailwind v4 and adapted official shadcn new-york shared controls, with a Neutral light/dark palette and blue primary actions. See decisions/2026-10-shadcn-theme.md for source attribution, dependency pins and CSS-layer choices.

Passed: 21 frontend tests; ESLint; generated API freshness; Prettier/diff checks; TypeScript/Vite and clean Docker web builds; six editor/layout browser tests against actual Nginx on 8080. A read-only browser sweep passed 64 page/theme/viewport combinations across 1366×768, 1477×871, 820×1180 and 390×844, with zero browser errors or practice API writes. The default laptop editor retains 12 code lines with output open; key execution and Studio Save/Export controls fit. Tab keyboard navigation, dialog focus trapping, Escape and focus restoration passed. Mobile Studio Save clipping found during visual review was fixed. Screenshots: output/playwright/shadcn/index.html, including final captures from the updated 8080 server.

Backend tests were not rerun because this pass changes no backend, database, content/grading identity, or execution-worker code. Hosted CI was not run. Existing Vite bundle-size warnings remain. Only the local web container was refreshed; no personal data was modified.

## Editor investigation and feature verification — 2026-11-01

Reproduced and fixed three editor defects:

- Cmd/Ctrl+Enter and Cmd/Ctrl+Shift+Enter queued execution but also reached Monaco's insert-line commands, adding blank lines to the draft. The workspace now consumes its execution shortcuts before Monaco handles them. A real-browser regression first reproduced the extra newline and now verifies that both shortcuts preserve the exact source, show results, and restore saved code safely.
- Replace All's keyboard shortcut was captured as Run, including Cmd+Enter inside Find/Replace. Execution shortcuts now leave dialog keyboard actions alone and ignore Alt-modified combinations. Mac and Windows keybinding profiles verify replacement and zero unintended submission requests.
- The minimal Monaco imports omitted its Codicon font stylesheet. Find/Replace and other editor icons rendered as missing glyphs. The font and modifiers are now bundled locally; browser checks require an actual loaded font face, and the built app serves the 80,340-byte font successfully.

| Verification | Result |
| --- | --- |
| Full Python/content/PostgreSQL/restricted-Docker suite | **280 passed, 8 skipped**; the eight proxy checks ran separately below. Temporary PostgreSQL schemas/databases were used. |
| Frontend component tests | **21 passed**. |
| Full isolated browser feature suite | **46 passed** for the shortcut fixes. Covers all twelve coding lifecycles, three design workflows, drafts/recovery/conflicts, previous-version export, reviews, navigation/search/bookmarks/notes, history/export/progress/curriculum, keyboard controls and the eight light/dark viewport combinations. |
| Final editor/layout flows after the icon-font fix | **11 passed** on the test frontend and **11 passed** through the actual Nginx config and built assets on 8081. Includes typing/indentation, keyboard and mouse insertion at 12/15/24 px, protected Reset, exact-source execution shortcuts, private-result redaction, restoration, Mac/Windows Find/Replace, real icon-font loading, formatter undo/stale-edit protection, resizing/fullscreen, persistence and responsive layouts. |
| Actual Nginx Host/Origin regressions | **8 passed**. |
| In-app Mac browser smoke checks | Native typing, Undo, formatting, protected Reset and Run/Submit shortcuts checked on an isolated origin/database. Both execution shortcuts preserved the editor's source. |
| Additional editor checks | Comment/uncomment, indent/unindent, Replace All button, three progressive hints and six public-input disclosures passed. |
| Static/build checks | Ruff lint/format, strict mypy, ESLint, generated API freshness, TypeScript/Vite, new browser-test formatting, whitespace and Docker web build passed. |

The mouse-placement test now measures live text nodes atomically and uses a locator click that waits for stable layout. An initial version could retain a detached Monaco line after a font change and incorrectly click coordinates 0,0; this was test synchronization, rather than an application editing defect. The functional insertion check passed three consecutive focused runs and the final built-app suite.

All personal-record fingerprints matched: **60 submissions, 506 test results, zero database review/design rows, and all 14 stored content-version rows**. Personal browser tabs/drafts were not edited. Only the local web container was refreshed; API, database and personal worker stayed running. The final health check reported the worker ready and the bundled icon-font URL returned HTTP 200. Temporary test services/database were removed afterward.

Screenshots: `output/playwright/editor-fix/verified-editor.png` shows the corrected editor controls on isolated test data; current layout captures are under `output/playwright/refinement/`. Hosted CI and complete Firefox/Safari suites were not run. Existing non-failing Starlette/Alembic deprecation and Vite bundle-size warnings remain.

## LeetCode-inspired coding workspace — 2026-11-01

Replaced the focus/fullscreen workflow with a permanent split workspace: Description/Hints/Notes/Review on the left, code on the right, and a resizable Test cases/Test results/History panel below code. The compact header aligns challenge identity, bookmark, Run and Submit. The Code/Python row retains only draft status, font size, Format and protected Reset. Public fixtures now have individual case tabs with arguments and expected values/exceptions; case selection survives switching to results and back. Run/Submit and history selection expand results automatically. Mobile uses Description/Code views.

Removed the old fullscreen effects and overlapping editor CSS rather than layering new geometry on them. `features/arena/arena.css` owns the workspace layout, and shared shadcn/Radix tabs support a line variant. Source-draft/notes/preference keys, formatter undo/stale-edit guards, API contracts, content/grading identities and the sandbox remain unchanged. The prior shortcut and Codicon fixes remain covered.

| Verification | Actual result |
| --- | --- |
| Frontend component tests | **22 passed**, including public case display, collapse/reopen and case-selection retention. |
| Full isolated browser suite | **46 passed** on a fresh temporary PostgreSQL database. Includes twelve challenge lifecycles, editor typing/selection, shortcuts, formatting/Undo, Reset/restoration, saved drafts, reviews/design recovery and responsive site flows. |
| Built application through actual Nginx | **11 browser flows passed** against production assets and the isolated API. |
| Actual proxy security regressions | **8 passed** for Host/Origin handling. |
| Static/build checks | ESLint, generated API freshness, TypeScript/Vite, touched frontend Prettier checks, whitespace and Docker web build passed. |
| Visual and keyboard usability | Light/dark checks passed at **1366×768, 1477×871, 820×1180 and 390×844**. Default laptop code space is **13 lines** with test cases open. Run/Submit/Format/Reset fit; panel resizing, tab arrows, mobile Description/Code, output collapse and public-case selection work. |

The local web service was refreshed on **http://127.0.0.1:8080** without restarting the personal API, database or execution worker. Current assets and the bundled icon font return HTTP 200; health reports the isolated Python worker ready. Final screenshots are in `output/playwright/leetcode/`, including `laptop-light.png`, `laptop-dark.png` and mobile Description/Code views.

The final built app passed the same eight theme/viewport checks. All personal-table fingerprints matched: **60 submissions, 506 test results, zero review/design rows and 14 stored content-version rows**. Personal browser tabs and drafts were not edited. Temporary test API/Vite/worker processes and the helper-created database were removed after verification.

This is a frontend layout change. The complete backend suite was not rerun; the actual-proxy security suite was. Hosted CI and full Firefox/Safari suites were not run. The existing non-failing large lazy-editor bundle warning remains. Public case inputs are read-only; custom case execution is not introduced.
