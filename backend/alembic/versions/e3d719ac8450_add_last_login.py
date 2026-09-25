"""Add last successful login timestamp.

Revision ID: e3d719ac8450
Revises: c18f4b7e92ad
Create Date: 2026-09-24
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "e3d719ac8450"
down_revision: Union[str, Sequence[str], None] = "c18f4b7e92ad"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(timezone=True)))


def downgrade() -> None:
    op.drop_column("users", "last_login_at")
