"""Run the production Nginx config and built assets against the isolated API, then remove it."""

import argparse
import os
import platform
import subprocess
import sys
import time
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import uuid4

import httpx
from ael_api.config import ROOT

parser = argparse.ArgumentParser()
parser.add_argument(
    "--browser", action="store_true", help="Also verify the built editor and site layouts"
)
args = parser.parse_args()

if not (ROOT / "apps/web/dist/index.html").exists():
    raise SystemExit("Build the frontend before checking the proxy")
name = f"ael-proxy-check-{uuid4().hex[:10]}"
config = (ROOT / "infra/docker/nginx.conf").read_text()
linux = platform.system() == "Linux"
config = config.replace(
    "http://api:8000", "http://127.0.0.1:8001" if linux else "http://host.docker.internal:8001"
)
if linux:
    config = config.replace("listen 8080", "listen 127.0.0.1:8081")
with TemporaryDirectory(prefix="ael-proxy-") as folder:
    conf = Path(folder) / "default.conf"
    conf.write_text(config)
    command = [
        "docker",
        "run",
        "-d",
        "--name",
        name,
        "--read-only",
        "--cap-drop=ALL",
        "--security-opt=no-new-privileges:true",
        "--tmpfs",
        "/tmp:size=16m",
        "-v",
        f"{conf}:/etc/nginx/conf.d/default.conf:ro",
        "-v",
        f"{ROOT / 'apps/web/dist'}:/usr/share/nginx/html:ro",
    ]
    command += ["--network=host"] if linux else ["-p", "127.0.0.1:8081:8080"]
    command += ["nginxinc/nginx-unprivileged:1.28-alpine"]
    subprocess.run(command, check=True, capture_output=True)
    try:
        for _ in range(60):
            try:
                response = httpx.get("http://127.0.0.1:8081/api/v1/health", timeout=2)
                if response.status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            time.sleep(0.25)
        else:
            subprocess.run(["docker", "logs", name], check=False)
            raise SystemExit("Isolated proxy could not reach the isolated API on port 8001")
        env = {**os.environ, "AEL_TEST_PROXY_URL": "http://127.0.0.1:8081"}
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "-q", "services/api/tests/test_proxy.py"],
            cwd=ROOT,
            env=env,
        )
        if result.returncode == 0 and args.browser:
            browser_env = {**env, "AEL_WEB_URL": "http://127.0.0.1:8081"}
            result = subprocess.run(
                [
                    "npm",
                    "--prefix",
                    "apps/web",
                    "run",
                    "test:e2e",
                    "--",
                    "e2e/editor.spec.ts",
                    "e2e/layout.spec.ts",
                    "--output=" + str(ROOT / ".cache/proxy-browser-results"),
                    "--reporter=line",
                ],
                cwd=ROOT,
                env=browser_env,
            )
        raise SystemExit(result.returncode)
    finally:
        subprocess.run(["docker", "rm", "-f", name], check=True, capture_output=True)
