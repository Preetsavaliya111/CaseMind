from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.models.organization import Organization
from app.schemas.auth import RegisterRequest
from app.core.config import settings
from app.services.authorization_service import assign_system_role, default_workspace, get_permission_codes, get_role_slugs
from app.services.organization_unit_service import ensure_default_support_structure, user_department_summaries, user_team_summaries


def register_user(
    db: Session,
    data: RegisterRequest,
) -> User:

    existing_user = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    if data.organization_domain:
        existing_organization = (
            db.query(Organization)
            .filter(Organization.domain == data.organization_domain)
            .first()
        )
        if existing_organization:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Organization domain is already registered",
            )

    organization = Organization(
        name=data.organization_name,
        domain=data.organization_domain,
    )
    user = User(
        name=data.name,
        email=str(data.email).lower(),
        hashed_password=hash_password(data.password),
        organization=organization,
        role="admin",
        department=data.department,
        is_active=True,
    )

    try:
        db.add(user)
        db.flush()
        assign_system_role(db, user, "org_admin")
        ensure_default_support_structure(db, user)
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User:

    user = (
        db.query(User)
        .filter(User.email == email.lower())
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    if not verify_password(
        password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return user


def create_user_token(user: User) -> str:
    return create_access_token(
        subject=str(user.id),
        token_version=user.token_version,
    )


def token_expiry_seconds() -> int:
    return settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


def record_successful_login(db: Session, user: User) -> None:
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()


def build_user_response(db: Session, user: User) -> dict:
    roles = get_role_slugs(db, user)
    if "org_admin" in roles and not user_team_summaries(db, user):
        ensure_default_support_structure(db, user)
        db.commit()
    return {
        "id": user.id,
        "organization_id": user.organization_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "department": user.department,
        "is_active": user.is_active,
        "mfa_enabled": user.mfa_enabled,
        "created_at": user.created_at,
        "last_login_at": user.last_login_at,
        "organization": {"id": user.organization.id, "name": user.organization.name},
        "roles": roles,
        "permissions": get_permission_codes(db, user),
        "teams": user_team_summaries(db, user),
        "departments": user_department_summaries(db, user),
        "default_workspace": default_workspace(roles),
        "onboarding_completed": user.onboarding_completed,
        "onboarding_step": user.onboarding_step,
        "onboarding_data": user.onboarding_data or {},
        "tours_viewed": user.tours_viewed or [],
        "setup_checklist_dismissed": user.setup_checklist_dismissed,
    }
