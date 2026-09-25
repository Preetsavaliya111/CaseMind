from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.case import SupportCase
from app.models.document import Document
from app.models.knowledge import KnowledgeArticle
from app.models.memory import MemoryItem
from app.models.user import User
from app.services.authorization_service import get_permission_codes
from app.services.ticket_service import authorized_case_query
from app.services.content_access_service import apply_content_scope


OPEN_STATES = {"new", "assigned", "in_progress", "waiting_customer", "waiting_engineering", "reopened"}


def get_overview(db: Session, current_user: User) -> dict:
    organization_id = current_user.organization_id
    permissions = set(get_permission_codes(db, current_user))
    cases = authorized_case_query(db, current_user).all()
    now = datetime.now(timezone.utc)
    today = now.date()
    resolved = [case for case in cases if case.resolved_at]
    durations = []
    for case in resolved:
        created_at = case.created_at
        resolved_at = case.resolved_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        if resolved_at.tzinfo is None:
            resolved_at = resolved_at.replace(tzinfo=timezone.utc)
        durations.append((resolved_at - created_at).total_seconds() / 3600)

    trends = []
    running_open = 0
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        created_count = sum(1 for case in cases if case.created_at.date() == day)
        resolved_count = sum(1 for case in resolved if case.resolved_at.date() == day)
        running_open = sum(1 for case in cases if case.created_at.date() <= day and (case.resolved_at is None or case.resolved_at.date() > day))
        trends.append({"date": day.isoformat(), "created": created_count, "resolved": resolved_count, "open": running_open})

    attention = sorted(
        [case for case in cases if case.status in OPEN_STATES and case.priority in {"critical", "high"}],
        key=lambda case: (case.priority != "critical", case.updated_at),
    )[:5]
    documents = apply_content_scope(db.query(Document), db, current_user, Document, Document.uploaded_by_id).all() if "document.read" in permissions else []
    can_read_internal_knowledge = "knowledge.read_internal" in permissions
    memories = apply_content_scope(db.query(MemoryItem), db, current_user, MemoryItem, MemoryItem.created_by_id) if can_read_internal_knowledge else None
    articles = apply_content_scope(db.query(KnowledgeArticle), db, current_user, KnowledgeArticle, KnowledgeArticle.author_id, allow_public=True)
    return {
        "total_cases": len(cases),
        "open_cases": sum(1 for case in cases if case.status in OPEN_STATES),
        "resolved_today": sum(1 for case in resolved if case.resolved_at.date() == today),
        "average_resolution_hours": round(sum(durations) / len(durations), 1) if durations else None,
        "critical_cases": sum(1 for case in cases if case.status in OPEN_STATES and case.priority == "critical"),
        "verified_memory": memories.filter(MemoryItem.verification_state == "verified").count() if memories is not None else 0,
        "draft_memory": memories.filter(MemoryItem.verification_state == "draft").count() if memories is not None else 0,
        "published_knowledge": articles.filter(KnowledgeArticle.state == "published").count(),
        "indexed_documents": sum(1 for document in documents if document.status == "indexed"),
        "documents_pending": sum(1 for document in documents if document.status in {"uploaded", "processing", "ready_for_indexing"}),
        "documents_failed": sum(1 for document in documents if document.status == "failed"),
        "trends": trends,
        "attention_cases": [{"id": str(case.id), "case_number": case.case_number, "subject": case.subject, "priority": case.priority, "status": case.status, "updated_at": case.updated_at.isoformat()} for case in attention],
    }
