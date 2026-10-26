"""Versioned challenge content, durable execution jobs, results and worker health."""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "tracks",
        sa.Column("id", sa.String(80), primary_key=True),
        sa.Column("title", sa.String(120), nullable=False),
    )
    op.create_table(
        "challenges",
        sa.Column("slug", sa.String(80), primary_key=True),
        sa.Column("track_id", sa.String(80), sa.ForeignKey("tracks.id"), nullable=False),
        sa.Column("title", sa.String(120), nullable=False),
    )
    op.create_table(
        "challenge_versions",
        sa.Column("id", sa.String(160), primary_key=True),
        sa.Column(
            "challenge_slug", sa.String(80), sa.ForeignKey("challenges.slug"), nullable=False
        ),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("digest", sa.String(64), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index(
        "ix_challenge_versions_challenge_slug", "challenge_versions", ["challenge_slug"]
    )
    op.create_table(
        "submissions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column(
            "version_id", sa.String(160), sa.ForeignKey("challenge_versions.id"), nullable=False
        ),
        sa.Column("action", sa.String(10), nullable=False),
        sa.Column("code", sa.Text(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True)),
        sa.Column("completed_at", sa.DateTime(timezone=True)),
        sa.Column("duration_ms", sa.Integer()),
        sa.Column("message", sa.Text(), nullable=False),
        sa.CheckConstraint("action IN ('run','submit')"),
        sa.CheckConstraint(
            "status IN ('queued','running','passed','failed','timed_out',"
            "'execution_error','infrastructure_error')"
        ),
    )
    op.create_index("ix_submissions_version_id", "submissions", ["version_id"])
    op.create_index("ix_submission_queue", "submissions", ["status", "created_at"])
    op.create_table(
        "test_results",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("submission_id", sa.String(36), sa.ForeignKey("submissions.id"), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("hidden", sa.Boolean(), nullable=False),
        sa.Column("passed", sa.Boolean(), nullable=False),
        sa.Column("expected", sa.JSON()),
        sa.Column("actual", sa.JSON()),
        sa.Column("error", sa.Text(), nullable=False),
        sa.Column("stdout", sa.Text(), nullable=False),
    )
    op.create_index("ix_test_results_submission_id", "test_results", ["submission_id"])
    op.create_table(
        "worker_health",
        sa.Column("id", sa.String(30), primary_key=True),
        sa.Column("heartbeat_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("available", sa.Boolean(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
    )


def downgrade() -> None:
    for table in (
        "worker_health",
        "test_results",
        "submissions",
        "challenge_versions",
        "challenges",
        "tracks",
    ):
        op.drop_table(table)
