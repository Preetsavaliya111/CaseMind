from collections.abc import Iterable

from sqlalchemy.orm import Session

from app.core.permissions import DEFAULT_WORKSPACES, LEGACY_ROLE_MAP, PERMISSION_DEFINITIONS, ROLE_DEFINITIONS
from app.models.authorization import Permission, Role, RolePermission, UserRole
from app.models.user import User


def ensure_authorization_catalog(db: Session) -> dict[str, Role]:
    permissions = {item.code: item for item in db.query(Permission).all()}
    for code, (description, category) in PERMISSION_DEFINITIONS.items():
        if code not in permissions:
            permissions[code] = Permission(code=code, description=description, category=category)
            db.add(permissions[code])
    db.flush()

    roles = {item.slug: item for item in db.query(Role).all()}
    for slug, (name, description, permission_codes) in ROLE_DEFINITIONS.items():
        role = roles.get(slug)
        if role is None:
            role = Role(name=name, slug=slug, description=description, is_system_role=True)
            db.add(role)
            db.flush()
            roles[slug] = role
        existing = {item.permission_id for item in db.query(RolePermission).filter(RolePermission.role_id == role.id)}
        for code in permission_codes:
            permission = permissions[code]
            if permission.id not in existing:
                db.add(RolePermission(role_id=role.id, permission_id=permission.id))
    db.flush()
    return roles


def assign_system_role(db: Session, user: User, role_slug: str) -> UserRole:
    roles = ensure_authorization_catalog(db)
    role = roles[role_slug]
    assignment = db.query(UserRole).filter(
        UserRole.user_id == user.id,
        UserRole.role_id == role.id,
        UserRole.organization_id == user.organization_id,
    ).first()
    if assignment is None:
        assignment = UserRole(user_id=user.id, role_id=role.id, organization_id=user.organization_id)
        db.add(assignment)
        db.flush()
    return assignment


def ensure_user_role_assignment(db: Session, user: User) -> None:
    if db.query(UserRole.id).filter(UserRole.user_id == user.id, UserRole.organization_id == user.organization_id).first():
        return
    assign_system_role(db, user, LEGACY_ROLE_MAP.get(user.role, user.role if user.role in ROLE_DEFINITIONS else "customer"))
    db.commit()


def get_role_slugs(db: Session, user: User) -> list[str]:
    ensure_user_role_assignment(db, user)
    return sorted({assignment.role.slug for assignment in db.query(UserRole).filter(
        UserRole.user_id == user.id,
        UserRole.organization_id == user.organization_id,
    ).all()})


def get_permission_codes(db: Session, user: User) -> list[str]:
    ensure_user_role_assignment(db, user)
    rows: Iterable[tuple[str]] = (
        db.query(Permission.code)
        .join(RolePermission, RolePermission.permission_id == Permission.id)
        .join(UserRole, UserRole.role_id == RolePermission.role_id)
        .filter(UserRole.user_id == user.id, UserRole.organization_id == user.organization_id)
        .distinct()
        .all()
    )
    return sorted(row[0] for row in rows)


def has_permission(db: Session, user: User, permission_code: str) -> bool:
    ensure_user_role_assignment(db, user)
    return db.query(Permission.id).join(
        RolePermission, RolePermission.permission_id == Permission.id
    ).join(
        UserRole, UserRole.role_id == RolePermission.role_id
    ).filter(
        UserRole.user_id == user.id,
        UserRole.organization_id == user.organization_id,
        Permission.code == permission_code,
    ).first() is not None


def default_workspace(role_slugs: list[str]) -> str:
    priority = ["super_admin", "org_admin", "support_manager", "team_lead", "senior_agent", "support_agent", "knowledge_manager", "ai_manager", "customer"]
    selected = next((role for role in priority if role in role_slugs), "customer")
    return DEFAULT_WORKSPACES[selected]
