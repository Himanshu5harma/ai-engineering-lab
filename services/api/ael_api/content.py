import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator


class Metadata(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: Literal[1]
    slug: str = Field(pattern=r"^[a-z][a-z0-9-]{2,79}$")
    version: int = Field(ge=1)
    title: str = Field(min_length=3, max_length=120)
    difficulty: Literal["Foundation", "Intermediate", "Advanced", "Senior / Production"]
    track: str = Field(pattern=r"^[a-z][a-z0-9-]+$")
    tags: list[str] = Field(min_length=1, max_length=12)
    function_name: str = Field(pattern=r"^[a-z][a-z0-9_]+$")
    summary: str
    learning_objectives: list[str]
    constraints: list[str]
    production_relevance: str


class Case(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1)
    kwargs: dict[str, Any]
    expected: Any = None
    raises: Literal["ValueError", "TypeError"] | None = None

    @model_validator(mode="after")
    def expectation(self) -> "Case":
        if self.raises and "expected" in self.model_fields_set:
            raise ValueError("Use either expected or raises")
        if not self.raises and "expected" not in self.model_fields_set:
            raise ValueError("Missing expected or raises")
        return self


@dataclass(frozen=True)
class ChallengeBundle:
    metadata: Metadata
    digest: str
    problem: str
    starter: str
    hints: list[str]
    public: list[Case]
    hidden: list[Case]
    reference: str
    explanation: str

    @property
    def version_id(self) -> str:
        return f"{self.metadata.slug}:{self.digest}"

    def learner(self) -> dict[str, Any]:
        return {
            **self.metadata.model_dump(),
            "version_id": self.version_id,
            "problem": self.problem,
            "starter_code": self.starter,
            "hints": self.hints,
            "public_cases": [case.model_dump(exclude_none=True) for case in self.public],
            "public_count": len(self.public),
            "verification_count": len(self.public) + len(self.hidden),
        }


def load_bundles(root: Path) -> dict[str, ChallengeBundle]:
    bundles: dict[str, ChallengeBundle] = {}
    for folder in sorted(root.iterdir()):
        if not folder.is_dir():
            continue
        names = [
            "metadata.yaml",
            "problem.md",
            "starter.py",
            "hints.md",
            "tests/public.json",
            "tests/hidden.json",
            "reference_solution.py",
            "explanation.md",
        ]
        files = {name: (folder / name).read_text() for name in names}
        meta = Metadata.model_validate(yaml.safe_load(files["metadata.yaml"]))
        if meta.slug != folder.name or meta.slug in bundles:
            raise ValueError(f"Duplicate slug or folder mismatch: {folder}")
        digest = hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
        suites = [
            [Case.model_validate(c) for c in json.loads(files[f"tests/{kind}.json"])]
            for kind in ("public", "hidden")
        ]
        if any(not suite or len(suite) > 50 for suite in suites):
            raise ValueError("Each test suite needs 1–50 cases")
        if len({c.name for suite in suites for c in suite}) != sum(map(len, suites)):
            raise ValueError("Case names must be unique")
        bundles[meta.slug] = ChallengeBundle(
            meta,
            digest,
            files["problem.md"],
            files["starter.py"],
            [h.strip() for h in files["hints.md"].split("---")],
            suites[0],
            suites[1],
            files["reference_solution.py"],
            files["explanation.md"],
        )
    if not bundles:
        raise ValueError("No challenge packages found")
    return bundles
