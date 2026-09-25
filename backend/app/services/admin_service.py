from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.authorization import Role, UserRole
from app.models.user import User
from app.schemas.admin import AdminUserUpdate
from app.services.authorization_service import assign_system_role, get_role_slugs
from app.services.invitation_service import LEGACY_ROLE_BY_WORKSPACE_ROLE
from app.services.audit_service import record_audit


def _primary_role(db: Session, user: User) -> str:
    roles = get_role_slugs(db, user)
    priority = ["super_admin", "org_admin", "support_manager", "team_lead", "senior_agent", "support_agent", "knowledge_manager", "ai_manager", "customer"]
    return next((role for role in priority if role in roles), "customer")


def _response(db: Session, user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "workspace_role": _primary_role(db, user),
        "department": user.department,
        "is_active": user.is_active,
        "created_at": user.created_at,
    }


def list_users(db: Session, organization_id: UUID) -> list[dict]:
    users = db.query(User).filter(User.organization_id == organization_id).order_by(User.created_at.asc()).all()
    return [_response(db, user) for user in users]


def update_user(db: Session, current_user: User, user_id: UUID, data: AdminUserUpdate) -> dict:
    target = db.query(User).filter(User.id == user_id, User.organization_id == current_user.organization_id).first()
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    changes = data.model_dump(exclude_unset=True)
    if target.id == current_user.id and (changes.get("is_active") is False or ("workspace_role" in changes and changes["workspace_role"] != "org_admin")):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You cannot deactivate or remove your own administrator access")
    current_target_role = _primary_role(db, target)
    if current_target_role == "org_admin" and (changes.get("is_active") is False or ("workspace_role" in changes and changes["workspace_role"] != "org_admin")):
        active_admins = db.query(User.id).join(UserRole, UserRole.user_id == User.id).join(Role, Role.id == UserRole.role_id).filter(
            User.organization_id == current_user.organization_id,
            User.is_active.is_(True),
            Role.slug == "org_admin",
        ).distinct().count()
        if active_admins <= 1:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The organization must retain at least one active administrator")

    workspace_role = changes.pop("workspace_role", None)
    previous_active = target.is_active
    for field, value in changes.items():
        setattr(target, field, value)
    if workspace_role is not None and workspace_role != current_target_role:
        db.query(UserRole).filter(
            UserRole.user_id == target.id,
            UserRole.organization_id == target.organization_id,
        ).delete(synchronize_session=False)
        target.role = LEGACY_ROLE_BY_WORKSPACE_ROLE[workspace_role]
        assign_system_role(db, target, workspace_role)
        record_audit(db, current_user, "user.role_changed", "user", target.id, {"from": current_target_role, "to": workspace_role, "email": target.email})
    if "is_active" in changes and target.is_active != previous_active:
        record_audit(db, current_user, "user.status_changed", "user", target.id, {"active": target.is_active, "email": target.email})
    db.commit()
    db.refresh(target)
    return _response(db, target)
