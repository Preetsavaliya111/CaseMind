from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


# Password hashing configuration
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Hash a user's password using bcrypt.

    Bcrypt only accepts passwords up to 72 bytes.
    We explicitly validate this before hashing.
    """
    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        raise ValueError("Password cannot be longer than 72 bytes.")

    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain-text password against its bcrypt hash.
    """
    password_bytes = plain_password.encode("utf-8")

    if len(password_bytes) > 72:
        return False

    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    token_version: int = 0,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT access token.

    The subject normally contains the user's UUID.
    """
    if expires_delta is None:
        expires_delta = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    expire = datetime.now(timezone.utc) + expires_delta

    payload = {
        "sub": subject,
        "exp": expire,
        "typ": "access",
        "ver": token_version,
    }

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )


def decode_access_token(token: str) -> Optional[tuple[str, int]]:
    """
    Decode and validate a JWT access token.

    Returns:
        User ID stored in the token's 'sub' claim.

    Returns None when the token is invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        subject = payload.get("sub")

        if not subject or payload.get("typ") != "access":
            return None

        return str(subject), int(payload.get("ver", -1))

    except JWTError:
        return None


def create_mfa_challenge_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=5)
    return jwt.encode({"sub": subject, "exp": expire, "typ": "mfa"}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_mfa_challenge_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("typ") != "mfa" or not payload.get("sub"):
            return None
        return str(payload["sub"])
    except JWTError:
        return None
