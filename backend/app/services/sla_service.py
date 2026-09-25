from datetime import timedelta
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.case import SupportCase
from app.models.sla import CaseEscalation, SLAPolicy
from app.models.user import User
from app.schemas.sla import SLAPolicyUpdate
from app.services.audit_service import record_audit
from app.services.ticket_service import authorized_case_query, get_case
from app.services.notification_service import notify_escalation


DEFAULT_POLICIES = {
    "critical": (15, 240),
    "high": (60, 480),
    "medium": (240, 1_440),
    "low": (480, 4_320),
}


def ensure_sla_policies(db: Session, organization_id: UUID) -> list[SLAPolicy]:
    existing = {policy.priority: policy for policy in db.query(SLAPolicy).filter(SLAPolicy.organization_id == organization_id).all()}
    changed = False
    for priority, (response, resolution) in DEFAULT_POLICIES.items():
        if priority not in existing:
            policy = SLAPolicy(organization_id=organization_id, priority=priority, first_response_minutes=response, resolution_minutes=resolution, warning_percent=75, is_active=True)
            db.add(policy); existing[priority] = policy; changed = True
    if changed: db.flush()
    return [existing[priority] for priority in ("critical", "high", "medium", "low")]


def apply_sla_to_case(db: Session, case: SupportCase) -> None:
    policy = next((item for item in ensure_sla_policies(db, case.organization_id) if item.priority == case.priority and item.is_active), None)
    if policy is None:
        case.first_response_due_at = None; case.resolution_due_at = None
        return
    case.first_response_due_at = case.created_at + timedelta(minutes=policy.first_response_minutes)
    case.resolution_due_at = case.created_at + timedelta(minutes=policy.resolution_minutes)
    case.sla_warning_percent = policy.warning_percent


def list_policies(db: Session, current_user: User) -> list[SLAPolicy]:
    policies = ensure_sla_policies(db, current_user.organization_id)
    for case in db.query(SupportCase).filter(
        SupportCase.organization_id == current_user.organization_id,
        SupportCase.archived_at.is_(None),
        SupportCase.resolution_due_at.is_(None),
        SupportCase.status.notin_(["resolved", "closed"]),
    ).all():
        apply_sla_to_case(db, case)
    db.commit()
    return policies


def update_policy(db: Session, current_user: User, policy_id: UUID, data: SLAPolicyUpdate) -> SLAPolicy:
    policy = db.query(SLAPolicy).filter(SLAPolicy.id == policy_id, SLAPolicy.organization_id == current_user.organization_id).first()
    if policy is None: raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SLA policy not found")
    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items(): setattr(policy, field, value)
    if policy.first_response_minutes > policy.resolution_minutes:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="First-response target cannot exceed the resolution target")
    record_audit(db, current_user, "sla.policy_updated", "sla_policy", policy.id, {"priority": policy.priority, "fields": sorted(changes)})
    db.commit(); db.refresh(policy)
    return policy


def escalate_case(db: Session, current_user: User, case_id: UUID, reason: str) -> SupportCase:
    case = get_case(db, current_user, case_id)
    if case.status in {"resolved", "closed"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Resolved or closed cases cannot be escalated")
    if case.escalation_level >= 3:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Case is already at the maximum escalation level")
    previous = case.escalation_level
    case.escalation_level += 1
    db.add(CaseEscalation(organization_id=current_user.organization_id, case_id=case.id, actor_id=current_user.id, from_level=previous, to_level=case.escalation_level, reason=reason.strip()))
    record_audit(db, current_user, "case.escalated", "case", case.id, {"case_number": case.case_number, "from": previous, "to": case.escalation_level, "reason": reason.strip()})
    notify_escalation(db, case, current_user)
    db.commit()
    return get_case(db, current_user, case.id)


def sla_summary(db: Session, current_user: User) -> dict:
    cases = authorized_case_query(db, current_user).filter(SupportCase.status.notin_(["resolved", "closed"])).all()
    states = [case.sla_state for case in cases]
    return {"healthy": states.count("healthy"), "at_risk": states.count("at_risk"), "breached": states.count("breached"), "escalated": sum(1 for case in cases if case.escalation_level > 0)}
