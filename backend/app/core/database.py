"""Backward-compatible imports for the single database configuration.

New code should import from ``app.db.database`` directly.
"""

from app.db.database import Base, SessionLocal, engine, get_db

__all__ = ["Base", "SessionLocal", "engine", "get_db"]
