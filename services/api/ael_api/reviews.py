from typing import Any, Literal

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ael_api.content import ChallengeBundle
from ael_api.models import ChallengeReview, Submission, now

TaskKey = Literal[
    "performance", "security", "failure_analysis", "tradeoffs", "code_quality", "interview"
]
REVIEW_TASKS = [
    {
        "id": "performance",
        "title": "Performance and complexity",
        "description": "State complexity, execution evidence and a benchmark plan.",
    },
    {
        "id": "security",
        "title": "Security boundary",
        "description": "Explain checks that must precede data exposure and side effects.",
    },
    {
        "id": "failure_analysis",
        "title": "Production failure analysis",
        "description": "Explain incident evidence, root cause, fix and regression tests.",
    },
    {
        "id": "tradeoffs",
        "title": "Alternative approaches",
        "description": "Compare alternatives and defend reliability, latency and cost trade-offs.",
    },
    {
        "id": "code_quality",
        "title": "Code quality review",
        "description": "Manually review types, names, validation, error paths and test coverage.",
    },
    {
        "id": "interview",
        "title": "Explain and solve again",
        "description": "Reimplement without hints and explain decisions and open questions.",
    },
]


class ReviewUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    version_id: str = Field(max_length=160)
    revision: int = Field(default=0, ge=0, le=2147483646)
    completed_tasks: list[TaskKey] = Field(max_length=6)
    notes: str = Field(default="", max_length=8000)


def review_view(session: Session, bundle: ChallengeBundle) -> dict[str, Any]:
    review = session.get(ChallengeReview, bundle.version_id)
    passed = (
        session.scalar(
            select(Submission.id)
            .where(
                Submission.version_id == bundle.version_id,
                Submission.action == "submit",
                Submission.status == "passed",
            )
            .limit(1)
        )
        is not None
    )
    return {
        "version_id": bundle.version_id,
        "revision": review.revision if review else 0,
        "tasks": REVIEW_TASKS,
        "completed_tasks": review.completed_tasks if review else [],
        "notes": review.notes if review else "",
        "code_verified": passed,
        "updated_at": review.updated_at.isoformat() if review else None,
        "evidence_type": "learner_self_review",
        "notice": "Self-review records your reasoning. Automated tests verify functional behavior; "
        "these checkboxes do not certify mastery, security or interview readiness.",
    }


class ReviewTask(BaseModel):
    id: TaskKey
    title: str
    description: str


class ReviewView(BaseModel):
    version_id: str
    revision: int
    tasks: list[ReviewTask]
    completed_tasks: list[TaskKey]
    notes: str
    code_verified: bool
    updated_at: str | None
    evidence_type: Literal["learner_self_review"]
    notice: str


def save_review(session: Session, bundle: ChallengeBundle, payload: ReviewUpdate) -> dict[str, Any]:
    if payload.version_id != bundle.version_id:
        raise HTTPException(
            409, {"code": "content_changed", "message": "Challenge changed. Reload the review."}
        )
    values = dict(
        completed_tasks=list(dict.fromkeys(payload.completed_tasks)),
        notes=payload.notes,
        revision=payload.revision + 1,
        updated_at=now(),
    )
    conflict = HTTPException(
        409,
        {
            "code": "revision_conflict",
            "message": "A newer review was saved in another tab. Your local draft is preserved; "
            "export it before loading the saved review.",
        },
    )
    if payload.revision == 0:
        session.add(ChallengeReview(version_id=bundle.version_id, **values))
        try:
            session.commit()
        except IntegrityError as error:
            session.rollback()
            raise conflict from error
    else:
        changed = session.execute(
            update(ChallengeReview)
            .where(
                ChallengeReview.version_id == bundle.version_id,
                ChallengeReview.revision == payload.revision,
            )
            .values(**values)
            .returning(ChallengeReview.version_id)
        )
        if changed.scalar_one_or_none() is None:
            session.rollback()
            raise conflict
        session.commit()
    session.expire_all()
    return review_view(session, bundle)
