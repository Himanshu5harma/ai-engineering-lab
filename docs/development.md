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

## Isolated browser curriculum verification

The browser suite exercises all twelve coding challenges and all three design exercises, draft races, previous versions, keyboard access and light/dark layouts at four viewport sizes. After preparing the temporary database, source `.cache/e2e.env` and run `.venv/bin/python scripts/seed_browser_history.py` to add the guarded previous-version regression fixture. The helper refuses to seed personal databases. Design tests write actual drafts and review readiness. Run the complete suite on a fresh temporary database so test designs and reference solutions do not enter personal progress:

```bash
.venv/bin/python scripts/e2e_database.py
```

Source `.cache/e2e.env` separately in three terminals, then start:

```bash
# Terminal 1, after sourcing the environment
.venv/bin/uvicorn ael_api.main:create_app --factory --host 127.0.0.1 --port 8001
# Terminal 2, after sourcing the environment
.venv/bin/python -m ael_worker
# Terminal 3, after sourcing the environment
npm --prefix apps/web run dev -- --port 5175
```

Run `AEL_WEB_URL=http://127.0.0.1:5175 npm --prefix apps/web run test:e2e`. Stop those three test-service processes, then run `.venv/bin/python scripts/e2e_database.py --cleanup` from a terminal using the personal/default database settings. The helper supports only loopback PostgreSQL, creates a uniquely named database, applies real Alembic migrations, and removes only its recorded temporary database. It never clears personal submissions. Temporary connection settings stay in ignored `.cache/` files.

`AEL_API_TARGET` configures Vite's proxy; its default remains port 8000. Personal services stay on ports 8000/5174/8080. The dedicated browser suite uses 8001/5175. Hosted CI uses an ephemeral PostgreSQL service and may use the default ports directly.

## System Design Studio

Open `/design` for the library or `/design/<slug>` for an exercise. JSON packages under `content/system-design` define the brief, requirements, scale assumptions, constraints, five deliverable prompts, rubric and follow-ups. Their validated canonical content determines the version hash; changes create a new workspace identity. Link ready exercises from the system-design module in `content/curriculum.json`. Restart FastAPI after editing content.

Migration `0003` adds `design_workspaces`. A draft stores its graph, four written sections, rubric self-assessments, revision and review-readiness status. Every save carries the expected revision; a stale insert or update receives HTTP 409 without overwriting the saved design. A stale content version is also rejected. Saving edits returns a ready design to draft. There is no automated architecture score or effect on coding verification.

Design saves share the 80 KB request boundary. There are at most 60 components and 120 connections, 120 characters per label, 500 per component note and 6000 per written section. Total encoded size also matters; shorten notes or export if the request exceeds 80 KB. Server validation rejects dangling connections, duplicate IDs, nonfinite/out-of-range coordinates and unknown fields. Browser backup is best effort; explicit Save draft persists to PostgreSQL. Use exports before replacing a conflicted draft. Exports include SVG for the diagram, Markdown for the written review and JSON for the full document; importing JSON is not implemented.

## Coding editor and local Python tools

The coding route uses the remaining viewport height, including after the main navigation wraps. Execution output is visible by default, with an empty state before the first run and explicit Hide/Show controls. Drag the vertical divider to allocate problem width or use its arrow-key controls. Resize output height, or use Focus editor and Fullscreen. Escape exits fullscreen; when the browser denies the Fullscreen API, the app still expands the workspace within the window. Small screens have explicit Problem/Code views. Running code opens the results automatically.

The editor has one compact file row with saved-draft status, 12–24 px font size, Format and Reset. Font size is validated from `ael-editor-preferences-v1` in localStorage; older settings are reduced to font size. The theme follows the app. Line numbers, four-space indentation and wrapping are fixed defaults; the minimap and suggestion popups are disabled. Existing code drafts and notes keep their original keys. Layout choices are session-local. Undo/redo, find/replace, comments and formatting retain keyboard access. Comparison, live lint, extra settings and shortcut panels have been removed.

`@astral-sh/ruff-wasm-web` is pinned to 0.16.8 because its API is experimental. The worker and approximately 10.9 MB uncompressed WASM asset are bundled by Vite and loaded only on the first formatting request. Parsing and formatting run off the main UI thread. No formatter API or Python interpreter is started. The worker supports 32 KiB source, Python 3.12, 88-column formatting and four-space indentation. Requests time out after 15 seconds; failed loading can be retried. Formatting snapshots the model version, refuses to replace later edits, and creates one undo step. Syntax failures leave the draft intact.

There is no background lint request or Problems drawer. Deterministic Run/Submit results remain the correctness evidence. The larger on-demand Monaco chunk still produces a non-failing build-size warning.

## Shared layout

`apps/web/src/styles.css` owns consolidated shared page geometry; `tokens.css` owns theme values and `components/ui/ui.css` owns shared states: a 1600 px maximum content width, responsive 16–32 px gutters, consistent page/section headings, card spacing, and responsive grids. The coding header separates breadcrumb, identity and actions; controls share one baseline. Fullscreen intentionally uses the full viewport. The output pane has a usable default height and is constrained after viewport changes. Mobile catalog topic filters scroll within their own row instead of pushing the challenge list down.

After rebuilding the frontend, refresh long-lived browser tabs to load the new asset bundle. Browser layout tests cover the annotated 1477×871 desktop size and 390-pixel mobile width, shared page edges, output visibility, header overlap and Design Studio button alignment.

## Contract generation and reliability checks

After editing API requests/responses, run `npm --prefix apps/web run api:generate`. Commit/review `openapi.json` and `src/api/generated` with the endpoint changes. `api:check` regenerates in memory and compares every artifact; it neither starts FastAPI nor requires a live database. Generated output is excluded from manual formatting. Frontend domain adapters must use generated SDK methods and contracts.

Migration `0004` is additive: review revisions plus nullable design exercise snapshots and carry-forward source fields. Both review and design writes carry the expected revision. HTTP 409 leaves the database winner intact. Browser drafts are backed up per document writer, keep their original base revision and survive route/tab changes; failed saves preserve them. Loading saved work exports local changes first and protects edits made during the fetch. Previous-version drafts are available from each Studio header and indicated in catalog cards.

To run actual proxy regressions, build the frontend, start the isolated API on 8001 with `.cache/e2e.env`, then run `.venv/bin/python scripts/check_proxy.py --browser`. It uses a temporary Nginx container on loopback 8081, the production configuration with only test upstream/listener substitutions, and the current built assets. The optional `--browser` flag also runs editor/formatting and site-layout flows against the built assets. It removes that container on exit. No personal activity is created. Allowed test origins are set by the isolated database helper.

The refinement pass leaves the existing 8080 deployment unchanged. Apply migrations and update local images together only when choosing to update that deployment; do not mix the new frontend/review revision contract with an older API. Historical content hashes and submissions need no rewriting.
