"""Review concurrency and design provenance; no existing drafts are replaced."""

import sqlalchemy as sa
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "challenge_reviews", sa.Column("revision", sa.Integer(), nullable=False, server_default="1")
    )
    op.add_column("design_workspaces", sa.Column("exercise_snapshot", sa.JSON(), nullable=True))
    op.add_column(
        "design_workspaces", sa.Column("source_version_id", sa.String(160), nullable=True)
    )
    op.add_column("design_workspaces", sa.Column("source_revision", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("design_workspaces", "source_revision")
    op.drop_column("design_workspaces", "source_version_id")
    op.drop_column("design_workspaces", "exercise_snapshot")
    op.drop_column("challenge_reviews", "revision")
