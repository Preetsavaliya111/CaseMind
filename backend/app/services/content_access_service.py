from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.authorization_service import get_permission_codes
from app.services.organization_unit_service import user_department_ids, user_team_ids


def apply_content_scope(query, db: Session, current_user: User, model, owner_column, *, allow_public: bool = False):
    query = query.filter(model.organization_id == current_user.organization_id, model.archived_at.is_(None))
    permissions = set(get_permission_codes(db, current_user))
    if "ticket.view_all_org" in permissions:
        return query

    scopes = [owner_column == current_user.id]
    team_ids = user_team_ids(db, current_user)
    department_ids = user_department_ids(db, current_user)
    if team_ids:
        scopes.append(model.team_id.in_(team_ids))
    if department_ids:
        scopes.append(model.department_id.in_(department_ids))
    if allow_public:
        scopes.append(model.visibility == "public")
    return query.filter(or_(*scopes))
