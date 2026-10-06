from datetime import datetime
from typing import Annotated, Literal, Union, get_args
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.ticket import CasePriority, CaseStatus

EventType = Literal["case.created", "case.assigned", "case.priority_changed", "case.status_changed", "case.resolved"]


class BoundedModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Condition(BoundedModel):
    field: Literal["priority", "status", "category", "team_id", "assignee_id", "tags"]
    operator: Literal["equals", "contains"] = "equals"
    value: str = Field(min_length=1, max_length=64)

    @model_validator(mode="after")
    def supported_value(self):
        if self.field == "tags":
            if self.operator != "contains":
                raise ValueError("Tags support contains only")
            self.value = self.value.lower()
        elif self.operator != "equals":
            raise ValueError("This field supports equals only")
        if self.field == "priority" and self.value not in get_args(CasePriority):
            raise ValueError("Unsupported priority")
        if self.field == "status" and self.value not in get_args(CaseStatus):
            raise ValueError("Unsupported status")
        if self.field in {"team_id", "assignee_id"}:
            self.value = str(UUID(self.value))
        return self


class AssignUser(BoundedModel):
    type: Literal["assign_user"]
    user_id: UUID


class AssignTeam(BoundedModel):
    type: Literal["assign_team"]
    team_id: UUID


class SetStatus(BoundedModel):
    type: Literal["set_status"]
    status: CaseStatus


class SetPriority(BoundedModel):
    type: Literal["set_priority"]
    priority: CasePriority


class InternalNote(BoundedModel):
    type: Literal["internal_note"]
    content: str = Field(min_length=1, max_length=1000)


class NotifyUser(BoundedModel):
    type: Literal["notify_user"]
    user_id: UUID
    message: str = Field(min_length=1, max_length=300)


Action = Annotated[Union[AssignUser, AssignTeam, SetStatus, SetPriority, InternalNote, NotifyUser], Field(discriminator="type")]


class WorkflowWrite(BoundedModel):
    name: str = Field(min_length=3, max_length=100)
    description: str = Field(default="", max_length=500)
    event_type: EventType
    conditions: list[Condition] = Field(default_factory=list, max_length=6)
    actions: list[Action] = Field(min_length=1, max_length=5)
    enabled: bool = False


class WorkflowUpdate(WorkflowWrite):
    revision: int = Field(ge=1)


class WorkflowToggle(BoundedModel):
    enabled: bool
    revision: int = Field(ge=1)


class WorkflowResponse(WorkflowWrite):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    organization_id: UUID
    created_by_id: UUID
    revision: int
    created_at: datetime
    updated_at: datetime


class RunResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    workflow_id: UUID
    event_id: UUID
    case_id: UUID
    actor_id: UUID
    event_type: EventType
    workflow_revision: int
    definition: dict
    status: Literal["running", "succeeded", "skipped", "failed"]
    executed_actions: list[dict]
    failure_code: str | None
    failure_detail: str | None
    started_at: datetime
    finished_at: datetime | None


class WorkflowList(BaseModel):
    items: list[WorkflowResponse]
    total: int


class RunList(BaseModel):
    items: list[RunResponse]
    total: int
