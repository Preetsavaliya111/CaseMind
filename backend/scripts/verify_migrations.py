"""Destructive migration rehearsal ONLY for a new disposable *_test database."""
import os
from pathlib import Path
import sys
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, select
from sqlalchemy.engine import make_url
from app.core.config import settings
from app.models.authorization import Permission, Role, RolePermission


def main():
    url = make_url(settings.DATABASE_URL)
    if os.environ.get("ENVIRONMENT") != "test" or url.get_backend_name() != "postgresql" or not (url.database or "").endswith("_test"):
        raise SystemExit("Use ENVIRONMENT=test and a disposable PostgreSQL database ending in _test")
    engine = create_engine(url)
    if inspect(engine).get_table_names():
        raise SystemExit("Migration rehearsal requires an empty disposable database; existing tables are never removed")
    config = Config(str(Path(__file__).resolve().parents[1] / "alembic.ini"))
    command.upgrade(config, "6df4cc81bd91")
    # Rehearse grants for a pre-existing system role rather than only a fresh install.
    role_id = uuid4()
    with engine.begin() as connection:
        connection.execute(Role.__table__.insert().values(id=role_id, name="Support Manager", slug="support_manager", description="Existing role", is_system_role=True))
    command.upgrade(config, "head")
    with engine.connect() as connection:
        codes = connection.execute(select(Permission.code).join(RolePermission, RolePermission.permission_id == Permission.id).where(RolePermission.role_id == role_id)).scalars().all()
        assert set(codes) == {"workflow.view", "workflow.manage"}
    command.check(config)
    command.downgrade(config, "-1")
    with engine.connect() as connection:
        assert connection.execute(select(Role.id).where(Role.id == role_id)).scalar() == role_id
    command.upgrade(config, "head")
    command.check(config)
    print("PostgreSQL upgrade, workflow permission backfill, one-revision rollback/re-upgrade and model drift checks passed.")


if __name__ == "__main__":
    main()
