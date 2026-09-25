"""Add session token version.

Revision ID: bd5e8a32fc11
Revises: a7c249eb105d
Create Date: 2026-09-24
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "bd5e8a32fc11"
down_revision: Union[str, Sequence[str], None] = "a7c249eb105d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("token_version", sa.Integer(), server_default="0", nullable=False))


def downgrade() -> None:
    op.drop_column("users", "token_version")
