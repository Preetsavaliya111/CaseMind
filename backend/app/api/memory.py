from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
from app.db.database import get_db
from app.models.user import User
from app.schemas.memory import MemoryItemCreate, MemoryItemListResponse, MemoryItemResponse, MemoryItemUpdate
from app.services.memory_service import archive_memory_item, create_memory_item, get_memory_item, list_memory_items, update_memory_item, verify_memory_item


router = APIRouter()
memory_reader = require_permission("knowledge.read_internal")
memory_contributor = require_permission("knowledge.create")
memory_editor = require_permission("knowledge.edit")
memory_manager = require_permission("knowledge.publish")
memory_archiver = require_permission("knowledge.archive")


@router.get("", response_model=MemoryItemListResponse)
def read_memory_items(search: str | None = Query(default=None, max_length=200), memory_type: str | None = None, verification_state: str | None = None, page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=100), current_user: User = Depends(memory_reader), db: Session = Depends(get_db)):
    return list_memory_items(db, current_user, search=search, memory_type=memory_type, verification_state=verification_state, page=page, page_size=page_size)


@router.post("", response_model=MemoryItemResponse, status_code=status.HTTP_201_CREATED)
def create(data: MemoryItemCreate, current_user: User = Depends(memory_contributor), db: Session = Depends(get_db)):
    return create_memory_item(db, current_user, data)


@router.get("/{memory_item_id}", response_model=MemoryItemResponse)
def read(memory_item_id: UUID, current_user: User = Depends(memory_reader), db: Session = Depends(get_db)):
    return get_memory_item(db, current_user, memory_item_id)


@router.patch("/{memory_item_id}", response_model=MemoryItemResponse)
def update(memory_item_id: UUID, data: MemoryItemUpdate, current_user: User = Depends(memory_editor), db: Session = Depends(get_db)):
    return update_memory_item(db, current_user, memory_item_id, data)


@router.post("/{memory_item_id}/verify", response_model=MemoryItemResponse)
def verify(memory_item_id: UUID, current_user: User = Depends(memory_manager), db: Session = Depends(get_db)):
    return verify_memory_item(db, current_user, memory_item_id)


@router.delete("/{memory_item_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive(memory_item_id: UUID, current_user: User = Depends(memory_archiver), db: Session = Depends(get_db)):
    archive_memory_item(db, current_user, memory_item_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
