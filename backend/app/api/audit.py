from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
from app.db.database import get_db
from app.models.user import User
from app.schemas.audit import AuditEventListResponse
from app.services.audit_service import list_audit_events


router = APIRouter()


@router.get("", response_model=AuditEventListResponse)
def events(
    action: str | None = Query(default=None, max_length=100),
    entity_type: str | None = Query(default=None, max_length=64),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=30, ge=1, le=100),
    current_user: User = Depends(require_permission("audit.view")),
    db: Session = Depends(get_db),
):
    return list_audit_events(db, current_user, action=action, entity_type=entity_type, page=page, page_size=page_size)
