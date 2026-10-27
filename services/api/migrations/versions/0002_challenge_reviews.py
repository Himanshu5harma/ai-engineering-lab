"""Keep learner engineering self-review separate from automated submission results."""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "challenge_reviews",
        sa.Column(
            "version_id", sa.String(160), sa.ForeignKey("challenge_versions.id"), primary_key=True
        ),
        sa.Column("completed_tasks", sa.JSON(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("challenge_reviews")
