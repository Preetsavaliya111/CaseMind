from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import (
    InvitationAcceptRequest,
    InvitationPreview,
    LoginRequest,
    MFAChallengeResponse,
    MFADisableRequest,
    MFAEnableRequest,
    MFAEnableResponse,
    MFASetupRequest,
    MFASetupResponse,
    MFAStatusResponse,
    MFAVerifyRequest,
    PasswordChangeRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    MessageResponse,
    ProfileUpdateRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import (
    authenticate_user,
    build_user_response,
    create_user_token,
    register_user,
    record_successful_login,
    token_expiry_seconds,
)
from app.services.invitation_service import accept_invitation, preview_invitation
from app.core.security import create_mfa_challenge_token
from app.services.mfa_service import begin_setup, disable_mfa, enable_mfa, user_from_challenge, verify_user_code
from app.services.account_service import change_password, update_profile
from app.services.password_reset_service import confirm_reset, request_reset

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    return build_user_response(db, register_user(db, data))


@router.post(
    "/login",
    response_model=TokenResponse | MFAChallengeResponse,
)
def login(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        db,
        str(data.email),
        data.password,
    )

    if user.mfa_enabled:
        return MFAChallengeResponse(challenge_token=create_mfa_challenge_token(str(user.id)))

    record_successful_login(db, user)
    return TokenResponse(
        access_token=create_user_token(user),
        token_type="bearer",
        expires_in=token_expiry_seconds(),
        user=build_user_response(db, user),
    )


@router.post("/mfa/verify", response_model=TokenResponse)
def mfa_verify(data: MFAVerifyRequest, db: Session = Depends(get_db)):
    user = user_from_challenge(db, data.challenge_token)
    if not verify_user_code(db, user, data.code):
        from fastapi import HTTPException
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="The authenticator or recovery code is invalid")
    record_successful_login(db, user)
    return TokenResponse(access_token=create_user_token(user), expires_in=token_expiry_seconds(), user=build_user_response(db, user))


@router.get("/mfa/status", response_model=MFAStatusResponse)
def mfa_status(current_user: User = Depends(get_current_user)):
    return {"enabled": current_user.mfa_enabled}


@router.post("/mfa/setup", response_model=MFASetupResponse)
def mfa_setup(data: MFASetupRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return begin_setup(db, current_user, data.current_password)


@router.post("/mfa/enable", response_model=MFAEnableResponse)
def mfa_enable(data: MFAEnableRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return {"recovery_codes": enable_mfa(db, current_user, data.code)}


@router.post("/mfa/disable", status_code=status.HTTP_204_NO_CONTENT)
def mfa_disable(data: MFADisableRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    disable_mfa(db, current_user, data.current_password, data.code)


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return build_user_response(db, current_user)


@router.patch("/profile", response_model=UserResponse)
def profile_update(data: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return build_user_response(db, update_profile(db, current_user, data.name))


@router.post("/password", response_model=TokenResponse)
def password_change(data: PasswordChangeRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = change_password(db, current_user, data.current_password, data.new_password)
    return TokenResponse(access_token=create_user_token(user), expires_in=token_expiry_seconds(), user=build_user_response(db, user))


@router.post("/password-reset/request", response_model=MessageResponse)
def password_reset_request(data: PasswordResetRequest, db: Session = Depends(get_db)):
    request_reset(db, str(data.email))
    return {"message": "If an active account exists, password recovery instructions have been sent."}


@router.post("/password-reset/confirm", response_model=MessageResponse)
def password_reset_confirm(data: PasswordResetConfirm, db: Session = Depends(get_db)):
    confirm_reset(db, data.token, data.new_password)
    return {"message": "Password reset complete. You can now sign in."}


@router.get("/invitations/{token}", response_model=InvitationPreview)
def invitation_preview(token: str, db: Session = Depends(get_db)):
    return preview_invitation(db, token)


@router.post("/invitations/{token}/accept", response_model=TokenResponse)
def invitation_accept(token: str, data: InvitationAcceptRequest, db: Session = Depends(get_db)):
    user = accept_invitation(db, token, data.password)
    record_successful_login(db, user)
    return TokenResponse(
        access_token=create_user_token(user),
        token_type="bearer",
        expires_in=token_expiry_seconds(),
        user=build_user_response(db, user),
    )
