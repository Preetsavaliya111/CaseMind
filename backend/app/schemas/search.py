from typing import Literal

from pydantic import BaseModel


class SearchResult(BaseModel):
    type: Literal["case", "memory", "knowledge", "document"]
    id: str
    title: str
    description: str
    locator: str


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
