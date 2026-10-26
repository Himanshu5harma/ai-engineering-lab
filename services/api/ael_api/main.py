import logging
from collections.abc import AsyncIterator, Iterator
from contextlib import asynccontextmanager
from typing import Annotated, Any

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from ael_api.config import Settings
from ael_api.content import load_bundles
from ael_api.db import database, sync_content
from ael_api.models import Submission, Track
from ael_api.repository import availability, lock_queue, progress, queue_size, view
from ael_api.schemas import CreateSubmission, ExecutionAvailability, SubmissionView

log = logging.getLogger("ael.api")


class BodyLimitMiddleware:
    def __init__(self, app: ASGIApp, limit: int = 80000):
        self.app, self.limit = app, limit

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        messages: list[Message] = []
        size = 0
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":
                return
            size += len(message.get("body", b""))
            if size > self.limit:
                response = JSONResponse(
                    status_code=413,
                    content={
                        "error": {
                            "code": "body_too_large",
                            "message": "Request body exceeds 80000 bytes",
                        }
                    },
                )
                await response(scope, receive, send)
                return
            messages.append(message)
            if not message.get("more_body", False):
                break
        index = 0

        async def replay() -> Message:
            nonlocal index
            if index < len(messages):
                item = messages[index]
                index += 1
                return item
            return await receive()

        await self.app(scope, replay, send)


def create_app(
    settings: Settings | None = None, sessions: sessionmaker[Session] | None = None
) -> FastAPI:
    settings = settings or Settings()
    engine = None
    if sessions is None:
        engine, sessions = database(settings.database_url)
    factory = sessions
    bundles = load_bundles(settings.content_dir)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        with factory() as session:
            sync_content(session, bundles)
        yield
        if engine is not None:
            engine.dispose()

    app = FastAPI(title="AI Engineering Lab", version="0.1.0", lifespan=lifespan)
    app.add_middleware(BodyLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )
    app.add_middleware(
        TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1", "testserver"]
    )

    @app.middleware("http")
    async def local_writes(request: Request, call_next: Any) -> Any:
        origin = request.headers.get("origin")
        if request.method == "POST" and origin and origin not in settings.allowed_origins:
            return JSONResponse(
                status_code=403,
                content={
                    "error": {
                        "code": "origin_denied",
                        "message": "Only configured local origins may write",
                    }
                },
            )
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Cache-Control"] = "no-store"
        return response

    @app.exception_handler(StarletteHTTPException)
    async def http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = (
            exc.detail
            if isinstance(exc.detail, dict)
            else {"code": "request_error", "message": str(exc.detail)}
        )
        return JSONResponse(status_code=exc.status_code, content={"error": detail})

    @app.exception_handler(RequestValidationError)
    async def validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "code": "validation_error",
                    "message": "Invalid request",
                    "details": [
                        {"location": list(e["loc"]), "message": e["msg"]} for e in exc.errors()
                    ],
                }
            },
        )

    @app.exception_handler(SQLAlchemyError)
    async def db_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        log.exception("Database operation failed")
        return JSONResponse(
            status_code=503,
            content={
                "error": {
                    "code": "database_unavailable",
                    "message": "Database unavailable; check migrations and PostgreSQL",
                }
            },
        )

    def session_dependency() -> Iterator[Session]:
        with factory() as session:
            yield session

    DB = Annotated[Session, Depends(session_dependency)]

    def bundle_for(slug: str) -> Any:
        if slug not in bundles:
            raise HTTPException(
                404, {"code": "challenge_not_found", "message": "Challenge not found"}
            )
        return bundles[slug]

    @app.get("/api/v1/health")
    def health(session: DB) -> dict[str, Any]:
        session.execute(text("SELECT 1"))
        return {"status": "ok", "execution": availability(session, settings).model_dump()}

    @app.get("/api/v1/execution", response_model=ExecutionAvailability)
    def execution(session: DB) -> ExecutionAvailability:
        return availability(session, settings)

    @app.get("/api/v1/tracks")
    def tracks(session: DB) -> list[dict[str, str]]:
        return [{"id": t.id, "title": t.title} for t in session.scalars(select(Track))]

    @app.get("/api/v1/challenges")
    def challenges(
        track: str | None = None,
        difficulty: str | None = None,
        offset: int = Query(0, ge=0),
        limit: int = Query(20, ge=1, le=100),
    ) -> dict[str, Any]:
        found = [
            b
            for b in bundles.values()
            if (not track or b.metadata.track == track)
            and (not difficulty or b.metadata.difficulty == difficulty)
        ]
        return {
            "items": [
                {
                    **b.metadata.model_dump(),
                    "version_id": b.version_id,
                    "public_count": len(b.public),
                }
                for b in found[offset : offset + limit]
            ],
            "total": len(found),
        }

    @app.get("/api/v1/challenges/{slug}")
    def challenge(slug: str) -> dict[str, Any]:
        return dict(bundle_for(slug).learner())

    @app.post("/api/v1/submissions", status_code=202, response_model=SubmissionView)
    def submit(payload: CreateSubmission, session: DB) -> SubmissionView:
        bundle = bundle_for(payload.challenge_slug)
        if bundle.version_id != payload.version_id:
            raise HTTPException(
                409,
                {
                    "code": "content_changed",
                    "message": "Challenge changed. Reload before submitting.",
                },
            )
        ready = availability(session, settings)
        if not ready.available:
            raise HTTPException(503, {"code": "execution_unavailable", "message": ready.message})
        lock_queue(session)
        if queue_size(session) >= settings.queue_limit:
            raise HTTPException(
                429, {"code": "queue_full", "message": "Execution queue full. Try again shortly."}
            )
        row = Submission(version_id=bundle.version_id, code=payload.code, action=payload.action)
        session.add(row)
        session.commit()
        session.refresh(row)
        return view(row)

    @app.get("/api/v1/submissions")
    def history(
        session: DB,
        challenge_slug: str | None = None,
        offset: int = Query(0, ge=0),
        limit: int = Query(20, ge=1, le=100),
    ) -> dict[str, Any]:
        query = select(Submission).order_by(Submission.created_at.desc())
        if challenge_slug:
            bundle_for(challenge_slug)
            query = query.where(Submission.version_id.like(f"{challenge_slug}:%"))
        rows = session.scalars(query.offset(offset).limit(limit)).all()
        return {
            "items": [view(s).model_dump(mode="json") for s in rows],
            "offset": offset,
            "limit": limit,
            "has_more": len(rows) == limit,
        }

    def find_submission(submission_id: str, session: Session) -> Submission:
        row = session.get(Submission, submission_id)
        if row is None:
            raise HTTPException(
                404, {"code": "submission_not_found", "message": "Submission not found"}
            )
        return row

    @app.get("/api/v1/submissions/{submission_id}", response_model=SubmissionView)
    def submission(submission_id: str, session: DB) -> SubmissionView:
        return view(find_submission(submission_id, session), include_code=True)

    @app.get("/api/v1/submissions/{submission_id}/results")
    def results(submission_id: str, session: DB) -> dict[str, Any]:
        result = view(find_submission(submission_id, session))
        return {"status": result.status, "results": [r.model_dump() for r in result.results]}

    @app.get("/api/v1/progress")
    @app.get("/api/v1/dashboard")
    def dashboard(session: DB) -> dict[str, Any]:
        return progress(session, [b.version_id for b in bundles.values()])

    return app
