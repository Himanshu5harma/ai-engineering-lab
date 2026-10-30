from copy import deepcopy

import pytest
from ael_api.config import ROOT, Settings
from ael_api.designs import DesignChallenge, load_designs
from ael_api.main import create_app
from fastapi.testclient import TestClient


def design_document():
    return {
        "diagram": {
            "nodes": [
                {
                    "id": "api",
                    "position": {"x": 20, "y": 30},
                    "data": {
                        "label": "Policy gateway",
                        "kind": "service",
                        "notes": "Authorize before exposure",
                    },
                },
                {
                    "id": "index",
                    "position": {"x": 300, "y": 50},
                    "data": {
                        "label": "Tenant index",
                        "kind": "database",
                        "notes": "Versioned evidence",
                    },
                },
            ],
            "edges": [
                {"id": "query", "source": "api", "target": "index", "label": "authorized query"}
            ],
            "viewport": {"x": 50, "y": 10, "zoom": 0.8},
        },
        "flow": "Resolve identity, apply policy, retrieve versioned sources, then generate.",
        "capacity": "Document the source/chunk multiplier and measure peak service time.",
        "failures": "Fail closed on policy outage; retry idempotent indexing with deadlines.",
        "adr": "Choose versioned index publication over in-place mutation for atomic visibility.",
        "ratings": {},
    }


@pytest.mark.parametrize(
    "slug",
    ["enterprise-rag-platform", "durable-document-ingestion", "version-aware-support-assistant"],
)
def test_design_full_lifecycle_survives_api_restart(client, sessions, slug):
    url = f"/api/v1/designs/{slug}"
    challenge = client.get(url).json()
    assert challenge["workspace"]["revision"] == 0
    assert set(challenge["prompts"]) == {"diagram", "flow", "capacity", "failures", "adr"}
    payload = dict(version_id=challenge["version_id"], revision=0, document=design_document())
    payload["document"]["ratings"] = {challenge["rubric"][0]["id"]: "needs_work"}
    response = client.post(url + "/workspace", json=payload)
    assert response.status_code == 200, response.text
    assert response.json()["document"] == payload["document"]
    assert response.json()["revision"] == 1 and response.json()["status"] == "draft"
    payload.update(revision=1, action="submit_for_review")
    ready = client.post(url + "/workspace", json=payload).json()
    assert ready["status"] == "ready_for_review" and all(ready["completeness"].values())
    assert "self-assessment" in ready["notice"]
    assert client.get("/api/v1/progress").json()["solved_slugs"] == []
    with TestClient(create_app(Settings(), sessions), base_url="http://localhost") as restarted:
        assert restarted.get(url).json()["workspace"]["document"] == payload["document"]
        assert restarted.get(url).json()["workspace"]["revision"] == 2
        # Saving edits explicitly returns a ready design to draft, with no stale readiness.
        payload.update(revision=2, action="save")
        payload["document"]["flow"] = ""
        result = restarted.post(url + "/workspace", json=payload).json()
        assert result["status"] == "draft" and not result["completeness"]["flow"]


def test_conflicts_preserve_the_winning_draft(client):
    url = "/api/v1/designs/enterprise-rag-platform"
    challenge = client.get(url).json()
    payload = dict(version_id=challenge["version_id"], revision=0, document=design_document())
    assert client.post(url + "/workspace", json=payload).status_code == 200
    stale = deepcopy(payload)
    stale["document"]["adr"] = "Must not overwrite the saved ADR"
    assert client.post(url + "/workspace", json=stale).status_code == 409
    payload["revision"] = 1
    assert client.post(url + "/workspace", json=payload).status_code == 200
    stale["revision"] = 1
    assert client.post(url + "/workspace", json=stale).status_code == 409
    assert client.get(url).json()["workspace"]["document"]["adr"] == payload["document"]["adr"]
    payload.update(version_id="old", revision=2)
    assert client.post(url + "/workspace", json=payload).status_code == 409


@pytest.mark.parametrize(
    "mutation",
    [
        "dangling",
        "duplicate_node",
        "duplicate_edge",
        "self_loop",
        "unknown_kind",
        "blank_name",
        "position",
        "too_many_nodes",
        "extra_field",
        "long_text",
        "negative_revision",
        "overflow_revision",
    ],
)
def test_invalid_designs_cannot_replace_a_saved_draft(client, mutation):
    url = "/api/v1/designs/durable-document-ingestion"
    challenge = client.get(url).json()
    payload = dict(version_id=challenge["version_id"], revision=0, document=design_document())
    assert client.post(url + "/workspace", json=payload).status_code == 200
    payload["revision"] = 1
    graph = payload["document"]["diagram"]
    if mutation == "dangling":
        graph["edges"][0]["target"] = "missing"
    elif mutation == "duplicate_node":
        graph["nodes"].append(deepcopy(graph["nodes"][0]))
    elif mutation == "duplicate_edge":
        graph["edges"].append(deepcopy(graph["edges"][0]))
    elif mutation == "self_loop":
        graph["edges"][0]["target"] = "api"
    elif mutation == "unknown_kind":
        graph["nodes"][0]["data"]["kind"] = "script"
    elif mutation == "blank_name":
        graph["nodes"][0]["data"]["label"] = "  "
    elif mutation == "position":
        graph["nodes"][0]["position"]["x"] = 20001
    elif mutation == "too_many_nodes":
        graph["nodes"] = graph["nodes"] * 31
    elif mutation == "extra_field":
        graph["nodes"][0]["dangerouslySetInnerHTML"] = "script"
    elif mutation == "long_text":
        payload["document"]["adr"] = "x" * 6001
    elif mutation == "negative_revision":
        payload["revision"] = -1
    elif mutation == "overflow_revision":
        payload["revision"] = 2147483647
    response = client.post(url + "/workspace", json=payload)
    assert response.status_code == 422, response.text
    assert client.get(url).json()["workspace"]["revision"] == 1


def test_review_readiness_requires_all_five_deliverables_and_known_rubric(client):
    url = "/api/v1/designs/version-aware-support-assistant"
    challenge = client.get(url).json()
    payload = dict(
        version_id=challenge["version_id"],
        revision=0,
        document=design_document(),
        action="submit_for_review",
    )
    for key in ("flow", "capacity", "failures", "adr"):
        incomplete = deepcopy(payload)
        incomplete["document"][key] = " \n "
        assert client.post(url + "/workspace", json=incomplete).status_code == 422
    incomplete = deepcopy(payload)
    incomplete["document"]["diagram"]["edges"] = []
    assert client.post(url + "/workspace", json=incomplete).status_code == 422
    payload["document"]["ratings"] = {"invented": "defensible"}
    assert client.post(url + "/workspace", json=payload).status_code == 422
    assert client.get(url).json()["workspace"]["revision"] == 0
    assert client.get("/api/v1/designs/missing").status_code == 404


def test_design_catalog_matches_curriculum_and_rejects_broken_authored_content(client):
    items = client.get("/api/v1/designs").json()["items"]
    assert [item["id"] for item in items] == ["D01", "D02", "D03"]
    plan = client.get("/api/v1/curriculum").json()
    design_module = next(module for module in plan["modules"] if module["id"] == "system_design")
    assert design_module["available_count"] == 3
    assert {entry["slug"] for entry in design_module["entries"] if entry["available"]} == {
        item["slug"] for item in items
    }
    item = next(iter(load_designs(ROOT / "content/system-design").values())).model_dump()
    item["prompts"].pop("adr")
    with pytest.raises(ValueError):
        DesignChallenge.model_validate(item)
