"""Exercise a real PostgreSQL case transaction and concurrent duplicate delivery."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import sys
from uuid import UUID, uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from sqlalchemy.engine import make_url
from app.core.config import settings
from app.db.database import SessionLocal
from app.models.case import CaseComment
from app.models.workflow import CaseEvent, WorkflowRun
from app.services.workflow_service import dispatch_event
from main import app


def main():
    url = make_url(settings.DATABASE_URL)
    if settings.ENVIRONMENT != "test" or url.get_backend_name() != "postgresql" or not (url.database or "").endswith("_test"):
        raise SystemExit("This check requires a migrated disposable PostgreSQL *_test database")
    client = TestClient(app)
    email = f"concurrency-{uuid4().hex}@example.org"
    assert client.post("/api/v1/auth/register", json={"name": "Test Manager", "email": email, "password": "DisposableCheck!123", "organization_name": "Disposable verification", "department": "Support"}).status_code == 201
    token = client.post("/api/v1/auth/login", json={"email": email, "password": "DisposableCheck!123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    me = client.get("/api/v1/auth/me", headers=headers).json()
    workflow = client.post("/api/v1/workflows", headers=headers, json={"name": "Concurrent delivery", "event_type": "case.created", "enabled": True, "actions": [{"type": "internal_note", "content": "Exactly one note per event"}]}).json()
    created = client.post("/api/v1/cases", headers=headers, json={"subject": "PostgreSQL smoke case", "description": "Disposable case used to verify workflow transactions."})
    assert created.status_code == 201 and len(created.json()["comments"]) == 1
    case_id = UUID(created.json()["id"])
    with SessionLocal() as db:
        event = CaseEvent(organization_id=UUID(me["organization_id"]), actor_id=UUID(me["id"]), case_id=case_id, event_type="case.created", snapshot={"workflow_ids": [workflow["id"]]})
        db.add(event)
        db.commit()
        event_id = event.id
    def deliver():
        with SessionLocal() as db:
            dispatch_event(db, event_id, UUID(me["organization_id"]))
            db.commit()
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(lambda _: deliver(), range(2)))
    with SessionLocal() as db:
        assert db.query(WorkflowRun).filter(WorkflowRun.event_id == event_id).count() == 1
        assert db.query(CaseComment).filter(CaseComment.case_id == case_id).count() == 2
    print("PostgreSQL authenticated workflow execution and concurrent idempotency passed.")


if __name__ == "__main__":
    main()
