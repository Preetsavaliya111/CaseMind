from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


DocumentStatus = Literal["uploaded", "processing", "ready_for_indexing", "indexed", "failed"]


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    team_id: UUID | None
    department_id: UUID | None
    visibility: str
    original_filename: str
    extension: str
    media_type: str
    size_bytes: int
    status: DocumentStatus
    chunk_count: int
    extracted_characters: int
    error_code: str | None
    error_message: str | None
    uploaded_by_name: str
    created_at: datetime
    updated_at: datetime
    indexed_at: datetime | None


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int
    page: int
    page_size: int
    pages: int


class DocumentChunkResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    chunk_index: int
    content: str
    char_start: int
    char_end: int
    token_estimate: int


class DocumentDetailResponse(DocumentResponse):
    chunks: list[DocumentChunkResponse] = Field(default_factory=list)
