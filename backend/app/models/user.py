import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String
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

    role = Column(String(50), default="customer")

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    organization = relationship("Organization")