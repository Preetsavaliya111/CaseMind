"""Create SLA policies, Case deadlines, and escalations.

Revision ID: d2f684b9150a
Revises: c9e441a6d052
Create Date: 2026-09-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "d2f684b9150a"
down_revision: Union[str, Sequence[str], None] = "c9e441a6d052"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table("sla_policies",
        sa.Column("id", sa.UUID(), nullable=False), sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("priority", sa.String(16), nullable=False), sa.Column("first_response_minutes", sa.Integer(), nullable=False),
        sa.Column("resolution_minutes", sa.Integer(), nullable=False), sa.Column("warning_percent", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "priority", name="uq_sla_policy_org_priority"))
    for name, column in [
        ("first_response_due_at", sa.Column("first_response_due_at", sa.DateTime(timezone=True))),
        ("resolution_due_at", sa.Column("resolution_due_at", sa.DateTime(timezone=True))),
        ("first_responded_at", sa.Column("first_responded_at", sa.DateTime(timezone=True))),
        ("sla_breached_at", sa.Column("sla_breached_at", sa.DateTime(timezone=True))),
        ("sla_warning_percent", sa.Column("sla_warning_percent", sa.Integer(), server_default="75", nullable=False)),
        ("escalation_level", sa.Column("escalation_level", sa.Integer(), server_default="0", nullable=False)),
    ]: op.add_column("cases", column)
    op.create_table("case_escalations",
        sa.Column("id", sa.UUID(), nullable=False), sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("case_id", sa.UUID(), nullable=False), sa.Column("actor_id", sa.UUID()),
        sa.Column("from_level", sa.Integer(), nullable=False), sa.Column("to_level", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["case_id"], ["cases.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"), sa.PrimaryKeyConstraint("id"))
    op.create_index("ix_case_escalations_case_created", "case_escalations", ["case_id", "created_at"])

def downgrade() -> None:
    op.drop_index("ix_case_escalations_case_created", table_name="case_escalations"); op.drop_table("case_escalations")
    for column in ("escalation_level", "sla_warning_percent", "sla_breached_at", "first_responded_at", "resolution_due_at", "first_response_due_at"): op.drop_column("cases", column)
    op.drop_table("sla_policies")
