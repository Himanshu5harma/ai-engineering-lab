import os
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest
from ael_api.config import Settings
from ael_api.main import create_app
from ael_api.models import Base, Submission
from ael_worker.runner import DockerRunner
from ael_worker.service import Worker
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import sessionmaker

pytestmark = pytest.mark.postgres


@pytest.fixture
def pg_sessions():
    url = os.getenv("AEL_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Set AEL_TEST_DATABASE_URL to an isolated local test database")
    schema = f"ael_test_{uuid4().hex}"
    admin = create_engine(url)
    with admin.begin() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    engine = create_engine(url, connect_args={"options": f"-csearch_path={schema}"})
    Base.metadata.create_all(engine)
    try:
        yield sessionmaker(engine, expire_on_commit=False)
    finally:
        engine.dispose()
        with admin.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        admin.dispose()


def test_postgres_concurrent_queue_claim_and_restart(pg_sessions, bundles, fake_runner):
    factory = pg_sessions
    app = create_app(Settings(), factory)
    with TestClient(app, base_url="http://localhost") as client:
        worker = Worker(factory, bundles, fake_runner)
        worker.heartbeat()
        bundle = next(iter(bundles.values()))
        for _ in range(4):
            assert (
                client.post(
                    "/api/v1/submissions",
                    json=dict(
                        challenge_slug=bundle.metadata.slug,
                        version_id=bundle.version_id,
                        code="correct",
                        action="submit",
                    ),
                ).status_code
                == 202
            )
        with ThreadPoolExecutor(max_workers=4) as pool:
            assert all(pool.map(lambda _: worker.process_one(), range(4)))
        assert not worker.process_one()
        assert len(client.get("/api/v1/progress").json()["solved_slugs"]) == 1
    with TestClient(create_app(Settings(), factory), base_url="http://localhost") as restarted:
        rows = restarted.get("/api/v1/submissions").json()["items"]
        assert len(rows) == 4
        assert all(row["status"] == "passed" for row in rows)


def test_real_postgres_submission_lifecycle(pg_sessions, bundles):
    if os.getenv("AEL_TEST_DOCKER") != "1":
        pytest.skip("Real lifecycle also requires AEL_TEST_DOCKER=1")
    runner = DockerRunner("ael-python-sandbox:1", 3)
    worker = Worker(pg_sessions, bundles, runner)
    assert worker.heartbeat()
    with TestClient(create_app(Settings(), pg_sessions), base_url="http://localhost") as client:
        for bundle in bundles.values():
            for code, expected in ((bundle.starter, "failed"), (bundle.reference, "passed")):
                response = client.post(
                    "/api/v1/submissions",
                    json=dict(
                        challenge_slug=bundle.metadata.slug,
                        version_id=bundle.version_id,
                        action="submit",
                        code=code,
                    ),
                )
                assert response.status_code == 202, response.text
                assert worker.process_one()
                result = client.get(f"/api/v1/submissions/{response.json()['id']}").json()
                assert result["status"] == expected, result
        assert len(client.get("/api/v1/progress").json()["solved_slugs"]) == len(bundles)
    with pg_sessions() as session:
        assert len(session.scalars(select(Submission)).all()) == 2 * len(bundles)


def test_concurrent_design_saves_have_one_winner_and_survive_restart(pg_sessions):
    # Separate real database sessions race both initial insertion and revision updates.
    from ael_api.designs import DesignDocument

    url = "/api/v1/designs/enterprise-rag-platform"
    with TestClient(create_app(Settings(), pg_sessions), base_url="http://localhost") as client:
        challenge = client.get(url).json()
        for revision in (0, 1):

            def save_competing_draft(label, revision=revision):
                document = DesignDocument(flow=f"{label}, revision {revision}")
                return client.post(
                    url + "/workspace",
                    json={
                        "version_id": challenge["version_id"],
                        "revision": revision,
                        "document": document.model_dump(),
                        "action": "save",
                    },
                )

            with ThreadPoolExecutor(max_workers=2) as pool:
                responses = list(pool.map(save_competing_draft, ["first tab", "second tab"]))
            assert sorted(response.status_code for response in responses) == [200, 409]
            winner = next(response.json() for response in responses if response.status_code == 200)
            assert client.get(url).json()["workspace"]["document"] == winner["document"]
    with TestClient(create_app(Settings(), pg_sessions), base_url="http://localhost") as restarted:
        assert restarted.get(url).json()["workspace"]["revision"] == 2
        assert restarted.get(url).json()["workspace"]["document"] == winner["document"]


def test_concurrent_review_saves_preserve_the_winning_revision(pg_sessions, bundles):
    bundle = next(iter(bundles.values()))
    url = f"/api/v1/challenges/{bundle.metadata.slug}/review"
    with TestClient(create_app(Settings(), pg_sessions), base_url="http://localhost") as client:
        for revision in (0, 1):

            def save(label, revision=revision):
                return client.post(
                    url,
                    json={
                        "version_id": bundle.version_id,
                        "revision": revision,
                        "completed_tasks": [],
                        "notes": label,
                    },
                )

            with ThreadPoolExecutor(max_workers=2) as pool:
                responses = list(pool.map(save, ["first tab", "second tab"]))
            assert sorted(response.status_code for response in responses) == [200, 409]
            winner = next(response.json() for response in responses if response.status_code == 200)
            assert client.get(url).json()["notes"] == winner["notes"]
            assert winner["revision"] == revision + 1


def test_postgres_progress_uses_utc_even_in_a_different_database_timezone(pg_sessions, bundles):
    from datetime import timedelta

    from ael_api.models import now

    bundle = next(iter(bundles.values()))
    with TestClient(create_app(Settings(), pg_sessions), base_url="http://localhost") as client:
        start = now().replace(hour=0, minute=0, second=0, microsecond=0)
        with pg_sessions() as session:
            session.execute(text("SET TIME ZONE 'America/Los_Angeles'"))
            session.add_all(
                [
                    Submission(
                        version_id=bundle.version_id,
                        action="run",
                        status="passed",
                        code="x",
                        created_at=start + timedelta(minutes=5),
                    ),
                    Submission(
                        version_id=bundle.version_id,
                        action="submit",
                        status="passed",
                        code="x",
                        created_at=start - timedelta(days=6) + timedelta(minutes=5),
                    ),
                    Submission(
                        version_id=bundle.version_id,
                        action="run",
                        status="passed",
                        code="x",
                        created_at=start - timedelta(days=6, minutes=5),
                    ),
                ]
            )
            session.commit()
        progress = client.get("/api/v1/progress").json()
        assert progress["runs"] == 2 and progress["submissions"] == 1
        assert progress["weekly_activity"][-1]["executions"] == 1
        assert progress["weekly_activity"][0]["executions"] == 1
        assert sum(day["executions"] for day in progress["weekly_activity"]) == 2
        assert progress["solved_slugs"] == [bundle.metadata.slug]
