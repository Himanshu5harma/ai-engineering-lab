# AI Engineering Lab

**Build it. Test it. Design it. Ship it.**

A local practice workspace for experienced engineers learning applied AI. The first release implements twelve original Python challenges with Monaco, deterministic verification, a separate Docker worker, PostgreSQL history, and evidence-based progress. No model API, GPU, or paid service is required.

## Start locally

Requirements: Python 3.12+, [uv](https://docs.astral.sh/uv/), Node.js 22.12+, Docker Engine/Desktop with Linux containers, Compose, and Linux memory/CPU/PID controls. Start Docker first. Ports 5432, 8000, and 5174 must be available.

```bash
cp .env.example .env
make setup
make dev
```

Open **http://127.0.0.1:5174**. `make dev` starts PostgreSQL, applies migrations, builds the sandbox, then starts FastAPI, the host worker, and Vite. Ctrl+C stops the application processes. PostgreSQL stays running; `make stop` stops Compose without deleting saved data.

Alternatively, run `make db migrate sandbox`, then `make api`, `make worker`, and `make web` in separate terminals. See [development](docs/development.md) for troubleshooting.

For a built frontend and API in containers:

```bash
make setup
make compose
# Separate terminal: trusted host worker, never a socket mount on the API
make worker
```

Open http://127.0.0.1:8080. Do not run the host API and Compose API simultaneously on port 8000. Both modes use the same persistent PostgreSQL volume. API docs: http://127.0.0.1:8000/docs.

## What works

- **Cosine similarity:** zero vectors, input validation, floating-point extremes, deterministic scores.
- **First-twelve curriculum:** R01 cosine similarity → R02 top-K → R04 token windows → R05 structure-aware chunks → R08 access/version filters → R09 rank fusion → G03 context allocation → E01 precision/recall → E02 MRR/nDCG → G06 citation integrity → P03 backoff/jitter → A02 tool permissions.
- **211 deterministic cases:** 61 public and 150 private cases, shared by public/hidden pytest contracts and the isolated value-checking worker. Each challenge has a tested broken implementation and production failure review.
- **88-item roadmap:** 64 coding, 10 design, 6 lab and 8 debugging entries. Only the first twelve coding entries are marked ready; the remaining items are explicitly planned.
- Content-driven catalog with search and difficulty filters, progressive hints, public test inputs, production context.
- Monaco with bundled local assets, Python syntax highlighting, resizable panels, local drafts, reset, light/dark themes, keyboard shortcuts.
- **Run** checks public cases; **Submit** checks public and private cases. Only a passing full submission on the current content version earns completion.
- Durable queued → running → terminal jobs; saved code, result details, execution duration, paginated history and code restoration.
- Dashboard counts and weekly UTC activity computed from real stored events. Practice counts do not claim mastery.
- Global challenge search (Cmd/Ctrl+K), topic/status filters, difficulty filtering, and sorting.
- Saved challenges and per-version engineering notes stored on this browser.
- Activity viewer with paginated execution history, test evidence, saved source inspection, and Python export.
- Ordered first-twelve checklist, track completion, and PostgreSQL-backed engineering self-review separate from automated code verification.
- Execution explicitly unavailable when a healthy local worker or sandbox image is absent. No fake execution mode exists in the app.

This is a single-user local tool. Containers are a resource boundary, not sufficient isolation for a hostile public code-execution service. See [execution security](docs/security/code-execution.md).

## Checks

```bash
make test                    # unit/API/component tests; infrastructure tests skip explicitly
make check                   # lint, format, Python/TypeScript checking, production build
make db migrate sandbox
make integration             # real PostgreSQL + Docker, including resource probes
# With make dev running:
cd apps/web
npx playwright install chromium
npm run test:e2e              # real browser, API, database and containers; writes practice history
```

Integration tests use temporary database schemas and remove them afterward. E2E tests use the active personal workspace and leave their runs visible as genuine practice events. Use the isolated browser database workflow in [development](docs/development.md) to keep your personal statistics untouched. No untrusted submission is executed on the host during tests. Repository-authored reference solutions are imported by trusted content validation tests.

## Repository

```text
apps/web/                 React, TypeScript, Vite, Monaco, Vitest, Playwright
services/api/ael_api/     FastAPI, validated content, SQLAlchemy persistence
services/api/migrations/ Alembic migrations
services/worker/          Trusted host worker, Docker adapter, external grader
content/challenges/      Versioned original challenge bundles
infra/sandbox/           Restricted Python image and value-returning bridge
infra/docker/            Optional API/frontend containers
scripts/                 Local process orchestration
```

[Architecture](docs/architecture/overview.md) · [Decisions](docs/decisions/initial-architecture.md) · [Challenge authoring](docs/challenge-authoring.md) · [Roadmap](docs/product-roadmap.md) · [Verification](docs/verification.md)

Next milestones are a functioning System Design Studio with three original problems, a production RAG lab, and a Debugging Arena. The remaining curriculum, spaced revision and optional AI mentor are recorded as planned work.
