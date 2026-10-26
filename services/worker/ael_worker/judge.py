import math
from dataclasses import dataclass, field
from typing import Any

from ael_api.content import Case
from ael_api.schemas import Status


@dataclass
class CaseResult:
    name: str
    hidden: bool
    passed: bool
    expected: Any
    actual: Any
    error: str = ""
    stdout: str = ""


@dataclass
class Outcome:
    status: Status
    message: str
    results: list[CaseResult] = field(default_factory=list)
    duration_ms: int = 0


def equivalent(actual: Any, expected: Any, depth: int = 0) -> bool:
    if depth > 20:
        return False
    if type(expected) in (int, float):
        return (
            type(actual) in (int, float)
            and math.isfinite(actual)
            and math.isclose(actual, expected, rel_tol=0.0, abs_tol=1e-9)
        )
    if isinstance(expected, list):
        return (
            isinstance(actual, list)
            and len(actual) == len(expected)
            and all(equivalent(a, e, depth + 1) for a, e in zip(actual, expected, strict=True))
        )
    if isinstance(expected, dict):
        return (
            isinstance(actual, dict)
            and actual.keys() == expected.keys()
            and all(equivalent(actual[k], v, depth + 1) for k, v in expected.items())
        )
    return type(actual) is type(expected) and bool(actual == expected)


def judge(cases: list[Case], responses: list[dict[str, Any]], public_count: int) -> Outcome:
    if len(responses) != len(cases):
        return Outcome("execution_error", "Sandbox returned an incomplete result protocol")
    results = []
    for index, (case, response) in enumerate(zip(cases, responses, strict=True)):
        error_type = response.get("exception")
        passed = (
            error_type == case.raises
            if case.raises
            else error_type is None
            and "value" in response
            and equivalent(response["value"], case.expected)
        )
        if response.get("mutated"):
            passed = False
        error = str(response.get("error", ""))[:2000]
        if not passed and not error:
            error = (
                "Input was mutated"
                if response.get("mutated")
                else "Returned value does not match the contract"
            )
        results.append(
            CaseResult(
                case.name,
                index >= public_count,
                passed,
                {"raises": case.raises} if case.raises else case.expected,
                response.get("value") if not error_type else {"exception": error_type},
                error,
                str(response.get("stdout", ""))[:4096],
            )
        )
    passed_count = sum(r.passed for r in results)
    return Outcome(
        "passed" if passed_count == len(cases) else "failed",
        f"{passed_count}/{len(cases)} tests passed",
        results,
    )
