from __future__ import annotations

import json
from pathlib import Path
from typing import TYPE_CHECKING, Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

if TYPE_CHECKING:
    from ael_api.content import ChallengeBundle


class CurriculumItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(pattern=r"^[PRGEASODLB][0-9]{2}$")
    title: str
    difficulty: Literal["E", "M", "H", "S"] | None = None
    track: str | None = None
    track_title: str | None = None
    slug: str | None = None
    focus: str | None = None


class CurriculumModule(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: Literal["coding", "system_design", "labs", "debugging"]
    title: str
    target_count: int = Field(ge=1)
    entries: list[CurriculumItem]

    @model_validator(mode="after")
    def count(self) -> CurriculumModule:
        if len(self.entries) != self.target_count:
            raise ValueError("Module count does not match its entries")
        return self


class Curriculum(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: Literal[1]
    title: str
    modules: list[CurriculumModule]
    first_release: list[str] = Field(min_length=12, max_length=12)
    weekly_hours: dict[str, int]
    design_deliverables: list[str]

    @model_validator(mode="after")
    def consistent(self) -> Curriculum:
        entries = [entry for module in self.modules for entry in module.entries]
        ids = [entry.id for entry in entries]
        slugs = [entry.slug for entry in entries if entry.slug]
        if len(set(ids)) != len(ids) or len(set(slugs)) != len(slugs):
            raise ValueError("Curriculum IDs and linked slugs must be unique")
        if len(set(self.first_release)) != 12 or not set(self.first_release).issubset(ids):
            raise ValueError("First-release IDs must be unique curriculum entries")
        if len(self.modules) != 4 or {module.id for module in self.modules} != {
            "coding",
            "system_design",
            "labs",
            "debugging",
        }:
            raise ValueError("Expected four curriculum modules")
        coding = next(module for module in self.modules if module.id == "coding")
        linked = {entry.id for entry in coding.entries if entry.slug}
        if not set(self.first_release).issubset(linked):
            raise ValueError("First release must link twelve coding packages")
        if set(self.weekly_hours) != {module.id for module in self.modules}:
            raise ValueError("Weekly allocations must cover all four modules")
        if any(value < 0 for value in self.weekly_hours.values()):
            raise ValueError("Weekly allocations cannot be negative")
        return self

    def view(
        self, bundles: dict[str, ChallengeBundle], designs: set[str] | None = None
    ) -> dict[str, Any]:
        modules = []
        for module in self.modules:
            entries = [
                {
                    **entry.model_dump(),
                    "available": entry.slug in (designs or set())
                    if module.id == "system_design"
                    else entry.slug in bundles
                    if module.id == "coding"
                    else False,
                    "learning_order": self.first_release.index(entry.id) + 1
                    if entry.id in self.first_release
                    else None,
                }
                for entry in module.entries
            ]
            modules.append(
                {
                    "id": module.id,
                    "title": module.title,
                    "target_count": module.target_count,
                    "available_count": sum(e["available"] for e in entries),
                    "entries": entries,
                }
            )
        return {
            "title": self.title,
            "total_planned": sum(m.target_count for m in self.modules),
            "modules": modules,
            "first_release": self.first_release,
            "weekly_hours": self.weekly_hours,
            "design_deliverables": self.design_deliverables,
        }


def load_curriculum(path: Path) -> Curriculum | None:
    return Curriculum.model_validate(json.loads(path.read_text())) if path.is_file() else None
