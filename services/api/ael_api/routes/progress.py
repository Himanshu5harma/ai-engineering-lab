from typing import Any

from fastapi import APIRouter
from sqlalchemy import text

from ael_api.dependencies import DB, Context
from ael_api.repository import availability, progress
from ael_api.schemas import HealthView, ProgressView

router = APIRouter(tags=["progress"])


@router.get("/health", response_model=HealthView, operation_id="getHealth")
def health(session: DB, context: Context) -> dict[str, Any]:
    session.execute(text("SELECT 1"))
    return {"status": "ok", "execution": availability(session, context.settings)}


@router.get("/progress", response_model=ProgressView, operation_id="getProgress")
@router.get("/dashboard", response_model=ProgressView, operation_id="getDashboard")
def dashboard(session: DB, context: Context) -> dict[str, Any]:
    return progress(session, [b.version_id for b in context.bundles.values()])
