import logging
from datetime import timedelta

from ael_api.content import ChallengeBundle
from ael_api.models import Submission, TestResult, WorkerHealth, now
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, sessionmaker

from ael_worker.judge import Outcome
from ael_worker.runner import Runner

log = logging.getLogger("ael.worker")


class Worker:
    def __init__(
        self, sessions: sessionmaker[Session], bundles: dict[str, ChallengeBundle], runner: Runner
    ):
        self.sessions, self.bundles, self.runner = sessions, bundles, runner

    def heartbeat(self) -> bool:
        ready, message = self.runner.available()
        with self.sessions() as session:
            session.merge(
                WorkerHealth(id="local", heartbeat_at=now(), available=ready, message=message)
            )
            session.commit()
        return ready

    def recover(self) -> int:
        """A crashed worker never awards credit or silently reruns a job."""
        with self.sessions() as session:
            stale = session.scalars(
                select(Submission)
                .where(
                    or_(
                        and_(
                            Submission.status == "queued",
                            Submission.created_at < now() - timedelta(minutes=5),
                        ),
                        and_(
                            Submission.status == "running",
                            func.coalesce(Submission.started_at, Submission.created_at)
                            < now() - timedelta(seconds=60),
                        ),
                    ),
                )
                .with_for_update(skip_locked=True)
            ).all()
            for row in stale:
                row.status = "infrastructure_error"
                row.message = (
                    "Worker interrupted or queue expired. Your code is saved; retry execution."
                )
                row.completed_at = now()
            session.commit()
            return len(stale)

    def process_one(self) -> bool:
        with self.sessions() as session:
            row = session.scalar(
                select(Submission)
                .where(Submission.status == "queued")
                .order_by(Submission.created_at)
                .limit(1)
                .with_for_update(skip_locked=True)
            )
            if row is None:
                return False
            row.status, row.started_at, row.message = (
                "running",
                now(),
                "Running isolated Python tests",
            )
            session.commit()
            submission_id, version_id, code, action = row.id, row.version_id, row.code, row.action
        bundle = self.bundles.get(version_id.split(":")[0])
        if bundle is None or bundle.version_id != version_id:
            outcome = Outcome(
                "infrastructure_error", "Pinned challenge bundle unavailable; restore its revision"
            )
        else:
            try:
                outcome = self.runner.run(bundle, code, action)
            except Exception:
                log.exception("Unexpected runner error")
                outcome = Outcome(
                    "infrastructure_error", "Worker failed unexpectedly; inspect worker logs"
                )
        with self.sessions() as session:
            saved = session.get(Submission, submission_id)
            if saved is None:
                return True
            saved.status, saved.message = outcome.status, outcome.message
            saved.duration_ms, saved.completed_at = outcome.duration_ms, now()
            saved.results = [
                TestResult(
                    position=i,
                    name=r.name,
                    hidden=r.hidden,
                    passed=r.passed,
                    expected=r.expected,
                    actual=r.actual,
                    error=r.error,
                    stdout=r.stdout,
                )
                for i, r in enumerate(outcome.results)
            ]
            session.commit()
        log.info(
            "submission=%s status=%s duration_ms=%s",
            submission_id,
            outcome.status,
            outcome.duration_ms,
        )
        return True
