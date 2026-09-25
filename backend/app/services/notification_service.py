import math
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.case import SupportCase
from app.models.notification import Notification
from app.models.organization_unit import TeamMember
from app.models.user import User


PREFERENCE_KEYS = {
    "case_assigned": "case_assigned",
    "case_reply": "case_reply",
    "case_escalated": "case_escalated",
    "sla_at_risk": "sla_alerts",
    "sla_breached": "sla_alerts",
}


def notification_preferences(user: User) -> dict[str, bool]:
    stored = user.notification_preferences or {}
    return {key: bool(stored.get(key, True)) for key in {"case_assigned", "case_reply", "case_escalated", "sla_alerts"}}


def update_notification_preferences(db: Session, user: User, values: dict[str, bool]) -> dict[str, bool]:
    user.notification_preferences = {key: bool(value) for key, value in values.items()}
    db.commit()
    return notification_preferences(user)


def create_notification(db: Session, *, recipient_id: UUID, organization_id: UUID, notification_type: str, title: str, message: str, locator: str | None = None, entity_type: str | None = None, entity_id=None, actor_id: UUID | None = None, severity: str = "info", dedup_key: str | None = None) -> Notification | None:
    if actor_id == recipient_id:
        return None
    preference_key = PREFERENCE_KEYS.get(notification_type)
    if preference_key:
        recipient = db.query(User).filter(User.id == recipient_id, User.organization_id == organization_id).first()
        if recipient is None or not notification_preferences(recipient)[preference_key]:
            return None
    if dedup_key and db.query(Notification.id).filter(Notification.recipient_id == recipient_id, Notification.dedup_key == dedup_key).first():
        return None
    item = Notification(organization_id=organization_id, recipient_id=recipient_id, actor_id=actor_id, notification_type=notification_type, severity=severity, title=title, message=message, locator=locator, entity_type=entity_type, entity_id=str(entity_id) if entity_id else None, dedup_key=dedup_key)
    db.add(item)
    return item


def notify_assignment(db: Session, case: SupportCase, actor: User) -> None:
    if case.assignee_id:
        create_notification(db, recipient_id=case.assignee_id, organization_id=case.organization_id, actor_id=actor.id, notification_type="case_assigned", title=f"Case assigned: {case.case_number}", message=case.subject, locator=f"/tickets/{case.id}", entity_type="case", entity_id=case.id)


def notify_reply(db: Session, case: SupportCase, actor: User, is_internal: bool) -> None:
    if is_internal:
        return
    recipient = case.reporter_id if case.reporter_id != actor.id else case.assignee_id
    if recipient:
        create_notification(db, recipient_id=recipient, organization_id=case.organization_id, actor_id=actor.id, notification_type="case_reply", title=f"New reply on {case.case_number}", message=case.subject, locator=f"/tickets/{case.id}", entity_type="case", entity_id=case.id)


def notify_escalation(db: Session, case: SupportCase, actor: User) -> None:
    recipient_ids = set()
    if case.assignee_id: recipient_ids.add(case.assignee_id)
    if case.team_id:
        recipient_ids.update(row[0] for row in db.query(TeamMember.user_id).filter(TeamMember.team_id == case.team_id, TeamMember.is_lead.is_(True)).all())
    for recipient_id in recipient_ids:
        create_notification(db, recipient_id=recipient_id, organization_id=case.organization_id, actor_id=actor.id, notification_type="case_escalated", severity="warning", title=f"Escalated to level {case.escalation_level}", message=f"{case.case_number}: {case.subject}", locator=f"/tickets/{case.id}", entity_type="case", entity_id=case.id)


def ensure_sla_notifications(db: Session, current_user: User) -> None:
    from app.services.ticket_service import authorized_case_query
    cases = authorized_case_query(db, current_user).filter(SupportCase.status.notin_(["resolved", "closed"])).all()
    for case in cases:
        state = case.sla_state
        if state not in {"at_risk", "breached"}: continue
        deadline = case.sla_deadline.isoformat() if case.sla_deadline else "none"
        create_notification(db, recipient_id=current_user.id, organization_id=current_user.organization_id, notification_type=f"sla_{state}", severity="critical" if state == "breached" else "warning", title=f"SLA {state.replace('_', ' ')}: {case.case_number}", message=case.subject, locator=f"/tickets/{case.id}", entity_type="case", entity_id=case.id, dedup_key=f"sla:{case.id}:{state}:{deadline}")
    db.commit()


def list_notifications(db: Session, current_user: User, *, unread_only: bool, page: int, page_size: int) -> dict:
    ensure_sla_notifications(db, current_user)
    base = db.query(Notification).options(joinedload(Notification.actor)).filter(Notification.recipient_id == current_user.id, Notification.organization_id == current_user.organization_id)
    unread = base.filter(Notification.read_at.is_(None)).count()
    query = base.filter(Notification.read_at.is_(None)) if unread_only else base
    total = query.count(); items = query.order_by(Notification.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "unread": unread, "page": page, "page_size": page_size, "pages": math.ceil(total / page_size) if total else 0}


def mark_read(db: Session, current_user: User, notification_id: UUID) -> Notification:
    item = db.query(Notification).filter(Notification.id == notification_id, Notification.recipient_id == current_user.id).first()
    if item is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    item.read_at = item.read_at or datetime.now(timezone.utc); db.commit(); db.refresh(item)
    return item


def mark_all_read(db: Session, current_user: User) -> None:
    db.query(Notification).filter(Notification.recipient_id == current_user.id, Notification.read_at.is_(None)).update({"read_at": datetime.now(timezone.utc)}, synchronize_session=False); db.commit()
