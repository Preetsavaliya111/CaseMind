from uuid import UUID

from sqlalchemy.orm import Session

from app.models.organization_unit import Department, DepartmentMember, Team, TeamMember
from app.models.user import User


def ensure_default_support_structure(db: Session, user: User) -> tuple[Department, Team]:
    department = db.query(Department).filter(
        Department.organization_id == user.organization_id,
        Department.name == "Support",
    ).first()
    if department is None:
        department = Department(
            organization_id=user.organization_id,
            name="Support",
            description="Default support department",
        )
        db.add(department)
        db.flush()

    team = db.query(Team).filter(
        Team.organization_id == user.organization_id,
        Team.name == "General Support",
    ).first()
    if team is None:
        team = Team(
            organization_id=user.organization_id,
            department_id=department.id,
            name="General Support",
            description="Default support queue",
        )
        db.add(team)
        db.flush()

    if not db.query(DepartmentMember.id).filter(
        DepartmentMember.department_id == department.id,
        DepartmentMember.user_id == user.id,
    ).first():
        db.add(DepartmentMember(
            organization_id=user.organization_id,
            department_id=department.id,
            user_id=user.id,
            is_manager=True,
        ))
    if not db.query(TeamMember.id).filter(TeamMember.team_id == team.id, TeamMember.user_id == user.id).first():
        db.add(TeamMember(
            organization_id=user.organization_id,
            team_id=team.id,
            user_id=user.id,
            is_lead=True,
        ))
    db.flush()
    return department, team


def add_user_to_default_support_structure(db: Session, user: User, role_slug: str) -> None:
    if role_slug == "customer":
        return

    department = db.query(Department).filter(
        Department.organization_id == user.organization_id,
        Department.name == "Support",
    ).first()
    if department is None:
        department = Department(
            organization_id=user.organization_id,
            name="Support",
            description="Default support department",
        )
        db.add(department)
        db.flush()

    team = db.query(Team).filter(
        Team.organization_id == user.organization_id,
        Team.name == "General Support",
    ).first()
    if team is None:
        team = Team(
            organization_id=user.organization_id,
            department_id=department.id,
            name="General Support",
            description="Default support queue",
        )
        db.add(team)
        db.flush()

    is_manager = role_slug in {"support_manager", "org_admin", "super_admin"}
    is_lead = role_slug in {"team_lead", "support_manager", "org_admin", "super_admin"}
    if not db.query(DepartmentMember.id).filter(
        DepartmentMember.department_id == department.id,
        DepartmentMember.user_id == user.id,
    ).first():
        db.add(DepartmentMember(
            organization_id=user.organization_id,
            department_id=department.id,
            user_id=user.id,
            is_manager=is_manager,
        ))
    if not db.query(TeamMember.id).filter(
        TeamMember.team_id == team.id,
        TeamMember.user_id == user.id,
    ).first():
        db.add(TeamMember(
            organization_id=user.organization_id,
            team_id=team.id,
            user_id=user.id,
            is_lead=is_lead,
        ))
    db.flush()


def user_team_ids(db: Session, user: User) -> list[UUID]:
    return [row[0] for row in db.query(TeamMember.team_id).filter(
        TeamMember.organization_id == user.organization_id,
        TeamMember.user_id == user.id,
    ).all()]


def user_department_ids(db: Session, user: User) -> list[UUID]:
    direct = {row[0] for row in db.query(DepartmentMember.department_id).filter(
        DepartmentMember.organization_id == user.organization_id,
        DepartmentMember.user_id == user.id,
    ).all()}
    through_teams = {row[0] for row in db.query(Team.department_id).join(
        TeamMember, TeamMember.team_id == Team.id
    ).filter(
        TeamMember.organization_id == user.organization_id,
        TeamMember.user_id == user.id,
        Team.department_id.is_not(None),
    ).all()}
    return sorted(direct | through_teams, key=str)


def user_team_summaries(db: Session, user: User) -> list[dict]:
    rows = db.query(Team).join(TeamMember, TeamMember.team_id == Team.id).filter(
        TeamMember.organization_id == user.organization_id,
        TeamMember.user_id == user.id,
        Team.is_active.is_(True),
    ).order_by(Team.name.asc()).all()
    return [{"id": team.id, "name": team.name, "department_id": team.department_id} for team in rows]


def user_department_summaries(db: Session, user: User) -> list[dict]:
    ids = user_department_ids(db, user)
    if not ids:
        return []
    rows = db.query(Department).filter(Department.id.in_(ids), Department.is_active.is_(True)).order_by(Department.name.asc()).all()
    return [{"id": department.id, "name": department.name} for department in rows]
