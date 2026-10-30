.PHONY: setup db migrate sandbox dev api worker web test check integration e2e compose stop
UV_CACHE_DIR := $(CURDIR)/.cache/uv
export UV_CACHE_DIR
setup:
	uv sync --frozen
	npm --prefix apps/web ci

db:
	docker compose up -d --wait db

migrate:
	.venv/bin/alembic upgrade head

sandbox:
	docker build -t ael-python-sandbox:1 infra/sandbox

dev: db migrate sandbox
	./scripts/dev.sh

api:
	.venv/bin/uvicorn ael_api.main:create_app --factory --host 127.0.0.1 --port 8000 --reload

worker:
	.venv/bin/python -m ael_worker

web:
	npm --prefix apps/web run dev

test:
	.venv/bin/pytest -q
	npm --prefix apps/web test

check:
	npm --prefix apps/web run api:check
	.venv/bin/ruff check conftest.py services infra/sandbox content scripts
	.venv/bin/ruff format --check conftest.py services infra/sandbox content scripts
	.venv/bin/mypy
	npm --prefix apps/web run lint
	npm --prefix apps/web run build

integration:
	AEL_TEST_DOCKER=1 AEL_TEST_DATABASE_URL=postgresql+psycopg://ael:ael_local@127.0.0.1:5432/ael .venv/bin/pytest -q

e2e:
	cd apps/web && npx playwright test

compose: sandbox
	docker compose up -d --build --wait
	@echo 'UI: http://127.0.0.1:8080 — start make worker in a separate terminal.'

stop:
	docker compose down
