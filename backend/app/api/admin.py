from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import require_permission
from app.db.database import get_db
from app.models.user import User
from app.schemas.admin import AIConfigurationResponse, AdminUserResponse, AdminUserUpdate, InvitationCreate, InvitationResponse, PasswordResetLinkResponse
from app.services.admin_service import list_users, update_user
from app.services.invitation_service import create_invitation, list_invitations, revoke_invitation
from app.services.password_reset_service import create_reset


router = APIRouter()


@router.get("/users", response_model=list[AdminUserResponse])
def users(current_user: User = Depends(require_permission("user.view")), db: Session = Depends(get_db)):
    return list_users(db, current_user.organization_id)


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
def update(user_id: UUID, data: AdminUserUpdate, current_user: User = Depends(require_permission("user.edit")), db: Session = Depends(get_db)):
    return update_user(db, current_user, user_id, data)


@router.post("/users/{user_id}/password-reset", response_model=PasswordResetLinkResponse)
def issue_password_reset(user_id: UUID, current_user: User = Depends(require_permission("user.edit")), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.organization_id == current_user.organization_id, User.is_active.is_(True)).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active user not found")
    return create_reset(db, user, current_user)


@router.get("/invitations", response_model=list[InvitationResponse])
def invitations(current_user: User = Depends(require_permission("user.invite")), db: Session = Depends(get_db)):
    return list_invitations(db, current_user)


@router.post("/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def invite(data: InvitationCreate, current_user: User = Depends(require_permission("user.invite")), db: Session = Depends(get_db)):
    return create_invitation(db, current_user, data)


@router.delete("/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke(invitation_id: UUID, current_user: User = Depends(require_permission("user.invite")), db: Session = Depends(get_db)):
    revoke_invitation(db, current_user, invitation_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/ai-configuration", response_model=AIConfigurationResponse)
def ai_configuration(current_user: User = Depends(require_permission("ai.manage_models"))):
    return {
        "chat_provider": "Groq",
        "chat_model": settings.GROQ_CHAT_MODEL,
        "chat_configured": bool(settings.GROQ_API_KEY),
        "embedding_provider": "Gemini",
        "embedding_model": settings.GEMINI_EMBEDDING_MODEL,
        "embedding_configured": bool(settings.GEMINI_API_KEY),
        "vector_store": "Qdrant",
        "vector_collection": settings.QDRANT_COLLECTION,
        "secrets_location": "Server environment only",
    }
