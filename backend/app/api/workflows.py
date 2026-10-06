from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
from app.db.database import get_db
from app.models.case import SupportCase
from app.models.organization_unit import Team
from app.models.user import User
from app.models.workflow import Workflow, WorkflowRun
from app.schemas.workflow import RunList, WorkflowList, WorkflowResponse, WorkflowToggle, WorkflowUpdate, WorkflowWrite
from app.services import workflow_service as service
from app.services.authorization_service import get_permission_codes
from app.services.ticket_service import authorized_case_query, list_assignees

router = APIRouter()
viewer = require_permission("workflow.view")
manager = require_permission("workflow.manage")


@router.get("", response_model=WorkflowList)
def list_workflows(user: User = Depends(viewer), db: Session = Depends(get_db)):
    service.require_workflow_access(db, user, "workflow.view")
    items = db.query(Workflow).filter(Workflow.organization_id == user.organization_id).order_by(Workflow.created_at, Workflow.id).limit(service.MAX_WORKFLOWS).all()
    return {"items": items, "total": len(items)}


@router.get("/options")
def options(user: User = Depends(viewer), db: Session = Depends(get_db)):
    service.require_workflow_access(db, user, "workflow.view")
    users = list_assignees(db, user.organization_id)
    teams = db.query(Team).filter(Team.organization_id == user.organization_id, Team.is_active.is_(True)).order_by(Team.name).all()
    recipients = db.query(User).filter(User.organization_id == user.organization_id, User.is_active.is_(True)).order_by(User.name).all()
    return {"users": users, "teams": [{"id": team.id, "name": team.name} for team in teams],
            "recipients": [{"id": item.id, "name": item.name} for item in recipients if "ticket.internal_note" in get_permission_codes(db, item)]}


@router.post("", response_model=WorkflowResponse, status_code=201)
def create(data: WorkflowWrite, user: User = Depends(manager), db: Session = Depends(get_db)):
    return service.create_workflow(db, user, data)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def read(workflow_id: UUID, user: User = Depends(viewer), db: Session = Depends(get_db)):
    return service.get_workflow(db, user, workflow_id)


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update(workflow_id: UUID, data: WorkflowUpdate, user: User = Depends(manager), db: Session = Depends(get_db)):
    return service.update_workflow(db, user, workflow_id, WorkflowWrite.model_validate(data.model_dump(exclude={"revision"})), data.revision)


@router.patch("/{workflow_id}/enabled", response_model=WorkflowResponse)
def toggle(workflow_id: UUID, data: WorkflowToggle, user: User = Depends(manager), db: Session = Depends(get_db)):
    return service.toggle_workflow(db, user, workflow_id, data.enabled, data.revision)


@router.get("/{workflow_id}/runs", response_model=RunList)
def runs(workflow_id: UUID, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100), user: User = Depends(viewer), db: Session = Depends(get_db)):
    service.get_workflow(db, user, workflow_id)
    # Run visibility follows current case scope. Archived cases remain in internal audit history.
    case_ids = authorized_case_query(db, user).with_entities(SupportCase.id).subquery()
    query = db.query(WorkflowRun).filter(WorkflowRun.organization_id == user.organization_id, WorkflowRun.workflow_id == workflow_id, WorkflowRun.case_id.in_(db.query(case_ids.c.id)))
    return {"items": query.order_by(WorkflowRun.started_at.desc(), WorkflowRun.id.desc()).offset((page - 1) * page_size).limit(page_size).all(), "total": query.count()}
