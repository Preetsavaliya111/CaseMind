import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_recipient_created", "recipient_id", "created_at"),
        UniqueConstraint("recipient_id", "dedup_key", name="uq_notifications_recipient_dedup"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    actor_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    notification_type = Column(String(64), nullable=False)
    severity = Column(String(16), nullable=False, default="info")
    title = Column(String(180), nullable=False)
    message = Column(String(500), nullable=False)
    locator = Column(String(500))
    entity_type = Column(String(64))
    entity_id = Column(String(100))
    dedup_key = Column(String(255))
    read_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    actor = relationship("User", foreign_keys=[actor_id])

    @property
    def actor_name(self) -> str | None:
        return self.actor.name if self.actor else None
