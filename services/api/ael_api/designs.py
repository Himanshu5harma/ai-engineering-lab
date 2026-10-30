"""Versioned architecture exercises and learner-owned design workspaces."""

import hashlib
from pathlib import Path
from typing import Any, Literal

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field, model_validator
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ael_api.models import DesignWorkspace, now

DELIVERABLES = ("diagram", "flow", "capacity", "failures", "adr")
ComponentKind = Literal["client", "service", "model", "database", "queue", "cache", "external"]
ReviewRating = Literal["unreviewed", "needs_work", "defensible"]


class StrictModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid", allow_inf_nan=False, json_schema_serialization_defaults_required=True
    )


class RubricCriterion(StrictModel):
    id: str = Field(pattern=r"^[a-z_]{2,40}$")
    title: str
    question: str
    evidence: str


class DesignContent(StrictModel):
    id: str = Field(pattern=r"^D[0-9]{2}$")
    slug: str = Field(pattern=r"^[a-z][a-z0-9-]{2,79}$")
    version: int = Field(ge=1)
    title: str = Field(max_length=120)
    summary: str
    difficulty: str
    timebox_minutes: int = Field(ge=30, le=240)
    tags: list[str]
    scenario: str
    requirements: list[str] = Field(min_length=4)
    scale: list[str] = Field(min_length=3)
    constraints: list[str] = Field(min_length=3)
    prompts: dict[str, str]
    rubric: list[RubricCriterion] = Field(min_length=5)
    follow_ups: list[str] = Field(min_length=3)

    @model_validator(mode="after")
    def consistent(self) -> "DesignContent":
        if set(self.prompts) != set(DELIVERABLES):
            raise ValueError("Designs require exactly five deliverable prompts")
        if len({item.id for item in self.rubric}) != len(self.rubric):
            raise ValueError("Rubric IDs must be unique")
        return self


class DesignChallenge(DesignContent):
    @property
    def version_id(self) -> str:
        digest = hashlib.sha256(self.model_dump_json().encode()).hexdigest()
        return f"{self.slug}:{digest}"

    def catalog_summary(self) -> dict[str, Any]:
        return self.model_dump(
            include={"id", "slug", "title", "summary", "difficulty", "timebox_minutes", "tags"}
        ) | {"version_id": self.version_id}


def load_designs(root: Path) -> dict[str, DesignChallenge]:
    result: dict[str, DesignChallenge] = {}
    ids: set[str] = set()
    for path in sorted(root.glob("*.json")):
        item = DesignChallenge.model_validate_json(path.read_text())
        if item.slug != path.stem or item.slug in result or item.id in ids:
            raise ValueError("Design file names, slugs and IDs must be unique and consistent")
        result[item.slug] = item
        ids.add(item.id)
    return dict(sorted(result.items(), key=lambda item: item[1].id))


class Position(StrictModel):
    x: float = Field(ge=-20000, le=20000)
    y: float = Field(ge=-20000, le=20000)


class ComponentData(StrictModel):
    label: str = Field(min_length=1, max_length=120)
    kind: ComponentKind
    notes: str = Field(default="", max_length=500)

    @model_validator(mode="after")
    def named(self) -> "ComponentData":
        if not self.label.strip():
            raise ValueError("Component name cannot be blank")
        return self


class DiagramNode(StrictModel):
    id: str = Field(pattern=r"^[a-zA-Z0-9_-]{1,64}$")
    position: Position
    data: ComponentData


class DiagramEdge(StrictModel):
    id: str = Field(pattern=r"^[a-zA-Z0-9_-]{1,64}$")
    source: str
    target: str
    label: str = Field(default="", max_length=120)


class Viewport(StrictModel):
    x: float = Field(default=0, ge=-100000, le=100000)
    y: float = Field(default=0, ge=-100000, le=100000)
    zoom: float = Field(default=1, ge=0.1, le=3)


class Diagram(StrictModel):
    nodes: list[DiagramNode] = Field(default_factory=list, max_length=60)
    edges: list[DiagramEdge] = Field(default_factory=list, max_length=120)
    viewport: Viewport = Field(default_factory=Viewport)

    @model_validator(mode="after")
    def valid_graph(self) -> "Diagram":
        ids = {node.id for node in self.nodes}
        if len(ids) != len(self.nodes) or len({e.id for e in self.edges}) != len(self.edges):
            raise ValueError("Node and edge IDs must be unique")
        if any(e.source not in ids or e.target not in ids for e in self.edges):
            raise ValueError("Every connection must reference existing components")
        if any(e.source == e.target for e in self.edges):
            raise ValueError("Connect two different components")
        return self


class DesignDocument(StrictModel):
    diagram: Diagram = Field(default_factory=Diagram)
    flow: str = Field(default="", max_length=6000)
    capacity: str = Field(default="", max_length=6000)
    failures: str = Field(default="", max_length=6000)
    adr: str = Field(default="", max_length=6000)
    ratings: dict[str, ReviewRating] = Field(default_factory=dict)

    def completeness(self) -> dict[str, bool]:
        return {
            "diagram": len(self.diagram.nodes) >= 2 and len(self.diagram.edges) >= 1,
            **{key: bool(getattr(self, key).strip()) for key in DELIVERABLES[1:]},
        }


class DesignUpdate(StrictModel):
    version_id: str = Field(max_length=160)
    revision: int = Field(ge=0, le=2147483646)
    document: DesignDocument
    action: Literal["save", "submit_for_review"] = "save"
    source_version_id: str | None = Field(default=None, max_length=160)
    source_revision: int | None = Field(default=None, ge=1)


class WorkspaceView(BaseModel):
    version_id: str
    revision: int
    document: DesignDocument
    status: Literal["draft", "ready_for_review"]
    updated_at: str | None
    completeness: dict[str, bool]
    evidence_type: Literal["learner_design_and_self_review"]
    notice: str
    exercise_snapshot: DesignChallenge | None
    source_version_id: str | None
    source_revision: int | None


class DesignSummary(BaseModel):
    id: str
    slug: str
    title: str
    summary: str
    difficulty: str
    timebox_minutes: int
    tags: list[str]
    version_id: str
    workspace: WorkspaceView
    previous_draft_count: int


class DesignDetail(DesignContent):
    version_id: str
    workspace: WorkspaceView
    previous_draft_count: int


class DesignCatalog(BaseModel):
    items: list[DesignSummary]


class PreviousDrafts(BaseModel):
    items: list[WorkspaceView]


def row_view(row: DesignWorkspace) -> dict[str, Any]:
    document = DesignDocument.model_validate(row.document)
    return {
        "version_id": row.version_id,
        "revision": row.revision,
        "document": document.model_dump(),
        "status": row.status,
        "updated_at": row.updated_at.isoformat(),
        "completeness": document.completeness(),
        "evidence_type": "learner_design_and_self_review",
        "notice": "Completeness checks structure only. Rubric ratings are your self-assessment; "
        "they do not verify architecture quality, capacity, security or mastery.",
        "exercise_snapshot": row.exercise_snapshot,
        "source_version_id": row.source_version_id,
        "source_revision": row.source_revision,
    }


def previous_workspaces(session: Session, challenge: DesignChallenge) -> list[dict[str, Any]]:
    return [
        row_view(row)
        for row in session.scalars(
            select(DesignWorkspace)
            .where(
                DesignWorkspace.slug == challenge.slug,
                DesignWorkspace.version_id != challenge.version_id,
            )
            .order_by(DesignWorkspace.updated_at.desc())
        )
    ]


def workspace_view(session: Session, challenge: DesignChallenge) -> dict[str, Any]:
    row = session.get(DesignWorkspace, challenge.version_id)
    if row:
        return row_view(row)
    return {
        "version_id": challenge.version_id,
        "revision": 0,
        "document": DesignDocument().model_dump(),
        "status": "draft",
        "updated_at": None,
        "completeness": DesignDocument().completeness(),
        "evidence_type": "learner_design_and_self_review",
        "notice": "Completeness checks structure only. Rubric ratings are your self-assessment; "
        "they do not verify architecture quality, capacity, security or mastery.",
        "exercise_snapshot": challenge.model_dump(),
        "source_version_id": None,
        "source_revision": None,
    }


def save_workspace(
    session: Session, challenge: DesignChallenge, payload: DesignUpdate
) -> dict[str, Any]:
    if payload.version_id != challenge.version_id:
        raise HTTPException(
            409,
            {
                "code": "content_changed",
                "message": "Exercise changed. Export your draft and reload.",
            },
        )
    if not set(payload.document.ratings).issubset({item.id for item in challenge.rubric}):
        raise HTTPException(422, {"code": "invalid_rubric", "message": "Unknown rubric criterion"})
    if payload.action == "submit_for_review" and not all(payload.document.completeness().values()):
        raise HTTPException(
            422,
            {
                "code": "incomplete_design",
                "message": "Complete all five deliverables before review.",
            },
        )
    source = None
    if payload.source_version_id is not None or payload.source_revision is not None:
        source = session.get(DesignWorkspace, payload.source_version_id or "")
        if (
            not source
            or source.slug != challenge.slug
            or source.version_id == challenge.version_id
            or source.revision != payload.source_revision
        ):
            raise HTTPException(
                409,
                {
                    "code": "source_changed",
                    "message": "The previous draft changed. "
                    "Reopen it before carrying work forward.",
                },
            )
        existing = session.get(DesignWorkspace, challenge.version_id)
        if existing and payload.revision == 0:
            raise HTTPException(
                409,
                {
                    "code": "revision_conflict",
                    "message": "A current draft already exists. "
                    "Load it before carrying work forward.",
                },
            )
    values: dict[str, Any] = {
        "exercise_snapshot": challenge.model_dump(),
        "document": payload.document.model_dump(),
        "revision": payload.revision + 1,
        "status": "ready_for_review" if payload.action == "submit_for_review" else "draft",
        "updated_at": now(),
    }
    if source:
        values.update(source_version_id=source.version_id, source_revision=source.revision)
    conflict = HTTPException(
        409,
        {
            "code": "revision_conflict",
            "message": "A newer draft was saved in another tab. "
            "Export your changes before loading the saved draft.",
        },
    )
    if payload.revision == 0:
        session.add(DesignWorkspace(version_id=challenge.version_id, slug=challenge.slug, **values))
        try:
            session.commit()
        except IntegrityError as error:
            session.rollback()
            raise conflict from error
    else:
        updated = session.execute(
            update(DesignWorkspace)
            .where(
                DesignWorkspace.version_id == challenge.version_id,
                DesignWorkspace.revision == payload.revision,
            )
            .values(**values)
            .returning(DesignWorkspace.version_id)
        )
        if updated.scalar_one_or_none() is None:
            session.rollback()
            raise conflict
        session.commit()
    session.expire_all()
    return workspace_view(session, challenge)


def previous_count(session: Session, challenge: DesignChallenge) -> int:
    return (
        session.scalar(
            select(func.count())
            .select_from(DesignWorkspace)
            .where(
                DesignWorkspace.slug == challenge.slug,
                DesignWorkspace.version_id != challenge.version_id,
            )
        )
        or 0
    )
