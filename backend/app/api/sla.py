from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import require_permission
from app.db.database import get_db
from app.models.user import User
from app.schemas.sla import SLAPolicyResponse, SLAPolicyUpdate, SLASummary
from app.services.sla_service import list_policies, sla_summary, update_policy

router = APIRouter()

@router.get("/policies", response_model=list[SLAPolicyResponse])
def policies(current_user: User = Depends(require_permission("sla.view")), db: Session = Depends(get_db)):
    return list_policies(db, current_user)

@router.patch("/policies/{policy_id}", response_model=SLAPolicyResponse)
def edit_policy(policy_id: UUID, data: SLAPolicyUpdate, current_user: User = Depends(require_permission("sla.manage")), db: Session = Depends(get_db)):
    return update_policy(db, current_user, policy_id, data)

@router.get("/summary", response_model=SLASummary)
def summary(current_user: User = Depends(require_permission("sla.view")), db: Session = Depends(get_db)):
    return sla_summary(db, current_user)
