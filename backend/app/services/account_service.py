from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.services.audit_service import record_audit


def update_profile(db: Session, user: User, name: str) -> User:
    normalized = " ".join(name.split())
    if len(normalized) < 2:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Name must contain at least two characters")
    user.name = normalized
    record_audit(db, user, "account.profile_updated", "user", user.id, {"fields": ["name"]})
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, current_password: str, new_password: str) -> User:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    if verify_password(new_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="New password must be different from the current password")
    user.hashed_password = hash_password(new_password)
    user.token_version += 1
    record_audit(db, user, "security.password_changed", "user", user.id)
    db.commit()
    db.refresh(user)
    return user
