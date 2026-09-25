from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.dashboard import WorkspaceDashboard
from app.services.workspace_dashboard_service import get_workspace_dashboard

router = APIRouter()

@router.get("/workspace", response_model=WorkspaceDashboard)
def workspace(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_workspace_dashboard(db, current_user)
