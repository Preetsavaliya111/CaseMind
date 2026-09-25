import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import ROLE_DEFINITIONS
from app.core.security import hash_password
from app.models.invitation import UserInvitation
from app.models.user import User
from app.schemas.admin import InvitationCreate
from app.services.authorization_service import assign_system_role, ensure_authorization_catalog
from app.services.organization_unit_service import add_user_to_default_support_structure
from app.services.audit_service import record_audit


INVITATION_LIFETIME_DAYS = 7
LEGACY_ROLE_BY_WORKSPACE_ROLE = {
    "customer": "viewer",
    "support_agent": "agent",
    "senior_agent": "engineer",
    "team_lead": "manager",
    "support_manager": "manager",
    "knowledge_manager": "product",
    "ai_manager": "product",
    "org_admin": "admin",
    "super_admin": "admin",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _as_aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def invitation_status(invitation: UserInvitation) -> str:
    if invitation.accepted_at is not None:
        return "accepted"
    if invitation.revoked_at is not None:
        return "revoked"
    if _as_aware(invitation.expires_at) <= _now():
        return "expired"
    return "pending"


def invitation_response(invitation: UserInvitation, token: str | None = None) -> dict:
    return {
        "id": invitation.id,
        "name": invitation.name,
        "email": invitation.email,
        "role": invitation.role.slug,
        "role_name": invitation.role.name,
        "department": invitation.department,
        "status": invitation_status(invitation),
        "expires_at": invitation.expires_at,
        "created_at": invitation.created_at,
        "invited_by_name": invitation.invited_by.name if invitation.invited_by else None,
        "token": token,
    }


def create_invitation(db: Session, current_user: User, data: InvitationCreate) -> dict:
    email = str(data.email).strip().lower()
    if db.query(User.id).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists")

    roles = ensure_authorization_catalog(db)
    role = roles.get(data.role)
    if role is None or data.role == "super_admin":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="This role cannot be invited")

    now = _now()
    db.query(UserInvitation).filter(
        UserInvitation.organization_id == current_user.organization_id,
        UserInvitation.email == email,
        UserInvitation.accepted_at.is_(None),
        UserInvitation.revoked_at.is_(None),
    ).update({"revoked_at": now}, synchronize_session=False)

    token = secrets.token_urlsafe(32)
    invitation = UserInvitation(
        organization_id=current_user.organization_id,
        email=email,
        name=data.name.strip(),
        role_id=role.id,
        department=data.department.strip(),
        token_hash=_hash_token(token),
        invited_by_id=current_user.id,
        expires_at=now + timedelta(days=INVITATION_LIFETIME_DAYS),
    )
    db.add(invitation)
    db.flush()
    record_audit(db, current_user, "user.invited", "invitation", invitation.id, {"email": email, "role": data.role})
    db.commit()
    db.refresh(invitation)
    return invitation_response(invitation, token)


def list_invitations(db: Session, current_user: User) -> list[dict]:
    invitations = db.query(UserInvitation).filter(
        UserInvitation.organization_id == current_user.organization_id,
    ).order_by(UserInvitation.created_at.desc()).all()
    return [invitation_response(invitation) for invitation in invitations]


def revoke_invitation(db: Session, current_user: User, invitation_id) -> None:
    invitation = db.query(UserInvitation).filter(
        UserInvitation.id == invitation_id,
        UserInvitation.organization_id == current_user.organization_id,
    ).first()
    if invitation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    if invitation_status(invitation) != "pending":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only pending invitations can be revoked")
    invitation.revoked_at = _now()
    record_audit(db, current_user, "invitation.revoked", "invitation", invitation.id, {"email": invitation.email, "role": invitation.role.slug})
    db.commit()


def get_valid_invitation(db: Session, token: str) -> UserInvitation:
    invitation = db.query(UserInvitation).filter(UserInvitation.token_hash == _hash_token(token)).first()
    if invitation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invitation not found")
    state = invitation_status(invitation)
    if state != "pending":
        detail = "Invitation has expired" if state == "expired" else f"Invitation is {state}"
        raise HTTPException(status_code=status.HTTP_410_GONE, detail=detail)
    return invitation


def preview_invitation(db: Session, token: str) -> dict:
    invitation = get_valid_invitation(db, token)
    return {
        "email": invitation.email,
        "name": invitation.name,
        "organization_name": invitation.organization.name,
        "role": invitation.role.slug,
        "role_name": invitation.role.name,
        "department": invitation.department,
        "expires_at": invitation.expires_at,
    }


def accept_invitation(db: Session, token: str, password: str) -> User:
    invitation = get_valid_invitation(db, token)
    if db.query(User.id).filter(User.email == invitation.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists")

    role_slug = invitation.role.slug
    if role_slug not in ROLE_DEFINITIONS:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invitation role is no longer available")
    user = User(
        organization_id=invitation.organization_id,
        name=invitation.name,
        email=invitation.email,
        hashed_password=hash_password(password),
        role=LEGACY_ROLE_BY_WORKSPACE_ROLE[role_slug],
        department=invitation.department,
        is_active=True,
    )
    try:
        db.add(user)
        db.flush()
        assign_system_role(db, user, role_slug)
        add_user_to_default_support_structure(db, user, role_slug)
        invitation.accepted_at = _now()
        record_audit(db, user, "invitation.accepted", "user", user.id, {"role": role_slug})
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise
    return user
