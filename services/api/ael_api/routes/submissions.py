from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import defer

from ael_api.dependencies import DB, Context, bundle_for, find_submission
from ael_api.models import Submission
from ael_api.repository import availability, lock_queue, queue_size, view
from ael_api.schemas import (
    CreateSubmission,
    ExecutionAvailability,
    ResultsView,
    SubmissionHistory,
    SubmissionView,
)

router = APIRouter(tags=["submissions"])


@router.post(
    "/submissions", status_code=202, response_model=SubmissionView, operation_id="createSubmission"
)
def submit(payload: CreateSubmission, session: DB, context: Context) -> SubmissionView:
    bundle = bundle_for(payload.challenge_slug, context)
    if bundle.version_id != payload.version_id:
        raise HTTPException(
            409,
            {
                "code": "content_changed",
                "message": "Challenge changed. Reload before submitting.",
            },
        )
    ready = availability(session, context.settings)
    if not ready.available:
        raise HTTPException(503, {"code": "execution_unavailable", "message": ready.message})
    lock_queue(session)
    if queue_size(session) >= context.settings.queue_limit:
        raise HTTPException(
            429, {"code": "queue_full", "message": "Execution queue full. Try again shortly."}
        )
    row = Submission(version_id=bundle.version_id, code=payload.code, action=payload.action)
    session.add(row)
    session.commit()
    session.refresh(row)
    return view(row)


@router.get("/submissions", response_model=SubmissionHistory, operation_id="listSubmissions")
def history(
    session: DB,
    context: Context,
    challenge_slug: str | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    query = (
        select(Submission).options(defer(Submission.code)).order_by(Submission.created_at.desc())
    )
    if challenge_slug:
        bundle_for(challenge_slug, context)
        query = query.where(Submission.version_id.like(f"{challenge_slug}:%"))
    rows = session.scalars(query.offset(offset).limit(limit)).all()
    return {
        "items": [view(s).model_dump(mode="json") for s in rows],
        "offset": offset,
        "limit": limit,
        "has_more": len(rows) == limit,
    }


@router.get(
    "/submissions/{submission_id}", response_model=SubmissionView, operation_id="getSubmission"
)
def submission(submission_id: str, session: DB) -> SubmissionView:
    return view(find_submission(submission_id, session), include_code=True)


@router.get(
    "/submissions/{submission_id}/results", response_model=ResultsView, operation_id="getResults"
)
def results(submission_id: str, session: DB) -> dict[str, Any]:
    result = view(find_submission(submission_id, session))
    return {"status": result.status, "results": [r.model_dump() for r in result.results]}


@router.get("/execution", response_model=ExecutionAvailability, operation_id="getExecution")
def execution(session: DB, context: Context) -> ExecutionAvailability:
    return availability(session, context.settings)
