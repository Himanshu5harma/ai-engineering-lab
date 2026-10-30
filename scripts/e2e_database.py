"""Prepare/clean a temporary loopback PostgreSQL database for real browser verification."""

import argparse
import json
import os
import shlex
from uuid import uuid4

from ael_api.config import ROOT, Settings
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

parser = argparse.ArgumentParser()
parser.add_argument("--cleanup", action="store_true")
args = parser.parse_args()
state = ROOT / ".cache/e2e-database.json"
env_file = ROOT / ".cache/e2e.env"
base_url = make_url(Settings().database_url)
if base_url.host not in ("127.0.0.1", "localhost") or not base_url.drivername.startswith(
    "postgresql"
):
    raise SystemExit("Isolated browser setup supports only a loopback PostgreSQL instance")
admin = create_engine(base_url.set(database="postgres"), isolation_level="AUTOCOMMIT")
if args.cleanup:
    if not state.exists():
        raise SystemExit("No temporary browser database to clean up")
    database_name = json.loads(state.read_text())["database"]
    if not database_name.startswith("ael_e2e_") or not database_name[8:].isalnum():
        raise SystemExit("Refusing unexpected database name")
    with admin.connect() as connection:
        connection.execute(
            text(
                "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                "WHERE datname=:name AND pid<>pg_backend_pid()"
            ),
            {"name": database_name},
        )
        quoted = connection.dialect.identifier_preparer.quote(database_name)
        connection.exec_driver_sql(f"DROP DATABASE {quoted}")
    state.unlink()
    env_file.unlink(missing_ok=True)
    print("Removed only the temporary browser-verification database")
else:
    if state.exists():
        raise SystemExit(
            "Temporary browser database already exists; clean it before preparing another"
        )
    database_name = f"ael_e2e_{uuid4().hex[:12]}"
    state.parent.mkdir(parents=True, exist_ok=True)
    with admin.connect() as connection:
        quoted = connection.dialect.identifier_preparer.quote(database_name)
        connection.exec_driver_sql(f"CREATE DATABASE {quoted}")
    state.write_text(json.dumps({"database": database_name}))
    url = base_url.set(database=database_name).render_as_string(hide_password=False)
    os.environ["AEL_DATABASE_URL"] = url
    command.upgrade(Config(str(ROOT / "alembic.ini")), "head")
    variables = {
        "AEL_DATABASE_URL": url,
        "AEL_ALLOWED_ORIGINS": '["http://127.0.0.1:5175","http://localhost:5175","http://127.0.0.1:8081","http://localhost:8081"]',
        "AEL_API_TARGET": "http://127.0.0.1:8001",
        "AEL_WEB_URL": "http://127.0.0.1:5175",
    }
    env_file.write_text(
        "\n".join(f"export {key}={shlex.quote(value)}" for key, value in variables.items()) + "\n"
    )
    print("Prepared temporary database; source .cache/e2e.env in the test-service terminals")
admin.dispose()
