"""Draft ownership, content changes, aggregate semantics, and response contracts."""

from datetime import timedelta

from ael_api.config import Settings
from ael_api.designs import load_designs
from ael_api.models import ChallengeVersion, DesignWorkspace, Submission, now
from ael_api.models import TestResult as CaseRow
from sqlalchemy import event


def test_previous_draft_discovery_and_carry_forward(client, sessions):
    challenge = load_designs(Settings().content_dir.parent / "system-design")[
        "enterprise-rag-platform"
    ]
    url = f"/api/v1/designs/{challenge.slug}"
    document = client.get(url).json()["workspace"]["document"]
    document["adr"] = "Prior-version decision and evidence"
    old_id = challenge.slug + ":" + "a" * 64
    with sessions() as session:
        session.add(
            DesignWorkspace(
                version_id=old_id,
                slug=challenge.slug,
                revision=3,
                document=document,
                status="draft",
                updated_at=now(),
            )
        )
        session.commit()
    assert client.get(url).json()["previous_draft_count"] == 1
    previous = client.get(url + "/previous-drafts").json()["items"][0]
    assert previous["document"]["adr"] == document["adr"]
    assert previous["exercise_snapshot"] is None  # Legacy history is honest about missing briefs.
    payload = dict(
        version_id=challenge.version_id,
        revision=0,
        document=document,
        source_version_id=old_id,
        source_revision=2,
    )
    assert client.post(url + "/workspace", json=payload).status_code == 409
    payload["source_revision"] = 3
    response = client.post(url + "/workspace", json=payload)
    assert response.status_code == 200, response.text
    assert response.json()["source_version_id"] == old_id
    assert response.json()["exercise_snapshot"]["slug"] == challenge.slug
    assert client.get(url + "/previous-drafts").json()["items"][0] == previous
    # A stale carry-forward cannot overwrite an already-saved current draft.
    payload["document"]["adr"] = "Stale"
    assert client.post(url + "/workspace", json=payload).status_code == 409
    assert (
        client.get(url).json()["workspace"]["document"]["adr"]
        == "Prior-version decision and evidence"
    )


def test_review_concurrent_insert_and_update_preserve_winner(client, bundles):
    bundle = next(iter(bundles.values()))
    url = f"/api/v1/challenges/{bundle.metadata.slug}/review"
    payload = dict(version_id=bundle.version_id, revision=0, completed_tasks=[], notes="Winner")
    assert client.post(url, json=payload).json()["revision"] == 1
    payload["notes"] = "Stale insertion"
    assert client.post(url, json=payload).status_code == 409
    payload.update(revision=1, notes="Second revision")
    assert client.post(url, json=payload).json()["revision"] == 2
    assert client.post(url, json=payload).status_code == 409
    assert client.get(url).json()["notes"] == "Second revision"


def test_progress_aggregates_current_versions_utc_and_bounded_recent(client, sessions, bundles):
    first, second = list(bundles.values())[:2]
    with sessions() as session:
        historical = first.metadata.slug + ":" + "0" * 64
        session.add(
            ChallengeVersion(
                id=historical, challenge_slug=first.metadata.slug, version=1, digest="0" * 64
            )
        )
        session.flush()
        for index in range(40):
            row = Submission(
                version_id=first.version_id,
                action="run",
                code="large source" * 1000,
                status="passed",
                created_at=now() - timedelta(minutes=index),
            )
            session.add(row)
            session.flush()
            session.add(
                CaseRow(
                    submission_id=row.id,
                    position=0,
                    name="public",
                    hidden=False,
                    passed=True,
                    expected=1,
                    actual=1,
                    error="",
                    stdout="",
                )
            )
        session.add_all(
            [
                Submission(version_id=first.version_id, action="submit", code="x", status="failed"),
                Submission(
                    version_id=second.version_id,
                    action="submit",
                    code="x",
                    status="passed",
                    created_at=now() - timedelta(days=8),
                ),
                Submission(version_id=historical, action="submit", code="old", status="passed"),
            ]
        )
        session.commit()
    statements = []
    engine = sessions.kw["bind"]

    def record(conn, cursor, statement, parameters, context, executemany):
        statements.append(statement.lower())

    event.listen(engine, "before_cursor_execute", record)
    try:
        data = client.get("/api/v1/progress").json()
    finally:
        event.remove(engine, "before_cursor_execute", record)
    assert data["runs"] == 40 and data["submissions"] == 2 and data["attempted"] == 2
    assert data["solved_slugs"] == [second.metadata.slug]
    assert sum(day["executions"] for day in data["weekly_activity"]) == 41
    assert len(data["recent_submissions"]) == 5
    assert all(row["code"] is None for row in data["recent_submissions"])
    assert not any("submissions.code" in sql for sql in statements)
    result_queries = [sql for sql in statements if "from test_results" in sql]
    assert len(result_queries) == 1 and result_queries[0].count("?") <= 5
    # Historical evidence remains independently addressable.
    assert len(client.get("/api/v1/submissions?limit=100").json()["items"]) == 43


def test_all_json_endpoints_have_explicit_response_contracts(client):
    schema = client.get("/openapi.json").json()
    for path, operations in schema["paths"].items():
        for operation in operations.values():
            if not isinstance(operation, dict) or "responses" not in operation:
                continue
            for code, response in operation["responses"].items():
                if code.startswith("2"):
                    body = response["content"]["application/json"]["schema"]
                    assert "$ref" in body or body.get("type") == "array", (path, body)
