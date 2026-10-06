"""Validate production wiring without loading .env or printing resolved secrets.

--compose additionally asks Docker Compose to validate disposable test inputs.
This does not start services or build images.
"""
import argparse
import os
from pathlib import Path
import subprocess
import tempfile

import yaml

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--compose", action="store_true")
    parser.add_argument("--compose-bin", help="Optional standalone Docker Compose executable")
    args = parser.parse_args()
    config = yaml.safe_load((ROOT / "compose.production.yaml").read_text())
    services = config["services"]
    for name in ("postgres", "qdrant", "backend", "migrate"):
        assert not services[name].get("ports"), f"Internal service {name} must not publish ports"
    assert services["frontend"]["ports"] == ["127.0.0.1:8080:8080"]
    assert config["networks"]["private"]["internal"] is True
    assert services["migrate"]["command"] == ["alembic", "upgrade", "head"]
    for name in ("postgres", "qdrant", "backend"):
        assert services[name]["volumes"], f"{name} requires durable storage"
    assert services["backend"]["read_only"] and services["frontend"]["read_only"]
    backend_ignore = (ROOT / "backend/.dockerignore").read_text()
    frontend_ignore = (ROOT / "frontend/.dockerignore").read_text()
    assert "**/.env*" in backend_ignore and ".env*" in frontend_ignore
    assert "COPY app ./app" in (ROOT / "backend/Dockerfile").read_text()
    assert "USER 10001:10001" in (ROOT / "backend/Dockerfile").read_text()
    assert "VITE_API_BASE_URL=/api/v1" in (ROOT / "frontend/Dockerfile").read_text()
    print("Static production wiring, storage, internal ports and build-context checks passed.")
    if args.compose:
        with tempfile.TemporaryDirectory(prefix="casemind-config-") as directory:
            root = Path(directory)
            for name in ("backend.env", "qdrant.env", "postgres-password"):
                (root / name).write_text("# disposable validation file\n" if name.endswith(".env") else "disposable-value")
            env = {**os.environ, "CASEMIND_BACKEND_ENV_FILE": str(root / "backend.env"), "CASEMIND_QDRANT_ENV_FILE": str(root / "qdrant.env"), "CASEMIND_POSTGRES_PASSWORD_FILE": str(root / "postgres-password")}
            executable = [args.compose_bin] if args.compose_bin else ["docker", "compose"]
            subprocess.run([*executable, "--env-file", str(root / "backend.env"), "-f", str(ROOT / "compose.production.yaml"), "config", "--quiet"], env=env, check=True)
        print("Docker Compose configuration validation passed.")


if __name__ == "__main__":
    main()
