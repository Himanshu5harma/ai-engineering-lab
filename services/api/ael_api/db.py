from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from ael_api.content import ChallengeBundle
from ael_api.models import Challenge, ChallengeVersion, Track


def database(url: str) -> tuple[Engine, sessionmaker[Session]]:
    engine = create_engine(url, pool_pre_ping=True)
    return engine, sessionmaker(engine, expire_on_commit=False)


def sync_content(session: Session, bundles: dict[str, ChallengeBundle]) -> None:
    for bundle in bundles.values():
        meta = bundle.metadata
        if session.get(Track, meta.track) is None:
            session.add(Track(id=meta.track, title=meta.track.replace("-", " ").title()))
            session.flush()
        challenge = session.get(Challenge, meta.slug)
        if challenge is None:
            session.add(Challenge(slug=meta.slug, title=meta.title, track_id=meta.track))
            session.flush()
        else:
            challenge.title = meta.title
            challenge.track_id = meta.track
        if session.get(ChallengeVersion, bundle.version_id) is None:
            session.add(
                ChallengeVersion(
                    id=bundle.version_id,
                    challenge_slug=meta.slug,
                    version=meta.version,
                    digest=bundle.digest,
                )
            )
    session.commit()
