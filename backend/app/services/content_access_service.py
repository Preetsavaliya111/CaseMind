from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.authorization_service import get_permission_codes
from app.services.organization_unit_service import user_department_ids, user_team_ids


def apply_content_scope(query, db: Session, current_user: User, model, owner_column, *, allow_public: bool = False):
    query = query.filter(model.organization_id == current_user.organization_id, model.archived_at.is_(None))
    permissions = set(get_permission_codes(db, current_user))
    # Public readers must never inherit internal access through a team, owner or
    # department relationship. Publication and audience are separate decisions.
    if allow_public and "knowledge.read_internal" not in permissions:
        return query.filter(model.visibility == "public", model.state == "published")
    if "ticket.view_all_org" in permissions:
        return query

    scopes = [owner_column == current_user.id, model.visibility == "organization"]
    team_ids = user_team_ids(db, current_user)
    department_ids = user_department_ids(db, current_user)
    if team_ids:
        scopes.append(and_(model.visibility == "team", model.team_id.in_(team_ids)))
    if department_ids:
        scopes.append(and_(model.visibility == "department", model.department_id.in_(department_ids)))
    if allow_public:
        scopes.append(and_(model.visibility == "public", model.state == "published"))
    return query.filter(or_(*scopes))
