import base64
import json
import logging
import time
import zlib
from contextlib import closing
from typing import Protocol
from uuid import uuid4

import docker
from ael_api.content import ChallengeBundle
from docker.errors import DockerException, NotFound
from docker.models.containers import Container
from requests.exceptions import RequestException

from ael_worker.judge import Outcome, judge

log = logging.getLogger("ael.worker.runner")
OUTPUT_LIMIT = 65536


class Runner(Protocol):
    def available(self) -> tuple[bool, str]: ...
    def run(self, bundle: ChallengeBundle, code: str, action: str) -> Outcome: ...


class DockerRunner:
    def __init__(self, image: str, timeout: int = 8):
        self.image = image
        self.timeout = timeout

    def available(self) -> tuple[bool, str]:
        try:
            with closing(docker.from_env(timeout=3)) as client:
                info = client.info()
                if (
                    info.get("OSType") != "linux"
                    or not info.get("MemoryLimit")
                    or not info.get("CpuCfsQuota")
                    or not info.get("PidsLimit")
                ):
                    return False, "Execution unavailable: Linux CPU and memory limits are required."
                if any("seccomp" in option for option in info.get("SecurityOptions", [])) is False:
                    return (
                        False,
                        "Execution unavailable: Docker's default seccomp profile is required.",
                    )
                client.images.get(self.image)
            return True, "Local isolated Python worker ready"
        except (DockerException, RequestException, OSError):
            return (
                False,
                "Execution unavailable: Docker engine or sandbox image missing. Run make sandbox.",
            )

    def run(self, bundle: ChallengeBundle, code: str, action: str) -> Outcome:
        cases = bundle.public + (bundle.hidden if action == "submit" else [])
        payload = base64.b64encode(
            zlib.compress(
                json.dumps(
                    {
                        "code": code,
                        "function": bundle.metadata.function_name,
                        "inputs": [c.kwargs for c in cases],
                    },
                    ensure_ascii=False,
                ).encode()
            )
        ).decode()
        started = time.monotonic()
        container: Container | None = None
        outcome = Outcome("infrastructure_error", "Sandbox could not start")
        try:
            with closing(docker.from_env(timeout=3)) as client:
                container = client.containers.create(
                    self.image,
                    name=f"ael-sandbox-{uuid4().hex}",
                    environment={"AEL_PAYLOAD": payload},
                    network_disabled=True,
                    network_mode="none",
                    read_only=True,
                    user="65534:65534",
                    mem_limit="128m",
                    memswap_limit="128m",
                    nano_cpus=1_000_000_000,
                    pids_limit=32,
                    cap_drop=["ALL"],
                    security_opt=["no-new-privileges:true"],
                    tmpfs={"/tmp": "rw,noexec,nosuid,nodev,size=8m,mode=1777"},
                    ulimits=[
                        docker.types.Ulimit(name="nofile", soft=64, hard=64),
                        docker.types.Ulimit(name="fsize", soft=1048576, hard=1048576),
                    ],
                    log_config=docker.types.LogConfig(
                        type="json-file",
                        config={
                            "max-size": "64k",
                            "max-file": "1",
                            "mode": "non-blocking",
                            "max-buffer-size": "64k",
                        },
                    ),
                    labels={"ael.sandbox": "true"},
                )
                container.start()
                deadline = started + self.timeout
                while time.monotonic() < deadline:
                    container.reload()
                    if container.status in ("exited", "dead"):
                        break
                    time.sleep(0.05)
                else:
                    container.kill()
                    outcome = Outcome("timed_out", f"Execution exceeded {self.timeout} seconds")
                    return outcome
                state = container.attrs["State"]
                output = container.logs(stdout=True, stderr=False)
                if state.get("OOMKilled") or state.get("ExitCode") == 137:
                    outcome = Outcome(
                        "execution_error", "Execution exceeded the 128 MiB memory limit"
                    )
                elif state.get("ExitCode") != 0:
                    outcome = Outcome(
                        "execution_error", "Python exited before completing the test protocol"
                    )
                elif len(output) >= OUTPUT_LIMIT:
                    outcome = Outcome(
                        "execution_error", "Execution output exceeded the 64 KiB limit"
                    )
                else:
                    try:
                        responses = json.loads(output)
                        if not isinstance(responses, list) or not all(
                            isinstance(r, dict) for r in responses
                        ):
                            raise ValueError("Invalid protocol")
                        outcome = judge(cases, responses, len(bundle.public))
                    except (ValueError, TypeError, RecursionError, OverflowError):
                        outcome = Outcome("execution_error", "Invalid or excessive sandbox output")
        except (DockerException, RequestException, OSError):
            log.exception("Container execution failed")
            outcome = Outcome(
                "infrastructure_error", "Docker execution failed; inspect the local worker log"
            )
        finally:
            if container is not None:
                try:
                    container.remove(force=True)
                except NotFound:
                    pass
                except (DockerException, RequestException):
                    log.exception("Sandbox cleanup failed")
            outcome.duration_ms = int((time.monotonic() - started) * 1000)
        return outcome
