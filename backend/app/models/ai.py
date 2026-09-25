import uuid

from sqlalchemy import JSON, Column, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.database import Base


class AIInteraction(Base):
    __tablename__ = "ai_interactions"
    __table_args__ = (Index("ix_ai_interactions_org_created", "organization_id", "created_at"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    model = Column(String(120), nullable=False)
    citations = Column(JSON, nullable=False, default=list)
    feedback = Column(String(16))
    feedback_note = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    feedback_at = Column(DateTime(timezone=True))
