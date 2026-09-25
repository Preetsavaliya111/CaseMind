import math

from sqlalchemy.orm import Session, joinedload

from app.models.audit import AuditEvent
from app.models.user import User


def record_audit(db: Session, actor: User, action: str, entity_type: str, entity_id=None, details: dict | None = None) -> AuditEvent:
    event = AuditEvent(
        organization_id=actor.organization_id,
        actor_id=actor.id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        details=details or {},
    )
    db.add(event)
    return event


def list_audit_events(db: Session, current_user: User, *, action: str | None, entity_type: str | None, page: int, page_size: int) -> dict:
    query = db.query(AuditEvent).options(joinedload(AuditEvent.actor)).filter(AuditEvent.organization_id == current_user.organization_id)
    if action:
        query = query.filter(AuditEvent.action == action)
    if entity_type:
        query = query.filter(AuditEvent.entity_type == entity_type)
    total = query.count()
    items = query.order_by(AuditEvent.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": math.ceil(total / page_size) if total else 0}
