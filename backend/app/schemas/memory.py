from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


MemoryType = Literal["issue_pattern", "root_cause", "resolution", "workaround", "known_limitation", "troubleshooting", "incident_insight"]
VerificationState = Literal["draft", "verified", "deprecated"]
SourceType = Literal["case", "document"]


class MemorySourceCreate(BaseModel):
    source_type: SourceType
    source_id: UUID


class MemoryItemCreate(BaseModel):
    title: str = Field(min_length=5, max_length=220)
    summary: str = Field(min_length=20, max_length=2_000)
    memory_type: MemoryType
    issue_pattern: str = Field(min_length=20, max_length=5_000)
    root_cause: str | None = Field(default=None, max_length=5_000)
    resolution_steps: list[str] = Field(default_factory=list, max_length=30)
    tags: list[str] = Field(default_factory=list, max_length=30)
    product: str | None = Field(default=None, max_length=120)
    category: str | None = Field(default=None, max_length=64)
    sources: list[MemorySourceCreate] = Field(min_length=1, max_length=20)


class MemoryItemUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=220)
    summary: str | None = Field(default=None, min_length=20, max_length=2_000)
    memory_type: MemoryType | None = None
    issue_pattern: str | None = Field(default=None, min_length=20, max_length=5_000)
    root_cause: str | None = Field(default=None, max_length=5_000)
    resolution_steps: list[str] | None = Field(default=None, max_length=30)
    tags: list[str] | None = Field(default=None, max_length=30)
    product: str | None = Field(default=None, max_length=120)
    category: str | None = Field(default=None, max_length=64)


class MemorySourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    source_type: SourceType
    source_id: UUID
    source_title: str
    source_locator: str | None
    created_at: datetime


class MemoryItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    team_id: UUID | None
    department_id: UUID | None
    visibility: str
    title: str
    summary: str
    memory_type: MemoryType
    issue_pattern: str
    root_cause: str | None
    resolution_steps: list[str]
    confidence: float | None
    verification_state: VerificationState
    tags: list[str]
    product: str | None
    category: str | None
    usage_count: int
    created_by_name: str
    verified_by_name: str | None
    sources: list[MemorySourceResponse]
    created_at: datetime
    updated_at: datetime
    last_validated_at: datetime | None


class MemoryItemListResponse(BaseModel):
    items: list[MemoryItemResponse]
    total: int
    page: int
    page_size: int
    pages: int
