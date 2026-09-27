from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=10, max_length=72)
    organization_name: str = Field(min_length=2, max_length=255)
    organization_domain: str | None = Field(default=None, max_length=255)
    department: str = Field(default="Support", min_length=2, max_length=100)

    @field_validator("organization_domain")
    @classmethod
    def normalize_domain(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lower()
        return normalized or None

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password cannot be longer than 72 bytes")
        return value


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1, max_length=72)


class OrganizationSummary(BaseModel):
    id: UUID
    name: str


class TeamSummary(BaseModel):
    id: UUID
    name: str
    department_id: UUID | None = None


class DepartmentSummary(BaseModel):
    id: UUID
    name: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    email: EmailStr
    role: str
    department: str
    is_active: bool
    mfa_enabled: bool
    created_at: datetime
    last_login_at: datetime | None
    organization: OrganizationSummary
    roles: list[str]
    permissions: list[str]
    teams: list[TeamSummary] = Field(default_factory=list)
    departments: list[DepartmentSummary] = Field(default_factory=list)
    default_workspace: str
    onboarding_completed: bool
    onboarding_step: int
    onboarding_data: dict = Field(default_factory=dict)
    tours_viewed: list[str] = Field(default_factory=list)
    setup_checklist_dismissed: bool


class OnboardingUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    step: int | None = Field(default=None, ge=0, le=7)
    completed: bool | None = None
    data: dict | None = None
    tour_viewed: str | None = Field(default=None, min_length=1, max_length=50)
    checklist_dismissed: bool | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class MFAChallengeResponse(BaseModel):
    mfa_required: bool = True
    challenge_token: str
    expires_in: int = 300


class MFAVerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    challenge_token: str = Field(min_length=20)
    code: str = Field(min_length=6, max_length=20)


class MFASetupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    current_password: str = Field(min_length=1, max_length=72)


class MFASetupResponse(BaseModel):
    secret: str
    otpauth_uri: str


class MFAEnableRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(min_length=6, max_length=6)


class MFAEnableResponse(BaseModel):
    recovery_codes: list[str]


class MFADisableRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    current_password: str = Field(min_length=1, max_length=72)
    code: str = Field(min_length=6, max_length=20)


class MFAStatusResponse(BaseModel):
    enabled: bool


class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=2, max_length=255)


class PasswordChangeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=10, max_length=72)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password cannot be longer than 72 bytes")
        return value


class PasswordResetRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    model_config = ConfigDict(extra="forbid")
    token: str = Field(min_length=20)
    new_password: str = Field(min_length=10, max_length=72)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password cannot be longer than 72 bytes")
        return value


class MessageResponse(BaseModel):
    message: str


class InvitationPreview(BaseModel):
    email: EmailStr
    name: str
    organization_name: str
    role: str
    role_name: str
    department: str
    expires_at: datetime


class InvitationAcceptRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    password: str = Field(min_length=10, max_length=72)

    @field_validator("password")
    @classmethod
    def validate_password_bytes(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password cannot be longer than 72 bytes")
        return value
