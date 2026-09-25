from uuid import UUID
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.notification import NotificationListResponse, NotificationPreferences, NotificationResponse
from app.services.notification_service import list_notifications, mark_all_read, mark_read, notification_preferences, update_notification_preferences

router = APIRouter()

@router.get("/preferences", response_model=NotificationPreferences)
def preferences(current_user: User = Depends(get_current_user)):
    return notification_preferences(current_user)

@router.put("/preferences", response_model=NotificationPreferences)
def save_preferences(data: NotificationPreferences, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return update_notification_preferences(db, current_user, data.model_dump())

@router.get("", response_model=NotificationListResponse)
def notifications(unread_only: bool = False, page: int = Query(default=1, ge=1), page_size: int = Query(default=30, ge=1, le=100), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_notifications(db, current_user, unread_only=unread_only, page=page, page_size=page_size)

@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def read(notification_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return mark_read(db, current_user, notification_id)

@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def read_all(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    mark_all_read(db, current_user); return Response(status_code=status.HTTP_204_NO_CONTENT)
