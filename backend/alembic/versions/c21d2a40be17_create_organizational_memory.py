"""Create organizational memory and evidence links.

Revision ID: c21d2a40be17
Revises: b3147bfc18de
Create Date: 2026-09-21
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c21d2a40be17"
down_revision: Union[str, Sequence[str], None] = "b3147bfc18de"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "memory_items",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("memory_type", sa.String(length=40), nullable=False),
        sa.Column("issue_pattern", sa.Text(), nullable=False),
        sa.Column("root_cause", sa.Text(), nullable=True),
        sa.Column("resolution_steps", sa.JSON(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("verification_state", sa.String(length=24), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("product", sa.String(length=120), nullable=True),
        sa.Column("category", sa.String(length=64), nullable=True),
        sa.Column("usage_count", sa.Integer(), nullable=False),
        sa.Column("created_by_id", sa.UUID(), nullable=False),
        sa.Column("verified_by_id", sa.UUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("last_validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.ForeignKeyConstraint(["verified_by_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_memory_items_org_state_updated", "memory_items", ["organization_id", "verification_state", "updated_at"])
    op.create_index("ix_memory_items_org_type", "memory_items", ["organization_id", "memory_type"])
    op.create_table(
        "memory_sources",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("memory_item_id", sa.UUID(), nullable=False),
        sa.Column("source_type", sa.String(length=24), nullable=False),
        sa.Column("source_id", sa.UUID(), nullable=False),
        sa.Column("source_title", sa.String(length=255), nullable=False),
        sa.Column("source_locator", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["memory_item_id"], ["memory_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("memory_item_id", "source_type", "source_id", name="uq_memory_sources_item_source"),
    )
    op.create_index("ix_memory_sources_org_item", "memory_sources", ["organization_id", "memory_item_id"])


def downgrade() -> None:
    op.drop_index("ix_memory_sources_org_item", table_name="memory_sources")
    op.drop_table("memory_sources")
    op.drop_index("ix_memory_items_org_type", table_name="memory_items")
    op.drop_index("ix_memory_items_org_state_updated", table_name="memory_items")
    op.drop_table("memory_items")
