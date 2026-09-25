from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
)
from app.core.config import settings


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
)

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

@app.get("/")
def root():
    return {
        "name": "CaseMind API",
        "version": "1.0.0",
        "docs": "/docs",
    }
