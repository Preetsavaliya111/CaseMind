from fastapi import FastAPI

from app.api import (
    auth,
    chat,
    health,
    knowledge,
    memory,
    organization,
    tickets,
)


app = FastAPI(
    title="CaseMind API",
    version="1.0.0",
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
    organization.router,
    prefix="/api/v1/organizations",
    tags=["Organizations"],
)

app.include_router(
    tickets.router,
    prefix="/api/v1/tickets",
    tags=["Tickets"],
)

app.include_router(
    knowledge.router,
    prefix="/api/v1/knowledge",
    tags=["Knowledge"],
)

app.include_router(
    chat.router,
    prefix="/api/v1/chat",
    tags=["Chat"],
)

app.include_router(
    memory.router,
    prefix="/api/v1/memory",
    tags=["Memory"],
)


@app.get("/")
def root():
    return {
        "message": "Welcome to CaseMind API 🚀"
    }