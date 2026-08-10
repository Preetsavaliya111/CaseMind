from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings


# PostgreSQL database engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
)


# Database session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# Base class for all SQLAlchemy models
Base = declarative_base()


def get_db():
    """
    Provide a database session for FastAPI requests.

    The session is automatically closed after
    the request is completed.
    """
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()