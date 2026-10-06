from uuid import UUID, uuid4

import pytest

from app.models.case import CaseComment, SupportCase
from app.models.notification import Notification
from app.models.user import User
from app.models.workflow import CaseEvent, WorkflowRun
from app.services.workflow_service import dispatch_event
from test_auth_and_cases import TestingSession, client, reset_database, register_and_login, create_role_user


@pytest.fixture
def workspace(client):
    token = register_and_login(client, "workflow-admin@example.com", "Workflow Org")
    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/api/v1/auth/me", headers=headers).json()
    return headers, me


def definition(**changes):
    return {"name": "Triage a new case", "event_type": "case.created", "conditions": [],
            "actions": [{"type": "internal_note", "content": "Review the evidence before making changes."}], "enabled": True, **changes}


def workflow(client, headers, **changes):
    response = client.post("/api/v1/workflows", headers=headers, json=definition(**changes))
    assert response.status_code == 201, response.text
    return response.json()


def case(client, headers, **changes):
    response = client.post("/api/v1/cases", headers=headers, json={"subject": "Recurring authentication failure", "description": "An affected user cannot sign in after an identity configuration update.", **changes})
    assert response.status_code == 201, response.text
    return response.json()


def runs(client, headers, item):
    response = client.get(f"/api/v1/workflows/{item['id']}/runs", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()["items"]


def test_workflow_runs_real_actions_and_retains_revision_audit_and_conditions(client, workspace):
    headers, me = workspace
    item = workflow(client, headers, conditions=[{"field": "priority", "value": "high"}, {"field": "tags", "operator": "contains", "value": "LOGIN"}], actions=[
        {"type": "set_priority", "priority": "critical"}, {"type": "set_status", "status": "in_progress"},
        {"type": "internal_note", "content": "Escalation checklist needed."}, {"type": "notify_user", "user_id": me["id"], "message": "Review this case."},
    ])
    created = case(client, headers, priority="high", tags=["login"])
    assert created["priority"] == "critical" and created["status"] == "in_progress"
    assert created["comments"][0]["is_internal"] is True
    assert created["first_responded_at"] is None  # Automation must not impersonate a staff response for SLA metrics.
    result = runs(client, headers, item)[0]
    assert result["status"] == "succeeded" and len(result["executed_actions"]) == 4
    assert result["workflow_revision"] == 1 and result["finished_at"]
    assert result["event_type"] == "case.created" and result["actor_id"] == me["id"]
    notifications = client.get("/api/v1/notifications", headers=headers).json()["items"]
    assert any(row["message"] == "Review this case." for row in notifications)
    case(client, headers, priority="low")
    assert any(row["failure_code"] == "conditions_not_met" for row in runs(client, headers, item))
    changed = client.put(f"/api/v1/workflows/{item['id']}", headers=headers, json={**definition(name="Updated workflow", enabled=False), "revision": 1})
    assert changed.status_code == 200 and changed.json()["revision"] == 2
    assert client.put(f"/api/v1/workflows/{item['id']}", headers=headers, json={**definition(), "revision": 1}).status_code == 409
    audit = client.get("/api/v1/audit-events", headers=headers).json()["items"]
    assert {"workflow.created", "workflow.updated", "workflow.disabled", "workflow.run_succeeded", "workflow.run_skipped"}.issubset({row["action"] for row in audit})
    assert any(row["definition"]["name"] == "Triage a new case" for row in runs(client, headers, item))


def test_workflows_and_runs_are_tenant_scoped(client, workspace):
    headers, me = workspace
    item = workflow(client, headers)
    case(client, headers)
    other_token = register_and_login(client, "workflow-other@example.com", "Other Workflow Org")
    other = {"Authorization": f"Bearer {other_token}"}
    other_id = client.get("/api/v1/auth/me", headers=other).json()["id"]
    assert client.get("/api/v1/workflows", headers=other).json()["items"] == []
    for suffix in ["", "/runs"]:
        assert client.get(f"/api/v1/workflows/{item['id']}{suffix}", headers=other).status_code == 404
    assert client.put(f"/api/v1/workflows/{item['id']}", headers=other, json={**definition(), "revision": 1}).status_code == 404
    assert client.patch(f"/api/v1/workflows/{item['id']}/enabled", headers=other, json={"enabled": False, "revision": 1}).status_code == 404
    for action in [{"type": "assign_user", "user_id": other_id}, {"type": "notify_user", "user_id": other_id}, {"type": "assign_team", "team_id": str(uuid4())}]:
        if action["type"] == "notify_user": action["message"] = "A private note"
        assert client.post("/api/v1/workflows", headers=headers, json=definition(actions=[action])).status_code == 422
    case(client, other)
    assert len(runs(client, headers, item)) == 1


@pytest.mark.parametrize("role", ["customer", "support_agent", "team_lead", "knowledge_manager"])
def test_unauthorized_workflow_operations_are_denied(client, workspace, role):
    headers, me = workspace
    item = workflow(client, headers)
    token = create_role_user(client, organization_id=me["organization_id"], email=f"{role}@example.com", role_slug=role)
    denied = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/v1/workflows", headers=denied).status_code == 403
    assert client.get("/api/v1/workflows/options", headers=denied).status_code == 403
    assert client.get(f"/api/v1/workflows/{item['id']}/runs", headers=denied).status_code == 403
    assert client.post("/api/v1/workflows", headers=denied, json=definition()).status_code == 403
    assert client.put(f"/api/v1/workflows/{item['id']}", headers=denied, json={**definition(), "revision": 1}).status_code == 403
    assert client.patch(f"/api/v1/workflows/{item['id']}/enabled", headers=denied, json={"enabled": False, "revision": 1}).status_code == 403


def test_customer_events_cannot_borrow_workflow_owner_permissions(client, workspace):
    headers, me = workspace
    item = workflow(client, headers, actions=[{"type": "assign_user", "user_id": me["id"]}, {"type": "internal_note", "content": "Internal only"}])
    token = create_role_user(client, organization_id=me["organization_id"], email="customer-workflow@example.com", role_slug="customer")
    customer = {"Authorization": f"Bearer {token}"}
    created = case(client, customer)
    assert created["assignee_id"] is None and created["comments"] == []
    result = runs(client, headers, item)[0]
    assert result["status"] == "skipped" and result["failure_code"] == "permission_or_visibility_denied"
    # The ordinary create endpoint must not be an assignment-permission bypass either.
    denied = client.post("/api/v1/cases", headers=customer, json={"subject": "Unauthorized assignment", "description": "A customer cannot choose an assignee directly.", "assignee_id": me["id"]})
    assert denied.status_code == 403


@pytest.mark.parametrize("changes", [
    {"event_type": "email.received"}, {"actions": [{"type": "send_email", "address": "x@example.com"}]},
    {"actions": [{"type": "set_priority", "priority": "urgent"}]}, {"actions": [{"type": "set_status", "status": "deleted"}]},
    {"actions": [{"type": "internal_note", "content": " "}]}, {"conditions": [{"field": "customer_email", "value": "x"}]},
    {"conditions": [{"field": "status", "operator": "contains", "value": "new"}]},
    {"actions": [{"type": "internal_note", "content": "safe", "url": "https://example.com"}]},
    {"organization_id": str(uuid4())}, {"actions": [{"type": "internal_note", "content": "x"}] * 6},
])
def test_workflow_schema_rejects_unsupported_or_unbounded_input(client, workspace, changes):
    headers, _ = workspace
    assert client.post("/api/v1/workflows", headers=headers, json=definition(**changes)).status_code == 422


def test_failed_target_rolls_back_all_actions_but_preserves_case_and_safe_history(client, workspace):
    headers, me = workspace
    token = create_role_user(client, organization_id=me["organization_id"], email="target@example.com", role_slug="support_agent")
    target = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}).json()
    item = workflow(client, headers, actions=[{"type": "internal_note", "content": "Must roll back"}, {"type": "assign_user", "user_id": target["id"]}])
    with TestingSession() as db:
        db.get(User, UUID(target["id"])).is_active = False
        db.commit()
    created = case(client, headers)
    assert created["comments"] == [] and created["assignee_id"] is None
    result = runs(client, headers, item)[0]
    assert result["status"] == "failed" and result["executed_actions"] == []
    assert "target@example.com" not in result["failure_detail"]
    assert client.patch(f"/api/v1/workflows/{item['id']}/enabled", headers=headers, json={"enabled": False, "revision": 1}).status_code == 200


def test_notifications_do_not_disclose_cases_to_unassigned_staff(client, workspace):
    headers, me = workspace
    token = create_role_user(client, organization_id=me["organization_id"], email="unassigned@example.com", role_slug="support_agent")
    recipient = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}).json()
    item = workflow(client, headers, actions=[{"type": "internal_note", "content": "Should roll back"}, {"type": "notify_user", "user_id": recipient["id"], "message": "Private case context"}])
    created = case(client, headers)
    assert created["comments"] == []
    assert runs(client, headers, item)[0]["status"] == "skipped"
    with TestingSession() as db:
        assert db.query(Notification).filter(Notification.recipient_id == UUID(recipient["id"])).count() == 0


def test_event_replay_is_idempotent_and_workflow_updates_do_not_recurse(client, workspace):
    headers, me = workspace
    first = workflow(client, headers, actions=[{"type": "set_priority", "priority": "high"}, {"type": "internal_note", "content": "Only once"}])
    second = workflow(client, headers, event_type="case.priority_changed", actions=[{"type": "set_priority", "priority": "low"}])
    created = case(client, headers)
    assert created["priority"] == "high"
    assert runs(client, headers, second) == []
    result = runs(client, headers, first)[0]
    with TestingSession() as db:
        dispatch_event(db, UUID(result["event_id"]), uuid4())
        dispatch_event(db, UUID(result["event_id"]), UUID(me["organization_id"]))
        db.commit()
        assert db.query(WorkflowRun).count() == 1
        assert db.query(CaseEvent).count() == 1
        assert db.query(CaseComment).count() == 1
    response = client.patch(f"/api/v1/cases/{created['id']}", headers=headers, json={"priority": "critical"})
    assert response.json()["priority"] == "low"
    assert len(runs(client, headers, second)) == 1


@pytest.mark.parametrize("event_type,endpoint,payload", [
    ("case.assigned", "", "assign"), ("case.priority_changed", "", {"priority": "high"}),
    ("case.status_changed", "/status", {"status": "in_progress"}), ("case.resolved", "/status", {"status": "resolved"}),
])
def test_case_mutations_emit_supported_events_once(client, workspace, event_type, endpoint, payload):
    headers, me = workspace
    item = workflow(client, headers, event_type=event_type)
    created = case(client, headers)
    data = {"assignee_id": me["id"]} if payload == "assign" else payload
    for _ in range(2):
        result = client.patch(f"/api/v1/cases/{created['id']}{endpoint}", headers=headers, json=data)
        assert result.status_code == 200, result.text
    assert len(runs(client, headers, item)) == 1


def test_active_organization_team_assignment_and_disabled_workflow(client, workspace):
    headers, _ = workspace
    department = client.post("/api/v1/organization/departments", headers=headers, json={"name": "Technical support"}).json()
    team_response = client.post("/api/v1/organization/teams", headers=headers, json={"name": "Identity specialists", "department_id": department["id"]})
    assert team_response.status_code == 201, team_response.text
    team = team_response.json()
    item = workflow(client, headers, actions=[{"type": "assign_team", "team_id": team["id"]}], enabled=False)
    assert case(client, headers)["team_id"] != team["id"]
    assert runs(client, headers, item) == []
    assert client.patch(f"/api/v1/workflows/{item['id']}/enabled", headers=headers, json={"enabled": True, "revision": 1}).status_code == 200
    created = case(client, headers)
    assert created["team_id"] == team["id"] and created["department_id"] == department["id"]


def test_staff_event_rechecks_action_permissions_and_rolls_back_notes(client, workspace):
    headers, me = workspace
    token = create_role_user(client, organization_id=me["organization_id"], email="acting-agent@example.com", role_slug="support_agent")
    agent_headers = {"Authorization": f"Bearer {token}"}
    agent_id = client.get("/api/v1/auth/me", headers=agent_headers).json()["id"]
    item = workflow(client, headers, event_type="case.status_changed", actions=[{"type": "internal_note", "content": "Not retained on failure"}, {"type": "set_priority", "priority": "critical"}])
    created = case(client, headers, assignee_id=agent_id)
    changed = client.patch(f"/api/v1/cases/{created['id']}/status", headers=agent_headers, json={"status": "in_progress"})
    assert changed.status_code == 200
    assert changed.json()["priority"] == "medium" and changed.json()["comments"] == []
    assert runs(client, headers, item)[0]["status"] == "skipped"
