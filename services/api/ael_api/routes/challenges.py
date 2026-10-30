from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select

from ael_api.dependencies import DB, Context, bundle_for
from ael_api.models import Track
from ael_api.schemas import ChallengeCatalog, ChallengeDetail, CurriculumView, TrackView

router = APIRouter(tags=["challenges"])


@router.get("/tracks", response_model=list[TrackView], operation_id="listTracks")
def tracks(session: DB) -> list[dict[str, str]]:
    return [{"id": t.id, "title": t.title} for t in session.scalars(select(Track))]


@router.get("/challenges", response_model=ChallengeCatalog, operation_id="listChallenges")
def challenges(
    context: Context,
    track: str | None = None,
    difficulty: str | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    found = [
        b
        for b in context.bundles.values()
        if (not track or b.metadata.track == track)
        and (not difficulty or b.metadata.difficulty == difficulty)
    ]
    return {
        "items": [b.summary() for b in found[offset : offset + limit]],
        "total": len(found),
    }


@router.get("/challenges/{slug}", response_model=ChallengeDetail, operation_id="getChallenge")
def challenge(slug: str, context: Context) -> dict[str, Any]:
    return dict(bundle_for(slug, context).learner())


@router.get("/curriculum", response_model=CurriculumView, operation_id="getCurriculum")
def curriculum_plan(context: Context) -> dict[str, Any]:
    if context.curriculum is None:
        raise HTTPException(
            404, {"code": "curriculum_unavailable", "message": "No curriculum configured"}
        )
    return context.curriculum.view(context.bundles, set(context.designs))
