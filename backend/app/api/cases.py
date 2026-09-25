from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_permission
from app.db.database import get_db
from app.models.user import User
from app.schemas.ticket import CaseAssigneeResponse, CaseAttachmentResponse, CaseCommentCreate, CaseCreate, CaseListResponse, CaseResponse, CaseStatusUpdate, CaseUpdate
from app.services.ticket_service import add_case_comment, archive_case, change_case_status, create_case, get_case, list_assignees, list_cases, present_case, update_case
from app.schemas.sla import EscalationCreate
from app.services.sla_service import escalate_case
from app.services.case_attachment_service import create_attachment, delete_attachment, get_attachment


router = APIRouter()
case_creator = require_permission("ticket.create")
case_replier = require_permission("ticket.reply")


@router.get("", response_model=CaseListResponse)
def read_cases(search: str | None = Query(default=None, max_length=200), case_status: str | None = Query(default=None, alias="status"), priority: str | None = None, page: int = Query(default=1, ge=1), page_size: int = Query(default=20, ge=1, le=100), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return list_cases(db, current_user, search=search, case_status=case_status, priority=priority, page=page, page_size=page_size)


@router.post("", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create(data: CaseCreate, current_user: User = Depends(case_creator), db: Session = Depends(get_db)):
    return present_case(db, current_user, create_case(db, current_user, data))


@router.get("/assignees", response_model=list[CaseAssigneeResponse])
def assignees(current_user: User = Depends(require_permission("ticket.assign")), db: Session = Depends(get_db)):
    return list_assignees(db, current_user.organization_id)


@router.get("/{case_id}", response_model=CaseResponse)
def read(case_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return present_case(db, current_user, get_case(db, current_user, case_id))


@router.patch("/{case_id}", response_model=CaseResponse)
def update(case_id: UUID, data: CaseUpdate, current_user: User = Depends(case_replier), db: Session = Depends(get_db)):
    return present_case(db, current_user, update_case(db, current_user, case_id, data))


@router.patch("/{case_id}/status", response_model=CaseResponse)
def update_status(case_id: UUID, data: CaseStatusUpdate, current_user: User = Depends(require_permission("ticket.change_status")), db: Session = Depends(get_db)):
    return present_case(db, current_user, change_case_status(db, current_user, case_id, data.status))


@router.post("/{case_id}/comments", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def add_comment(case_id: UUID, data: CaseCommentCreate, current_user: User = Depends(case_replier), db: Session = Depends(get_db)):
    return present_case(db, current_user, add_case_comment(db, current_user, case_id, data))


@router.post("/{case_id}/escalations", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def escalate(case_id: UUID, data: EscalationCreate, current_user: User = Depends(require_permission("ticket.escalate")), db: Session = Depends(get_db)):
    return present_case(db, current_user, escalate_case(db, current_user, case_id, data.reason))


@router.post("/{case_id}/attachments", response_model=CaseAttachmentResponse, status_code=status.HTTP_201_CREATED)
async def upload_attachment(case_id: UUID, file: UploadFile = File(...), current_user: User = Depends(case_replier), db: Session = Depends(get_db)):
    return await create_attachment(db, current_user, case_id, file)


@router.get("/{case_id}/attachments/{attachment_id}")
def download_attachment(case_id: UUID, attachment_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    attachment = get_attachment(db, current_user, case_id, attachment_id)
    return FileResponse(attachment.storage_key, media_type=attachment.media_type, filename=attachment.original_filename)


@router.delete("/{case_id}/attachments/{attachment_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_attachment(case_id: UUID, attachment_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    delete_attachment(db, current_user, case_id, attachment_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive(case_id: UUID, current_user: User = Depends(require_permission("ticket.delete")), db: Session = Depends(get_db)):
    archive_case(db, current_user, case_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
