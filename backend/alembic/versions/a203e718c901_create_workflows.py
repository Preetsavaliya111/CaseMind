"""Persist bounded workflows, case events, runs and management permissions.

Revision ID: a203e718c901
Revises: 6df4cc81bd91
"""
import uuid

from alembic import op
import sqlalchemy as sa

revision = "a203e718c901"
down_revision = "6df4cc81bd91"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "workflows",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("organization_id", sa.UUID(), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("created_by_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.String(500), nullable=False),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("conditions", sa.JSON(), nullable=False),
        sa.Column("actions", sa.JSON(), nullable=False),
        sa.Column("enabled", sa.Boolean(), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_workflows_org_event", "workflows", ["organization_id", "event_type", "enabled"])
    op.create_table(
        "case_events",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("organization_id", sa.UUID(), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("case_id", sa.UUID(), sa.ForeignKey("cases.id"), nullable=False),
        sa.Column("actor_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("snapshot", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_case_events_org_case", "case_events", ["organization_id", "case_id"])
    op.create_table(
        "workflow_runs",
        sa.Column("id", sa.UUID(), primary_key=True),
        sa.Column("organization_id", sa.UUID(), sa.ForeignKey("organizations.id"), nullable=False),
        sa.Column("workflow_id", sa.UUID(), sa.ForeignKey("workflows.id"), nullable=False),
        sa.Column("event_id", sa.UUID(), sa.ForeignKey("case_events.id"), nullable=False),
        sa.Column("case_id", sa.UUID(), sa.ForeignKey("cases.id"), nullable=False),
        sa.Column("actor_id", sa.UUID(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("event_type", sa.String(40), nullable=False),
        sa.Column("workflow_revision", sa.Integer(), nullable=False),
        sa.Column("definition", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("executed_actions", sa.JSON(), nullable=False),
        sa.Column("failure_code", sa.String(50)),
        sa.Column("failure_detail", sa.String(250)),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        sa.UniqueConstraint("workflow_id", "event_id", name="uq_workflow_run_event"),
    )
    op.create_index("ix_workflow_runs_org_workflow_started", "workflow_runs", ["organization_id", "workflow_id", "started_at"])
    connection = op.get_bind()
    permissions = sa.table("permissions", sa.column("id", sa.UUID()), sa.column("code", sa.String()), sa.column("description", sa.String()), sa.column("category", sa.String()))
    roles = sa.table("roles", sa.column("id", sa.UUID()), sa.column("slug", sa.String()), sa.column("is_system_role", sa.Boolean()))
    grants = sa.table("role_permissions", sa.column("id", sa.UUID()), sa.column("role_id", sa.UUID()), sa.column("permission_id", sa.UUID()))
    for code, description in [("workflow.view", "View organization workflows and runs"), ("workflow.manage", "Manage organization workflows")]:
        permission_id = connection.execute(sa.select(permissions.c.id).where(permissions.c.code == code)).scalar()
        if permission_id is None:
            permission_id = uuid.uuid4()
            connection.execute(permissions.insert().values(id=permission_id, code=code, description=description, category="workflows"))
        for role_id in connection.execute(sa.select(roles.c.id).where(roles.c.slug.in_(["org_admin", "super_admin", "support_manager"]), roles.c.is_system_role.is_(True))).scalars():
            if connection.execute(sa.select(grants.c.id).where(grants.c.role_id == role_id, grants.c.permission_id == permission_id)).first() is None:
                connection.execute(grants.insert().values(id=uuid.uuid4(), role_id=role_id, permission_id=permission_id))


def downgrade():
    connection = op.get_bind()
    permissions = sa.table("permissions", sa.column("id", sa.UUID()), sa.column("code", sa.String()))
    grants = sa.table("role_permissions", sa.column("permission_id", sa.UUID()))
    ids = sa.select(permissions.c.id).where(permissions.c.code.in_(["workflow.view", "workflow.manage"]))
    connection.execute(grants.delete().where(grants.c.permission_id.in_(ids)))
    connection.execute(permissions.delete().where(permissions.c.code.in_(["workflow.view", "workflow.manage"])))
    op.drop_table("workflow_runs")
    op.drop_table("case_events")
    op.drop_table("workflows")
