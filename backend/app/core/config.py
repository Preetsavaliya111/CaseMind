from functools import lru_cache
import os
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url


class Settings(BaseSettings):
    PROJECT_NAME: str = "CaseMind API"
    ENVIRONMENT: Literal["development", "test", "staging", "production"] = "development"
    DATABASE_URL: str = Field(repr=False)
    SECRET_KEY: str = Field(min_length=32, repr=False)
    ALGORITHM: Literal["HS256"] = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, ge=5, le=1440)
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    TRUSTED_HOSTS: str = "localhost,127.0.0.1"
    LOG_SQL: bool = False
    DOCUMENT_STORAGE_PATH: str = "./storage/documents"
    MAX_UPLOAD_BYTES: int = 15 * 1024 * 1024
    PROCESS_DOCUMENTS_INLINE: bool = False
    CHAT_PROVIDER: str = "groq"
    GROQ_API_KEY: str | None = Field(default=None, repr=False)
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_CHAT_MODEL: str = "openai/gpt-oss-20b"
    EMBEDDING_PROVIDER: str = "gemini"
    GEMINI_API_KEY: str | None = Field(default=None, repr=False)
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"
    GEMINI_EMBEDDING_DIMENSIONS: int = 768
    AI_MAX_OUTPUT_TOKENS: int = 1200
    AI_RETRIEVAL_LIMIT: int = 8
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str | None = Field(default=None, repr=False)
    QDRANT_COLLECTION: str = "casemind_knowledge"
    FRONTEND_URL: str = "http://localhost:3000"
    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = Field(default=None, repr=False)
    SMTP_FROM_EMAIL: str | None = None
    SMTP_USE_TLS: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        hide_input_in_errors=True,
    )

    @property
    def deployed(self) -> bool:
        return self.ENVIRONMENT in {"staging", "production"}

    @property
    def trusted_hosts(self) -> list[str]:
        return [host.strip() for host in self.TRUSTED_HOSTS.split(",") if host.strip()]

    @model_validator(mode="after")
    def production_policy(self):
        if not self.deployed:
            return self
        placeholders = ("replace", "change", "example", "test-secret", "casemind-local", "password")
        if len(self.SECRET_KEY) < 64 or len(set(self.SECRET_KEY)) < 16 or any(word in self.SECRET_KEY.lower() for word in placeholders):
            raise ValueError("Production SECRET_KEY must be a generated random secret of at least 64 characters")
        try:
            database = make_url(self.DATABASE_URL)
        except Exception:
            raise ValueError("Production DATABASE_URL must be a valid PostgreSQL connection URL") from None
        if database.get_backend_name() != "postgresql":
            raise ValueError("Production requires PostgreSQL")
        if not database.password or len(database.password) < 20 or any(word in database.password.lower() for word in placeholders):
            raise ValueError("Production database credentials must use a strong generated password")
        for origin in [self.FRONTEND_URL, *self.cors_origins]:
            parsed = urlsplit(origin)
            if parsed.scheme != "https" or not parsed.hostname or parsed.hostname in {"localhost", "127.0.0.1", "::1"} or "*" in origin or parsed.path not in {"", "/"} or parsed.query or parsed.fragment or parsed.username or parsed.password:
                raise ValueError("Production frontend and CORS origins must be explicit HTTPS origins")
        if not self.cors_origins or self.FRONTEND_URL.rstrip("/") not in self.cors_origins:
            raise ValueError("CORS_ORIGINS must explicitly include FRONTEND_URL without a trailing slash")
        if not self.trusted_hosts or any("*" in host or "/" in host or ":" in host for host in self.trusted_hosts) or urlsplit(self.FRONTEND_URL).hostname not in self.trusted_hosts:
            raise ValueError("TRUSTED_HOSTS must explicitly include the public hostname; wildcards are forbidden")
        if self.LOG_SQL:
            raise ValueError("SQL logging must be disabled in production")
        if not Path(self.DOCUMENT_STORAGE_PATH).is_absolute():
            raise ValueError("Production requires an absolute persistent document storage path")
        if not self.QDRANT_API_KEY or len(self.QDRANT_API_KEY) < 32:
            raise ValueError("Production Qdrant requires an API key of at least 32 characters")
        if self.SMTP_HOST and not self.SMTP_USE_TLS:
            raise ValueError("Production SMTP requires TLS")
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    # Test collection must never load a developer's real provider credentials.
    return Settings(_env_file=None) if os.environ.get("ENVIRONMENT") == "test" else Settings()


settings = get_settings()
