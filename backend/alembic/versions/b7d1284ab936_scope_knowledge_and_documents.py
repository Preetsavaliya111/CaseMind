"""Add team and department access scope to knowledge sources.

Revision ID: b7d1284ab936
Revises: a4f53c90e127
Create Date: 2026-09-23
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7d1284ab936"
down_revision: Union[str, Sequence[str], None] = "a4f53c90e127"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_scope(table: str) -> None:
    op.add_column(table, sa.Column("team_id", sa.UUID(), nullable=True))
    op.add_column(table, sa.Column("department_id", sa.UUID(), nullable=True))
    op.add_column(table, sa.Column("visibility", sa.String(length=32), server_default="team", nullable=False))
    op.create_foreign_key(f"fk_{table}_team", table, "teams", ["team_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key(f"fk_{table}_department", table, "departments", ["department_id"], ["id"], ondelete="SET NULL")


def upgrade() -> None:
    for table in ("documents", "knowledge_articles", "memory_items"):
        _add_scope(table)

    op.execute("""
        UPDATE documents AS source SET
          team_id = (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = source.uploaded_by_id ORDER BY tm.created_at LIMIT 1),
          department_id = (SELECT dm.department_id FROM department_members dm WHERE dm.user_id = source.uploaded_by_id ORDER BY dm.created_at LIMIT 1)
    """)
    op.execute("""
        UPDATE knowledge_articles AS source SET
          team_id = (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = source.author_id ORDER BY tm.created_at LIMIT 1),
          department_id = (SELECT dm.department_id FROM department_members dm WHERE dm.user_id = source.author_id ORDER BY dm.created_at LIMIT 1),
          visibility = CASE WHEN source.state = 'published' THEN 'public' ELSE 'team' END
    """)
    op.execute("""
        UPDATE memory_items AS source SET
          team_id = (SELECT tm.team_id FROM team_members tm WHERE tm.user_id = source.created_by_id ORDER BY tm.created_at LIMIT 1),
          department_id = (SELECT dm.department_id FROM department_members dm WHERE dm.user_id = source.created_by_id ORDER BY dm.created_at LIMIT 1)
    """)


def downgrade() -> None:
    for table in ("memory_items", "knowledge_articles", "documents"):
        op.drop_constraint(f"fk_{table}_department", table, type_="foreignkey")
        op.drop_constraint(f"fk_{table}_team", table, type_="foreignkey")
        op.drop_column(table, "visibility")
        op.drop_column(table, "department_id")
        op.drop_column(table, "team_id")
