"""Persist versioned architecture drafts with optimistic concurrency."""

import sqlalchemy as sa
from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "design_workspaces",
        sa.Column("version_id", sa.String(160), primary_key=True),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("document", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("revision >= 1"),
        sa.CheckConstraint("status IN ('draft', 'ready_for_review')"),
    )
    op.create_index("ix_design_workspaces_slug", "design_workspaces", ["slug"])


def downgrade() -> None:
    op.drop_table("design_workspaces")
