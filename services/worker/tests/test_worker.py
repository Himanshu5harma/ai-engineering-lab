from datetime import timedelta

from ael_api.db import sync_content
from ael_api.models import Submission, now
from ael_worker.judge import equivalent, judge
from ael_worker.service import Worker
from sqlalchemy import select


def seed(sessions, bundles, **kwargs):
    with sessions() as session:
        sync_content(session, bundles)
        row = Submission(
            version_id=next(iter(bundles.values())).version_id,
            code="correct",
            action="submit",
            **kwargs,
        )
        session.add(row)
        session.commit()
        return row.id


def test_worker_claims_once_and_handles_empty_queue(sessions, bundles, fake_runner):
    row_id = seed(sessions, bundles)
    worker = Worker(sessions, bundles, fake_runner)
    assert worker.heartbeat()
    assert worker.process_one()
    assert not worker.process_one()
    with sessions() as session:
        row = session.get(Submission, row_id)
        assert row.status == "passed"
        assert row.started_at and row.completed_at and row.duration_ms == 12
        assert row.results


def test_worker_recovers_interrupted_job(sessions, bundles, fake_runner):
    row_id = seed(sessions, bundles, status="running", created_at=now() - timedelta(minutes=5))
    worker = Worker(sessions, bundles, fake_runner)
    assert worker.recover() == 1
    with sessions() as session:
        assert session.get(Submission, row_id).status == "infrastructure_error"


def test_pinned_bundle_cannot_be_regraded_with_changed_content(sessions, bundles, fake_runner):
    row_id = seed(sessions, bundles)
    worker = Worker(sessions, {}, fake_runner)
    assert worker.process_one()
    with sessions() as session:
        assert session.get(Submission, row_id).status == "infrastructure_error"


def test_unexpected_runner_failure_is_persisted(sessions, bundles, fake_runner):
    seed(sessions, bundles)

    def fail(*args):
        raise RuntimeError("test infrastructure failure")

    fake_runner.run = fail
    Worker(sessions, bundles, fake_runner).process_one()
    with sessions() as session:
        assert session.scalar(select(Submission)).status == "infrastructure_error"


def test_judge_does_not_trust_self_reported_pass_flags(bundles):
    bundle = next(iter(bundles.values()))
    assert (
        judge(
            bundle.public,
            [{"passed": True, "value": "wrong"}] * len(bundle.public),
            len(bundle.public),
        ).status
        == "failed"
    )
    assert judge(bundle.public, [], len(bundle.public)).status == "execution_error"
    assert not equivalent(True, 1)
    assert not equivalent(float("nan"), 1)
    assert not equivalent({"id": "a", "score": 0.1}, {"id": "a", "score": 0.2})
    assert equivalent([{"id": "a", "score": 0.1}], [{"id": "a", "score": 0.1}])


def test_queue_wait_is_not_mistaken_for_a_crashed_execution(sessions, bundles, fake_runner):
    row_id = seed(sessions, bundles, status="queued", created_at=now() - timedelta(minutes=2))
    assert Worker(sessions, bundles, fake_runner).recover() == 0
    with sessions() as session:
        assert session.get(Submission, row_id).status == "queued"


def test_second_worker_refuses_lease_without_overwriting_health(monkeypatch):
    from unittest.mock import MagicMock

    import pytest
    from ael_worker import __main__ as entry

    engine, sessions = MagicMock(), MagicMock()
    engine.dialect.name = "postgresql"
    engine.connect.return_value.__enter__.return_value.scalar.return_value = False
    monkeypatch.setattr(entry, "database", lambda url: (engine, sessions))
    monkeypatch.setattr(entry.signal, "signal", lambda *args: None)
    with pytest.raises(SystemExit, match="already running"):
        entry.main()
    sessions.assert_not_called()
    engine.dispose.assert_called_once()
