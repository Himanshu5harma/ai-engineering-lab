# Development

## Commands and configuration

Use `make setup`, then `make dev`. It creates only project-local dependencies, a named PostgreSQL volume, and images. The worker runs on the host against your configured Docker context. `make dev` requires ports 5432/8000/5174; stop your own conflicting service or change Vite's port, Playwright's base URL, and `AEL_ALLOWED_ORIGINS` together. Another project on 5173 is unaffected.

Settings are loaded from `.env` with the `AEL_` prefix:

| Setting | Default | Purpose |
|---|---|---|
| DATABASE_URL | PostgreSQL on loopback:5432 | API and worker must share one database |
| CONTENT_DIR | checkout/content/challenges | Both services must use identical bundles |
| SANDBOX_IMAGE | ael-python-sandbox:1 | Locally built trusted image |
| EXECUTION_TIMEOUT | 8 | Suite timeout; 1–20 seconds |
| QUEUE_LIMIT | 8 | Queued + running capacity; 1–100 |
| ALLOWED_ORIGINS | local ports 5174, 8080, 8000 | JSON list of permitted write origins |

No API key is needed. `.env` is ignored. Don't enable a fake runner: only tests inject one. Linux Docker users can configure `DOCKER_HOST` / `DOCKER_CONTEXT` normally; the Docker SDK follows the environment and default socket, so non-default contexts may require `DOCKER_HOST` explicitly.

## Migrations

`make migrate` runs `alembic upgrade head`; application startup synchronizes validated content but never creates schema implicitly. For a model change: `uv run alembic revision --autogenerate -m 'description'`, review generated SQL, then upgrade. Back up local data before destructive migrations. API and worker must both be stopped for schema changes affecting active executions.

## Tests

`make test` executes fast backend and React tests. Infrastructure tests skip unless explicitly configured. `make integration` runs all backend tests using Docker and temporary schemas in the local PostgreSQL database; those schemas are dropped afterward. `make check` runs Ruff, formatting, strict mypy, ESLint, TypeScript and the Vite build. Frontend unit tests replace Monaco with an editable test control; browser E2E uses the actual Monaco editor.

With all development services running, run `cd apps/web && npm run test:e2e`. The browser tests type starter/reference code, observe failure, run public tests, submit full verification, and revisit history. They intentionally write real practice history. Set `AEL_WEB_URL` for a different frontend address. Browser binaries: `npx playwright install chromium`.

## Troubleshooting

- **Execution unavailable:** check `docker info`, run `make sandbox`, then start `make worker`. Check `/api/v1/execution` and worker logs. A stale heartbeat also disables new jobs.
- **Docker socket permission error:** use the intended local Docker user/context. Do not mount the socket on FastAPI or grant broad public socket access.
- **Database unavailable:** run `make db` and `make migrate`; check `.env`. Compose API uses host `db`; the host worker uses `127.0.0.1`.
- **Content changed/pinned bundle unavailable:** restart API and worker from the same checkout. Historical versions require their original content revision to execute; saved results remain readable.
- **Queue full:** wait for current work. A stopped worker is shown unavailable; interrupted/expired jobs receive infrastructure errors after recovery. Source remains available for restore/retry. The worker reconnects and reacquires its singleton lease after a database interruption.
- **Monaco not loading:** assets are bundled locally. Check the browser console and serve the application through Vite/Nginx. No external editor CDN should be required.
- **No expected history:** verify API and worker use the same PostgreSQL URL and named volume. `docker compose down` preserves the volume. `docker compose down -v` deletes it; do not use it casually.
- **Worker killed abruptly:** stop all workers; inspect only AEL sandboxes with `docker ps -a --filter label=ael.sandbox=true`. Remove those specific IDs with `docker rm -f <id>`, then restart the worker. Never delete unrelated containers.

Drafts stay in browser localStorage, keyed by full content hash. Clearing browser storage deletes drafts but not permanent submission source in PostgreSQL. Capture important work with Submit or restore it from history. UTC activity dates are labeled in the dashboard; execution timestamps display in browser-local time.
