import logging
import time
from uuid import UUID, uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api import (
    admin,
    audit,
    ai,
    analytics,
    auth,
    cases,
    documents,
    dashboard,
    health,
    knowledge,
    memory,
    notifications,
    organization_units,
    search,
    sla,
    workflows,
)
from app.core.config import settings
import app.utils.logger  # Configure structured process logging before the app starts.


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url=None if settings.deployed else "/docs",
    redoc_url=None if settings.deployed else "/redoc",
    openapi_url=None if settings.deployed else "/openapi.json",
)

request_logger = logging.getLogger("casemind.http")


@app.middleware("http")
async def request_observability(request: Request, call_next):
    supplied = request.headers.get("X-Request-ID", "")
    try:
        request_id = str(UUID(supplied)) if supplied else str(uuid4())
    except ValueError:
        request_id = str(uuid4())
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        request_logger.exception("Unhandled request error", extra={"request_id": request_id, "endpoint": request.url.path, "status_code": 500, "latency_ms": round((time.perf_counter() - started) * 1000, 2)})
        raise
    response.headers["X-Request-ID"] = request_id
    request_logger.info("request completed", extra={"request_id": request_id, "organization_id": getattr(request.state, "organization_id", None), "user_id": getattr(request.state, "user_id", None), "endpoint": request.url.path, "status_code": response.status_code, "latency_ms": round((time.perf_counter() - started) * 1000, 2)})
    return response

if settings.deployed:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)


app.include_router(
    admin.router,
    prefix="/api/v1/admin",
    tags=["Administration"],
)

app.include_router(
    audit.router,
    prefix="/api/v1/audit-events",
    tags=["Audit"],
)

app.include_router(
    analytics.router,
    prefix="/api/v1/analytics",
    tags=["Analytics"],
)

app.include_router(
    ai.router,
    prefix="/api/v1/ai",
    tags=["AI Workspace"],
)

app.include_router(
    health.router,
    prefix="/api/v1/health",
    tags=["Health"],
)

app.include_router(
    auth.router,
    prefix="/api/v1/auth",
    tags=["Authentication"],
)

app.include_router(
    cases.router,
    prefix="/api/v1/cases",
    tags=["Cases"],
)

app.include_router(
    documents.router,
    prefix="/api/v1/documents",
    tags=["Documents"],
)
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])

app.include_router(
    knowledge.router,
    prefix="/api/v1/knowledge",
    tags=["Knowledge"],
)

app.include_router(
    memory.router,
    prefix="/api/v1/memory-items",
    tags=["Organizational Memory"],
)

app.include_router(
    search.router,
    prefix="/api/v1/search",
    tags=["Search"],
)

app.include_router(
    organization_units.router,
    prefix="/api/v1/organization",
    tags=["Teams and Departments"],
)

app.include_router(sla.router, prefix="/api/v1/sla", tags=["SLA"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["Workflows"])

@app.get("/")
def root():
    return {
        "name": "CaseMind API",
        "version": "1.0.0",
        "docs": "/docs",
    }
