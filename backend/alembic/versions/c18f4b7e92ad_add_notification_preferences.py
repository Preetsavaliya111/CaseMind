"""Add user notification preferences.

Revision ID: c18f4b7e92ad
Revises: bd5e8a32fc11
Create Date: 2026-09-24
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "c18f4b7e92ad"
down_revision: Union[str, Sequence[str], None] = "bd5e8a32fc11"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("notification_preferences", sa.JSON(), server_default=sa.text("'{}'::json"), nullable=False))


def downgrade() -> None:
    op.drop_column("users", "notification_preferences")
