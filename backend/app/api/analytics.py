from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsOverview
from app.services.analytics_service import get_overview


router = APIRouter()


@router.get("/overview", response_model=AnalyticsOverview)
def overview(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_overview(db, current_user)
