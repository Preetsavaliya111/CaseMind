"""Create persistent user notifications.

Revision ID: e5a731c82db4
Revises: d2f684b9150a
Create Date: 2026-09-24
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "e5a731c82db4"
down_revision: Union[str, Sequence[str], None] = "d2f684b9150a"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table("notifications",
        sa.Column("id", sa.UUID(), nullable=False), sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("recipient_id", sa.UUID(), nullable=False), sa.Column("actor_id", sa.UUID()),
        sa.Column("notification_type", sa.String(64), nullable=False), sa.Column("severity", sa.String(16), nullable=False),
        sa.Column("title", sa.String(180), nullable=False), sa.Column("message", sa.String(500), nullable=False),
        sa.Column("locator", sa.String(500)), sa.Column("entity_type", sa.String(64)), sa.Column("entity_id", sa.String(100)),
        sa.Column("dedup_key", sa.String(255)), sa.Column("read_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recipient_id"], ["users.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("recipient_id", "dedup_key", name="uq_notifications_recipient_dedup"))
    op.create_index("ix_notifications_recipient_created", "notifications", ["recipient_id", "created_at"])

def downgrade() -> None:
    op.drop_index("ix_notifications_recipient_created", table_name="notifications"); op.drop_table("notifications")
