"""Public/private pytest contracts execute only repository-authored references.

Untrusted submissions always go through the Docker worker, never this fixture.
"""

import importlib.util
import json
from pathlib import Path

import pytest
import yaml
from ael_api.config import ROOT
from ael_worker.judge import equivalent


def trusted_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def check_contract(request):
    folder = Path(request.module.__file__).parents[1]
    metadata = yaml.safe_load((folder / "metadata.yaml").read_text())
    reference = trusted_module(folder.name, folder / "reference_solution.py")
    function = getattr(reference, metadata["function_name"])
    bridge = trusted_module("trusted_bridge", ROOT / "infra/sandbox/entrypoint.py")

    def check(case):
        kwargs = bridge.decode_inputs(case["kwargs"])
        before = bridge.snapshot_inputs(kwargs)
        if case.get("raises"):
            expected_exception = {"ValueError": ValueError, "TypeError": TypeError}[case["raises"]]
            with pytest.raises(expected_exception):
                function(**kwargs)
        else:
            actual = function(**kwargs)
            assert equivalent(actual, case["expected"]), (case["name"], actual, case["expected"])
        assert bridge.snapshot_inputs(kwargs) == before, "Input mutation is not allowed"
        # Fixtures themselves must remain safe, declarative data.
        json.dumps(case, allow_nan=False)

    return check
