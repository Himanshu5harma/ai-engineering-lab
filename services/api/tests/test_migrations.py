"""Verify the additive draft migration with existing records, in an isolated schema."""

import json
import os
from uuid import uuid4

import pytest
from ael_api.config import ROOT
from ael_api.db import sync_content
from ael_api.designs import DesignDocument
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

pytestmark = pytest.mark.postgres


def test_upgrade_preserves_existing_reviews_and_designs(monkeypatch, bundles):
    url = os.getenv("AEL_TEST_DATABASE_URL")
    if not url:
        pytest.skip("Set AEL_TEST_DATABASE_URL for isolated migration verification")
    schema = f"ael_migration_{uuid4().hex}"
    admin = create_engine(url)
    with admin.begin() as connection:
        connection.execute(text(f'CREATE SCHEMA "{schema}"'))
    scoped = make_url(url).update_query_dict({"options": f"-csearch_path={schema}"})
    engine = create_engine(scoped)
    try:
        monkeypatch.setenv("AEL_DATABASE_URL", scoped.render_as_string(hide_password=False))
        config = Config(str(ROOT / "alembic.ini"))
        command.upgrade(config, "0003")
        factory = sessionmaker(engine)
        with factory() as session:
            sync_content(session, bundles)
        version = next(iter(bundles.values())).version_id
        document = DesignDocument(flow="Original flow", adr="Original decision").model_dump()
        with engine.begin() as connection:
            connection.execute(
                text(
                    "INSERT INTO challenge_reviews (version_id,completed_tasks,notes,updated_at) "
                    "VALUES (:version, '[]', 'Existing reasoning', now())"
                ),
                {"version": version},
            )
            connection.execute(
                text(
                    "INSERT INTO design_workspaces "
                    "(version_id,slug,revision,document,status,updated_at) "
                    "VALUES ('design:original','design',4,CAST(:document AS json),'draft',now())"
                ),
                {"document": json.dumps(document)},
            )
        command.upgrade(config, "head")
        with engine.connect() as connection:
            review = connection.execute(text("SELECT notes,revision FROM challenge_reviews")).one()
            design = connection.execute(
                text(
                    "SELECT document,revision,source_version_id,exercise_snapshot "
                    "FROM design_workspaces"
                )
            ).one()
        assert review == ("Existing reasoning", 1)
        assert design.document == document and design.revision == 4
        assert design.source_version_id is None and design.exercise_snapshot is None
    finally:
        engine.dispose()
        with admin.begin() as connection:
            connection.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))
        admin.dispose()
