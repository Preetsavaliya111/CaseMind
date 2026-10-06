import pytest
from pydantic import ValidationError
from sqlalchemy import text

from app.api import health
from app.core.config import Settings, settings
from test_auth_and_cases import client, reset_database, engine


def production(**changes):
    # Public test values, never deployment credentials.
    return Settings(_env_file=None, **{
        "ENVIRONMENT": "production", "SECRET_KEY": "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-" * 2,
        "DATABASE_URL": "postgresql+psycopg2://app:0123456789abcdefghijklmnop@postgres/casemind",
        "FRONTEND_URL": "https://support.example.org", "CORS_ORIGINS": "https://support.example.org",
        "TRUSTED_HOSTS": "support.example.org,127.0.0.1", "DOCUMENT_STORAGE_PATH": "/var/lib/casemind/documents",
        "QDRANT_API_KEY": "public-test-value-for-qdrant-configuration", **changes,
    })


@pytest.mark.parametrize("changes", [
    {"SECRET_KEY": "replace-with-at-least-32-random-characters"}, {"SECRET_KEY": "a" * 100},
    {"DATABASE_URL": "sqlite://"}, {"DATABASE_URL": "postgresql://app:short@postgres/casemind"},
    {"CORS_ORIGINS": "*"}, {"CORS_ORIGINS": ""}, {"CORS_ORIGINS": "https://other.example.org"},
    {"FRONTEND_URL": "http://support.example.org"}, {"CORS_ORIGINS": "https://support.example.org/path"},
    {"TRUSTED_HOSTS": "*"}, {"LOG_SQL": True}, {"DOCUMENT_STORAGE_PATH": "./storage"},
    {"QDRANT_API_KEY": ""}, {"SMTP_HOST": "smtp.example.org", "SMTP_USE_TLS": False},
])
def test_unsafe_production_configuration_fails_closed(changes):
    with pytest.raises(ValidationError):
        production(**changes)


def test_production_config_accepts_explicit_values_and_hides_secrets():
    configured = production()
    assert configured.deployed and configured.cors_origins == ["https://support.example.org"]
    assert configured.SECRET_KEY not in repr(configured)
    assert configured.DATABASE_URL not in repr(configured)
    with pytest.raises(ValidationError) as error:
        production(SECRET_KEY="private-invalid-value")
    assert "private-invalid-value" not in str(error.value)


def test_readiness_checks_database_schema_storage_and_keeps_liveness_independent(client, monkeypatch, tmp_path):
    monkeypatch.setattr(health, "engine", engine)
    monkeypatch.setattr(settings, "DOCUMENT_STORAGE_PATH", str(tmp_path))
    live = client.get("/api/v1/health/live")
    assert live.status_code == 200
    assert live.headers.get("x-request-id")
    missing = client.get("/api/v1/health/ready")
    assert missing.status_code == 503 and missing.json()["checks"]["schema"] is False
    with engine.begin() as connection:
        connection.execute(text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)"))
        connection.execute(text("INSERT INTO alembic_version VALUES ('a203e718c901')"))
    try:
        assert client.get("/api/v1/health/ready").status_code == 200
        monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-key")
        def unavailable(*args, **kwargs):
            raise TimeoutError("private-upstream-configuration")
        monkeypatch.setattr(health, "urlopen", unavailable)
        response = client.get("/api/v1/health/ready")
        assert response.status_code == 503 and response.json()["checks"]["qdrant"] is False
        assert "private-upstream-configuration" not in response.text
        assert client.get("/api/v1/health/live").status_code == 200
    finally:
        with engine.begin() as connection:
            connection.execute(text("DROP TABLE alembic_version"))
