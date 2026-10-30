import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from ael_api.config import Settings
from ael_api.content import load_bundles
from ael_api.curriculum import load_curriculum
from ael_api.db import database, sync_content
from ael_api.dependencies import AppContext
from ael_api.designs import load_designs
from ael_api.routes import challenges, reviews, submissions
from ael_api.routes import designs as designs_router
from ael_api.routes import progress as progress_router
from ael_api.schemas import ErrorResponse

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
    curriculum = load_curriculum(settings.content_dir.parent / "curriculum.json")
    designs = load_designs(settings.content_dir.parent / "system-design")

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
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1"])

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

    app.state.context = AppContext(settings, factory, bundles, designs, curriculum)
    for router in (
        challenges.router,
        submissions.router,
        designs_router.router,
        reviews.router,
        progress_router.router,
    ):
        app.include_router(
            router,
            prefix="/api/v1",
            responses={
                code: {"model": ErrorResponse} for code in (400, 403, 404, 409, 413, 422, 429, 503)
            },
        )
    return app
