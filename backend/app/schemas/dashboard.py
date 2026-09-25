from pydantic import BaseModel, Field


class WorkspaceMetric(BaseModel):
    key: str
    label: str
    value: int
    tone: str = "default"
    locator: str | None = None


class WorkspaceDashboard(BaseModel):
    workspace: str
    role: str
    title: str
    description: str
    metrics: list[WorkspaceMetric] = Field(default_factory=list)
    priorities: list[str] = Field(default_factory=list)
