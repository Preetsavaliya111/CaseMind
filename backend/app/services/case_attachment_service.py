import hashlib
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.case import CaseAttachment
from app.models.user import User
from app.services.audit_service import record_audit
from app.services.authorization_service import has_permission
from app.services.ticket_service import get_case


ALLOWED_TYPES = {
    ".pdf": {"application/pdf", "application/octet-stream"},
    ".txt": {"text/plain", "application/octet-stream"},
    ".md": {"text/markdown", "text/plain", "application/octet-stream"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip", "application/octet-stream"},
    ".png": {"image/png", "application/octet-stream"},
    ".jpg": {"image/jpeg", "application/octet-stream"},
    ".jpeg": {"image/jpeg", "application/octet-stream"},
}


def _target(organization_id: UUID, case_id: UUID, attachment_id: UUID, extension: str) -> Path:
    base = (Path(settings.DOCUMENT_STORAGE_PATH).expanduser().resolve() / "case-attachments").resolve()
    target = (base / str(organization_id) / str(case_id) / f"{attachment_id}{extension}").resolve()
    try:
        target.relative_to(base)
    except ValueError as exc:
        raise RuntimeError("Invalid Case attachment storage path") from exc
    target.parent.mkdir(parents=True, exist_ok=True)
    return target


def _validate_content(extension: str, content: bytes) -> None:
    signatures = {".pdf": b"%PDF-", ".png": b"\x89PNG\r\n\x1a\n", ".jpg": b"\xff\xd8\xff", ".jpeg": b"\xff\xd8\xff"}
    signature = signatures.get(extension)
    if signature and not content.startswith(signature):
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="File content does not match its extension")
    if extension in {".txt", ".md"}:
        try:
            content.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Text attachments must use UTF-8 encoding") from exc


async def create_attachment(db: Session, current_user: User, case_id: UUID, upload: UploadFile) -> CaseAttachment:
    case = get_case(db, current_user, case_id)
    filename = Path(upload.filename or "").name
    extension = Path(filename).suffix.lower()
    media_type = (upload.content_type or "application/octet-stream").lower()
    if not filename or extension not in ALLOWED_TYPES or media_type not in ALLOWED_TYPES[extension]:
        raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Supported attachments are PDF, TXT, Markdown, DOCX, PNG, and JPEG")
    content = bytearray()
    while chunk := await upload.read(1024 * 1024):
        content.extend(chunk)
        if len(content) > settings.MAX_UPLOAD_BYTES:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=f"Attachments cannot exceed {settings.MAX_UPLOAD_BYTES // (1024 * 1024)} MB")
    if not content:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Attachment is empty")
    _validate_content(extension, bytes(content))
    attachment = CaseAttachment(
        organization_id=current_user.organization_id,
        case_id=case.id,
        uploaded_by_id=current_user.id,
        original_filename=filename[:255],
        media_type=media_type,
        size_bytes=len(content),
        sha256=hashlib.sha256(content).hexdigest(),
        storage_key="pending",
    )
    db.add(attachment)
    db.flush()
    target = _target(current_user.organization_id, case.id, attachment.id, extension)
    target.write_bytes(content)
    attachment.storage_key = str(target)
    record_audit(db, current_user, "case.attachment_uploaded", "case", case.id, {"attachment_id": str(attachment.id), "filename": attachment.original_filename})
    db.commit()
    db.refresh(attachment)
    return attachment


def get_attachment(db: Session, current_user: User, case_id: UUID, attachment_id: UUID) -> CaseAttachment:
    get_case(db, current_user, case_id)
    attachment = db.query(CaseAttachment).filter(CaseAttachment.id == attachment_id, CaseAttachment.case_id == case_id, CaseAttachment.organization_id == current_user.organization_id).first()
    if attachment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Attachment not found")
    return attachment


def delete_attachment(db: Session, current_user: User, case_id: UUID, attachment_id: UUID) -> None:
    attachment = get_attachment(db, current_user, case_id, attachment_id)
    if attachment.uploaded_by_id != current_user.id and not has_permission(db, current_user, "ticket.delete"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the uploader or a Case administrator can remove this attachment")
    path = Path(attachment.storage_key)
    record_audit(db, current_user, "case.attachment_deleted", "case", case_id, {"attachment_id": str(attachment.id), "filename": attachment.original_filename})
    db.delete(attachment)
    db.commit()
    try:
        path.unlink(missing_ok=True)
    except OSError:
        pass
