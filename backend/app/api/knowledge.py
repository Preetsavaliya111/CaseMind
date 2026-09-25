from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_permission
from app.db.database import get_db
from app.models.user import User
from app.schemas.knowledge import KnowledgeArticleCreate, KnowledgeArticleListResponse, KnowledgeArticleResponse, KnowledgeArticleUpdate
from app.services.knowledge_service import archive_article, create_article, get_article, list_articles, publish_article, update_article


router = APIRouter()
reader = require_permission("knowledge.read_public")
contributor = require_permission("knowledge.create")
editor = require_permission("knowledge.edit")
publisher = require_permission("knowledge.publish")
archiver = require_permission("knowledge.archive")


@router.get("", response_model=KnowledgeArticleListResponse)
def read_articles(search: str | None = Query(default=None, max_length=200), state: str | None = None, category: str | None = None, page: int = Query(default=1, ge=1), page_size: int = Query(default=24, ge=1, le=100), current_user: User = Depends(reader), db: Session = Depends(get_db)):
    return list_articles(db, current_user, search=search, state=state, category=category, page=page, page_size=page_size)


@router.post("", response_model=KnowledgeArticleResponse, status_code=status.HTTP_201_CREATED)
def create(data: KnowledgeArticleCreate, current_user: User = Depends(contributor), db: Session = Depends(get_db)):
    return create_article(db, current_user, data)


@router.get("/{article_id}", response_model=KnowledgeArticleResponse)
def read(article_id: UUID, current_user: User = Depends(reader), db: Session = Depends(get_db)):
    return get_article(db, current_user, article_id)


@router.patch("/{article_id}", response_model=KnowledgeArticleResponse)
def update(article_id: UUID, data: KnowledgeArticleUpdate, current_user: User = Depends(editor), db: Session = Depends(get_db)):
    return update_article(db, current_user, article_id, data)


@router.post("/{article_id}/publish", response_model=KnowledgeArticleResponse)
def publish(article_id: UUID, current_user: User = Depends(publisher), db: Session = Depends(get_db)):
    return publish_article(db, current_user, article_id)


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def archive(article_id: UUID, current_user: User = Depends(archiver), db: Session = Depends(get_db)):
    archive_article(db, current_user, article_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
