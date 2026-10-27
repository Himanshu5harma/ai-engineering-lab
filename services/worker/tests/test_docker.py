import os
from contextlib import closing
from dataclasses import replace

import docker
import pytest
from ael_api.content import Case
from ael_worker.runner import DockerRunner

pytestmark = pytest.mark.docker


@pytest.fixture
def runner():
    if os.getenv("AEL_TEST_DOCKER") != "1":
        pytest.skip("Set AEL_TEST_DOCKER=1 after building the sandbox image")
    runner = DockerRunner(os.getenv("AEL_SANDBOX_IMAGE", "ael-python-sandbox:1"), timeout=3)
    ready, message = runner.available()
    assert ready, message
    return runner


def probe(bundles, expected):
    bundle = next(iter(bundles.values()))
    return replace(
        bundle,
        metadata=bundle.metadata.model_copy(update={"function_name": "probe"}),
        public=[Case(name="Resource probe", kwargs={}, expected=expected)],
    )


@pytest.mark.parametrize(
    "slug",
    [
        "safe-cosine-similarity",
        "top-k-vector-search",
        "token-window-chunking",
        "structure-aware-chunking",
        "version-aware-evidence-filter",
        "reciprocal-rank-fusion",
        "context-budget-allocator",
        "precision-recall-at-k",
        "mrr-ndcg-evaluation",
        "citation-reference-verification",
        "exponential-backoff-jitter",
        "permission-aware-tool-registry",
    ],
)
def test_real_references_and_starters(runner, bundles, slug):
    bundle = bundles[slug]
    result = runner.run(bundle, bundle.reference, "submit")
    assert result.status == "passed", result
    assert len(result.results) == len(bundle.public) + len(bundle.hidden)
    incorrect = runner.run(bundle, bundle.starter, "submit")
    assert incorrect.status == "failed"
    assert not all(r.passed for r in incorrect.results)
    from ael_api.config import ROOT

    for mutant in (ROOT / "content/challenges" / slug / "tests").glob("buggy*.py"):
        assert runner.run(bundle, mutant.read_text(), "submit").status == "failed"


def test_infinite_loop_is_killed_and_cleaned_up(runner, bundles):
    result = runner.run(probe(bundles, 1), "def probe():\n    while True: pass", "run")
    assert result.status == "timed_out"
    assert result.duration_ms < 10000


def test_excessive_output_does_not_escape_budget(runner, bundles):
    result = runner.run(
        probe(bundles, 1), "def probe():\n    print('x' * 10000)\n    return 1", "run"
    )
    assert result.status == "failed"
    assert "OutputLimitError" in str(result.results[0].actual)
    result = runner.run(
        probe(bundles, 1),
        "import os\ndef probe():\n    os.write(1, b'x' * 200000)\n    return 1",
        "run",
    )
    assert result.status == "execution_error"


def test_memory_exhaustion_is_bounded(runner, bundles):
    result = runner.run(
        probe(bundles, 1), "def probe():\n    return len(bytearray(300 * 1024 * 1024))", "run"
    )
    assert result.status == "execution_error"
    assert "memory" in result.message


@pytest.mark.parametrize(
    "code",
    ["this is invalid python !!!", "def probe():\n    raise RuntimeError('intentional failure')"],
)
def test_malformed_and_runtime_exceptions_have_feedback(runner, bundles, code):
    result = runner.run(probe(bundles, 1), code, "run")
    assert result.status == "failed"
    assert result.results[0].error


def test_nonroot_network_filesystem_and_resource_limits(runner, bundles):
    code = """import os
import socket
from pathlib import Path

def probe():
    blocked_write = False
    try:
        Path('/forbidden').write_text('blocked')
    except OSError:
        blocked_write = True
    blocked_network = False
    try:
        socket.create_connection(('1.1.1.1', 53), timeout=0.2)
    except OSError:
        blocked_network = True
    return {'uid': os.getuid(), 'memory': Path('/sys/fs/cgroup/memory.max').read_text().strip(),
            'pids': Path('/sys/fs/cgroup/pids.max').read_text().strip(),
            'cpu': Path('/sys/fs/cgroup/cpu.max').read_text().strip(),
            'write_blocked': blocked_write, 'network_blocked': blocked_network}
"""
    result = runner.run(
        probe(
            bundles,
            dict(
                uid=65534,
                memory="134217728",
                pids="32",
                cpu="100000 100000",
                write_blocked=True,
                network_blocked=True,
            ),
        ),
        code,
        "run",
    )
    assert result.status == "passed", result
    with closing(docker.from_env()) as client:
        assert not client.containers.list(all=True, filters={"label": "ael.sandbox=true"})


def test_maximum_source_size_with_escaped_characters(runner, bundles):
    bundle = bundles["safe-cosine-similarity"]
    prefix = bundle.reference + "\n#"
    code = prefix + ('\\"' * 32768)[: 32768 - len(prefix.encode())]
    assert len(code.encode()) == 32768
    result = runner.run(bundle, code, "submit")
    assert result.status == "passed", result
