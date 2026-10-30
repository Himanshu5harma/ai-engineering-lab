"""Request-scoped database sessions and immutable application content."""

from collections.abc import Iterator
from dataclasses import dataclass
from typing import Annotated, cast

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session, sessionmaker

from ael_api.config import Settings
from ael_api.content import ChallengeBundle
from ael_api.curriculum import Curriculum
from ael_api.designs import DesignChallenge
from ael_api.models import Submission


@dataclass(frozen=True)
class AppContext:
    settings: Settings
    sessions: sessionmaker[Session]
    bundles: dict[str, ChallengeBundle]
    designs: dict[str, DesignChallenge]
    curriculum: Curriculum | None


def get_context(request: Request) -> AppContext:
    return cast(AppContext, request.app.state.context)


Context = Annotated[AppContext, Depends(get_context)]


def get_session(context: Context) -> Iterator[Session]:
    with context.sessions() as session:
        yield session


DB = Annotated[Session, Depends(get_session)]


def bundle_for(slug: str, context: AppContext) -> ChallengeBundle:
    if slug not in context.bundles:
        raise HTTPException(404, {"code": "challenge_not_found", "message": "Challenge not found"})
    return context.bundles[slug]


def design_for(slug: str, context: AppContext) -> DesignChallenge:
    if slug not in context.designs:
        raise HTTPException(
            404, {"code": "design_not_found", "message": "Design exercise not found"}
        )
    return context.designs[slug]


def find_submission(submission_id: str, session: Session) -> Submission:
    row = session.get(Submission, submission_id)
    if row is None:
        raise HTTPException(
            404, {"code": "submission_not_found", "message": "Submission not found"}
        )
    return row
