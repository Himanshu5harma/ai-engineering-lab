from typing import Any

from fastapi import APIRouter

from ael_api.dependencies import DB, Context, bundle_for
from ael_api.reviews import ReviewUpdate, ReviewView, review_view, save_review

router = APIRouter(tags=["reviews"])


@router.get("/challenges/{slug}/review", response_model=ReviewView, operation_id="getReview")
def get_review(slug: str, session: DB, context: Context) -> dict[str, Any]:
    return review_view(session, bundle_for(slug, context))


@router.post("/challenges/{slug}/review", response_model=ReviewView, operation_id="saveReview")
def update_review(
    slug: str, payload: ReviewUpdate, session: DB, context: Context
) -> dict[str, Any]:
    return save_review(session, bundle_for(slug, context), payload)
