from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationResponse,
)
from app.services.organization_service import create_organization


router = APIRouter()


@router.post(
    "/",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create(
    data: OrganizationCreate,
    db: Session = Depends(get_db),
):
    return create_organization(db, data)