import uuid

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class MemoryItem(Base):
    __tablename__ = "memory_items"
    __table_args__ = (
        Index("ix_memory_items_org_state_updated", "organization_id", "verification_state", "updated_at"),
        Index("ix_memory_items_org_type", "organization_id", "memory_type"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="SET NULL"))
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"))
    visibility = Column(String(32), nullable=False, default="team")
    title = Column(String(220), nullable=False)
    summary = Column(Text, nullable=False)
    memory_type = Column(String(40), nullable=False)
    issue_pattern = Column(Text, nullable=False)
    root_cause = Column(Text)
    resolution_steps = Column(JSON, nullable=False, default=list)
    confidence = Column(Float)
    verification_state = Column(String(24), nullable=False, default="draft")
    tags = Column(JSON, nullable=False, default=list)
    product = Column(String(120))
    category = Column(String(64))
    usage_count = Column(Integer, nullable=False, default=0)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    verified_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    last_validated_at = Column(DateTime(timezone=True))
    archived_at = Column(DateTime(timezone=True))

    created_by = relationship("User", foreign_keys=[created_by_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    sources = relationship("MemorySource", back_populates="memory_item", cascade="all, delete-orphan", order_by="MemorySource.created_at")

    @property
    def created_by_name(self) -> str:
        return self.created_by.name

    @property
    def verified_by_name(self) -> str | None:
        return self.verified_by.name if self.verified_by else None


class MemorySource(Base):
    __tablename__ = "memory_sources"
    __table_args__ = (
        UniqueConstraint("memory_item_id", "source_type", "source_id", name="uq_memory_sources_item_source"),
        Index("ix_memory_sources_org_item", "organization_id", "memory_item_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    memory_item_id = Column(UUID(as_uuid=True), ForeignKey("memory_items.id", ondelete="CASCADE"), nullable=False)
    source_type = Column(String(24), nullable=False)
    source_id = Column(UUID(as_uuid=True), nullable=False)
    source_title = Column(String(255), nullable=False)
    source_locator = Column(String(500))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    memory_item = relationship("MemoryItem", back_populates="sources")
