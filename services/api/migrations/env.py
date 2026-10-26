from ael_api.config import Settings
from ael_api.models import Base
from alembic import context
from sqlalchemy import create_engine, pool

config = context.config
target_metadata = Base.metadata

if context.is_offline_mode():
    context.configure(
        url=Settings().database_url, target_metadata=target_metadata, literal_binds=True
    )
    with context.begin_transaction():
        context.run_migrations()
else:
    engine = create_engine(Settings().database_url, poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
