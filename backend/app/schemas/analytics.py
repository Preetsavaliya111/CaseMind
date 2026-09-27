from pydantic import BaseModel


class TrendPoint(BaseModel):
    date: str
    created: int
    resolved: int
    open: int


class AttentionCase(BaseModel):
    id: str
    case_number: str
    subject: str
    priority: str
    status: str
    updated_at: str


class AnalyticsOverview(BaseModel):
    total_cases: int
    open_cases: int
    resolved_today: int
    average_resolution_hours: float | None
    critical_cases: int
    verified_memory: int
    draft_memory: int
    published_knowledge: int
    indexed_documents: int
    documents_pending: int
    documents_failed: int
    ai_questions_asked: int
    teammates_invited: int
    trends: list[TrendPoint]
    attention_cases: list[AttentionCase]
