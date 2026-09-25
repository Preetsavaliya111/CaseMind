import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, JSON, Column, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class SupportCase(Base):
    __tablename__ = "cases"
    __table_args__ = (
        UniqueConstraint("organization_id", "case_number", name="uq_cases_org_number"),
        Index("ix_cases_org_status_updated", "organization_id", "status", "updated_at"),
        Index("ix_cases_org_priority", "organization_id", "priority"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    case_number = Column(String(32), nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(32), nullable=False, default="new")
    priority = Column(String(16), nullable=False, default="medium")
    category = Column(String(64), nullable=False, default="other")
    product = Column(String(120))
    customer_name = Column(String(255))
    tags = Column(JSON, nullable=False, default=list)
    reporter_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assignee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="SET NULL"))
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id", ondelete="SET NULL"))
    visibility = Column(String(32), nullable=False, default="organization")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True))
    closed_at = Column(DateTime(timezone=True))
    archived_at = Column(DateTime(timezone=True))
    first_response_due_at = Column(DateTime(timezone=True))
    resolution_due_at = Column(DateTime(timezone=True))
    first_responded_at = Column(DateTime(timezone=True))
    sla_breached_at = Column(DateTime(timezone=True))
    sla_warning_percent = Column(Integer, nullable=False, default=75)
    escalation_level = Column(Integer, nullable=False, default=0)

    reporter = relationship("User", foreign_keys=[reporter_id])
    assignee = relationship("User", foreign_keys=[assignee_id])
    team = relationship("Team")
    department = relationship("Department")
    comments = relationship(
        "CaseComment",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="CaseComment.created_at",
    )
    escalations = relationship("CaseEscalation", cascade="all, delete-orphan", order_by="CaseEscalation.created_at")
    attachments = relationship("CaseAttachment", back_populates="case", cascade="all, delete-orphan", order_by="CaseAttachment.created_at")

    @property
    def reporter_name(self) -> str:
        return self.reporter.name

    @property
    def assignee_name(self) -> str | None:
        return self.assignee.name if self.assignee else None

    @property
    def sla_deadline(self):
        if self.first_responded_at is None and self.first_response_due_at is not None and self.status not in {"resolved", "closed"}:
            return self.first_response_due_at
        return self.resolution_due_at

    @property
    def sla_breached(self) -> bool:
        if self.sla_breached_at is not None:
            return True
        deadline = self.sla_deadline
        if deadline is None or self.status in {"resolved", "closed"}:
            return False
        now = datetime.now(timezone.utc)
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        return now > deadline

    @property
    def sla_state(self) -> str:
        if self.sla_breached:
            return "breached"
        deadline = self.sla_deadline
        if deadline is None or self.status in {"resolved", "closed"}:
            return "healthy"
        created = self.created_at
        if deadline.tzinfo is None: deadline = deadline.replace(tzinfo=timezone.utc)
        if created.tzinfo is None: created = created.replace(tzinfo=timezone.utc)
        elapsed = (datetime.now(timezone.utc) - created).total_seconds()
        total = max(1, (deadline - created).total_seconds())
        return "at_risk" if elapsed / total * 100 >= self.sla_warning_percent else "healthy"


class CaseComment(Base):
    __tablename__ = "case_comments"
    __table_args__ = (Index("ix_case_comments_org_case", "organization_id", "case_id"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    case = relationship("SupportCase", back_populates="comments")
    author = relationship("User")

    @property
    def author_name(self) -> str:
        return self.author.name


class CaseAttachment(Base):
    __tablename__ = "case_attachments"
    __table_args__ = (Index("ix_case_attachments_org_case", "organization_id", "case_id"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    case_id = Column(UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    media_type = Column(String(120), nullable=False)
    size_bytes = Column(Integer, nullable=False)
    sha256 = Column(String(64), nullable=False)
    storage_key = Column(String(500), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    case = relationship("SupportCase", back_populates="attachments")
    uploaded_by = relationship("User")

    @property
    def uploaded_by_name(self) -> str:
        return self.uploaded_by.name
