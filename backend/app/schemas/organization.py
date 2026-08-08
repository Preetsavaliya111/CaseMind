from pydantic import BaseModel, ConfigDict


class OrganizationCreate(BaseModel):
    name: str
    domain: str | None = None


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    domain: str | None = None