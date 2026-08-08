from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.schemas.organization import OrganizationCreate


def create_organization(
    db: Session,
    data: OrganizationCreate,
) -> Organization:
    if data.domain:
        existing_organization = (
            db.query(Organization)
            .filter(Organization.domain == data.domain)
            .first()
        )

        if existing_organization:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Organization domain already exists",
            )

    organization = Organization(
        name=data.name,
        domain=data.domain,
    )

    db.add(organization)
    db.commit()
    db.refresh(organization)

    return organization