"""Trusted reference verification; never import learner source on the host."""

import json
from pathlib import Path

import pytest

CASES = json.loads(Path(__file__).with_name("public.json").read_text())


@pytest.mark.parametrize("case", CASES, ids=lambda case: case["name"])
def test_public_contract(case, check_contract):
    check_contract(case)
