import uuid

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    organization_id = Column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id"),
        nullable=False
    )

    name = Column(String(255), nullable=False)

    email = Column(
        String(255),
        unique=True,
        nullable=False
    )

    hashed_password = Column(String(255), nullable=False)

    role = Column(String(50), nullable=False, default="agent")

    department = Column(String(100), nullable=False, default="Support")

    is_active = Column(Boolean, nullable=False, default=True)
    mfa_enabled = Column(Boolean, nullable=False, default=False)
    mfa_secret_encrypted = Column(String(500))
    mfa_pending_secret_encrypted = Column(String(500))
    mfa_recovery_code_hashes = Column(JSON, nullable=False, default=list)
    mfa_last_used_step = Column(Integer)
    token_version = Column(Integer, nullable=False, default=0)
    notification_preferences = Column(JSON, nullable=False, default=dict)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    last_login_at = Column(DateTime(timezone=True))

    organization = relationship("Organization")
    role_assignments = relationship("UserRole", cascade="all, delete-orphan", lazy="selectin")
