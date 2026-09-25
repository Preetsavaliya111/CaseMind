from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class AIStatusResponse(BaseModel):
    configured: bool
    model: str | None
    indexed_documents: int
    verified_memory_items: int
    available_evidence: int


class AIQueryRequest(BaseModel):
    question: str = Field(min_length=3, max_length=4000)


class AICitation(BaseModel):
    key: str
    source_type: Literal["memory", "case", "document", "knowledge"]
    source_id: str
    title: str
    excerpt: str
    relevance_score: float = Field(ge=0, le=1)
    locator: str


class AIQueryResponse(BaseModel):
    interaction_id: UUID
    answer: str
    citations: list[AICitation]
    model: str


class AIFeedbackRequest(BaseModel):
    rating: Literal["helpful", "not_helpful"]
    note: str | None = Field(default=None, max_length=1000)


class AIFeedbackResponse(BaseModel):
    interaction_id: UUID
    rating: Literal["helpful", "not_helpful"]
