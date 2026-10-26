from datetime import timedelta
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from ael_api.config import Settings
from ael_api.models import Submission, WorkerHealth, now
from ael_api.schemas import ExecutionAvailability, ResultView, SubmissionView

ACTIVE = ("queued", "running")


def availability(session: Session, settings: Settings) -> ExecutionAvailability:
    health = session.get(WorkerHealth, "local")
    recent = session.scalar(
        select(WorkerHealth.id).where(
            WorkerHealth.id == "local",
            WorkerHealth.heartbeat_at >= now() - timedelta(seconds=settings.worker_stale_seconds),
        )
    )
    if not health or not recent:
        return ExecutionAvailability(
            available=False,
            message="Execution unavailable: start the local Docker engine and sandbox worker.",
        )
    return ExecutionAvailability(available=health.available, message=health.message)


def queue_size(session: Session) -> int:
    return (
        session.scalar(
            select(func.count()).select_from(Submission).where(Submission.status.in_(ACTIVE))
        )
        or 0
    )


def lock_queue(session: Session) -> None:
    if session.bind is not None and session.bind.dialect.name == "postgresql":
        session.execute(text("SELECT pg_advisory_xact_lock(7301201)"))


def view(row: Submission, include_code: bool = False) -> SubmissionView:
    results = []
    for result in row.results:
        results.append(
            ResultView(
                name=f"Verification case {result.position + 1}" if result.hidden else result.name,
                hidden=result.hidden,
                passed=result.passed,
                expected=None if result.hidden else result.expected,
                actual=None if result.hidden else result.actual,
                error="Private case failed; review the contract and edge cases."
                if result.hidden and not result.passed
                else ("" if result.hidden else result.error),
                stdout="" if result.hidden else result.stdout,
            )
        )
    return SubmissionView(
        id=row.id,
        challenge_slug=row.version_id.split(":")[0],
        version_id=row.version_id,
        action=row.action,
        status=row.status,
        created_at=row.created_at,
        completed_at=row.completed_at,
        duration_ms=row.duration_ms,
        message=row.message,
        results=results,
        code=row.code if include_code else None,
    )


def progress(session: Session, versions: list[str]) -> dict[str, Any]:
    rows = session.scalars(
        select(Submission)
        .where(Submission.version_id.in_(versions))
        .order_by(Submission.created_at.desc())
    ).all()
    attempts = [s for s in rows if s.action == "submit"]
    solved = sorted({s.version_id.split(":")[0] for s in attempts if s.status == "passed"})
    attempted = {s.version_id for s in attempts}
    days: dict[str, int] = {}
    today = now().date()
    for offset in reversed(range(7)):
        days[str(today - timedelta(days=offset))] = 0
    for row in rows:
        day = row.created_at.date().isoformat()
        if day in days:
            days[day] += 1
    return {
        "solved_slugs": solved,
        "attempted": len(attempted),
        "submissions": len(attempts),
        "runs": len(rows) - len(attempts),
        "total_challenges": len(versions),
        "weekly_activity": [{"date": day, "executions": count} for day, count in days.items()],
        "recent_submissions": [view(s).model_dump(mode="json") for s in rows[:5]],
        "evidence_note": "Solved means a full Submit passed on the current content version. "
        "Run checks public tests only. Activity dates use UTC. "
        "These counts are practice evidence, not a mastery score.",
    }
