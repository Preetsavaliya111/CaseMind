from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import require_permission
from app.db.database import get_db
from app.models.user import User
from app.schemas.document import DocumentDetailResponse, DocumentListResponse, DocumentResponse
from app.services.document_service import archive_document, create_document, get_document, list_documents, process_document


router = APIRouter()
document_reader = require_permission("document.read")
document_manager = require_permission("document.manage")


@router.get("", response_model=DocumentListResponse)
def read_documents(document_status: str | None = Query(default=None, alias="status"), page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=100), current_user: User = Depends(document_reader), db: Session = Depends(get_db)):
    return list_documents(db, current_user, page=page, page_size=page_size, document_status=document_status)


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...), current_user: User = Depends(document_manager), db: Session = Depends(get_db)):
    document = await create_document(db, current_user, file)
    if settings.PROCESS_DOCUMENTS_INLINE:
        process_document(document.id, db)
    else:
        background_tasks.add_task(process_document, document.id)
    return get_document(db, current_user, document.id)


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def read_document(document_id: UUID, current_user: User = Depends(document_reader), db: Session = Depends(get_db)):
    return get_document(db, current_user, document_id)


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
def reprocess_document(document_id: UUID, background_tasks: BackgroundTasks, current_user: User = Depends(document_manager), db: Session = Depends(get_db)):
    document = get_document(db, current_user, document_id)
    document.status = "uploaded"
    document.error_code = None
    document.error_message = None
    db.commit()
    if settings.PROCESS_DOCUMENTS_INLINE:
        process_document(document.id, db)
    else:
        background_tasks.add_task(process_document, document.id)
    return get_document(db, current_user, document.id)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: UUID, current_user: User = Depends(document_manager), db: Session = Depends(get_db)):
    archive_document(db, current_user, document_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
