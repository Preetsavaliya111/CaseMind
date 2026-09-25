import math
from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.knowledge import KnowledgeArticle
from app.models.user import User
from app.schemas.knowledge import KnowledgeArticleCreate, KnowledgeArticleUpdate
from app.services.content_access_service import apply_content_scope
from app.services.organization_unit_service import user_department_ids, user_team_ids
from app.services.audit_service import record_audit


def _query(db: Session, current_user: User):
    query = db.query(KnowledgeArticle).options(joinedload(KnowledgeArticle.author))
    return apply_content_scope(query, db, current_user, KnowledgeArticle, KnowledgeArticle.author_id, allow_public=True)


def list_articles(db: Session, current_user: User, *, search: str | None, state: str | None, category: str | None, page: int, page_size: int) -> dict:
    query = _query(db, current_user)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(or_(KnowledgeArticle.title.ilike(pattern), KnowledgeArticle.summary.ilike(pattern), KnowledgeArticle.content.ilike(pattern)))
    if state:
        query = query.filter(KnowledgeArticle.state == state)
    if category:
        query = query.filter(KnowledgeArticle.category == category)
    total = query.count()
    items = query.order_by(KnowledgeArticle.updated_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": math.ceil(total / page_size) if total else 0}


def get_article(db: Session, current_user: User, article_id: UUID) -> KnowledgeArticle:
    article = _query(db, current_user).filter(KnowledgeArticle.id == article_id).first()
    if article is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge article not found")
    return article


def create_article(db: Session, user: User, data: KnowledgeArticleCreate) -> KnowledgeArticle:
    team_ids = user_team_ids(db, user)
    department_ids = user_department_ids(db, user)
    article = KnowledgeArticle(
        organization_id=user.organization_id,
        author_id=user.id,
        team_id=team_ids[0] if team_ids else None,
        department_id=department_ids[0] if department_ids else None,
        visibility="team" if team_ids else "organization",
        **data.model_dump(),
    )
    db.add(article)
    db.flush()
    record_audit(db, user, "knowledge.created", "knowledge_article", article.id, {"title": article.title})
    db.commit()
    return get_article(db, user, article.id)


def update_article(db: Session, user: User, article_id: UUID, data: KnowledgeArticleUpdate) -> KnowledgeArticle:
    article = get_article(db, user, article_id)
    changes = data.model_dump(exclude_unset=True)
    if changes:
        for field, value in changes.items():
            setattr(article, field, value)
        article.version += 1
        if article.state == "published":
            article.state = "draft"
            article.published_at = None
            article.visibility = "team" if article.team_id else "organization"
        db.commit()
    return get_article(db, user, article.id)


def publish_article(db: Session, user: User, article_id: UUID) -> KnowledgeArticle:
    article = get_article(db, user, article_id)
    article.state = "published"
    article.visibility = "public"
    article.published_at = datetime.now(timezone.utc)
    record_audit(db, user, "knowledge.published", "knowledge_article", article.id, {"title": article.title, "version": article.version})
    db.commit()
    return get_article(db, user, article.id)


def archive_article(db: Session, user: User, article_id: UUID) -> None:
    article = get_article(db, user, article_id)
    article.state = "archived"
    article.archived_at = datetime.now(timezone.utc)
    record_audit(db, user, "knowledge.archived", "knowledge_article", article.id, {"title": article.title})
    db.commit()
