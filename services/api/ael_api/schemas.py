from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

from ael_api.content import Metadata
from ael_api.curriculum import CurriculumItem

Action = Literal["run", "submit"]
Status = Literal[
    "queued", "running", "passed", "failed", "timed_out", "execution_error", "infrastructure_error"
]


class CreateSubmission(BaseModel):
    model_config = ConfigDict(extra="forbid")
    challenge_slug: str = Field(pattern=r"^[a-z][a-z0-9-]{2,79}$")
    version_id: str = Field(max_length=160)
    action: Action
    code: str = Field(min_length=1, max_length=32768)

    @field_validator("code")
    @classmethod
    def code_size(cls, value: str) -> str:
        if len(value.encode()) > 32768 or not value.strip() or "\x00" in value:
            raise ValueError("Code must contain 1–32768 UTF-8 bytes and no null characters")
        return value


class ResultView(BaseModel):
    name: str
    hidden: bool
    passed: bool
    expected: Any = None
    actual: Any = None
    error: str
    stdout: str


class SubmissionView(BaseModel):
    id: str
    challenge_slug: str
    version_id: str
    action: Action
    status: Status
    created_at: datetime
    completed_at: datetime | None
    duration_ms: int | None
    message: str
    results: list[ResultView]
    code: str | None = None


class ExecutionAvailability(BaseModel):
    available: bool
    message: str


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Any = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


class ChallengeSummary(Metadata):
    version_id: str
    curriculum_id: str | None
    learning_order: int | None
    public_count: int


class PublicCase(BaseModel):
    name: str
    kwargs: dict[str, Any]
    expected: Any = None
    raises: Literal["ValueError", "TypeError"] | None = None


class ChallengeDetail(ChallengeSummary):
    production_review: str
    problem: str
    starter_code: str
    hints: list[str]
    public_cases: list[PublicCase]
    verification_count: int


class ChallengeCatalog(BaseModel):
    items: list[ChallengeSummary]
    total: int


class TrackView(BaseModel):
    id: str
    title: str


class CurriculumEntry(CurriculumItem):
    available: bool
    learning_order: int | None


class CurriculumModuleView(BaseModel):
    id: str
    title: str
    target_count: int
    available_count: int
    entries: list[CurriculumEntry]


class CurriculumView(BaseModel):
    title: str
    total_planned: int
    modules: list[CurriculumModuleView]
    first_release: list[str]
    weekly_hours: dict[str, int]
    design_deliverables: list[str]


class SubmissionHistory(BaseModel):
    items: list[SubmissionView]
    offset: int
    limit: int
    has_more: bool


class ResultsView(BaseModel):
    status: Status
    results: list[ResultView]


class ActivityDay(BaseModel):
    date: str
    executions: int


class ProgressView(BaseModel):
    review_completed_slugs: list[str]
    solved_slugs: list[str]
    attempted: int
    submissions: int
    runs: int
    total_challenges: int
    weekly_activity: list[ActivityDay]
    recent_submissions: list[SubmissionView]
    evidence_note: str


class HealthView(BaseModel):
    status: Literal["ok"]
    execution: ExecutionAvailability
