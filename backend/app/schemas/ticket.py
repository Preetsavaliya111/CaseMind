from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from app.schemas.sla import EscalationResponse


CaseStatus = Literal["new", "assigned", "in_progress", "waiting_customer", "waiting_engineering", "resolved", "closed", "reopened"]
CasePriority = Literal["critical", "high", "medium", "low"]


class CaseCreate(BaseModel):
    subject: str = Field(min_length=5, max_length=200)
    description: str = Field(min_length=20, max_length=20_000)
    priority: CasePriority = "medium"
    category: str = Field(default="other", min_length=2, max_length=64)
    product: str | None = Field(default=None, max_length=120)
    customer_name: str | None = Field(default=None, max_length=255)
    assignee_id: UUID | None = None
    tags: list[str] = Field(default_factory=list, max_length=20)


class CaseUpdate(BaseModel):
    subject: str | None = Field(default=None, min_length=5, max_length=200)
    description: str | None = Field(default=None, min_length=20, max_length=20_000)
    priority: CasePriority | None = None
    category: str | None = Field(default=None, min_length=2, max_length=64)
    product: str | None = Field(default=None, max_length=120)
    customer_name: str | None = Field(default=None, max_length=255)
    assignee_id: UUID | None = None
    tags: list[str] | None = Field(default=None, max_length=20)


class CaseStatusUpdate(BaseModel):
    status: CaseStatus


class CaseCommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5_000)
    is_internal: bool = False


class CaseCommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    case_id: UUID
    author_id: UUID
    author_name: str
    content: str
    is_internal: bool
    created_at: datetime
    updated_at: datetime


class CaseAttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    case_id: UUID
    uploaded_by_id: UUID
    uploaded_by_name: str
    original_filename: str
    media_type: str
    size_bytes: int
    sha256: str
    created_at: datetime


class CaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    organization_id: UUID
    case_number: str
    subject: str
    description: str
    status: CaseStatus
    priority: CasePriority
    category: str
    product: str | None
    customer_name: str | None
    reporter_id: UUID
    reporter_name: str
    assignee_id: UUID | None
    assignee_name: str | None
    team_id: UUID | None
    department_id: UUID | None
    visibility: Literal["private_customer", "assigned_only", "team", "department", "organization", "restricted"]
    tags: list[str]
    comments: list[CaseCommentResponse] = Field(default_factory=list)
    attachments: list[CaseAttachmentResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    closed_at: datetime | None
    first_response_due_at: datetime | None
    resolution_due_at: datetime | None
    first_responded_at: datetime | None
    sla_deadline: datetime | None
    sla_breached: bool
    sla_state: Literal["healthy", "at_risk", "breached"]
    escalation_level: int
    escalations: list[EscalationResponse] = Field(default_factory=list)


class CaseListResponse(BaseModel):
    items: list[CaseResponse]
    total: int
    page: int
    page_size: int
    pages: int


class CaseAssigneeResponse(BaseModel):
    id: UUID
    name: str
    role: str
    role_slug: str
    department: str
