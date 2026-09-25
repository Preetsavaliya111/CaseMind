import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings


class VectorStoreError(RuntimeError):
    pass


def _request(method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    headers = {"Content-Type": "application/json"}
    if settings.QDRANT_API_KEY:
        headers["api-key"] = settings.QDRANT_API_KEY
    request = Request(
        f"{settings.QDRANT_URL.rstrip('/')}{path}",
        data=json.dumps(payload).encode("utf-8") if payload is not None else None,
        method=method,
        headers=headers,
    )
    try:
        with urlopen(request, timeout=30) as response:
            content = response.read()
            return json.loads(content.decode("utf-8")) if content else {}
    except HTTPError as exc:
        if exc.code == 404:
            raise FileNotFoundError(path) from exc
        raise VectorStoreError(f"Vector store returned HTTP {exc.code}") from exc
    except (URLError, TimeoutError, ValueError) as exc:
        raise VectorStoreError("Vector store is unavailable") from exc


def ensure_collection(vector_size: int) -> None:
    path = f"/collections/{settings.QDRANT_COLLECTION}"
    try:
        _request("GET", path)
    except FileNotFoundError:
        _request("PUT", path, {"vectors": {"size": vector_size, "distance": "Cosine"}})


def upsert_document_chunks(points: list[dict[str, Any]]) -> None:
    if not points:
        return
    ensure_collection(len(points[0]["vector"]))
    _request(
        "PUT",
        f"/collections/{settings.QDRANT_COLLECTION}/points?wait=true",
        {"points": points},
    )


def delete_document_vectors(organization_id: str, document_id: str) -> None:
    try:
        _request(
            "POST",
            f"/collections/{settings.QDRANT_COLLECTION}/points/delete?wait=true",
            {
                "filter": {
                    "must": [
                        {"key": "organization_id", "match": {"value": organization_id}},
                        {"key": "document_id", "match": {"value": document_id}},
                    ]
                }
            },
        )
    except FileNotFoundError:
        return


def query_organization(vector: list[float], organization_id: str, limit: int) -> list[dict[str, Any]]:
    try:
        body = _request(
            "POST",
            f"/collections/{settings.QDRANT_COLLECTION}/points/query",
            {
                "query": vector,
                "filter": {
                    "must": [
                        {"key": "organization_id", "match": {"value": organization_id}},
                    ]
                },
                "limit": limit,
                "with_payload": True,
                "with_vector": False,
            },
        )
    except FileNotFoundError:
        return []
    result = body.get("result", {})
    points = result.get("points", result if isinstance(result, list) else [])
    return points if isinstance(points, list) else []
