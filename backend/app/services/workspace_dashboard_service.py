from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.ai import AIInteraction
from app.models.audit import AuditEvent
from app.models.case import SupportCase
from app.models.document import Document
from app.models.invitation import UserInvitation
from app.models.knowledge import KnowledgeArticle
from app.models.memory import MemoryItem
from app.models.organization_unit import Team, TeamMember
from app.models.user import User
from app.services.authorization_service import default_workspace, get_role_slugs
from app.services.content_access_service import apply_content_scope
from app.services.invitation_service import invitation_status
from app.services.ticket_service import authorized_case_query


OPEN_STATES = ["new", "assigned", "in_progress", "waiting_customer", "waiting_engineering", "reopened"]


def _metric(key: str, label: str, value: int, tone: str = "default", locator: str | None = None) -> dict:
    return {"key": key, "label": label, "value": value, "tone": tone, "locator": locator}


def get_workspace_dashboard(db: Session, user: User) -> dict:
    roles = get_role_slugs(db, user)
    role = next((item for item in ["super_admin", "org_admin", "support_manager", "team_lead", "senior_agent", "support_agent", "knowledge_manager", "ai_manager", "customer"] if item in roles), "customer")
    workspace = default_workspace(roles)
    cases = authorized_case_query(db, user).all()
    open_cases = [case for case in cases if case.status in OPEN_STATES]
    breached = [case for case in open_cases if case.sla_state == "breached"]
    at_risk = [case for case in open_cases if case.sla_state == "at_risk"]

    if role == "customer":
        metrics = [
            _metric("open", "Open Cases", len(open_cases), locator="/tickets"),
            _metric("waiting", "Waiting for support", sum(1 for case in open_cases if case.status not in {"waiting_customer"}), "warning", "/tickets"),
            _metric("resolved", "Resolved Cases", sum(1 for case in cases if case.status in {"resolved", "closed"}), "success", "/tickets"),
            _metric("knowledge", "Published answers", db.query(KnowledgeArticle).filter(KnowledgeArticle.organization_id == user.organization_id, KnowledgeArticle.state == "published", KnowledgeArticle.archived_at.is_(None)).count(), locator="/knowledge"),
        ]
        return {"workspace": workspace, "role": role, "title": "Your support portal", "description": "Track your requests and find verified answers.", "metrics": metrics, "priorities": ["Review updates from support", "Add context to Cases waiting on you", "Search published Knowledge before creating a new Case"]}

    if role in {"support_agent", "senior_agent"}:
        metrics = [
            _metric("assigned", "Assigned to me", sum(1 for case in open_cases if case.assignee_id == user.id), locator="/tickets"),
            _metric("team", "Team queue", len(open_cases), locator="/tickets"),
            _metric("risk", "SLA at risk", len(at_risk), "warning", "/sla"),
            _metric("breached", "SLA breached", len(breached), "critical", "/sla"),
        ]
        title = "Senior agent workspace" if role == "senior_agent" else "Agent workspace"
        return {"workspace": workspace, "role": role, "title": title, "description": "Prioritize assigned work, SLA risk, and evidence-backed resolution.", "metrics": metrics, "priorities": ["Respond to breached and at-risk Cases first", "Review unassigned team work", "Capture reusable resolution evidence"]}

    if role == "team_lead":
        team_ids = [row[0] for row in db.query(TeamMember.team_id).filter(TeamMember.user_id == user.id).all()]
        metrics = [
            _metric("team_open", "Team open Cases", len(open_cases), locator="/tickets"),
            _metric("unassigned", "Unassigned", sum(1 for case in open_cases if case.assignee_id is None), "warning", "/tickets"),
            _metric("escalated", "Escalated", sum(1 for case in open_cases if case.escalation_level > 0), "critical", "/sla"),
            _metric("members", "Active members", db.query(TeamMember.user_id).filter(TeamMember.team_id.in_(team_ids)).distinct().count() if team_ids else 0, locator="/teams"),
        ]
        return {"workspace": workspace, "role": role, "title": "Team operations", "description": "Balance team workload and intervene before SLA impact.", "metrics": metrics, "priorities": ["Assign unowned Cases", "Review escalations with specialists", "Balance workload across active members"]}

    if role == "support_manager":
        metrics = [
            _metric("open", "Organization open", len(open_cases), locator="/tickets"),
            _metric("breached", "SLA breached", len(breached), "critical", "/sla"),
            _metric("escalated", "Escalated Cases", sum(1 for case in open_cases if case.escalation_level > 0), "warning", "/sla"),
            _metric("teams", "Active teams", db.query(Team).filter(Team.organization_id == user.organization_id, Team.is_active.is_(True)).count(), locator="/teams"),
        ]
        return {"workspace": workspace, "role": role, "title": "Support management", "description": "Organization-wide service health, risk, and capacity.", "metrics": metrics, "priorities": ["Review SLA breaches and escalations", "Inspect unassigned workload", "Verify Knowledge coverage for recurring issues"]}

    if role == "knowledge_manager":
        article_query = apply_content_scope(db.query(KnowledgeArticle), db, user, KnowledgeArticle, KnowledgeArticle.author_id, allow_public=True)
        memory_query = apply_content_scope(db.query(MemoryItem), db, user, MemoryItem, MemoryItem.created_by_id)
        metrics = [
            _metric("drafts", "Article drafts", article_query.filter(KnowledgeArticle.state == "draft").count(), "warning", "/knowledge"),
            _metric("published", "Published articles", article_query.filter(KnowledgeArticle.state == "published").count(), "success", "/knowledge"),
            _metric("memory_drafts", "Memory awaiting review", memory_query.filter(MemoryItem.verification_state == "draft").count(), "warning", "/memory"),
            _metric("verified", "Verified Memory", memory_query.filter(MemoryItem.verification_state == "verified").count(), locator="/memory"),
        ]
        return {"workspace": workspace, "role": role, "title": "Knowledge studio", "description": "Curate trusted organizational knowledge and close coverage gaps.", "metrics": metrics, "priorities": ["Review draft Memory and articles", "Publish customer-safe answers", "Refresh stale runbooks and evidence"]}

    if role == "ai_manager":
        documents = apply_content_scope(db.query(Document), db, user, Document, Document.uploaded_by_id)
        interactions = db.query(AIInteraction).filter(AIInteraction.organization_id == user.organization_id)
        metrics = [
            _metric("indexed", "Indexed documents", documents.filter(Document.status == "indexed").count(), "success", "/documents"),
            _metric("pending", "Pending ingestion", documents.filter(Document.status.in_(["uploaded", "processing", "ready_for_indexing"])).count(), "warning", "/documents"),
            _metric("failed", "Failed ingestion", documents.filter(Document.status == "failed").count(), "critical", "/documents"),
            _metric("feedback", "AI feedback events", interactions.filter(AIInteraction.feedback.is_not(None)).count(), locator="/admin/models"),
        ]
        return {"workspace": workspace, "role": role, "title": "AI control center", "description": "Monitor ingestion, retrieval readiness, and human feedback.", "metrics": metrics, "priorities": ["Resolve failed ingestion jobs", "Inspect low-quality feedback", "Run retrieval and citation evaluations"]}

    pending_invites = sum(1 for invite in db.query(UserInvitation).filter(UserInvitation.organization_id == user.organization_id).all() if invitation_status(invite) == "pending")
    metrics = [
        _metric("users", "Active users", db.query(User).filter(User.organization_id == user.organization_id, User.is_active.is_(True)).count(), locator="/admin/users"),
        _metric("invites", "Pending invitations", pending_invites, "warning", "/admin/users"),
        _metric("teams", "Active teams", db.query(Team).filter(Team.organization_id == user.organization_id, Team.is_active.is_(True)).count(), locator="/teams"),
        _metric("audit", "Audit events today", db.query(AuditEvent).filter(AuditEvent.organization_id == user.organization_id, AuditEvent.created_at >= datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)).count(), locator="/admin/audit"),
    ]
    return {"workspace": workspace, "role": role, "title": "Organization administration", "description": "Manage access, structure, security, and platform readiness.", "metrics": metrics, "priorities": ["Review pending invitations and access", "Monitor audit and security activity", "Confirm teams and SLA policies are current"]}
