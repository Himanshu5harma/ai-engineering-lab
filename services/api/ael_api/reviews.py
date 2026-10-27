from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ael_api.content import ChallengeBundle
from ael_api.models import ChallengeReview, Submission

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
        "tasks": REVIEW_TASKS,
        "completed_tasks": review.completed_tasks if review else [],
        "notes": review.notes if review else "",
        "code_verified": passed,
        "updated_at": review.updated_at.isoformat() if review else None,
        "evidence_type": "learner_self_review",
        "notice": "Self-review records your reasoning. Automated tests verify functional behavior; "
        "these checkboxes do not certify mastery, security or interview readiness.",
    }
