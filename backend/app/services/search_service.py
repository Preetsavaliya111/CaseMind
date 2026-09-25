from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.case import SupportCase
from app.models.document import Document
from app.models.knowledge import KnowledgeArticle
from app.models.memory import MemoryItem
from app.models.user import User
from app.services.authorization_service import get_permission_codes
from app.services.ticket_service import authorized_case_query
from app.services.content_access_service import apply_content_scope


def global_search(db: Session, current_user: User, query: str, limit_per_type: int = 5) -> list[dict]:
    pattern = f"%{query.strip()}%"
    results: list[dict] = []
    organization_id = current_user.organization_id
    permissions = set(get_permission_codes(db, current_user))

    cases = authorized_case_query(db, current_user).filter(
        or_(SupportCase.case_number.ilike(pattern), SupportCase.subject.ilike(pattern), SupportCase.description.ilike(pattern)),
    ).order_by(SupportCase.updated_at.desc()).limit(limit_per_type).all()
    results.extend({"type": "case", "id": str(item.id), "title": f"{item.case_number}: {item.subject}", "description": item.description[:180], "locator": f"/tickets/{item.id}"} for item in cases)

    if "knowledge.read_internal" in permissions:
        memory_query = apply_content_scope(db.query(MemoryItem), db, current_user, MemoryItem, MemoryItem.created_by_id)
        memories = memory_query.filter(
            or_(MemoryItem.title.ilike(pattern), MemoryItem.summary.ilike(pattern), MemoryItem.issue_pattern.ilike(pattern), MemoryItem.root_cause.ilike(pattern)),
        ).order_by(MemoryItem.updated_at.desc()).limit(limit_per_type).all()
        results.extend({"type": "memory", "id": str(item.id), "title": item.title, "description": item.summary[:180], "locator": f"/memory?item={item.id}"} for item in memories)

    article_query = apply_content_scope(db.query(KnowledgeArticle), db, current_user, KnowledgeArticle, KnowledgeArticle.author_id, allow_public=True).filter(
        or_(KnowledgeArticle.title.ilike(pattern), KnowledgeArticle.summary.ilike(pattern), KnowledgeArticle.content.ilike(pattern)),
    )
    if "knowledge.read_internal" not in permissions:
        article_query = article_query.filter(KnowledgeArticle.state == "published")
    articles = article_query.order_by(KnowledgeArticle.updated_at.desc()).limit(limit_per_type).all()
    results.extend({"type": "knowledge", "id": str(item.id), "title": item.title, "description": item.summary[:180], "locator": f"/knowledge?article={item.id}"} for item in articles)

    if "document.read" in permissions:
        document_query = apply_content_scope(db.query(Document), db, current_user, Document, Document.uploaded_by_id)
        documents = document_query.filter(
            Document.original_filename.ilike(pattern),
        ).order_by(Document.updated_at.desc()).limit(limit_per_type).all()
        results.extend({"type": "document", "id": str(item.id), "title": item.original_filename, "description": f"{item.status.replace('_', ' ')} · {item.chunk_count} chunks", "locator": f"/documents?document={item.id}"} for item in documents)
    return results
