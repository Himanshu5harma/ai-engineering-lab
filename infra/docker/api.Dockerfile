FROM ghcr.io/astral-sh/uv:0.12.5 AS uv
FROM python:3.12.12-slim
COPY --from=uv /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock alembic.ini ./
COPY services ./services
COPY content ./content
RUN uv sync --frozen --no-dev --no-cache
ENV PATH="/app/.venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
USER 65534:65534
CMD ["sh", "-c", "alembic upgrade head && uvicorn ael_api.main:create_app --factory --host 0.0.0.0 --port 8000"]
