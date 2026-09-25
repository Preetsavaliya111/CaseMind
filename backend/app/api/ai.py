from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import require_permission
from app.db.database import get_db
from app.models.document import Document, DocumentChunk
from app.models.memory import MemoryItem
from app.models.knowledge import KnowledgeArticle
from app.models.user import User
from app.schemas.ai import AIFeedbackRequest, AIFeedbackResponse, AIQueryRequest, AIQueryResponse, AIStatusResponse
from app.services.rag_service import answer_question, record_feedback
from app.services.authorization_service import get_permission_codes
from app.services.content_access_service import apply_content_scope


router = APIRouter()


@router.get("/status", response_model=AIStatusResponse)
def read_status(current_user: User = Depends(require_permission("ai.use")), db: Session = Depends(get_db)):
    permissions = set(get_permission_codes(db, current_user))
    documents = apply_content_scope(db.query(Document), db, current_user, Document, Document.uploaded_by_id) if "document.read" in permissions else db.query(Document).filter(False)
    indexed_documents = documents.filter(Document.status == "indexed").count()
    document_ids = [row[0] for row in documents.with_entities(Document.id).all()]
    document_chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id.in_(document_ids)).count() if document_ids else 0
    memories = apply_content_scope(db.query(MemoryItem), db, current_user, MemoryItem, MemoryItem.created_by_id) if "knowledge.read_internal" in permissions else db.query(MemoryItem).filter(False)
    verified_memory_items = memories.filter(MemoryItem.verification_state == "verified").count()
    articles = apply_content_scope(db.query(KnowledgeArticle), db, current_user, KnowledgeArticle, KnowledgeArticle.author_id, allow_public=True)
    if "knowledge.read_internal" not in permissions:
        articles = articles.filter(KnowledgeArticle.visibility == "public")
    published_articles = articles.filter(KnowledgeArticle.state == "published").count()
    return {
        "configured": bool(settings.GROQ_API_KEY),
        "model": settings.GROQ_CHAT_MODEL if settings.GROQ_API_KEY else None,
        "indexed_documents": indexed_documents,
        "verified_memory_items": verified_memory_items,
        "available_evidence": document_chunks + verified_memory_items + published_articles,
    }


@router.post("/query", response_model=AIQueryResponse)
def query(data: AIQueryRequest, current_user: User = Depends(require_permission("ai.use")), db: Session = Depends(get_db)):
    return answer_question(db, current_user, data.question)


@router.post("/interactions/{interaction_id}/feedback", response_model=AIFeedbackResponse)
def feedback(interaction_id: UUID, data: AIFeedbackRequest, current_user: User = Depends(require_permission("ai.use")), db: Session = Depends(get_db)):
    interaction = record_feedback(db, current_user, interaction_id, data.rating, data.note)
    return {"interaction_id": interaction.id, "rating": interaction.feedback}
