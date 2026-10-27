import pytest
from ael_api.curriculum import Curriculum


def test_curriculum_counts_order_and_available_content(client, bundles):
    plan = client.get("/api/v1/curriculum").json()
    assert plan["total_planned"] == 88
    assert [m["target_count"] for m in plan["modules"]] == [64, 10, 6, 8]
    assert [m["available_count"] for m in plan["modules"]] == [12, 0, 0, 0]
    expected = ["R01", "R02", "R04", "R05", "R08", "R09", "G03", "E01", "E02", "G06", "P03", "A02"]
    assert plan["first_release"] == expected
    assert [b.curriculum_id for b in bundles.values()] == expected
    assert [
        c["curriculum_id"] for c in client.get("/api/v1/challenges").json()["items"]
    ] == expected
    assert sum(plan["weekly_hours"].values()) == 20


def test_review_is_persisted_without_awarding_code_credit(client, bundles):
    bundle = bundles["version-aware-evidence-filter"]
    url = f"/api/v1/challenges/{bundle.metadata.slug}/review"
    initial = client.get(url).json()
    assert initial["completed_tasks"] == [] and not initial["code_verified"]
    keys = [task["id"] for task in initial["tasks"]]
    response = client.post(
        url,
        json=dict(
            version_id=bundle.version_id,
            completed_tasks=keys,
            notes="Explain fail-closed policy and retrieval-layer enforcement.",
        ),
    )
    assert response.status_code == 200
    assert client.get(url).json()["completed_tasks"] == keys
    progress = client.get("/api/v1/progress").json()
    assert bundle.metadata.slug in progress["review_completed_slugs"]
    assert progress["solved_slugs"] == []
    assert response.json()["evidence_type"] == "learner_self_review"
    assert (
        client.post(url, json=dict(version_id="old", completed_tasks=[], notes="")).status_code
        == 409
    )
    assert (
        client.post(
            url, json=dict(version_id=bundle.version_id, completed_tasks=["invented"], notes="")
        ).status_code
        == 422
    )
    assert (
        client.post(
            url, json=dict(version_id=bundle.version_id, completed_tasks=[], notes="x" * 8001)
        ).status_code
        == 422
    )


def test_curriculum_rejects_ambiguous_entries(client):
    # Strip computed API fields before checking authored schema validation.
    from ael_api.config import Settings
    from ael_api.curriculum import load_curriculum

    plan = load_curriculum(Settings().content_dir.parent / "curriculum.json").model_dump()
    plan["first_release"][1] = plan["first_release"][0]
    with pytest.raises(ValueError):
        Curriculum.model_validate(plan)
