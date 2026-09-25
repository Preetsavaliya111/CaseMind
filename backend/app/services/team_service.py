from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.organization_unit import Department, Team, TeamMember
from app.models.user import User
from app.schemas.organization_unit import DepartmentCreate, TeamCreate, TeamUpdate
from app.services.authorization_service import has_permission
from app.services.organization_unit_service import user_team_ids
from app.services.audit_service import record_audit


def _team_response(db: Session, team: Team) -> dict:
    memberships = db.query(TeamMember, User).join(User, User.id == TeamMember.user_id).filter(
        TeamMember.team_id == team.id,
        User.is_active.is_(True),
    ).order_by(User.name.asc()).all()
    return {
        "id": team.id,
        "name": team.name,
        "description": team.description,
        "department_id": team.department_id,
        "department_name": team.department.name if team.department else None,
        "is_active": team.is_active,
        "members": [{"id": user.id, "name": user.name, "email": user.email, "is_lead": membership.is_lead} for membership, user in memberships],
    }


def list_departments(db: Session, current_user: User) -> list[Department]:
    query = db.query(Department).filter(Department.organization_id == current_user.organization_id)
    if not has_permission(db, current_user, "ticket.view_all_org"):
        team_ids = user_team_ids(db, current_user)
        department_ids = db.query(Team.department_id).filter(Team.id.in_(team_ids), Team.department_id.is_not(None))
        query = query.filter(Department.id.in_(department_ids))
    return query.order_by(Department.name.asc()).all()


def create_department(db: Session, current_user: User, data: DepartmentCreate) -> Department:
    exists = db.query(Department.id).filter(Department.organization_id == current_user.organization_id, Department.name == data.name.strip()).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A department with this name already exists")
    department = Department(organization_id=current_user.organization_id, name=data.name.strip(), description=data.description)
    db.add(department); db.flush(); record_audit(db, current_user, "department.created", "department", department.id, {"name": department.name}); db.commit(); db.refresh(department)
    return department


def list_teams(db: Session, current_user: User) -> list[dict]:
    query = db.query(Team).filter(Team.organization_id == current_user.organization_id)
    if not has_permission(db, current_user, "ticket.view_all_org"):
        ids = user_team_ids(db, current_user)
        query = query.filter(Team.id.in_(ids))
    return [_team_response(db, team) for team in query.order_by(Team.name.asc()).all()]


def get_manageable_team(db: Session, current_user: User, team_id: UUID) -> Team:
    team = db.query(Team).filter(Team.id == team_id, Team.organization_id == current_user.organization_id).first()
    if team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
    if not has_permission(db, current_user, "ticket.view_all_org"):
        lead = db.query(TeamMember.id).filter(TeamMember.team_id == team.id, TeamMember.user_id == current_user.id, TeamMember.is_lead.is_(True)).first()
        if lead is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can manage only teams you lead")
    return team


def create_team(db: Session, current_user: User, data: TeamCreate) -> dict:
    department = db.query(Department).filter(Department.id == data.department_id, Department.organization_id == current_user.organization_id).first()
    if department is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Department not found")
    exists = db.query(Team.id).filter(Team.organization_id == current_user.organization_id, Team.name == data.name.strip()).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A team with this name already exists")
    team = Team(organization_id=current_user.organization_id, department_id=department.id, name=data.name.strip(), description=data.description)
    db.add(team); db.flush(); record_audit(db, current_user, "team.created", "team", team.id, {"name": team.name, "department": department.name}); db.commit(); db.refresh(team)
    return _team_response(db, team)


def update_team(db: Session, current_user: User, team_id: UUID, data: TeamUpdate) -> dict:
    team = get_manageable_team(db, current_user, team_id)
    changes = data.model_dump(exclude_unset=True)
    if "department_id" in changes:
        exists = db.query(Department.id).filter(Department.id == changes["department_id"], Department.organization_id == current_user.organization_id).first()
        if not exists:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Department not found")
    for field, value in changes.items(): setattr(team, field, value.strip() if isinstance(value, str) else value)
    record_audit(db, current_user, "team.updated", "team", team.id, {"fields": sorted(changes)})
    db.commit(); db.refresh(team)
    return _team_response(db, team)


def add_team_member(db: Session, current_user: User, team_id: UUID, user_id: UUID, is_lead: bool) -> dict:
    team = get_manageable_team(db, current_user, team_id)
    user = db.query(User).filter(User.id == user_id, User.organization_id == current_user.organization_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    membership = db.query(TeamMember).filter(TeamMember.team_id == team.id, TeamMember.user_id == user.id).first()
    if membership is None:
        membership = TeamMember(organization_id=current_user.organization_id, team_id=team.id, user_id=user.id, is_lead=is_lead)
        db.add(membership)
    else:
        membership.is_lead = is_lead
    record_audit(db, current_user, "team.member_added", "team", team.id, {"user_id": str(user.id), "user": user.email, "is_lead": is_lead})
    db.commit()
    return _team_response(db, team)


def remove_team_member(db: Session, current_user: User, team_id: UUID, user_id: UUID) -> dict:
    team = get_manageable_team(db, current_user, team_id)
    membership = db.query(TeamMember).filter(TeamMember.team_id == team.id, TeamMember.user_id == user_id).first()
    if membership is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team membership not found")
    if user_id == current_user.id and membership.is_lead:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A team lead cannot remove their own lead membership")
    db.delete(membership); record_audit(db, current_user, "team.member_removed", "team", team.id, {"user_id": str(user_id)}); db.commit()
    return _team_response(db, team)
