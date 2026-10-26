#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
.venv/bin/uvicorn ael_api.main:create_app --factory --host 127.0.0.1 --port 8000 &
api_pid=$!
.venv/bin/python -m ael_worker &
worker_pid=$!
cleanup() {
  kill "$api_pid" "$worker_pid" 2>/dev/null || true
  wait "$api_pid" "$worker_pid" 2>/dev/null || true
}
trap cleanup EXIT INT TERM
npm --prefix apps/web run dev
