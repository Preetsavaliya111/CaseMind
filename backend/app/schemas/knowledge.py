from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


ArticleState = Literal["draft", "published", "archived"]


class KnowledgeArticleCreate(BaseModel):
    title: str = Field(min_length=5, max_length=220)
    summary: str = Field(min_length=20, max_length=2000)
    content: str = Field(min_length=30, max_length=100_000)
    category: str = Field(min_length=2, max_length=80)
    tags: list[str] = Field(default_factory=list, max_length=30)


class KnowledgeArticleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=5, max_length=220)
    summary: str | None = Field(default=None, min_length=20, max_length=2000)
    content: str | None = Field(default=None, min_length=30, max_length=100_000)
    category: str | None = Field(default=None, min_length=2, max_length=80)
    tags: list[str] | None = Field(default=None, max_length=30)


class KnowledgeArticleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    team_id: UUID | None
    department_id: UUID | None
    visibility: str
    title: str
    summary: str
    content: str
    category: str
    tags: list[str]
    state: ArticleState
    version: int
    author_name: str
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None


class KnowledgeArticleListResponse(BaseModel):
    items: list[KnowledgeArticleResponse]
    total: int
    page: int
    page_size: int
    pages: int
