"""HTTP regressions through the built Nginx proxy, never a TestClient substitute."""

import os
from urllib.parse import urlsplit

import httpx
import pytest

pytestmark = pytest.mark.docker


@pytest.fixture
def proxy():
    url = os.getenv("AEL_TEST_PROXY_URL")
    if not url:
        pytest.skip("Run scripts/check_proxy.py against isolated services for actual Nginx checks")
    assert urlsplit(url).hostname == "127.0.0.1"
    with httpx.Client(base_url=url, timeout=10, follow_redirects=False) as client:
        yield client


def test_proxy_valid_hosts_reach_api_and_preserve_host_in_redirects(proxy):
    port = urlsplit(str(proxy.base_url)).port
    for hostname in ("localhost", "127.0.0.1"):
        host = f"{hostname}:{port}"
        assert proxy.get("/", headers={"Host": host}).status_code == 200
        response = proxy.get("/api/v1/health", headers={"Host": host})
        assert response.status_code == 200 and response.json()["status"] == "ok"
        redirect = proxy.get("/api/v1/challenges/", headers={"Host": host})
        assert redirect.status_code == 307
        assert urlsplit(redirect.headers["location"]).netloc == host


@pytest.mark.parametrize(
    "host",
    [
        "evil.invalid",
        "localhost.evil.invalid",
        "127.0.0.1.evil",
        "testserver",
        "localhost.",
        "localhost:8081.evil",
    ],
)
def test_proxy_rejects_unexpected_hosts_on_static_and_api_routes(proxy, host):
    for path in ("/", "/api/v1/health", "/arena/top-k-vector-search"):
        assert proxy.get(path, headers={"Host": host}).status_code == 400
    assert (
        proxy.post(
            "/api/v1/submissions",
            headers={"Host": host, "Origin": "http://127.0.0.1:8081"},
            json={},
        ).status_code
        == 400
    )


def test_proxy_write_origins_and_spoofed_forwarded_headers(proxy):
    assert (
        proxy.post(
            "/api/v1/submissions", headers={"Origin": "https://evil.invalid"}, json={}
        ).status_code
        == 403
    )
    for origin in ("http://localhost:8081", "http://127.0.0.1:8081"):
        response = proxy.post("/api/v1/submissions", headers={"Origin": origin}, json={})
        assert response.status_code == 422  # Reached schema validation without creating activity.
    assert (
        proxy.get("/api/v1/health", headers={"X-Forwarded-Host": "evil.invalid"}).status_code == 200
    )
