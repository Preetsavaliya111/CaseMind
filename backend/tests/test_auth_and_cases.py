import os
import time
from uuid import UUID
from urllib.parse import parse_qs, urlparse

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-secret-key-with-at-least-32-characters")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.database import get_db
from app.core.config import settings
from app.services import rag_service
from app.services.authorization_service import has_permission
from app.services.authorization_service import assign_system_role
from app.models.user import User
from app.models.organization_unit import Department, Team, TeamMember, TicketAccess
from app.models.document import Document, DocumentChunk
from app.core.security import hash_password
from app.services.mfa_service import _code
from main import app


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def register_and_login(client: TestClient, email: str, organization: str) -> str:
    registered = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Admin",
            "email": email,
            "password": "StrongPass!123",
            "organization_name": organization,
            "department": "Support",
        },
    )
    assert registered.status_code == 201
    assert registered.json()["role"] == "admin"

    logged_in = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "StrongPass!123"},
    )
    assert logged_in.status_code == 200
    return logged_in.json()["access_token"]


def create_role_user(client: TestClient, *, organization_id: str, email: str, role_slug: str) -> str:
    db = TestingSession()
    try:
        user = User(
            organization_id=UUID(organization_id),
            name=f"{role_slug} user",
            email=email,
            hashed_password=hash_password("StrongPass!123"),
            role="viewer" if role_slug == "customer" else "agent",
            department="Support",
            is_active=True,
        )
        db.add(user)
        db.flush()
        assign_system_role(db, user, role_slug)
        db.commit()
    finally:
        db.close()
    login = client.post("/api/v1/auth/login", json={"email": email, "password": "StrongPass!123"})
    assert login.status_code == 200, login.text
    return login.json()["access_token"]


def test_registration_does_not_accept_caller_selected_role_or_tenant(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Test Admin",
            "email": "admin@example.com",
            "password": "StrongPass!123",
            "organization_name": "Example",
            "role": "viewer",
            "organization_id": "00000000-0000-0000-0000-000000000001",
        },
    )

    assert response.status_code == 422


def test_optional_mfa_requires_challenge_and_prevents_totp_replay(client: TestClient):
    token = register_and_login(client, "mfa-admin@example.com", "MFA Workspace")
    headers = {"Authorization": f"Bearer {token}"}
    setup = client.post("/api/v1/auth/mfa/setup", headers=headers, json={"current_password": "StrongPass!123"})
    assert setup.status_code == 200, setup.text
    secret = setup.json()["secret"]
    code = _code(secret, int(time.time()) // 30)
    enabled = client.post("/api/v1/auth/mfa/enable", headers=headers, json={"code": code})
    assert enabled.status_code == 200, enabled.text
    assert len(enabled.json()["recovery_codes"]) == 10

    login = client.post("/api/v1/auth/login", json={"email": "mfa-admin@example.com", "password": "StrongPass!123"})
    assert login.status_code == 200
    assert login.json()["mfa_required"] is True
    challenge = login.json()["challenge_token"]
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {challenge}"}).status_code == 401

    verified = client.post("/api/v1/auth/mfa/verify", json={"challenge_token": challenge, "code": code})
    assert verified.status_code == 200, verified.text
    assert "access_token" in verified.json()
    replay = client.post("/api/v1/auth/mfa/verify", json={"challenge_token": challenge, "code": code})
    assert replay.status_code == 401


def test_profile_and_password_change_revoke_older_sessions(client: TestClient):
    old_token = register_and_login(client, "account-admin@example.com", "Account Workspace")
    old_headers = {"Authorization": f"Bearer {old_token}"}
    updated = client.patch("/api/v1/auth/profile", headers=old_headers, json={"name": "Updated Administrator"})
    assert updated.status_code == 200, updated.text
    assert updated.json()["name"] == "Updated Administrator"

    changed = client.post(
        "/api/v1/auth/password",
        headers=old_headers,
        json={"current_password": "StrongPass!123", "new_password": "NewStrongPass!456"},
    )
    assert changed.status_code == 200, changed.text
    new_token = changed.json()["access_token"]
    assert client.get("/api/v1/auth/me", headers=old_headers).status_code == 401
    assert client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {new_token}"}).status_code == 200
    assert client.post("/api/v1/auth/login", json={"email": "account-admin@example.com", "password": "StrongPass!123"}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"email": "account-admin@example.com", "password": "NewStrongPass!456"}).status_code == 200


def test_password_recovery_is_one_time_revokes_sessions_and_is_tenant_scoped(client: TestClient):
    first_token = register_and_login(client, "reset-first@example.com", "Reset First")
    second_token = register_and_login(client, "reset-second@example.com", "Reset Second")
    first_headers = {"Authorization": f"Bearer {first_token}"}
    second_headers = {"Authorization": f"Bearer {second_token}"}
    first_user_id = client.get("/api/v1/auth/me", headers=first_headers).json()["id"]
    second_user_id = client.get("/api/v1/auth/me", headers=second_headers).json()["id"]

    assert client.post(f"/api/v1/admin/users/{second_user_id}/password-reset", headers=first_headers).status_code == 404
    issued = client.post(f"/api/v1/admin/users/{first_user_id}/password-reset", headers=first_headers)
    assert issued.status_code == 200, issued.text
    superseded_token = parse_qs(urlparse(issued.json()["reset_link"]).query)["token"][0]
    replacement = client.post(f"/api/v1/admin/users/{first_user_id}/password-reset", headers=first_headers)
    reset_token = parse_qs(urlparse(replacement.json()["reset_link"]).query)["token"][0]
    assert client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": superseded_token, "new_password": "ShouldNotApply!456"},
    ).status_code == 410

    confirmed = client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": reset_token, "new_password": "RecoveredPass!456"},
    )
    assert confirmed.status_code == 200, confirmed.text
    assert client.get("/api/v1/auth/me", headers=first_headers).status_code == 401
    assert client.post("/api/v1/auth/login", json={"email": "reset-first@example.com", "password": "StrongPass!123"}).status_code == 401
    assert client.post("/api/v1/auth/login", json={"email": "reset-first@example.com", "password": "RecoveredPass!456"}).status_code == 200
    assert client.post(
        "/api/v1/auth/password-reset/confirm",
        json={"token": reset_token, "new_password": "AnotherPass!789"},
    ).status_code == 410

    generic = client.post("/api/v1/auth/password-reset/request", json={"email": "missing@example.com"})
    assert generic.status_code == 200
    assert "active account exists" in generic.json()["message"]


def test_registration_builds_enterprise_authorization_context(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "name": "Authorization Admin",
            "email": "authorization@example.com",
            "password": "StrongPass!123",
            "organization_name": "Authorization Workspace",
            "department": "Support",
        },
    )
    assert response.status_code == 201, response.text
    payload = response.json()
    assert payload["roles"] == ["org_admin"]
    assert payload["default_workspace"] == "admin"
    assert payload["organization"]["name"] == "Authorization Workspace"
    assert "user.invite" in payload["permissions"]
    assert "ticket.view_all_org" in payload["permissions"]
    assert "platform.manage" not in payload["permissions"]

    db = TestingSession()
    try:
        user = db.query(User).filter(User.email == "authorization@example.com").one()
        assert has_permission(db, user, "settings.security") is True
        assert has_permission(db, user, "platform.manage") is False
    finally:
        db.close()


def test_case_lifecycle_is_scoped_to_authenticated_organization(client: TestClient):
    first_token = register_and_login(client, "first@example.com", "First")
    second_token = register_and_login(client, "second@example.com", "Second")
    first_headers = {"Authorization": f"Bearer {first_token}"}
    second_headers = {"Authorization": f"Bearer {second_token}"}

    created = client.post(
        "/api/v1/cases",
        headers=first_headers,
        json={
            "subject": "Certificate rotation login failure",
            "description": "Users cannot authenticate after the identity provider certificate rotation.",
            "priority": "high",
            "category": "security",
            "tags": ["SSO", "Certificate"],
        },
    )
    assert created.status_code == 201
    case_id = created.json()["id"]
    assert created.json()["sla_deadline"] is not None
    assert created.json()["sla_state"] == "healthy"

    policies = client.get("/api/v1/sla/policies", headers=first_headers)
    assert policies.status_code == 200
    assert {policy["priority"] for policy in policies.json()} == {"critical", "high", "medium", "low"}

    escalated = client.post(
        f"/api/v1/cases/{case_id}/escalations",
        headers=first_headers,
        json={"reason": "Identity access is blocked across the production organization."},
    )
    assert escalated.status_code == 201, escalated.text
    assert escalated.json()["escalation_level"] == 1
    assert escalated.json()["escalations"][0]["to_level"] == 1

    assert client.get(f"/api/v1/cases/{case_id}", headers=first_headers).status_code == 200
    assert client.get(f"/api/v1/cases/{case_id}", headers=second_headers).status_code == 404

    assignees = client.get("/api/v1/cases/assignees", headers=first_headers)
    assert assignees.status_code == 200
    assert [item["id"] for item in assignees.json()] == [created.json()["reporter_id"]]
    assert assignees.json()[0]["role"] == "Organization Admin"
    assert assignees.json()[0]["role_slug"] == "org_admin"

    edited = client.patch(
        f"/api/v1/cases/{case_id}",
        headers=first_headers,
        json={"subject": "Certificate rotation causes login failure", "assignee_id": created.json()["reporter_id"]},
    )
    assert edited.status_code == 200
    assert edited.json()["subject"] == "Certificate rotation causes login failure"
    assert edited.json()["assignee_name"] == "Test Admin"

    search = client.get("/api/v1/search", headers=first_headers, params={"q": "certificate"})
    assert search.status_code == 200
    assert any(item["id"] == case_id for item in search.json()["results"])
    other_search = client.get("/api/v1/search", headers=second_headers, params={"q": "certificate"})
    assert all(item["id"] != case_id for item in other_search.json()["results"])

    commented = client.post(
        f"/api/v1/cases/{case_id}/comments",
        headers=first_headers,
        json={"content": "Validated the metadata audience.", "is_internal": True},
    )
    assert commented.status_code == 201
    assert commented.json()["comments"][0]["is_internal"] is True
    assert commented.json()["first_responded_at"] is not None

    in_progress = client.patch(
        f"/api/v1/cases/{case_id}/status",
        headers=first_headers,
        json={"status": "in_progress"},
    )
    assert in_progress.status_code == 200
    overview = client.get("/api/v1/analytics/overview", headers=first_headers)
    assert overview.status_code == 200
    assert overview.json()["total_cases"] == 1
    assert overview.json()["open_cases"] == 1

    resolved = client.patch(
        f"/api/v1/cases/{case_id}/status",
        headers=first_headers,
        json={"status": "resolved"},
    )
    assert resolved.status_code == 200
    assert resolved.json()["resolved_at"] is not None

    assert client.delete(f"/api/v1/cases/{case_id}", headers=first_headers).status_code == 204
    assert client.get(f"/api/v1/cases/{case_id}", headers=first_headers).status_code == 404


def test_customer_case_access_is_owner_scoped_and_internal_notes_are_removed(client: TestClient):
    admin_token = register_and_login(client, "owner-admin@example.com", "Owner Scoped")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    admin_context = client.get("/api/v1/auth/me", headers=admin_headers).json()
    first_token = create_role_user(
        client,
        organization_id=admin_context["organization_id"],
        email="customer-one@example.com",
        role_slug="customer",
    )
    second_token = create_role_user(
        client,
        organization_id=admin_context["organization_id"],
        email="customer-two@example.com",
        role_slug="customer",
    )
    first_headers = {"Authorization": f"Bearer {first_token}"}
    second_headers = {"Authorization": f"Bearer {second_token}"}

    created = client.post(
        "/api/v1/cases",
        headers=first_headers,
        json={
            "subject": "Customer cannot access the portal",
            "description": "The customer receives an access denied message after signing into the portal.",
            "priority": "medium",
            "category": "account",
        },
    )
    assert created.status_code == 201, created.text
    case_id = created.json()["id"]
    assert client.get(f"/api/v1/cases/{case_id}", headers=second_headers).status_code == 404
    assert client.get("/api/v1/cases", headers=second_headers).json()["total"] == 0
    assert client.get("/api/v1/analytics/overview", headers=first_headers).json()["total_cases"] == 1
    second_overview = client.get("/api/v1/analytics/overview", headers=second_headers).json()
    assert second_overview["total_cases"] == 0
    assert second_overview["verified_memory"] == 0
    assert second_overview["indexed_documents"] == 0

    first_workspace = client.get("/api/v1/dashboard/workspace", headers=first_headers)
    second_workspace = client.get("/api/v1/dashboard/workspace", headers=second_headers)
    assert first_workspace.status_code == 200
    assert second_workspace.status_code == 200
    assert first_workspace.json()["role"] == "customer"
    assert first_workspace.json()["title"] == "Your support portal"
    first_metrics = {metric["key"]: metric["value"] for metric in first_workspace.json()["metrics"]}
    second_metrics = {metric["key"]: metric["value"] for metric in second_workspace.json()["metrics"]}
    assert first_metrics["open"] == 1
    assert second_metrics["open"] == 0

    uploaded = client.post(
        f"/api/v1/cases/{case_id}/attachments",
        headers=first_headers,
        files={"file": ("diagnostic.txt", b"Browser console output for support", "text/plain")},
    )
    assert uploaded.status_code == 201, uploaded.text
    attachment_id = uploaded.json()["id"]
    case_with_attachment = client.get(f"/api/v1/cases/{case_id}", headers=first_headers).json()
    assert case_with_attachment["attachments"][0]["original_filename"] == "diagnostic.txt"
    downloaded = client.get(f"/api/v1/cases/{case_id}/attachments/{attachment_id}", headers=first_headers)
    assert downloaded.status_code == 200
    assert downloaded.content == b"Browser console output for support"
    assert client.get(f"/api/v1/cases/{case_id}/attachments/{attachment_id}", headers=second_headers).status_code == 404
    assert client.delete(f"/api/v1/cases/{case_id}/attachments/{attachment_id}", headers=first_headers).status_code == 204
    assert client.get("/api/v1/cases/assignees", headers=first_headers).status_code == 403

    internal = client.post(
        f"/api/v1/cases/{case_id}/comments",
        headers=admin_headers,
        json={"content": "Internal investigation detail", "is_internal": True},
    )
    assert internal.status_code == 201
    customer_view = client.get(f"/api/v1/cases/{case_id}", headers=first_headers)
    assert customer_view.status_code == 200
    assert customer_view.json()["comments"] == []
    forbidden_internal = client.post(
        f"/api/v1/cases/{case_id}/comments",
        headers=first_headers,
        json={"content": "Trying to add an internal note", "is_internal": True},
    )
    assert forbidden_internal.status_code == 403


def test_agent_case_access_is_limited_to_team_or_explicit_grant(client: TestClient):
    admin_token = register_and_login(client, "scope-admin@example.com", "Scope Workspace")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    context = client.get("/api/v1/auth/me", headers=admin_headers).json()
    first_token = create_role_user(
        client,
        organization_id=context["organization_id"],
        email="team-agent@example.com",
        role_slug="support_agent",
    )
    second_token = create_role_user(
        client,
        organization_id=context["organization_id"],
        email="outside-agent@example.com",
        role_slug="support_agent",
    )
    first_headers = {"Authorization": f"Bearer {first_token}"}
    second_headers = {"Authorization": f"Bearer {second_token}"}

    created = client.post(
        "/api/v1/cases",
        headers=admin_headers,
        json={
            "subject": "Team-scoped payment processing failure",
            "description": "Payment processing requests fail for the support team's assigned gateway.",
            "priority": "high",
            "category": "billing",
        },
    )
    assert created.status_code == 201, created.text
    case_id = created.json()["id"]
    assert created.json()["team_id"] is not None

    db = TestingSession()
    try:
        team = db.query(Team).filter(Team.id == UUID(created.json()["team_id"])).one()
        first_user = db.query(User).filter(User.email == "team-agent@example.com").one()
        second_user = db.query(User).filter(User.email == "outside-agent@example.com").one()
        db.add(TeamMember(organization_id=team.organization_id, team_id=team.id, user_id=first_user.id))
        db.commit()
        second_user_id = second_user.id
        admin_user_id = db.query(User).filter(User.email == "scope-admin@example.com").one().id
    finally:
        db.close()

    assert client.get(f"/api/v1/cases/{case_id}", headers=first_headers).status_code == 200
    assert client.get(f"/api/v1/cases/{case_id}", headers=second_headers).status_code == 404

    db = TestingSession()
    try:
        db.add(TicketAccess(
            organization_id=UUID(context["organization_id"]),
            case_id=UUID(case_id),
            user_id=second_user_id,
            granted_by_id=admin_user_id,
            reason="Specialist assistance",
        ))
        db.commit()
    finally:
        db.close()
    assert client.get(f"/api/v1/cases/{case_id}", headers=second_headers).status_code == 200


def test_document_extraction_is_truthful_and_tenant_scoped(client: TestClient, tmp_path):
    settings.PROCESS_DOCUMENTS_INLINE = True
    settings.DOCUMENT_STORAGE_PATH = str(tmp_path)
    settings.GEMINI_API_KEY = None
    first_token = register_and_login(client, "docs-first@example.com", "Docs First")
    second_token = register_and_login(client, "docs-second@example.com", "Docs Second")
    first_headers = {"Authorization": f"Bearer {first_token}"}
    second_headers = {"Authorization": f"Bearer {second_token}"}

    uploaded = client.post(
        "/api/v1/documents",
        headers=first_headers,
        files={
            "file": (
                "sso-runbook.md",
                b"# SSO certificate rotation\n\nRefresh metadata, verify the audience URI, and test with a non-production account.",
                "text/markdown",
            )
        },
    )
    assert uploaded.status_code == 201, uploaded.text
    payload = uploaded.json()
    assert payload["status"] == "ready_for_indexing"
    assert payload["chunk_count"] == 1
    assert payload["indexed_at"] is None

    document_id = payload["id"]
    detail = client.get(f"/api/v1/documents/{document_id}", headers=first_headers)
    assert detail.status_code == 200
    assert "verify the audience URI" in detail.json()["chunks"][0]["content"]
    assert client.get(f"/api/v1/documents/{document_id}", headers=second_headers).status_code == 404


def test_document_upload_rejects_unsupported_files(client: TestClient, tmp_path):
    settings.PROCESS_DOCUMENTS_INLINE = True
    settings.DOCUMENT_STORAGE_PATH = str(tmp_path)
    token = register_and_login(client, "unsafe@example.com", "Unsafe Test")

    response = client.post(
        "/api/v1/documents",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("payload.exe", b"not executable", "application/octet-stream")},
    )
    assert response.status_code == 415


def test_memory_requires_tenant_owned_evidence_and_manager_verification(client: TestClient):
    first_token = register_and_login(client, "memory-first@example.com", "Memory First")
    second_token = register_and_login(client, "memory-second@example.com", "Memory Second")
    first_headers = {"Authorization": f"Bearer {first_token}"}
    second_headers = {"Authorization": f"Bearer {second_token}"}
    created_case = client.post(
        "/api/v1/cases",
        headers=first_headers,
        json={
            "subject": "SSO metadata remains stale after certificate rotation",
            "description": "Authentication fails because service-provider metadata still contains the previous identity-provider certificate.",
            "priority": "high",
            "category": "security",
        },
    )
    assert created_case.status_code == 201
    case_id = created_case.json()["id"]

    created_memory = client.post(
        "/api/v1/memory-items",
        headers=first_headers,
        json={
            "title": "Refresh SSO metadata after certificate rotation",
            "summary": "Cached service-provider metadata can retain the previous certificate after an identity-provider rotation.",
            "memory_type": "resolution",
            "issue_pattern": "SSO users receive signature or audience errors immediately after an identity-provider certificate rotation.",
            "root_cause": "The service-provider metadata cache was not refreshed after the certificate changed.",
            "resolution_steps": ["Refresh metadata", "Verify the audience URI", "Test a non-production account"],
            "tags": ["sso", "certificate"],
            "sources": [{"source_type": "case", "source_id": case_id}],
        },
    )
    assert created_memory.status_code == 201, created_memory.text
    memory_id = created_memory.json()["id"]
    assert created_memory.json()["verification_state"] == "draft"
    assert created_memory.json()["confidence"] is None
    assert client.get(f"/api/v1/memory-items/{memory_id}", headers=second_headers).status_code == 404

    verified = client.post(f"/api/v1/memory-items/{memory_id}/verify", headers=first_headers)
    assert verified.status_code == 200
    assert verified.json()["verification_state"] == "verified"
    assert verified.json()["verified_by_name"] == "Test Admin"

    invalid_source = client.post(
        "/api/v1/memory-items",
        headers=second_headers,
        json={
            "title": "Cross tenant source should fail",
            "summary": "This memory attempts to attach evidence that belongs to another organization.",
            "memory_type": "issue_pattern",
            "issue_pattern": "A cross-tenant source identifier was supplied and must be rejected by the service.",
            "sources": [{"source_type": "case", "source_id": case_id}],
        },
    )
    assert invalid_source.status_code == 422


def test_ai_status_and_query_are_truthful_without_provider(client: TestClient):
    settings.GROQ_API_KEY = None
    token = register_and_login(client, "ai-pending@example.com", "AI Pending")
    headers = {"Authorization": f"Bearer {token}"}

    provider_status = client.get("/api/v1/ai/status", headers=headers)
    assert provider_status.status_code == 200
    assert provider_status.json()["configured"] is False
    assert provider_status.json()["model"] is None

    response = client.post("/api/v1/ai/query", headers=headers, json={"question": "What should I do?"})
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"]


def test_ai_retrieval_never_crosses_organization_boundary(client: TestClient, monkeypatch):
    first_token = register_and_login(client, "ai-first@example.com", "AI First")
    second_token = register_and_login(client, "ai-second@example.com", "AI Second")
    first_headers = {"Authorization": f"Bearer {first_token}"}
    second_headers = {"Authorization": f"Bearer {second_token}"}

    first_case = client.post(
        "/api/v1/cases",
        headers=first_headers,
        json={"subject": "Nebula cache failure", "description": "Restart the Nebula cache after validating replicas.", "priority": "high", "category": "infrastructure"},
    )
    second_case = client.post(
        "/api/v1/cases",
        headers=second_headers,
        json={"subject": "Nebula private incident", "description": "SECRET-TENANT-TWO must never be retrieved.", "priority": "high", "category": "infrastructure"},
    )
    assert first_case.status_code == 201
    assert second_case.status_code == 201

    captured: dict[str, str] = {}

    class FakeProvider:
        def generate(self, *, instructions: str, input_text: str) -> str:
            captured["instructions"] = instructions
            captured["input"] = input_text
            return "Restart the cache after validating replicas. [S1]"

    monkeypatch.setattr(rag_service, "get_response_provider", lambda: FakeProvider())
    monkeypatch.setattr(rag_service, "get_embedding_provider", lambda: None)
    response = client.post("/api/v1/ai/query", headers=first_headers, json={"question": "How do I resolve the Nebula cache failure?"})

    assert response.status_code == 200, response.text
    assert response.json()["citations"]
    assert response.json()["interaction_id"]
    assert all(citation["source_id"] != second_case.json()["id"] for citation in response.json()["citations"])
    assert "SECRET-TENANT-TWO" not in captured["input"]

    interaction_id = response.json()["interaction_id"]
    feedback = client.post(f"/api/v1/ai/interactions/{interaction_id}/feedback", headers=first_headers, json={"rating": "helpful"})
    assert feedback.status_code == 200
    assert feedback.json()["rating"] == "helpful"
    assert client.post(f"/api/v1/ai/interactions/{interaction_id}/feedback", headers=second_headers, json={"rating": "not_helpful"}).status_code == 404


def test_ai_retrieval_filters_same_organization_documents_by_team(client: TestClient, monkeypatch):
    admin_token = register_and_login(client, "rag-scope-admin@example.com", "RAG Scope")
    admin_context = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {admin_token}"}).json()
    first_token = create_role_user(
        client,
        organization_id=admin_context["organization_id"],
        email="rag-alpha@example.com",
        role_slug="senior_agent",
    )
    create_role_user(
        client,
        organization_id=admin_context["organization_id"],
        email="rag-beta@example.com",
        role_slug="senior_agent",
    )

    db = TestingSession()
    try:
        organization_id = UUID(admin_context["organization_id"])
        department = db.query(Department).filter(Department.organization_id == organization_id).one()
        alpha_team = db.query(Team).filter(Team.organization_id == organization_id).one()
        beta_department = Department(organization_id=organization_id, name="Restricted Engineering")
        db.add(beta_department)
        db.flush()
        beta_team = Team(organization_id=organization_id, department_id=beta_department.id, name="Restricted Escalations")
        db.add(beta_team)
        db.flush()
        alpha_user = db.query(User).filter(User.email == "rag-alpha@example.com").one()
        beta_user = db.query(User).filter(User.email == "rag-beta@example.com").one()
        db.add(TeamMember(organization_id=organization_id, team_id=alpha_team.id, user_id=alpha_user.id))
        db.add(TeamMember(organization_id=organization_id, team_id=beta_team.id, user_id=beta_user.id))

        alpha_document = Document(
            organization_id=organization_id, uploaded_by_id=alpha_user.id, team_id=alpha_team.id,
            department_id=department.id, visibility="team", original_filename="alpha-runbook.md",
            extension=".md", media_type="text/markdown", size_bytes=30, sha256="a" * 64,
            storage_key="test-alpha", status="indexed", chunk_count=1, extracted_characters=50,
        )
        beta_document = Document(
            organization_id=organization_id, uploaded_by_id=beta_user.id, team_id=beta_team.id,
            department_id=beta_department.id, visibility="team", original_filename="beta-private.md",
            extension=".md", media_type="text/markdown", size_bytes=30, sha256="b" * 64,
            storage_key="test-beta", status="indexed", chunk_count=1, extracted_characters=50,
        )
        db.add_all([alpha_document, beta_document])
        db.flush()
        db.add_all([
            DocumentChunk(organization_id=organization_id, document_id=alpha_document.id, chunk_index=0, content="Gateway rotation uses ALPHA-SAFE-PROCEDURE.", char_start=0, char_end=44, token_estimate=12),
            DocumentChunk(organization_id=organization_id, document_id=beta_document.id, chunk_index=0, content="Gateway rotation secret is SECRET-BETA-ONLY.", char_start=0, char_end=45, token_estimate=12),
        ])
        db.commit()
    finally:
        db.close()

    captured: dict[str, str] = {}

    class FakeProvider:
        def generate(self, *, instructions: str, input_text: str) -> str:
            captured["input"] = input_text
            return "Use the approved team procedure. [S1]"

    monkeypatch.setattr(rag_service, "get_response_provider", lambda: FakeProvider())
    monkeypatch.setattr(rag_service, "get_embedding_provider", lambda: None)
    response = client.post(
        "/api/v1/ai/query",
        headers={"Authorization": f"Bearer {first_token}"},
        json={"question": "What is the gateway rotation procedure?"},
    )
    assert response.status_code == 200, response.text
    assert "ALPHA-SAFE-PROCEDURE" in captured["input"]
    assert "SECRET-BETA-ONLY" not in captured["input"]


def test_knowledge_draft_publish_and_tenant_isolation(client: TestClient):
    first_token = register_and_login(client, "knowledge-first@example.com", "Knowledge First")
    second_token = register_and_login(client, "knowledge-second@example.com", "Knowledge Second")
    first_headers = {"Authorization": f"Bearer {first_token}"}
    second_headers = {"Authorization": f"Bearer {second_token}"}
    created = client.post(
        "/api/v1/knowledge",
        headers=first_headers,
        json={
            "title": "Certificate rotation runbook",
            "summary": "Reviewed steps for rotating identity-provider certificates without interrupting authentication.",
            "content": "Confirm the new certificate fingerprint, refresh service-provider metadata, and validate sign-in with a non-production account.",
            "category": "Runbook",
            "tags": ["sso", "certificate"],
        },
    )
    assert created.status_code == 201, created.text
    assert created.json()["state"] == "draft"
    article_id = created.json()["id"]
    assert client.get(f"/api/v1/knowledge/{article_id}", headers=second_headers).status_code == 404

    published = client.post(f"/api/v1/knowledge/{article_id}/publish", headers=first_headers)
    assert published.status_code == 200
    assert published.json()["state"] == "published"
    assert published.json()["published_at"] is not None

    first_overview = client.get("/api/v1/analytics/overview", headers=first_headers)
    second_overview = client.get("/api/v1/analytics/overview", headers=second_headers)
    assert first_overview.status_code == 200
    assert first_overview.json()["published_knowledge"] == 1
    assert second_overview.json()["published_knowledge"] == 0


def test_admin_user_management_is_tenant_scoped_and_protects_self(client: TestClient):
    first_token = register_and_login(client, "admin-first@example.com", "Admin First")
    second_token = register_and_login(client, "admin-second@example.com", "Admin Second")
    first_headers = {"Authorization": f"Bearer {first_token}"}
    second_headers = {"Authorization": f"Bearer {second_token}"}
    first_users = client.get("/api/v1/admin/users", headers=first_headers)
    second_users = client.get("/api/v1/admin/users", headers=second_headers)
    assert first_users.status_code == 200
    assert len(first_users.json()) == 1
    assert first_users.json()[0]["email"] == "admin-first@example.com"
    assert second_users.json()[0]["email"] == "admin-second@example.com"

    self_id = first_users.json()[0]["id"]
    deactivation = client.patch(f"/api/v1/admin/users/{self_id}", headers=first_headers, json={"is_active": False})
    assert deactivation.status_code == 409


def test_secure_invitation_onboards_user_with_selected_role_and_scope(client: TestClient):
    admin_token = register_and_login(client, "invite-admin@example.com", "Invitation Workspace")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    created = client.post(
        "/api/v1/admin/invitations",
        headers=admin_headers,
        json={
            "name": "Priya Agent",
            "email": "priya.agent@example.com",
            "role": "support_agent",
            "department": "Customer Support",
        },
    )
    assert created.status_code == 201, created.text
    invitation = created.json()
    assert invitation["status"] == "pending"
    assert invitation["token"]

    listed = client.get("/api/v1/admin/invitations", headers=admin_headers)
    assert listed.status_code == 200
    assert listed.json()[0]["token"] is None

    token = invitation["token"]
    preview = client.get(f"/api/v1/auth/invitations/{token}")
    assert preview.status_code == 200
    assert preview.json()["organization_name"] == "Invitation Workspace"
    assert preview.json()["role"] == "support_agent"

    accepted = client.post(
        f"/api/v1/auth/invitations/{token}/accept",
        json={"password": "InvitedPass!123"},
    )
    assert accepted.status_code == 200, accepted.text
    payload = accepted.json()
    assert payload["user"]["roles"] == ["support_agent"]
    assert payload["user"]["default_workspace"] == "agent"
    assert payload["user"]["teams"][0]["name"] == "General Support"
    assert "ticket.view_team" in payload["user"]["permissions"]
    assert "user.invite" not in payload["user"]["permissions"]

    assert client.post(
        f"/api/v1/auth/invitations/{token}/accept",
        json={"password": "InvitedPass!123"},
    ).status_code == 410
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "priya.agent@example.com", "password": "InvitedPass!123"},
    )
    assert login.status_code == 200

    changed = client.patch(
        f"/api/v1/admin/users/{payload['user']['id']}",
        headers=admin_headers,
        json={"workspace_role": "senior_agent"},
    )
    assert changed.status_code == 200, changed.text
    assert changed.json()["workspace_role"] == "senior_agent"
    refreshed_login = client.post(
        "/api/v1/auth/login",
        json={"email": "priya.agent@example.com", "password": "InvitedPass!123"},
    )
    assert refreshed_login.json()["user"]["roles"] == ["senior_agent"]
    assert "ticket.reassign" in refreshed_login.json()["user"]["permissions"]


def test_team_management_assigns_members_and_limits_team_listing(client: TestClient):
    admin_token = register_and_login(client, "teams-admin@example.com", "Teams Workspace")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    context = client.get("/api/v1/auth/me", headers=admin_headers).json()
    agent_token = create_role_user(
        client,
        organization_id=context["organization_id"],
        email="teams-agent@example.com",
        role_slug="support_agent",
    )
    agent_headers = {"Authorization": f"Bearer {agent_token}"}

    department = client.post(
        "/api/v1/organization/departments",
        headers=admin_headers,
        json={"name": "Enterprise Support", "description": "Enterprise customer operations"},
    )
    assert department.status_code == 201, department.text
    team = client.post(
        "/api/v1/organization/teams",
        headers=admin_headers,
        json={"name": "Enterprise Queue", "department_id": department.json()["id"]},
    )
    assert team.status_code == 201, team.text

    users = client.get("/api/v1/admin/users", headers=admin_headers).json()
    agent_id = next(user["id"] for user in users if user["email"] == "teams-agent@example.com")
    membership = client.put(
        f"/api/v1/organization/teams/{team.json()['id']}/members/{agent_id}",
        headers=admin_headers,
        json={"is_lead": False},
    )
    assert membership.status_code == 200, membership.text
    assert any(member["id"] == agent_id for member in membership.json()["members"])

    visible = client.get("/api/v1/organization/teams", headers=agent_headers)
    assert visible.status_code == 200
    assert [item["name"] for item in visible.json()] == ["Enterprise Queue"]
    assert client.post(
        "/api/v1/organization/teams",
        headers=agent_headers,
        json={"name": "Forbidden Queue", "department_id": department.json()["id"]},
    ).status_code == 403

    audit = client.get("/api/v1/audit-events", headers=admin_headers)
    assert audit.status_code == 200, audit.text
    actions = {event["action"] for event in audit.json()["items"]}
    assert {"department.created", "team.created", "team.member_added"}.issubset(actions)
    assert client.get("/api/v1/audit-events", headers=agent_headers).status_code == 403


def test_case_assignment_creates_private_persistent_notification(client: TestClient):
    admin_token = register_and_login(client, "notify-admin@example.com", "Notification Workspace")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    context = client.get("/api/v1/auth/me", headers=admin_headers).json()
    agent_token = create_role_user(
        client,
        organization_id=context["organization_id"],
        email="notify-agent@example.com",
        role_slug="support_agent",
    )
    agent_headers = {"Authorization": f"Bearer {agent_token}"}
    users = client.get("/api/v1/admin/users", headers=admin_headers).json()
    agent_id = next(user["id"] for user in users if user["email"] == "notify-agent@example.com")

    created = client.post(
        "/api/v1/cases",
        headers=admin_headers,
        json={
            "subject": "Assigned notification delivery check",
            "description": "Confirm the assigned support agent receives a private persistent notification.",
            "priority": "high",
            "category": "account",
            "assignee_id": agent_id,
        },
    )
    assert created.status_code == 201, created.text
    inbox = client.get("/api/v1/notifications", headers=agent_headers)
    assert inbox.status_code == 200, inbox.text
    assert inbox.json()["unread"] == 1
    notice = inbox.json()["items"][0]
    assert notice["notification_type"] == "case_assigned"
    assert notice["entity_id"] == created.json()["id"]

    assert client.patch(f"/api/v1/notifications/{notice['id']}/read", headers=admin_headers).status_code == 404
    marked = client.patch(f"/api/v1/notifications/{notice['id']}/read", headers=agent_headers)
    assert marked.status_code == 200
    assert marked.json()["read_at"] is not None

    preferences = client.get("/api/v1/notifications/preferences", headers=agent_headers)
    assert preferences.status_code == 200
    assert preferences.json()["case_assigned"] is True
    disabled = client.put(
        "/api/v1/notifications/preferences",
        headers=agent_headers,
        json={"case_assigned": False, "case_reply": True, "case_escalated": True, "sla_alerts": True},
    )
    assert disabled.status_code == 200
    assert disabled.json()["case_assigned"] is False
    second = client.post(
        "/api/v1/cases",
        headers=admin_headers,
        json={
            "subject": "Muted assignment notification check",
            "description": "A disabled assignment preference must prevent another private notification.",
            "priority": "medium",
            "category": "account",
            "assignee_id": agent_id,
        },
    )
    assert second.status_code == 201
    muted_inbox = client.get("/api/v1/notifications", headers=agent_headers).json()
    assert muted_inbox["total"] == 1
    assert muted_inbox["unread"] == 0
