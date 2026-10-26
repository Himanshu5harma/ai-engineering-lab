# Phase 1 implementation plan

1. Establish a typed React/Vite application and Python 3.12 FastAPI service.
2. Store versioned challenge content in validated packages; start with cosine similarity and reciprocal rank fusion.
3. Add SQLAlchemy models and Alembic migrations for content versions, durable execution jobs, test results, worker health, and submission-backed progress.
4. Use a PostgreSQL queue with row locking. A trusted local worker launches ephemeral Docker sandboxes; the API has no Docker socket or execution capability.
5. Build a Monaco workspace with Run/Submit, polling, public feedback, saved history, drafts, and a dashboard driven by stored submissions.
6. Verify challenge bundles, API lifecycle, queue recovery, container restrictions, frontend behavior, and real browser flows. Keep unavailable infrastructure explicit.
7. Document commands, security boundaries, verified limitations, and the prioritized roadmap.

## Decisions and scope

- Two original challenges first; no placeholder later-phase screens.
- PostgreSQL also provides the durable queue, avoiding Redis and dual-write failure modes in this local single-user release.
- Python submissions run only in containers controlled by a separate host worker. One job per worker, bounded queue, strict runtime/output limits.
- Fake execution is test-only dependency injection. No application configuration enables a fake runner.
- Core learning works without model providers, external accounts, or paid services.
