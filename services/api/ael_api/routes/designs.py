from typing import Any

from fastapi import APIRouter

from ael_api.dependencies import DB, Context, design_for
from ael_api.designs import (
    DesignCatalog,
    DesignDetail,
    DesignUpdate,
    PreviousDrafts,
    WorkspaceView,
    previous_count,
    previous_workspaces,
    save_workspace,
    workspace_view,
)

router = APIRouter(tags=["designs"])


@router.get("/designs", response_model=DesignCatalog, operation_id="listDesigns")
def design_catalog(session: DB, context: Context) -> dict[str, Any]:
    return {
        "items": [
            {
                **item.catalog_summary(),
                "workspace": workspace_view(session, item),
                "previous_draft_count": previous_count(session, item),
            }
            for item in context.designs.values()
        ]
    }


@router.get("/designs/{slug}", response_model=DesignDetail, operation_id="getDesign")
def design_detail(slug: str, session: DB, context: Context) -> dict[str, Any]:
    item = design_for(slug, context)
    return {
        **item.model_dump(),
        "version_id": item.version_id,
        "workspace": workspace_view(session, item),
        "previous_draft_count": previous_count(session, item),
    }


@router.get(
    "/designs/{slug}/previous-drafts",
    response_model=PreviousDrafts,
    operation_id="listPreviousDrafts",
)
def previous_drafts(slug: str, session: DB, context: Context) -> dict[str, Any]:
    return {"items": previous_workspaces(session, design_for(slug, context))}


@router.post("/designs/{slug}/workspace", response_model=WorkspaceView, operation_id="saveDesign")
def design_save(slug: str, payload: DesignUpdate, session: DB, context: Context) -> dict[str, Any]:
    return save_workspace(session, design_for(slug, context), payload)
