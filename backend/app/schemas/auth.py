from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    organization_id: UUID
    role: str = "customer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    email: EmailStr
    role: str