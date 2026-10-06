import os

# Deterministic test-only configuration. Do not read .env or contact real providers.
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SECRET_KEY"] = "test-secret-key-with-at-least-32-characters"
for name in ("GROQ_API_KEY", "GEMINI_API_KEY", "SMTP_HOST", "SMTP_PASSWORD", "QDRANT_API_KEY"):
    os.environ[name] = ""
