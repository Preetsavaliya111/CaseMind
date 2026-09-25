from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    actor_name: str | None
    notification_type: str
    severity: str
    title: str
    message: str
    locator: str | None
    entity_type: str | None
    entity_id: str | None
    read_at: datetime | None
    created_at: datetime

class NotificationListResponse(BaseModel):
    items: list[NotificationResponse]
    total: int
    unread: int
    page: int
    page_size: int
    pages: int


class NotificationPreferences(BaseModel):
    case_assigned: bool = True
    case_reply: bool = True
    case_escalated: bool = True
    sla_alerts: bool = True
