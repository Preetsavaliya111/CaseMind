# Backup and recovery

The repository includes `scripts/backup.py` for the standalone production Compose reference. It requires an explicit maintenance window and a new owner-only output directory outside the repository. It captures a PostgreSQL custom-format dump, private documents/attachments, Qdrant snapshots and a SHA-256 manifest.

```bash
python scripts/backup.py \
  --env-file /secure/casemind/deployment.env \
  --output /secure/backups/casemind-YYYYMMDD \
  --quiesce
```

The helper is not a scheduler, encryption service or off-host copy. The operator must encrypt the output, copy it to an independent account/location, set retention and alert on failures. Never store raw secrets in the backup directory.

## Recovery rehearsal

1. Stop writes or restore into isolated recovery services; do not overwrite the only live database or volume.
2. Verify every artifact hash in `manifest.json`.
3. Restore `postgres.dump` into an empty database with `pg_restore --exit-on-error --no-owner` and reapply runtime grants.
4. Restore `documents.tar.gz` into the original private document root with the application UID/GID.
5. Restore matching Qdrant snapshots through its private snapshot-recovery API, or re-index authorized documents and mark the vector index incomplete until complete.
6. Run Alembic head/readiness checks, sign-in, MFA, tenant isolation, file download, workflow history and provider smoke tests.
7. Record elapsed recovery time, lost interval, owner approval and any exceptions before switching traffic.

No RPO/RTO, backup schedule, off-host destination or successful Docker-backed restore is claimed until the selected hosting operator performs and records this rehearsal.
