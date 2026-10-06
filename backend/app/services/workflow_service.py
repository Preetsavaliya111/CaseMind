from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.case import SupportCase
from app.models.notification import Notification
from app.models.organization import Organization
from app.models.organization_unit import Team
from app.models.user import User
from app.models.workflow import CaseEvent, Workflow, WorkflowRun
from app.schemas.ticket import CaseCommentCreate, CaseUpdate
from app.schemas.workflow import WorkflowWrite
from app.services.audit_service import record_audit
from app.services.authorization_service import get_permission_codes

MAX_WORKFLOWS = 50


def require_workflow_access(db: Session, user: User, permission: str) -> None:
    # Phase 1 is deliberately organization-manager-only. Runs may contain internal notes.
    needed = {permission, "ticket.view_all_org", "ticket.internal_note"}
    if not user.is_active or not needed.issubset(set(get_permission_codes(db, user))):
        raise HTTPException(403, "Organization workflow permission is required")


def get_workflow(db: Session, user: User, workflow_id: UUID, *, lock=False) -> Workflow:
    require_workflow_access(db, user, "workflow.view")
    query = db.query(Workflow).filter(Workflow.organization_id == user.organization_id, Workflow.id == workflow_id)
    item = (query.with_for_update() if lock else query).first()
    if item is None:
        raise HTTPException(404, "Workflow not found")
    return item


def _require_action(permissions: set[str], action, case: SupportCase | None = None) -> None:
    needed = {
        "assign_user": {"ticket.reply", "ticket.assign"},
        "assign_team": {"ticket.reply", "ticket.assign"},
        "set_status": {"ticket.change_status"},
        "set_priority": {"ticket.reply", "ticket.change_priority"},
        "internal_note": {"ticket.reply", "ticket.internal_note"},
        "notify_user": {"ticket.internal_note"},
    }[action.type].copy()
    if action.type == "assign_user" and case is not None and case.assignee_id:
        needed.add("ticket.reassign")
    if action.type == "assign_team" and case is not None and case.team_id:
        needed.add("ticket.reassign")
    if action.type == "set_status" and action.status in {"resolved", "closed"}:
        needed.add("ticket.resolve")
    if action.type == "set_status" and action.status == "reopened":
        needed.add("ticket.reopen")
    if not needed.issubset(permissions):
        raise HTTPException(403, "The acting user cannot perform this action")


def _team(db: Session, organization_id: UUID, team_id: UUID) -> Team:
    team = db.query(Team).filter(Team.id == team_id, Team.organization_id == organization_id, Team.is_active.is_(True)).first()
    if team is None:
        raise HTTPException(422, "Select an active team in this organization")
    return team


def _recipient(db: Session, organization_id: UUID, user_id: UUID) -> User:
    user = db.query(User).filter(User.id == user_id, User.organization_id == organization_id, User.is_active.is_(True)).first()
    if user is None or "ticket.internal_note" not in get_permission_codes(db, user):
        raise HTTPException(422, "Select an active internal member of this organization")
    return user


def validate_definition(db: Session, user: User, data: WorkflowWrite) -> None:
    from app.services.ticket_service import _validate_assignee

    permissions = set(get_permission_codes(db, user))
    for condition in data.conditions:
        if condition.field == "team_id":
            _team(db, user.organization_id, UUID(condition.value))
        elif condition.field == "assignee_id":
            _validate_assignee(db, user.organization_id, UUID(condition.value))
    for action in data.actions:
        _require_action(permissions, action)
        if action.type == "assign_user":
            _validate_assignee(db, user.organization_id, action.user_id)
        elif action.type == "assign_team":
            _team(db, user.organization_id, action.team_id)
        elif action.type == "notify_user":
            _recipient(db, user.organization_id, action.user_id)


def create_workflow(db: Session, user: User, data: WorkflowWrite) -> Workflow:
    require_workflow_access(db, user, "workflow.manage")
    validate_definition(db, user, data)
    # Serializes the organization cap even when two administrators create concurrently.
    db.query(Organization).filter(Organization.id == user.organization_id).with_for_update().one()
    if db.query(Workflow).filter(Workflow.organization_id == user.organization_id).count() >= MAX_WORKFLOWS:
        raise HTTPException(409, "This organization has reached the 50-workflow limit; edit an existing workflow")
    item = Workflow(**data.model_dump(mode="json"), organization_id=user.organization_id, created_by_id=user.id)
    db.add(item)
    db.flush()
    record_audit(db, user, "workflow.created", "workflow", item.id, {"revision": item.revision, "enabled": item.enabled})
    db.commit()
    db.refresh(item)
    return item


def update_workflow(db: Session, user: User, workflow_id: UUID, data: WorkflowWrite, revision: int) -> Workflow:
    require_workflow_access(db, user, "workflow.manage")
    item = get_workflow(db, user, workflow_id, lock=True)
    if item.revision != revision:
        raise HTTPException(409, "Workflow changed; reload before saving")
    validate_definition(db, user, data)
    previous_enabled = item.enabled
    for key, value in data.model_dump(mode="json").items():
        setattr(item, key, value)
    item.revision += 1
    record_audit(db, user, "workflow.updated", "workflow", item.id, {"revision": item.revision})
    if previous_enabled != item.enabled:
        record_audit(db, user, "workflow.enabled" if item.enabled else "workflow.disabled", "workflow", item.id, {"revision": item.revision})
    db.commit()
    db.refresh(item)
    return item


def toggle_workflow(db: Session, user: User, workflow_id: UUID, enabled: bool, revision: int) -> Workflow:
    require_workflow_access(db, user, "workflow.manage")
    item = get_workflow(db, user, workflow_id, lock=True)
    if item.revision != revision:
        raise HTTPException(409, "Workflow changed; reload before saving")
    # Disabling must remain possible even if a previously valid target was deactivated.
    if enabled:
        validate_definition(db, user, WorkflowWrite.model_validate({key: getattr(item, key) for key in WorkflowWrite.model_fields}))
    item.enabled = enabled
    item.revision += 1
    record_audit(db, user, "workflow.enabled" if enabled else "workflow.disabled", "workflow", item.id, {"revision": item.revision})
    db.commit()
    db.refresh(item)
    return item


def emit_case_events(db: Session, actor: User, case: SupportCase, event_types: list[str]) -> None:
    if db.info.get("workflow_running") or not event_types:
        return
    if case.organization_id != actor.organization_id:
        raise HTTPException(403, "Case organization does not match actor")
    db.flush()
    snapshot = {field: getattr(case, field) for field in ("priority", "status", "category", "tags")}
    snapshot.update({field: str(getattr(case, field)) if getattr(case, field) else None for field in ("team_id", "assignee_id")})
    events = []
    for event_type in dict.fromkeys(event_types):
        workflow_ids = [str(row[0]) for row in db.query(Workflow.id).filter(Workflow.organization_id == actor.organization_id, Workflow.event_type == event_type, Workflow.enabled.is_(True)).all()]
        event = CaseEvent(organization_id=actor.organization_id, case_id=case.id, actor_id=actor.id, event_type=event_type, snapshot={**snapshot, "workflow_ids": workflow_ids})
        db.add(event)
        events.append(event)
    db.flush()
    for event in events:
        dispatch_event(db, event.id, actor.organization_id)


def _execute_action(db: Session, actor: User, case: SupportCase, action, run: WorkflowRun, index: int) -> None:
    from app.services.ticket_service import add_case_comment, assign_case_team, change_case_status, get_case, update_case

    # Authorization is rechecked for each action, including after assignment changes scope.
    get_case(db, actor, case.id)
    _require_action(set(get_permission_codes(db, actor)), action, case)
    if action.type == "assign_user":
        update_case(db, actor, case.id, CaseUpdate(assignee_id=action.user_id), commit=False)
    elif action.type == "assign_team":
        assign_case_team(db, actor, case.id, action.team_id, commit=False)
    elif action.type == "set_priority":
        update_case(db, actor, case.id, CaseUpdate(priority=action.priority), commit=False)
    elif action.type == "set_status":
        change_case_status(db, actor, case.id, action.status, commit=False)
    elif action.type == "internal_note":
        add_case_comment(db, actor, case.id, CaseCommentCreate(content=action.content, is_internal=True), commit=False)
    elif action.type == "notify_user":
        recipient = _recipient(db, actor.organization_id, action.user_id)
        get_case(db, recipient, case.id)
        db.add(Notification(organization_id=actor.organization_id, recipient_id=recipient.id, actor_id=actor.id,
                            notification_type="workflow", severity="info", title=f"Workflow: {case.case_number}",
                            message=action.message, locator=f"/tickets/{case.id}", entity_type="case", entity_id=str(case.id),
                            dedup_key=f"workflow:{run.id}:{index}"))


def dispatch_event(db: Session, event_id: UUID, organization_id: UUID) -> None:
    """Internal synchronous dispatcher; never accepts a client-selected actor or event.

    The event lock serializes duplicate deliveries on PostgreSQL. The unique run key
    is the final database guard. Workflows execute in savepoints in the case transaction.
    """
    from app.services.ticket_service import get_case

    if db.info.get("workflow_running"):
        return
    event = db.query(CaseEvent).filter(CaseEvent.id == event_id, CaseEvent.organization_id == organization_id).with_for_update().first()
    if event is None:
        return
    actor = db.query(User).filter(User.id == event.actor_id, User.organization_id == organization_id).first()
    if actor is None:
        return
    ids = [UUID(value) for value in event.snapshot.get("workflow_ids", [])]
    workflows = db.query(Workflow).filter(Workflow.organization_id == organization_id, Workflow.id.in_(ids), Workflow.enabled.is_(True), Workflow.event_type == event.event_type).order_by(Workflow.created_at, Workflow.id).all()
    for workflow in workflows:
        if db.query(WorkflowRun.id).filter(WorkflowRun.workflow_id == workflow.id, WorkflowRun.event_id == event.id).first():
            continue
        definition = {key: getattr(workflow, key) for key in WorkflowWrite.model_fields}
        run = WorkflowRun(organization_id=organization_id, workflow_id=workflow.id, event_id=event.id, case_id=event.case_id, actor_id=actor.id,
                          event_type=event.event_type, workflow_revision=workflow.revision, definition=definition, status="running", executed_actions=[])
        db.add(run)
        db.flush()
        try:
            data = WorkflowWrite.model_validate(definition)
            matches = all(condition.value in (event.snapshot.get("tags") or []) if condition.field == "tags" else event.snapshot.get(condition.field) == condition.value for condition in data.conditions)
            if not matches:
                run.status = "skipped"
                run.failure_code = "conditions_not_met"
                run.failure_detail = "The triggering case did not match all conditions."
            else:
                completed = []
                with db.begin_nested():
                    if not actor.is_active:
                        raise HTTPException(403, "Inactive actor")
                    case = get_case(db, actor, event.case_id)
                    db.info["workflow_running"] = True
                    for index, action in enumerate(data.actions):
                        _execute_action(db, actor, case, action, run, index)
                        db.flush()
                        completed.append({"index": index, "type": action.type, "status": "succeeded"})
                run.executed_actions = completed
                run.status = "succeeded"
        except HTTPException as exc:
            run.status = "skipped" if exc.status_code in {403, 404} else "failed"
            run.failure_code = "permission_or_visibility_denied" if run.status == "skipped" else "invalid_action_target"
            run.failure_detail = "Actions were rolled back. Check the actor's permissions, case access and active organization targets."
        except Exception:
            run.status = "failed"
            run.failure_code = "execution_failed"
            run.failure_detail = "Actions were rolled back. Review the workflow configuration and contact an administrator."
        finally:
            db.info.pop("workflow_running", None)
        run.finished_at = datetime.now(timezone.utc)
        record_audit(db, actor, f"workflow.run_{run.status}", "workflow", workflow.id,
                     {"run_id": str(run.id), "event_id": str(event.id), "case_id": str(event.case_id), "revision": run.workflow_revision, "failure_code": run.failure_code})
        db.flush()
