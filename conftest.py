import pytest
from ael_api.config import ROOT, Settings
from ael_api.content import load_bundles
from ael_api.main import create_app
from ael_api.models import Base
from ael_worker.judge import CaseResult, Outcome
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


@pytest.fixture
def bundles():
    return load_bundles(ROOT / "content/challenges")


@pytest.fixture
def sessions():
    engine = create_engine(
        "sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False}
    )

    @event.listens_for(engine, "connect")
    def foreign_keys(connection, record):
        connection.execute("PRAGMA foreign_keys=ON")

    Base.metadata.create_all(engine)
    yield sessionmaker(engine, expire_on_commit=False)
    engine.dispose()


@pytest.fixture
def client(sessions):
    with TestClient(create_app(Settings(), sessions)) as client:
        yield client


class FakeRunner:
    """Test-only predetermined results. Never executes source code."""

    def available(self):
        return True, "Test fixture runner"

    def run(self, bundle, code, action):
        cases = bundle.public + (bundle.hidden if action == "submit" else [])
        correct = code == "correct"
        return Outcome(
            "passed" if correct else "failed",
            "Test fixture results",
            [
                CaseResult(
                    c.name,
                    i >= len(bundle.public),
                    correct,
                    c.expected,
                    c.expected if correct else "wrong",
                    "" if correct else "Mismatch",
                    "PRIVATE OUTPUT" if i >= len(bundle.public) else "visible output",
                )
                for i, c in enumerate(cases)
            ],
            12,
        )


@pytest.fixture
def fake_runner():
    return FakeRunner()
