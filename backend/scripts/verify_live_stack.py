"""Run a disposable end-to-end smoke test against a local CaseMind API."""

from __future__ import annotations

import json
import sys
import time
import uuid
from datetime import datetime, timezone
from urllib.parse import urlencode
from urllib.request import Request, urlopen


BASE_URL = "http://127.0.0.1:8000/api/v1"


def request(method: str, path: str, *, headers=None, json_body=None, params=None, file=None):
    url = f"{BASE_URL}{path}"
    if params:
        url = f"{url}?{urlencode(params)}"
    request_headers = dict(headers or {})
    body = None
    if json_body is not None:
        body = json.dumps(json_body).encode()
        request_headers["Content-Type"] = "application/json"
    elif file is not None:
        filename, content, content_type = file
        boundary = f"----CaseMind{uuid.uuid4().hex}"
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
            f"Content-Type: {content_type}\r\n\r\n"
        ).encode() + content.encode() + f"\r\n--{boundary}--\r\n".encode()
        request_headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
    with urlopen(Request(url, data=body, headers=request_headers, method=method), timeout=90) as response:
        payload = response.read()
        return json.loads(payload) if payload else None


def main() -> int:
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    email = f"live-check-{stamp}@example.com"
    password = "CaseMindLiveCheck!2026"

    request(
        "POST",
        "/auth/register",
        json_body={
            "name": "CaseMind Live Check",
            "email": email,
            "password": password,
            "organization_name": f"Live Check {stamp}",
            "department": "Support",
        },
    )
    login = request("POST", "/auth/login", json_body={"email": email, "password": password})
    headers = {"Authorization": f"Bearer {login['access_token']}"}

    case = request(
        "POST",
        "/cases",
        headers=headers,
        json_body={
            "subject": "Northstar gateway returns signature mismatch",
            "description": "The Northstar gateway rejects valid requests after key rotation with signature mismatch errors.",
            "priority": "high",
            "category": "authentication",
            "product": "Northstar Gateway",
            "tags": ["northstar", "key-rotation"],
        },
    )

    document_text = (
        "# Northstar gateway key rotation\n\n"
        "When Northstar reports a signature mismatch after key rotation, clear the cached signing key, "
        "restart the gateway worker, and retry the request. The cache retains the previous key for ten minutes."
    )
    document = request(
        "POST",
        "/documents",
        headers=headers,
        file=("northstar-runbook.md", document_text, "text/markdown"),
    )
    for _ in range(30):
        document = request("GET", f"/documents/{document['id']}", headers=headers)
        if document["status"] in {"indexed", "failed"}:
            break
        time.sleep(1)
    if document["status"] != "indexed":
        raise RuntimeError(f"Document ingestion ended with status {document['status']}: {document.get('error_message')}")

    memory = request(
        "POST",
        "/memory-items",
        headers=headers,
        json_body={
            "title": "Northstar signing-key cache after rotation",
            "summary": "A stale cached signing key causes signature mismatches immediately after Northstar key rotation.",
            "memory_type": "resolution",
            "issue_pattern": "Requests that were valid before a Northstar key rotation begin failing with signature mismatch.",
            "root_cause": "The gateway worker retains the previous signing key in its local cache.",
            "resolution_steps": ["Clear the cached signing key", "Restart the gateway worker", "Retry the request"],
            "tags": ["northstar", "authentication"],
            "product": "Northstar Gateway",
            "category": "authentication",
            "sources": [{"source_type": "case", "source_id": case["id"]}],
        },
    )
    request("POST", f"/memory-items/{memory['id']}/verify", headers=headers)

    article = request(
        "POST",
        "/knowledge",
        headers=headers,
        json_body={
            "title": "Recovering Northstar after signing-key rotation",
            "summary": "Steps for recovering a Northstar gateway that is using a stale signing key after rotation.",
            "content": "Clear the cached signing key, restart the gateway worker, then retry the failed request. This refreshes the active key.",
            "category": "authentication",
            "tags": ["northstar", "runbook"],
        },
    )
    request("POST", f"/knowledge/{article['id']}/publish", headers=headers)

    status = request("GET", "/ai/status", headers=headers)
    answer = request(
        "POST",
        "/ai/query",
        headers=headers,
        json_body={"question": "How should I fix a Northstar signature mismatch after key rotation?"},
    )
    if not answer["citations"]:
        raise RuntimeError("AI answer did not include evidence citations")
    request(
        "POST",
        f"/ai/interactions/{answer['interaction_id']}/feedback",
        headers=headers,
        json_body={"rating": "helpful"},
    )
    search = request("GET", "/search", headers=headers, params={"q": "Northstar"})
    if len(search["results"]) < 3:
        raise RuntimeError("Global search did not return the newly created records")

    print(
        "LIVE STACK PASSED | "
        f"document={document['status']} | evidence={status['available_evidence']} | "
        f"citations={len(answer['citations'])} | search_results={len(search['results'])} | "
        f"model={answer['model']}"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"LIVE STACK FAILED: {exc}", file=sys.stderr)
        raise
