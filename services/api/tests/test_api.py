from datetime import timedelta

from ael_api.config import Settings
from ael_api.main import create_app
from ael_api.models import Submission, WorkerHealth, now
from ael_worker.service import Worker
from fastapi.testclient import TestClient


def ready(sessions):
    with sessions() as session:
        session.merge(
            WorkerHealth(id="local", heartbeat_at=now(), available=True, message="Test worker")
        )
        session.commit()


def payload(bundles, code="correct", action="submit"):
    bundle = next(iter(bundles.values()))
    return dict(
        challenge_slug=bundle.metadata.slug, version_id=bundle.version_id, action=action, code=code
    )


def test_health_catalog_filters_and_public_contract(client):
    assert client.get("/api/v1/health").status_code == 200
    assert client.get("/api/v1/health").json()["execution"]["available"] is False
    assert len(client.get("/api/v1/tracks").json()) == 1
    catalog = client.get("/api/v1/challenges").json()
    assert catalog["total"] == 2
    assert client.get("/api/v1/challenges?difficulty=Foundation").json()["total"] == 1
    assert len(client.get("/api/v1/challenges?limit=1&offset=1").json()["items"]) == 1
    assert client.get("/api/v1/challenges?limit=101").status_code == 422
    assert client.get("/api/v1/challenges/does-not-exist").status_code == 404
    detail = client.get(f"/api/v1/challenges/{catalog['items'][0]['slug']}").json()
    assert "hidden" not in detail and "reference" not in detail


def test_no_worker_never_queues_a_submission(client, bundles):
    response = client.post("/api/v1/submissions", json=payload(bundles))
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "execution_unavailable"
    assert client.get("/api/v1/submissions").json()["items"] == []


def test_submission_lifecycle_persistence_redaction_and_progress(
    client, sessions, bundles, fake_runner
):
    ready(sessions)
    worker = Worker(sessions, bundles, fake_runner)
    row = client.post("/api/v1/submissions", json=payload(bundles, action="run")).json()
    assert row["status"] == "queued"
    assert worker.process_one()
    result = client.get(f"/api/v1/submissions/{row['id']}").json()
    assert result["status"] == "passed"
    assert all(not r["hidden"] for r in result["results"])
    assert client.get("/api/v1/progress").json()["solved_slugs"] == []
    row = client.post("/api/v1/submissions", json=payload(bundles)).json()
    assert worker.process_one()
    result = client.get(f"/api/v1/submissions/{row['id']}").json()
    assert result["code"] == "correct"
    assert result["status"] == "passed"
    hidden = [r for r in result["results"] if r["hidden"]]
    assert hidden and all(
        r["expected"] is None and r["actual"] is None and not r["stdout"] for r in hidden
    )
    assert "PRIVATE OUTPUT" not in str(result)
    assert len(client.get("/api/v1/progress").json()["solved_slugs"]) == 1
    # New application instance, same persistence layer.
    with TestClient(create_app(Settings(), sessions)) as restarted:
        assert len(restarted.get("/api/v1/submissions").json()["items"]) == 2
        assert (
            restarted.get(f"/api/v1/submissions/{row['id']}/results").json()["status"] == "passed"
        )


def test_incorrect_submission_fails_and_no_credit(client, sessions, bundles, fake_runner):
    ready(sessions)
    row = client.post("/api/v1/submissions", json=payload(bundles, code="wrong")).json()
    Worker(sessions, bundles, fake_runner).process_one()
    result = client.get(f"/api/v1/submissions/{row['id']}").json()
    assert result["status"] == "failed"
    assert client.get("/api/v1/progress").json()["solved_slugs"] == []
    assert all(
        r["error"].startswith("Private case failed") for r in result["results"] if r["hidden"]
    )


def test_validation_origin_and_size_limits(client, sessions, bundles):
    ready(sessions)
    for code in ("", " ", "\x00", "a" * 32769, "語" * 12000):
        assert (
            client.post("/api/v1/submissions", json=payload(bundles, code=code)).status_code == 422
        )
    data = payload(bundles)
    data["version_id"] = "old"
    assert client.post("/api/v1/submissions", json=data).status_code == 409
    assert (
        client.post(
            "/api/v1/submissions",
            json=payload(bundles),
            headers={"Origin": "https://attacker.example"},
        ).status_code
        == 403
    )
    assert client.post("/api/v1/submissions", content=b"x" * 80001).status_code == 413
    assert client.get("/api/v1/submissions/missing").status_code == 404
    assert client.get("/api/v1/health", headers={"Host": "attacker.example"}).status_code == 400
    assert (
        client.post("/api/v1/submissions", json={**payload(bundles), "action": "fake"}).status_code
        == 422
    )


def test_queue_capacity_and_stale_worker(client, sessions, bundles):
    ready(sessions)
    for _ in range(8):
        assert client.post("/api/v1/submissions", json=payload(bundles)).status_code == 202
    assert client.post("/api/v1/submissions", json=payload(bundles)).status_code == 429
    with sessions() as session:
        health = session.get(WorkerHealth, "local")
        health.heartbeat_at = now() - timedelta(minutes=1)
        session.commit()
    assert client.get("/api/v1/execution").json()["available"] is False


def test_history_pagination_and_version_safe_progress(client, sessions, bundles):
    ready(sessions)
    row = client.post("/api/v1/submissions", json=payload(bundles)).json()
    assert client.get("/api/v1/submissions?limit=1").json()["has_more"] is True
    assert not client.get("/api/v1/submissions?offset=1").json()["items"]
    with sessions() as session:
        saved = session.get(Submission, row["id"])
        saved.status = "passed"
        session.commit()
    assert client.get("/api/v1/progress").json()["submissions"] == 1


def test_unknown_route_and_method_use_consistent_errors(client):
    missing = client.get("/api/v1/missing")
    assert missing.status_code == 404 and "error" in missing.json()
    method = client.delete("/api/v1/challenges")
    assert method.status_code == 405 and "error" in method.json()
