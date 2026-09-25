"""Add optional user MFA.

Revision ID: a7c249eb105d
Revises: f1a8c20d9e37
Create Date: 2026-09-24
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "a7c249eb105d"
down_revision: Union[str, Sequence[str], None] = "f1a8c20d9e37"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("mfa_enabled", sa.Boolean(), server_default=sa.false(), nullable=False))
    op.add_column("users", sa.Column("mfa_secret_encrypted", sa.String(500)))
    op.add_column("users", sa.Column("mfa_pending_secret_encrypted", sa.String(500)))
    op.add_column("users", sa.Column("mfa_recovery_code_hashes", sa.JSON(), server_default=sa.text("'[]'::json"), nullable=False))
    op.add_column("users", sa.Column("mfa_last_used_step", sa.Integer()))


def downgrade() -> None:
    op.drop_column("users", "mfa_last_used_step")
    op.drop_column("users", "mfa_recovery_code_hashes")
    op.drop_column("users", "mfa_pending_secret_encrypted")
    op.drop_column("users", "mfa_secret_encrypted")
    op.drop_column("users", "mfa_enabled")
