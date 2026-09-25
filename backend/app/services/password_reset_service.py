import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.password_reset import PasswordResetToken
from app.models.user import User
from app.services.audit_service import record_audit
from app.services.email_service import send_email


RESET_LIFETIME_MINUTES = 30


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


def create_reset(db: Session, user: User, actor: User | None = None) -> dict:
    now = _now()
    db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)).update({"used_at": now}, synchronize_session=False)
    raw = secrets.token_urlsafe(32)
    item = PasswordResetToken(user_id=user.id, organization_id=user.organization_id, token_hash=_hash(raw), expires_at=now + timedelta(minutes=RESET_LIFETIME_MINUTES))
    db.add(item); db.flush()
    if actor:
        record_audit(db, actor, "security.password_reset_issued", "user", user.id)
    db.commit()
    return {"reset_link": f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={raw}", "expires_at": item.expires_at}


def request_reset(db: Session, email: str) -> None:
    user = db.query(User).filter(User.email == email.strip().lower(), User.is_active.is_(True)).first()
    if user is None:
        return
    result = create_reset(db, user)
    send_email(user.email, "Reset your CaseMind password", f"Use this one-time link within {RESET_LIFETIME_MINUTES} minutes:\n\n{result['reset_link']}\n\nIf you did not request this, ignore this email.")


def confirm_reset(db: Session, token: str, new_password: str) -> None:
    item = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == _hash(token)).first()
    if item is None or item.used_at is not None or _aware(item.expires_at) <= _now():
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Password reset link is invalid or expired")
    user = db.query(User).filter(User.id == item.user_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_410_GONE, detail="Password reset link is invalid or expired")
    user.hashed_password = hash_password(new_password)
    user.token_version += 1
    item.used_at = _now()
    record_audit(db, user, "security.password_reset_completed", "user", user.id)
    db.commit()
