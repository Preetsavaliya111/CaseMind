"""Maintenance-window backup of the standalone Compose reference.

Explicitly stops frontend/backend, dumps PostgreSQL, archives private files and
downloads Qdrant collection snapshots, then restarts the services it stopped.
The output contains sensitive organization data: encrypt and copy it off-host.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--env-file", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path, help="New directory outside the repository")
    parser.add_argument("--quiesce", action="store_true", help="Confirm a maintenance window for frontend/backend")
    parser.add_argument("--project-name", help="Compose project name when backing up a non-default rehearsal stack")
    args = parser.parse_args()
    output = args.output.resolve()
    if not args.quiesce or output.is_relative_to(ROOT) or output.exists():
        raise SystemExit("Pass --quiesce and a NEW backup directory outside the repository")
    os.umask(0o077)
    output.mkdir(parents=True, mode=0o700)
    compose = ["docker", "compose", "--env-file", str(args.env_file.resolve()), "-f", str(ROOT / "compose.production.yaml")]
    if args.project_name:
        compose[2:2] = ["-p", args.project_name]
    running = subprocess.check_output([*compose, "ps", "--services", "--status", "running"], text=True).splitlines()
    if not {"frontend", "backend", "postgres", "qdrant"}.issubset(running):
        raise SystemExit("Expected running production reference services; backup aborted")
    artifacts = []
    try:
        subprocess.run([*compose, "stop", "frontend", "backend"], check=True)
        with (output / "postgres.dump").open("wb") as target:
            subprocess.run([*compose, "exec", "-T", "postgres", "sh", "-c", 'export PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"; exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc'], stdout=target, check=True)
        artifacts.append("postgres.dump")
        with (output / "documents.tar.gz").open("wb") as target:
            subprocess.run([*compose, "run", "--rm", "--no-deps", "-T", "backend", "tar", "-C", "/var/lib/casemind/documents", "-czf", "-", "."], stdout=target, check=True)
        artifacts.append("documents.tar.gz")
        # Credentials remain in the backend container environment and HTTP headers.
        common = "from app.core.config import settings; from urllib.request import Request,urlopen; import json,sys; base=settings.QDRANT_URL.rstrip('/'); headers={'api-key':settings.QDRANT_API_KEY}; "
        collections = json.loads(subprocess.check_output([*compose, "run", "--rm", "--no-deps", "-T", "backend", "python", "-c", common + "print(json.dumps(json.load(urlopen(Request(base+'/collections',headers=headers),timeout=30))['result']['collections']))"], text=True))
        snapshots = []
        for index, collection in enumerate(collections):
            code = common + "from urllib.parse import quote; name=quote(sys.argv[1],safe=''); response=json.load(urlopen(Request(base+'/collections/'+name+'/snapshots',headers=headers,method='POST'),timeout=300)); snapshot=quote(response['result']['name'],safe=''); stream=urlopen(Request(base+'/collections/'+name+'/snapshots/'+snapshot,headers=headers),timeout=300); import shutil; shutil.copyfileobj(stream,sys.stdout.buffer)"
            filename = f"qdrant-{index}.snapshot"
            with (output / filename).open("wb") as target:
                subprocess.run([*compose, "run", "--rm", "--no-deps", "-T", "backend", "python", "-c", code, collection["name"]], stdout=target, check=True)
            artifacts.append(filename)
            snapshots.append({"collection": collection["name"], "file": filename})
        hashes = {}
        for name in artifacts:
            with (output / name).open("rb") as source:
                hashes[name] = hashlib.file_digest(source, "sha256").hexdigest()
        (output / "manifest.json").write_text(json.dumps({"completed_at": datetime.now(timezone.utc).isoformat(), "sha256": hashes, "qdrant": snapshots, "document_path": "/var/lib/casemind/documents"}, indent=2))
    finally:
        subprocess.run([*compose, "start", "backend", "frontend"], check=True)
    print("Backup completed. Encrypt and copy off-host; verify the manifest and rehearse recovery before relying on it.")


if __name__ == "__main__":
    main()
