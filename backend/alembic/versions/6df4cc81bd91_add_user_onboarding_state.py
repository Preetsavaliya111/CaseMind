"""add user onboarding state

Revision ID: 6df4cc81bd91
Revises: f4201d8be76a
Create Date: 2026-09-27
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6df4cc81bd91"
down_revision: Union[str, None] = "f4201d8be76a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing users keep their established workflow. Accounts created after this
    # migration receive the guided first-use experience.
    op.add_column("users", sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("users", sa.Column("onboarding_step", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("onboarding_data", sa.JSON(), nullable=False, server_default=sa.text("'{}'::json")))
    op.add_column("users", sa.Column("tours_viewed", sa.JSON(), nullable=False, server_default=sa.text("'[]'::json")))
    op.add_column("users", sa.Column("setup_checklist_dismissed", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.alter_column("users", "onboarding_completed", server_default=sa.false())


def downgrade() -> None:
    op.drop_column("users", "setup_checklist_dismissed")
    op.drop_column("users", "tours_viewed")
    op.drop_column("users", "onboarding_data")
    op.drop_column("users", "onboarding_step")
    op.drop_column("users", "onboarding_completed")
