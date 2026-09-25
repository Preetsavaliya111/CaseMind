from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


Priority = Literal["critical", "high", "medium", "low"]


class SLAPolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    priority: Priority
    first_response_minutes: int
    resolution_minutes: int
    warning_percent: int
    is_active: bool


class SLAPolicyUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    first_response_minutes: int | None = Field(default=None, ge=5, le=43_200)
    resolution_minutes: int | None = Field(default=None, ge=15, le=129_600)
    warning_percent: int | None = Field(default=None, ge=25, le=95)
    is_active: bool | None = None


class EscalationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reason: str = Field(min_length=10, max_length=2_000)


class EscalationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    actor_name: str
    from_level: int
    to_level: int
    reason: str
    created_at: datetime


class SLASummary(BaseModel):
    healthy: int
    at_risk: int
    breached: int
    escalated: int
