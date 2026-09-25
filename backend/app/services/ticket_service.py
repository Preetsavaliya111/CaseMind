import math
import uuid
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.case import CaseAttachment, CaseComment, SupportCase
from app.models.user import User
from app.models.authorization import Permission, Role, RolePermission, UserRole
from app.models.organization_unit import TicketAccess
from app.models.sla import CaseEscalation
from app.schemas.ticket import CaseCommentCreate, CaseCreate, CaseResponse, CaseUpdate
from app.services.authorization_service import get_permission_codes
from app.services.organization_unit_service import user_department_ids, user_team_ids
from app.services.audit_service import record_audit
from app.services.notification_service import notify_assignment, notify_reply


def _base_query(db: Session, organization_id: UUID):
    return (
        db.query(SupportCase)
        .options(joinedload(SupportCase.reporter), joinedload(SupportCase.assignee), selectinload(SupportCase.comments).joinedload(CaseComment.author), selectinload(SupportCase.escalations).joinedload(CaseEscalation.actor), selectinload(SupportCase.attachments).joinedload(CaseAttachment.uploaded_by))
        .filter(SupportCase.organization_id == organization_id, SupportCase.archived_at.is_(None))
    )


def authorized_case_query(db: Session, current_user: User):
    query = _base_query(db, current_user.organization_id)
    permissions = set(get_permission_codes(db, current_user))
    if "ticket.view_all_org" in permissions:
        return query
    scopes = []
    if "ticket.view_own" in permissions:
        scopes.append(SupportCase.reporter_id == current_user.id)
    if "ticket.view_assigned" in permissions:
        scopes.append(SupportCase.assignee_id == current_user.id)
    if "ticket.view_team" in permissions:
        team_ids = user_team_ids(db, current_user)
        if team_ids:
            scopes.append(SupportCase.team_id.in_(team_ids))
    if "ticket.view_department" in permissions:
        department_ids = user_department_ids(db, current_user)
        if department_ids:
            scopes.append(SupportCase.department_id.in_(department_ids))
    explicit_case_ids = db.query(TicketAccess.case_id).filter(
        TicketAccess.organization_id == current_user.organization_id,
        TicketAccess.user_id == current_user.id,
    )
    scopes.append(SupportCase.id.in_(explicit_case_ids))
    if not scopes:
        return query.filter(False)
    return query.filter(or_(*scopes))


def present_case(db: Session, current_user: User, case: SupportCase) -> CaseResponse:
    payload = CaseResponse.model_validate(case)
    if "ticket.internal_note" not in set(get_permission_codes(db, current_user)):
        payload = payload.model_copy(update={"comments": [comment for comment in payload.comments if not comment.is_internal]})
    return payload


def list_cases(db: Session, current_user: User, *, search: str | None, case_status: str | None, priority: str | None, page: int, page_size: int) -> dict:
    query = authorized_case_query(db, current_user)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(or_(SupportCase.case_number.ilike(pattern), SupportCase.subject.ilike(pattern), SupportCase.customer_name.ilike(pattern)))
    if case_status:
        query = query.filter(SupportCase.status == case_status)
    if priority:
        query = query.filter(SupportCase.priority == priority)
    total = query.count()
    items = query.order_by(SupportCase.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": [present_case(db, current_user, item) for item in items], "total": total, "page": page, "page_size": page_size, "pages": math.ceil(total / page_size) if total else 0}


def get_case(db: Session, current_user: User, case_id: UUID) -> SupportCase:
    case = authorized_case_query(db, current_user).filter(SupportCase.id == case_id).first()
    if case is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return case


ASSIGNEE_ROLE_PRIORITY = ["support_agent", "senior_agent", "team_lead", "support_manager", "org_admin", "super_admin"]


def _assignable_users_query(db: Session, organization_id: UUID):
    eligible_user_ids = (
        db.query(UserRole.user_id)
        .join(Role, Role.id == UserRole.role_id)
        .join(RolePermission, RolePermission.role_id == Role.id)
        .join(Permission, Permission.id == RolePermission.permission_id)
        .filter(UserRole.organization_id == organization_id, Permission.code == "ticket.view_assigned")
        .distinct()
    )
    return (
        db.query(User)
        .filter(
            User.organization_id == organization_id,
            User.is_active.is_(True),
            User.id.in_(eligible_user_ids),
        )
    )


def _validate_assignee(db: Session, organization_id: UUID, assignee_id: UUID | None) -> None:
    if assignee_id is None:
        return
    exists = _assignable_users_query(db, organization_id).filter(User.id == assignee_id).first()
    if not exists:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Assignee must be an active case-handling member of this organization")


def list_assignees(db: Session, organization_id: UUID) -> list[dict]:
    users = _assignable_users_query(db, organization_id).order_by(User.name.asc()).all()
    result = []
    for user in users:
        roles = {assignment.role.slug: assignment.role.name for assignment in user.role_assignments}
        role_slug = next((slug for slug in ASSIGNEE_ROLE_PRIORITY if slug in roles), next(iter(roles), "support_agent"))
        result.append({"id": user.id, "name": user.name, "role": roles.get(role_slug, "Support Agent"), "role_slug": role_slug, "department": user.department})
    return result


def create_case(db: Session, current_user: User, data: CaseCreate) -> SupportCase:
    _validate_assignee(db, current_user.organization_id, data.assignee_id)
    values = data.model_dump()
    values["tags"] = sorted({tag.strip().lower() for tag in data.tags if tag.strip()})
    team_ids = user_team_ids(db, current_user)
    department_ids = user_department_ids(db, current_user)
    permissions = set(get_permission_codes(db, current_user))
    visibility = "private_customer" if "ticket.view_own" in permissions and "ticket.view_all_org" not in permissions else ("team" if team_ids else "organization")
    case = SupportCase(
        **values,
        case_number=f"CASE-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:8].upper()}",
        organization_id=current_user.organization_id,
        reporter_id=current_user.id,
        team_id=team_ids[0] if team_ids else None,
        department_id=department_ids[0] if department_ids else None,
        visibility=visibility,
        status="new",
    )
    db.add(case)
    db.flush()
    from app.services.sla_service import apply_sla_to_case
    apply_sla_to_case(db, case)
    record_audit(db, current_user, "case.created", "case", case.id, {"case_number": case.case_number, "priority": case.priority})
    notify_assignment(db, case, current_user)
    db.commit()
    return get_case(db, current_user, case.id)


def update_case(db: Session, current_user: User, case_id: UUID, data: CaseUpdate) -> SupportCase:
    case = get_case(db, current_user, case_id)
    previous_assignee = case.assignee_id
    values = data.model_dump(exclude_unset=True)
    if "assignee_id" in values:
        permissions = set(get_permission_codes(db, current_user))
        required = "ticket.reassign" if case.assignee_id else "ticket.assign"
        if required not in permissions:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot assign this case")
        _validate_assignee(db, current_user.organization_id, values["assignee_id"])
    if "tags" in values and values["tags"] is not None:
        values["tags"] = sorted({tag.strip().lower() for tag in values["tags"] if tag.strip()})
    if "priority" in values and values["priority"] != case.priority and "ticket.change_priority" not in set(get_permission_codes(db, current_user)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot change case priority")
    if "ticket.view_own" in set(get_permission_codes(db, current_user)) and case.reporter_id == current_user.id and case.assignee_id is not None:
        protected = {"subject", "description", "priority", "category", "product", "customer_name", "assignee_id", "tags"}
        if protected.intersection(values):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Assigned cases can no longer be edited by the customer")
    for field, value in values.items():
        setattr(case, field, value)
    if "priority" in values:
        from app.services.sla_service import apply_sla_to_case
        apply_sla_to_case(db, case)
    if values:
        record_audit(db, current_user, "case.updated", "case", case.id, {"case_number": case.case_number, "fields": sorted(values)})
    if "assignee_id" in values and case.assignee_id != previous_assignee:
        notify_assignment(db, case, current_user)
    db.commit()
    return get_case(db, current_user, case.id)


def change_case_status(db: Session, current_user: User, case_id: UUID, new_status: str) -> SupportCase:
    case = get_case(db, current_user, case_id)
    previous_status = case.status
    was_breached = case.sla_breached
    case.status = new_status
    now = datetime.now(timezone.utc)
    if was_breached:
        case.sla_breached_at = case.sla_breached_at or now
    elif case.resolution_due_at is not None:
        deadline = case.resolution_due_at if case.resolution_due_at.tzinfo else case.resolution_due_at.replace(tzinfo=timezone.utc)
        if now > deadline and case.sla_breached_at is None:
            case.sla_breached_at = now
    if new_status == "resolved":
        case.resolved_at = now
    elif new_status == "closed":
        case.closed_at = now
    elif new_status == "reopened":
        case.resolved_at = None
        case.closed_at = None
    record_audit(db, current_user, "case.status_changed", "case", case.id, {"case_number": case.case_number, "from": previous_status, "to": new_status})
    db.commit()
    return get_case(db, current_user, case.id)


def add_case_comment(db: Session, current_user: User, case_id: UUID, data: CaseCommentCreate) -> SupportCase:
    case = get_case(db, current_user, case_id)
    if data.is_internal and "ticket.internal_note" not in set(get_permission_codes(db, current_user)):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot add internal notes")
    comment = CaseComment(organization_id=current_user.organization_id, case_id=case.id, author_id=current_user.id, content=data.content.strip(), is_internal=data.is_internal)
    db.add(comment)
    db.flush()
    record_audit(db, current_user, "case.internal_note_added" if data.is_internal else "case.reply_added", "case", case.id, {"case_number": case.case_number, "comment_id": str(comment.id)})
    notify_reply(db, case, current_user, data.is_internal)
    if case.first_responded_at is None and "ticket.internal_note" in set(get_permission_codes(db, current_user)):
        responded_at = datetime.now(timezone.utc)
        if case.first_response_due_at is not None:
            deadline = case.first_response_due_at if case.first_response_due_at.tzinfo else case.first_response_due_at.replace(tzinfo=timezone.utc)
            if responded_at > deadline and case.sla_breached_at is None:
                case.sla_breached_at = responded_at
        case.first_responded_at = responded_at
    case.updated_at = datetime.now(timezone.utc)
    db.commit()
    return get_case(db, current_user, case.id)


def archive_case(db: Session, current_user: User, case_id: UUID) -> None:
    case = get_case(db, current_user, case_id)
    case.archived_at = datetime.now(timezone.utc)
    record_audit(db, current_user, "case.archived", "case", case.id, {"case_number": case.case_number})
    db.commit()
