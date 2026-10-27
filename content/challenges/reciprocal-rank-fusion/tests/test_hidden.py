"""Verify only trusted repository reference code."""

import json
from pathlib import Path

import pytest

CASES = json.loads(Path(__file__).with_name("hidden.json").read_text())


@pytest.mark.parametrize("case", CASES, ids=lambda case: case["name"])
def test_hidden_contract(case, check_contract):
    check_contract(case)
