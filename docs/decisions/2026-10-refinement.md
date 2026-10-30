# Reliability, contracts and workspace refinement

This pass keeps the single-user local architecture. It adds no accounts, provider calls, curriculum entries, new queue or execution authority.

## Reference inspected

The official [FastAPI full-stack template at f4bcfaba](https://github.com/fastapi/full-stack-fastapi-template/tree/f4bcfaba7c85be3c6332cc74a20819f586dcdbc6) was inspected on 2026-10-30: `backend/app/api/main.py`, `api/deps.py`, `api/routes/items.py`, `frontend/package.json`, `openapi-ts.config.ts` and `components/ui/button.tsx`.

| Convention adopted | Application and reason |
| --- | --- |
| Focused routers and annotated shared dependencies | Challenge/curriculum, execution/submissions, design, review and progress/health routers share a typed application context and request-scoped SQLAlchemy sessions. Initialization and middleware stay in `main.py`. |
| Explicit public response models | Pydantic validates every JSON endpoint response. Private test redaction remains in the external grader's public view adapter. Content identities remain unchanged. |
| OpenAPI-generated client | A deterministic schema export generates types and named SDK methods. The existing fetch transport uses pinned `openapi-typescript` and `openapi-fetch`, rather than adopting the template's Axios runtime. There are no handwritten wire models or unchecked generic request casts. |
| Locally owned shadcn/ui components | Radix Slot, Tabs and Dialog plus class-variance-authority implement composable shared controls. The shadcn component patterns are adapted to semantic CSS, keeping the existing styling system instead of introducing a second utility framework. |
| Reproducible checks | `make check` detects stale generated output. CI uses an isolated browser database, real browser/Docker tests and the actual Nginx proxy configuration. |

SQLAlchemy/Alembic, npm, React Router, PostgreSQL queueing and the separate host worker remain. Authentication, SQLModel, TanStack Router, Bun, hosting and account management are not adopted.

## Draft state and concurrency

A dirty draft retains the revision on which editing began. Clean drafts can adopt newer server revisions. Save acknowledgements mark only the requested snapshot as saved; later typing stays dirty. The design detail cache is updated immediately after save, independently of catalog invalidation. Older acknowledgements cannot regress a newer cache revision.

Each browser document creates a new random writer identity, including duplicated tabs. Recovery keys contain kind, full content version and writer identity. A save removes only its own key. A small document-local registry preserves current state across route unmounts and late save responses. Reloads expose previous recovery copies explicitly. Browser storage remains best effort and is never labeled a PostgreSQL save.

Loading saved work exports the local version first and refuses to replace edits made while the fetch was pending. Content-version refreshes keep the open design intact until the learner explicitly exports and opens the new exercise. Review drafts retain notes and checklist changes across tab switches and routes. Both review and design saves use atomic revision checks, including first-save races.

Previous content-version designs are listed independently of the current workspace. They can be inspected and exported, or explicitly copied into the current draft under the current optimistic revision. The source version and source revision are recorded. Original rows stay untouched. Future saves record the authored exercise snapshot; pre-existing drafts cannot retrospectively recover an unavailable historical brief, and the UI says so. Carry-forward copies retain current rubric IDs; retired ratings remain in the previous draft/export.

Migration `0004` adds a review revision and nullable design snapshot/source fields without replacing existing content or documents. Apply it when updating the local application, before running the revised API. This implementation pass did not migrate or replace the personal deployment.

## Query and trust boundaries

Progress uses SQL aggregates for run/submission counts, distinct attempted/current solved versions and weekly UTC activity. Only five recent submissions load result rows; source is deferred. Review completion selects task IDs without notes. Full historical source and results remain available through history/detail endpoints.

Nginx has a rejecting default server and validates the raw Host header for the accepted server. It forwards the validated Host, including port, and replaces forwarded headers. FastAPI independently permits only localhost and 127.0.0.1. POST Origin restrictions remain. Actual-proxy tests check rejection on static, SPA and API routes, correct Host in API redirects, and allowed/denied write origins without creating activity.

No sandbox settings or grading paths changed. The API has no Docker socket and never executes learner code on the host.

## UI ownership

`tokens.css` owns semantic surfaces, typography and theme colors. `styles.css` owns shared page geometry and product components; the old layout override file was consolidated. `components/ui/ui.css` owns shared variants/states. `features/design/studio.css` owns the design workspace; conflicting prior Studio rules were removed.

The code editor retains its single file row and existing shortcuts. Empty output is compact; execution/history opens output subject to a minimum useful code allocation. The default 1366×768 view is checked for at least twelve visible code lines. Design Studio uses remaining viewport space, with independently scrollable instructions, inspector, writing and review areas. On narrow screens, the brief is explicitly collapsible and canvas controls remain reachable by scrolling their workspace.

Remaining limits: recovery depends on browser storage capacity; recovery copies are not a revision-history service; legacy historical briefs may be absent; JSON import and automated architecture grading remain unimplemented. Monaco and on-demand formatter assets remain large and lazy-loaded.
