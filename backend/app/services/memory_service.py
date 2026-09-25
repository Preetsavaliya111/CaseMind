import math
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.case import SupportCase
from app.models.document import Document
from app.models.memory import MemoryItem, MemorySource
from app.models.user import User
from app.schemas.memory import MemoryItemCreate, MemoryItemUpdate, MemorySourceCreate
from app.services.content_access_service import apply_content_scope
from app.services.document_service import get_document
from app.services.organization_unit_service import user_department_ids, user_team_ids
from app.services.ticket_service import get_case
from app.services.audit_service import record_audit


def _query(db: Session, current_user: User):
    query = db.query(MemoryItem).options(joinedload(MemoryItem.created_by), joinedload(MemoryItem.verified_by), selectinload(MemoryItem.sources))
    return apply_content_scope(query, db, current_user, MemoryItem, MemoryItem.created_by_id)


def list_memory_items(db: Session, current_user: User, *, search: str | None, memory_type: str | None, verification_state: str | None, page: int, page_size: int) -> dict:
    query = _query(db, current_user)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(or_(MemoryItem.title.ilike(pattern), MemoryItem.summary.ilike(pattern), MemoryItem.issue_pattern.ilike(pattern), MemoryItem.root_cause.ilike(pattern)))
    if memory_type:
        query = query.filter(MemoryItem.memory_type == memory_type)
    if verification_state:
        query = query.filter(MemoryItem.verification_state == verification_state)
    total = query.count()
    items = query.order_by(MemoryItem.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": math.ceil(total / page_size) if total else 0}


def get_memory_item(db: Session, current_user: User, memory_item_id: UUID) -> MemoryItem:
    item = _query(db, current_user).filter(MemoryItem.id == memory_item_id).first()
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory item not found")
    return item


def _resolve_source(db: Session, current_user: User, source: MemorySourceCreate) -> tuple[str, str]:
    if source.source_type == "case":
        try:
            case = get_case(db, current_user, source.source_id)
        except HTTPException as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="The selected Case source is unavailable") from exc
        return f"{case.case_number}: {case.subject}", f"/tickets/{case.id}"
    try:
        document = get_document(db, current_user, source.source_id)
    except HTTPException as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="The selected Document source is unavailable") from exc
    return document.original_filename, f"/documents/{document.id}"


def create_memory_item(db: Session, current_user: User, data: MemoryItemCreate) -> MemoryItem:
    resolved_sources = [(source, *_resolve_source(db, current_user, source)) for source in data.sources]
    values = data.model_dump(exclude={"sources"})
    values["tags"] = sorted({tag.strip().lower() for tag in data.tags if tag.strip()})
    values["resolution_steps"] = [step.strip() for step in data.resolution_steps if step.strip()]
    team_ids = user_team_ids(db, current_user)
    department_ids = user_department_ids(db, current_user)
    item = MemoryItem(
        **values,
        organization_id=current_user.organization_id,
        created_by_id=current_user.id,
        team_id=team_ids[0] if team_ids else None,
        department_id=department_ids[0] if department_ids else None,
        visibility="team" if team_ids else "organization",
        verification_state="draft",
    )
    db.add(item)
    db.flush()
    record_audit(db, current_user, "memory.created", "memory_item", item.id, {"title": item.title, "type": item.memory_type})
    db.add_all([
        MemorySource(organization_id=current_user.organization_id, memory_item_id=item.id, source_type=source.source_type, source_id=source.source_id, source_title=title, source_locator=locator)
        for source, title, locator in resolved_sources
    ])
    db.commit()
    return get_memory_item(db, current_user, item.id)


def update_memory_item(db: Session, current_user: User, memory_item_id: UUID, data: MemoryItemUpdate) -> MemoryItem:
    item = get_memory_item(db, current_user, memory_item_id)
    values = data.model_dump(exclude_unset=True)
    if values.get("tags") is not None:
        values["tags"] = sorted({tag.strip().lower() for tag in values["tags"] if tag.strip()})
    if values.get("resolution_steps") is not None:
        values["resolution_steps"] = [step.strip() for step in values["resolution_steps"] if step.strip()]
    for field, value in values.items():
        setattr(item, field, value)
    if item.verification_state == "verified":
        item.verification_state = "draft"
        item.verified_by_id = None
        item.last_validated_at = None
    db.commit()
    return get_memory_item(db, current_user, item.id)


def verify_memory_item(db: Session, current_user: User, memory_item_id: UUID) -> MemoryItem:
    item = get_memory_item(db, current_user, memory_item_id)
    item.verification_state = "verified"
    item.verified_by_id = current_user.id
    item.last_validated_at = datetime.now(timezone.utc)
    record_audit(db, current_user, "memory.verified", "memory_item", item.id, {"title": item.title})
    db.commit()
    return get_memory_item(db, current_user, item.id)


def archive_memory_item(db: Session, current_user: User, memory_item_id: UUID) -> None:
    item = get_memory_item(db, current_user, memory_item_id)
    item.archived_at = datetime.now(timezone.utc)
    record_audit(db, current_user, "memory.archived", "memory_item", item.id, {"title": item.title})
    db.commit()
