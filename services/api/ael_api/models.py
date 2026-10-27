from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import JSON, CheckConstraint, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from ael_api.schemas import Action, Status


def now() -> datetime:
    return datetime.now(UTC)


class Base(DeclarativeBase):
    pass


class Track(Base):
    __tablename__ = "tracks"
    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    title: Mapped[str] = mapped_column(String(120))


class Challenge(Base):
    __tablename__ = "challenges"
    slug: Mapped[str] = mapped_column(String(80), primary_key=True)
    track_id: Mapped[str] = mapped_column(ForeignKey("tracks.id"))
    title: Mapped[str] = mapped_column(String(120))


class ChallengeVersion(Base):
    __tablename__ = "challenge_versions"
    id: Mapped[str] = mapped_column(String(160), primary_key=True)
    challenge_slug: Mapped[str] = mapped_column(ForeignKey("challenges.slug"), index=True)
    version: Mapped[int]
    digest: Mapped[str] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Submission(Base):
    __tablename__ = "submissions"
    __table_args__ = (
        CheckConstraint("action IN ('run', 'submit')"),
        CheckConstraint(
            "status IN ('queued','running','passed','failed','timed_out',"
            "'execution_error','infrastructure_error')"
        ),
        Index("ix_submission_queue", "status", "created_at"),
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    version_id: Mapped[str] = mapped_column(ForeignKey("challenge_versions.id"), index=True)
    action: Mapped[Action] = mapped_column(String(10))
    code: Mapped[str] = mapped_column(Text)
    status: Mapped[Status] = mapped_column(String(30), default="queued")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_ms: Mapped[int | None]
    message: Mapped[str] = mapped_column(Text, default="Waiting for the execution worker")
    results: Mapped[list["TestResult"]] = relationship(
        cascade="all, delete-orphan", order_by="TestResult.position", lazy="selectin"
    )


class TestResult(Base):
    __tablename__ = "test_results"
    id: Mapped[int] = mapped_column(primary_key=True)
    submission_id: Mapped[str] = mapped_column(ForeignKey("submissions.id"), index=True)
    position: Mapped[int]
    name: Mapped[str] = mapped_column(String(160))
    hidden: Mapped[bool]
    passed: Mapped[bool]
    expected: Mapped[Any | None] = mapped_column(JSON)
    actual: Mapped[Any | None] = mapped_column(JSON)
    error: Mapped[str] = mapped_column(Text, default="")
    stdout: Mapped[str] = mapped_column(Text, default="")


class WorkerHealth(Base):
    __tablename__ = "worker_health"
    id: Mapped[str] = mapped_column(String(30), primary_key=True)
    heartbeat_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    available: Mapped[bool]
    message: Mapped[str] = mapped_column(Text)


class ChallengeReview(Base):
    __tablename__ = "challenge_reviews"
    version_id: Mapped[str] = mapped_column(ForeignKey("challenge_versions.id"), primary_key=True)
    completed_tasks: Mapped[list[str]] = mapped_column(JSON, default=list)
    notes: Mapped[str] = mapped_column(Text, default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
