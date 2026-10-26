from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

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
