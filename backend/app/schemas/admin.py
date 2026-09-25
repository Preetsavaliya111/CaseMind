from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


Role = Literal["admin", "manager", "agent", "engineer", "product", "cs", "viewer"]
WorkspaceRole = Literal["customer", "support_agent", "senior_agent", "team_lead", "support_manager", "knowledge_manager", "ai_manager", "org_admin", "super_admin"]
AssignableWorkspaceRole = Literal["customer", "support_agent", "senior_agent", "team_lead", "support_manager", "knowledge_manager", "ai_manager", "org_admin"]


class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    email: str
    role: Role
    workspace_role: WorkspaceRole
    department: str
    is_active: bool
    created_at: datetime


class AdminUserUpdate(BaseModel):
    workspace_role: AssignableWorkspaceRole | None = None
    department: str | None = None
    is_active: bool | None = None


class InvitationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    role: AssignableWorkspaceRole
    department: str = Field(default="Support", min_length=2, max_length=100)


class InvitationResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    role: WorkspaceRole
    role_name: str
    department: str
    status: Literal["pending", "accepted", "expired", "revoked"]
    expires_at: datetime
    created_at: datetime
    invited_by_name: str | None = None
    token: str | None = None


class AIConfigurationResponse(BaseModel):
    chat_provider: str
    chat_model: str
    chat_configured: bool
    embedding_provider: str
    embedding_model: str
    embedding_configured: bool
    vector_store: str
    vector_collection: str
    secrets_location: str


class PasswordResetLinkResponse(BaseModel):
    reset_link: str
    expires_at: datetime
