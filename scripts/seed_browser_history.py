"""Seed one previous-version design only in a recorded temporary browser database."""

import json

from ael_api.config import ROOT, Settings
from ael_api.db import database
from ael_api.designs import DesignDocument, load_designs
from ael_api.models import DesignWorkspace, now
from sqlalchemy.engine import make_url

settings = Settings()
name = make_url(settings.database_url).database
state = ROOT / ".cache/e2e-database.json"
if (
    not state.exists()
    or name != json.loads(state.read_text())["database"]
    or not name.startswith("ael_e2e_")
):
    raise SystemExit("Refusing to seed outside the recorded temporary browser database")
challenge = load_designs(settings.content_dir.parent / "system-design")["enterprise-rag-platform"]
old = challenge.model_copy(
    update={"summary": "Earlier exercise brief for history regression coverage."}
)
engine, sessions = database(settings.database_url)
with sessions() as session:
    if session.get(DesignWorkspace, old.version_id) is None:
        session.add(
            DesignWorkspace(
                version_id=old.version_id,
                slug=old.slug,
                revision=2,
                document=DesignDocument(
                    flow="Previous-version request flow",
                    adr="Keep evidence of the original decision",
                ).model_dump(),
                status="draft",
                updated_at=now(),
                exercise_snapshot=old.model_dump(),
            )
        )
        session.commit()
engine.dispose()
print("Seeded one prior-version design in the temporary browser database")
