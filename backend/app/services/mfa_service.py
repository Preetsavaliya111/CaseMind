import base64
import hashlib
import hmac
import secrets
import struct
import time
from urllib.parse import quote
from uuid import UUID

from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_mfa_challenge_token, verify_password
from app.models.user import User
from app.services.audit_service import record_audit


def _fernet() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.SECRET_KEY.encode()).digest())
    return Fernet(key)


def _encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def _decrypt(value: str | None) -> str:
    if not value:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="MFA setup is not available")
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="MFA configuration cannot be decrypted") from exc


def _code(secret: str, step: int) -> str:
    key = base64.b32decode(secret + "=" * ((8 - len(secret) % 8) % 8), casefold=True)
    digest = hmac.new(key, struct.pack(">Q", step), hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    value = (struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF) % 1_000_000
    return f"{value:06d}"


def verify_totp(secret: str, value: str, last_used_step: int | None = None) -> int | None:
    normalized = value.replace(" ", "").replace("-", "")
    if len(normalized) != 6 or not normalized.isdigit():
        return None
    current = int(time.time()) // 30
    for step in (current - 1, current, current + 1):
        if step != last_used_step and hmac.compare_digest(_code(secret, step), normalized):
            return step
    return None


def _recovery_hash(code: str) -> str:
    normalized = code.upper().replace("-", "").replace(" ", "")
    return hmac.new(settings.SECRET_KEY.encode(), normalized.encode(), hashlib.sha256).hexdigest()


def begin_setup(db: Session, user: User, current_password: str) -> dict:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    if user.mfa_enabled:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="MFA is already enabled")
    secret = base64.b32encode(secrets.token_bytes(20)).decode().rstrip("=")
    user.mfa_pending_secret_encrypted = _encrypt(secret)
    db.commit()
    label = quote(f"CaseMind:{user.email}")
    issuer = quote("CaseMind")
    return {"secret": secret, "otpauth_uri": f"otpauth://totp/{label}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30"}


def enable_mfa(db: Session, user: User, code: str) -> list[str]:
    secret = _decrypt(user.mfa_pending_secret_encrypted)
    step = verify_totp(secret, code)
    if step is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The authenticator code is invalid or expired")
    recovery_codes = [f"{secrets.token_hex(2).upper()}-{secrets.token_hex(2).upper()}" for _ in range(10)]
    user.mfa_secret_encrypted = _encrypt(secret)
    user.mfa_pending_secret_encrypted = None
    user.mfa_recovery_code_hashes = [_recovery_hash(item) for item in recovery_codes]
    user.mfa_last_used_step = None
    user.mfa_enabled = True
    record_audit(db, user, "security.mfa_enabled", "user", user.id)
    db.commit()
    return recovery_codes


def verify_user_code(db: Session, user: User, code: str, *, consume_recovery: bool = True) -> bool:
    secret = _decrypt(user.mfa_secret_encrypted)
    step = verify_totp(secret, code, user.mfa_last_used_step)
    if step is not None:
        user.mfa_last_used_step = step
        db.commit()
        return True
    candidate = _recovery_hash(code)
    hashes = list(user.mfa_recovery_code_hashes or [])
    if consume_recovery and candidate in hashes:
        hashes.remove(candidate)
        user.mfa_recovery_code_hashes = hashes
        db.commit()
        return True
    return False


def disable_mfa(db: Session, user: User, current_password: str, code: str) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    if not user.mfa_enabled or not verify_user_code(db, user, code):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="The authenticator or recovery code is invalid")
    user.mfa_enabled = False
    user.mfa_secret_encrypted = None
    user.mfa_pending_secret_encrypted = None
    user.mfa_recovery_code_hashes = []
    user.mfa_last_used_step = None
    record_audit(db, user, "security.mfa_disabled", "user", user.id)
    db.commit()


def user_from_challenge(db: Session, challenge_token: str) -> User:
    subject = decode_mfa_challenge_token(challenge_token)
    try:
        user_id = UUID(subject or "")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="MFA challenge is invalid or expired") from exc
    user = db.query(User).filter(User.id == user_id, User.is_active.is_(True), User.mfa_enabled.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="MFA challenge is invalid or expired")
    return user
