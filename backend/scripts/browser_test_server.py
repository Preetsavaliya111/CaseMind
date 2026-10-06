"""An isolated, local-only API for browser checks; never reads the project .env."""
import os
from pathlib import Path
import sys
import tempfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))


if __name__ == "__main__":
    with tempfile.TemporaryDirectory(prefix="casemind-browser-") as directory:
        os.environ.update(ENVIRONMENT="test", DATABASE_URL=f"sqlite:///{directory}/browser.sqlite3",
                          SECRET_KEY="test-secret-key-with-at-least-32-characters", GROQ_API_KEY="", GEMINI_API_KEY="",
                          SMTP_HOST="", SMTP_PASSWORD="", QDRANT_API_KEY="", DOCUMENT_STORAGE_PATH=directory,
                          CORS_ORIGINS="http://127.0.0.1:4173", PROCESS_DOCUMENTS_INLINE="true")
        from app.db.base import Base
        from app.db.database import engine
        import uvicorn
        Base.metadata.create_all(engine)
        uvicorn.run("main:app", host="127.0.0.1", port=8011, access_log=False)
