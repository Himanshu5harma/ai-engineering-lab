import logging
import signal
import time

from ael_api.config import Settings
from ael_api.content import load_bundles
from ael_api.db import database
from ael_api.models import WorkerHealth, now
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from ael_worker.runner import DockerRunner
from ael_worker.service import Worker

log = logging.getLogger("ael.worker")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
    settings = Settings()
    engine, sessions = database(settings.database_url)
    if engine.dialect.name != "postgresql":
        raise SystemExit("The execution worker requires PostgreSQL")
    stopped = False

    def stop(*_: object) -> None:
        nonlocal stopped
        stopped = True

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    worker = Worker(
        sessions,
        load_bundles(settings.content_dir),
        DockerRunner(settings.sandbox_image, settings.execution_timeout),
    )
    has_lease = False
    try:
        while not stopped:
            try:
                with engine.connect() as lease:
                    if not lease.scalar(text("SELECT pg_try_advisory_lock(7301202)")):
                        raise SystemExit("A local worker is already running")
                    lease.commit()
                    has_lease = True
                    try:
                        while not stopped:
                            # An engine pool can reconnect ordinary sessions after a DB restart,
                            # but the old session lock is then gone. Check its connection before
                            # claiming anything, and reacquire the lock after connection loss.
                            lease.execute(text("SELECT 1"))
                            lease.commit()
                            ready = worker.heartbeat()
                            worker.recover()
                            if not ready or not worker.process_one():
                                time.sleep(1)
                    finally:
                        if not lease.invalidated:
                            lease.rollback()
                            lease.execute(text("SELECT pg_advisory_unlock(7301202)"))
                            lease.commit()
            except SQLAlchemyError:
                has_lease = False
                log.warning("Database connection interrupted; reacquiring worker lease")
                engine.dispose()
                if not stopped:
                    time.sleep(1)
    finally:
        try:
            if has_lease:
                with sessions() as session:
                    session.merge(
                        WorkerHealth(
                            id="local",
                            available=False,
                            heartbeat_at=now(),
                            message="Execution worker stopped",
                        )
                    )
                    session.commit()
        except SQLAlchemyError:
            log.warning("Database unavailable while stopping worker")
        engine.dispose()


if __name__ == "__main__":
    main()
