import os
from pathlib import Path
from urllib.request import Request, urlopen

from alembic.config import Config
from alembic.script import ScriptDirectory
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.core.config import settings
from app.db.database import engine

router = APIRouter()


@router.get("/")
@router.get("/live")
def health():
    return {
        "status": "healthy",
        "service": "CaseMind Backend",
        "version": "1.0.0"
    }


def dependency_status() -> dict[str, bool]:
    checks = {"database": False, "schema": False, "storage": False}
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            checks["database"] = True
            versions = set(connection.execute(text("SELECT version_num FROM alembic_version")).scalars())
            config = Config()
            config.set_main_option("script_location", str(Path(__file__).resolve().parents[2] / "alembic"))
            checks["schema"] = versions == set(ScriptDirectory.from_config(config).get_heads())
    except Exception:
        pass  # Never disclose URLs, credentials or SQL errors in public readiness output.
    path = Path(settings.DOCUMENT_STORAGE_PATH)
    checks["storage"] = path.is_dir() and os.access(path, os.R_OK | os.W_OK | os.X_OK)
    if settings.deployed or settings.GEMINI_API_KEY:
        checks["qdrant"] = False
        try:
            request = Request(f"{settings.QDRANT_URL.rstrip('/')}/readyz", headers={"api-key": settings.QDRANT_API_KEY or ""})
            with urlopen(request, timeout=3) as response:
                checks["qdrant"] = response.status == 200
        except Exception:
            pass
    return checks


@router.get("/ready")
def readiness():
    checks = dependency_status()
    ready = all(checks.values())
    return JSONResponse({"status": "ready" if ready else "not_ready", "checks": checks}, status_code=200 if ready else 503)
