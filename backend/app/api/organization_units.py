from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
from app.db.database import get_db
from app.models.user import User
from app.schemas.organization_unit import DepartmentCreate, DepartmentResponse, TeamCreate, TeamMemberUpdate, TeamResponse, TeamUpdate
from app.services.team_service import add_team_member, create_department, create_team, list_departments, list_teams, remove_team_member, update_team


router = APIRouter()


@router.get("/departments", response_model=list[DepartmentResponse])
def departments(current_user: User = Depends(require_permission("team.view")), db: Session = Depends(get_db)):
    return list_departments(db, current_user)


@router.post("/departments", response_model=DepartmentResponse, status_code=201)
def add_department(data: DepartmentCreate, current_user: User = Depends(require_permission("team.create")), db: Session = Depends(get_db)):
    return create_department(db, current_user, data)


@router.get("/teams", response_model=list[TeamResponse])
def teams(current_user: User = Depends(require_permission("team.view")), db: Session = Depends(get_db)):
    return list_teams(db, current_user)


@router.post("/teams", response_model=TeamResponse, status_code=201)
def add_team(data: TeamCreate, current_user: User = Depends(require_permission("team.create")), db: Session = Depends(get_db)):
    return create_team(db, current_user, data)


@router.patch("/teams/{team_id}", response_model=TeamResponse)
def edit_team(team_id: UUID, data: TeamUpdate, current_user: User = Depends(require_permission("team.manage")), db: Session = Depends(get_db)):
    return update_team(db, current_user, team_id, data)


@router.put("/teams/{team_id}/members/{user_id}", response_model=TeamResponse)
def put_member(team_id: UUID, user_id: UUID, data: TeamMemberUpdate, current_user: User = Depends(require_permission("team.manage")), db: Session = Depends(get_db)):
    return add_team_member(db, current_user, team_id, user_id, data.is_lead)


@router.delete("/teams/{team_id}/members/{user_id}", response_model=TeamResponse)
def delete_member(team_id: UUID, user_id: UUID, current_user: User = Depends(require_permission("team.manage")), db: Session = Depends(get_db)):
    return remove_team_member(db, current_user, team_id, user_id)
