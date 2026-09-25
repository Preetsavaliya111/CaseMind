"""Create tenant-scoped cases and comments.

Revision ID: 98c4aa1e7d20
Revises: 7f6d1d2b83ac
Create Date: 2026-09-20
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "98c4aa1e7d20"
down_revision: Union[str, Sequence[str], None] = "7f6d1d2b83ac"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table("cases", sa.Column("id", sa.UUID(), nullable=False), sa.Column("organization_id", sa.UUID(), nullable=False), sa.Column("case_number", sa.String(length=32), nullable=False), sa.Column("subject", sa.String(length=200), nullable=False), sa.Column("description", sa.Text(), nullable=False), sa.Column("status", sa.String(length=32), nullable=False), sa.Column("priority", sa.String(length=16), nullable=False), sa.Column("category", sa.String(length=64), nullable=False), sa.Column("product", sa.String(length=120), nullable=True), sa.Column("customer_name", sa.String(length=255), nullable=True), sa.Column("tags", sa.JSON(), nullable=False), sa.Column("reporter_id", sa.UUID(), nullable=False), sa.Column("assignee_id", sa.UUID(), nullable=True), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False), sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True), sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True), sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True), sa.ForeignKeyConstraint(["assignee_id"], ["users.id"]), sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]), sa.ForeignKeyConstraint(["reporter_id"], ["users.id"]), sa.PrimaryKeyConstraint("id"), sa.UniqueConstraint("organization_id", "case_number", name="uq_cases_org_number"))
    op.create_index("ix_cases_org_priority", "cases", ["organization_id", "priority"])
    op.create_index("ix_cases_org_status_updated", "cases", ["organization_id", "status", "updated_at"])
    op.create_table("case_comments", sa.Column("id", sa.UUID(), nullable=False), sa.Column("organization_id", sa.UUID(), nullable=False), sa.Column("case_id", sa.UUID(), nullable=False), sa.Column("author_id", sa.UUID(), nullable=False), sa.Column("content", sa.Text(), nullable=False), sa.Column("is_internal", sa.Boolean(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False), sa.ForeignKeyConstraint(["author_id"], ["users.id"]), sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]), sa.PrimaryKeyConstraint("id"))
    op.create_index("ix_case_comments_org_case", "case_comments", ["organization_id", "case_id"])


def downgrade() -> None:
    op.drop_index("ix_case_comments_org_case", table_name="case_comments")
    op.drop_table("case_comments")
    op.drop_index("ix_cases_org_status_updated", table_name="cases")
    op.drop_index("ix_cases_org_priority", table_name="cases")
    op.drop_table("cases")
