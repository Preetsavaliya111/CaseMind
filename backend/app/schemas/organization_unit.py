from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DepartmentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=255)


class DepartmentResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    is_active: bool


class TeamCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=255)
    department_id: UUID


class TeamUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=255)
    department_id: UUID | None = None
    is_active: bool | None = None


class TeamMemberResponse(BaseModel):
    id: UUID
    name: str
    email: str
    is_lead: bool


class TeamResponse(BaseModel):
    id: UUID
    name: str
    description: str | None
    department_id: UUID | None
    department_name: str | None
    is_active: bool
    members: list[TeamMemberResponse]


class TeamMemberUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    is_lead: bool = False
