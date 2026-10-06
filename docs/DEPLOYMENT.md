# CaseMind deployment and recovery

Updated 2026-10-03. This is host-neutral release preparation. **No hosting provider is configured and no public deployment has been authorized.** Current evidence and blockers are in [DEPLOYMENT_READINESS_AUDIT.md](DEPLOYMENT_READINESS_AUDIT.md).

## 1. Choose the deployment target

Before release, record: provider/account, region, public hostname, TLS termination, private networking, image registry, persistent volume or managed service IDs, backup location/retention, RPO/RTO, operational owner, monitoring destinations and staging environment. Configure a protected GitHub Environment with required reviewers and main-branch restrictions before adding host-specific deployment credentials.

The supplied `compose.production.yaml` is a **standalone single-host reference**, not an overlay on the development Compose file. Only the frontend binds a host port, on `127.0.0.1:8080`. Put an approved HTTPS ingress in front of it. PostgreSQL, Qdrant and the backend have no published ports. The backend can reach AI/SMTP providers through its egress network; database and vector services are on an internal network.

For managed PostgreSQL or Qdrant, adapt the reference to private endpoints, use provider-required TLS verification and install any required CA bundle. Do not expose their ports to the Internet.

## 2. Runtime configuration and secrets

Use the hosting secret manager where possible. The Compose reference accepts protected **external** files whose absolute paths are supplied through `deployment/.env.example`:

- `CASEMIND_BACKEND_ENV_FILE`: backend environment values.
- `CASEMIND_QDRANT_ENV_FILE`: `QDRANT__SERVICE__API_KEY=<generated secret>`.
- `CASEMIND_POSTGRES_PASSWORD_FILE`: only the generated PostgreSQL password, supplied as a Docker secret.
- `BACKEND_IMAGE`, `FRONTEND_IMAGE`: immutable release SHA tags or registry digests.

Do not copy real secret files into the repository or image context. Set directory permissions to owner-only and file permissions to `0600`; keep a separately encrypted secret recovery copy. Use generated random secrets (for example `secrets.token_urlsafe(48)` generated directly into your secret store). Do not print secrets in CI or run a resolved `docker compose config` in public logs; use `config --quiet`.

| Backend variable | Production requirement |
| --- | --- |
| `ENVIRONMENT` | `production` (or `staging` for a staging host); the reference forces production validation |
| `DATABASE_URL` | PostgreSQL URL, host `postgres` in the reference, database `casemind`; generated password of at least 20 characters, URL-encoded if needed |
| `SECRET_KEY` | Generated random secret, at least 64 characters; placeholders/repeated-character values rejected |
| `FRONTEND_URL` | Exact public HTTPS origin, no trailing slash |
| `CORS_ORIGINS` | Explicit comma-separated HTTPS origins, including `FRONTEND_URL`; no wildcards or localhost |
| `TRUSTED_HOSTS` | Explicit public hostname plus `127.0.0.1` for container checks; no wildcard or scheme, e.g. `support.example.org,127.0.0.1,backend` |
| `DOCUMENT_STORAGE_PATH` | Absolute durable path; reference fixes `/var/lib/casemind/documents` |
| `QDRANT_URL` | `http://qdrant:6333` on the isolated reference network, or your private secured endpoint |
| `QDRANT_API_KEY` | At least 32 characters; exactly match Qdrant's service key |
| `QDRANT_COLLECTION` | Stable collection name; default `casemind_knowledge`. Keep embedding model/dimensions consistent with existing vectors |
| `LOG_SQL` | `false`; rejected when enabled in deployed environments |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Default 60; accepted range 5–1440 |
| `MAX_UPLOAD_BYTES` | Default 15 MiB; align the ingress request limit (reference Nginx: 16 MiB including multipart overhead) |
| `PROCESS_DOCUMENTS_INLINE` | Default `false`; document jobs still run in the API process, not a durable worker queue |
| `GROQ_API_KEY`, `CHAT_PROVIDER`, `GROQ_CHAT_MODEL` | Optional AI answers; provider `groq`, default model `openai/gpt-oss-20b` |
| `GEMINI_API_KEY`, `EMBEDDING_PROVIDER`, `GEMINI_EMBEDDING_MODEL`, `GEMINI_EMBEDDING_DIMENSIONS` | Optional semantic indexing; defaults `gemini`, `gemini-embedding-001`, 768 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_USE_TLS` | Optional password-reset delivery; TLS required when SMTP enabled. No workflow email or invitation-email integration |

Provider base URLs and token/retrieval limits are in `backend/.env.example`. Credentials belong only on the backend. Review provider content-handling policies: document text reaches Gemini for embeddings; selected source excerpts reach Groq for answers. Provider configuration does not prove provider availability.

Provision a restricted runtime database role and a separately controlled migration/backup role for the selected host. The reference's bootstrap `POSTGRES_USER=casemind` is an owner role; do not adopt unrestricted bootstrap credentials as the final least-privilege application policy. Grant the runtime role only the required schema/table/sequence privileges after migrations, and set default privileges for later migrations. Use the hosting release job's migration credential for the migration container. Confirm this policy in staging.

`SECRET_KEY` also protects encrypted MFA material. Rotation revokes tokens and can make existing MFA secrets unreadable without a migration/re-enrollment plan. Preserve the key for recovery; treat rotation as an explicit operational procedure.

## 3. Frontend routing and images

The frontend defaults to `/api/v1`. Development Vite proxies that path to `http://localhost:8000` (`CASEMIND_DEV_API_PROXY` can override it). The production frontend image serves the SPA through unprivileged Nginx and proxies `/api/` to `backend:8000`; direct navigation to `/workflows` or `/tickets/...` works through the SPA fallback.

For a separately hosted static frontend, set the **public** `VITE_API_BASE_URL` at build time, including `/api/v1`, configure SPA rewrites and exact backend CORS origins, and adapt CSP `connect-src`. Frontend variables are public assets and must never contain credentials. The reference image intentionally uses same-origin routing and needs no build arguments or secrets.

From the repository root, build locally without injecting production environment files:

```bash
docker build -t casemind-backend:local backend
docker build -t casemind-frontend:local frontend
```

The API runs as UID/GID `10001`, without SQL/access logging or public OpenAPI in production. Frontend assets run through the unprivileged Nginx image. App root filesystems are read-only in Compose, with `/tmp` tmpfs and a writable document volume. Pin evaluated release images to digests. CI builds images; an image build is not a deployment or backup validation.

## 4. Persistent data

The reference declares durable volumes for PostgreSQL, Qdrant storage, Qdrant snapshots and uploaded documents. A volume is **not a backup**. Map these to the selected host's persistent disks and verify survival across container recreation and host recovery.

The current document/attachment adapter uses filesystem paths, not S3/object storage. Mount a private volume writable by UID/GID `10001` at `/var/lib/casemind/documents`. Do not serve this directory through Nginx or public object URLs. Multiple API replicas require a shared filesystem with consistent paths and ingestion coordination; this release reference is single-instance. Object-storage support requires an adapter and migration, not merely an environment variable.

Existing databases contain absolute `storage_key` paths. Moving an existing installation requires a controlled, backed-up copy and path remapping for documents and case attachments, tested in staging. Changing `DOCUMENT_STORAGE_PATH` alone does not relocate historical files. Preserve the configured root when restoring a production backup.

## 5. Controlled release procedure

These commands are instructions for the authorized operator after a target is approved; no production release was performed during development. Run them from the repository root with the deployment reference file outside source control:

```bash
docker compose --env-file /secure/casemind/deployment.env -f compose.production.yaml config --quiet
docker compose --env-file /secure/casemind/deployment.env -f compose.production.yaml pull
docker compose --env-file /secure/casemind/deployment.env -f compose.production.yaml up -d postgres qdrant
# Take/verify a pre-release backup and enter a maintenance window for upgrades.
docker compose --env-file /secure/casemind/deployment.env -f compose.production.yaml --profile release run --rm migrate
docker compose --env-file /secure/casemind/deployment.env -f compose.production.yaml up -d backend frontend
```

For locally built images use `build` in place of `pull`. Run exactly one migration job per release; application startup does **not** auto-migrate. Current migration head is `a203e718c901`. Test the entire upgrade against a staging copy before an existing-data release. Do not modify historical migration revisions or use `create_all` on production.

Verify readiness through the ingress, sign-in, case creation, workflow actions/history, permissions, document upload/download and configured providers using approved non-sensitive test data. Activate public traffic only after those pass. Enable TLS/HSTS at the chosen ingress. The supplied Nginx applies authentication rate limits per observed peer; configure trusted real-client-IP handling at the selected ingress before scaling behind another proxy. Keep the API private so ingress limits cannot be bypassed. Configure broader signup/AI/upload abuse controls and monitoring for your operating limits.

## 6. Health and operations

- `GET /api/v1/health/live` (legacy `/api/v1/health/` retained): process liveness.
- `GET /api/v1/health/ready`: 200 only when PostgreSQL responds, the schema matches the image's Alembic head, the document directory is readable/writable, and Qdrant is ready in deployed environments. Returns 503 and boolean component checks on failure, without connection strings or upstream error text.
- Frontend `GET /healthz`: static server liveness. It does not certify the backend.
- Readiness does not prove file-volume durability, provider credentials, SMTP delivery, backup success or available storage capacity. Monitor those separately.

Monitor 5xx/429 rates, readiness, disk capacity, database connections, failed workflow runs, document processing age and backup freshness. Logs in the reference omit request URLs/query strings and authorization headers. Configure alerts and log retention with the hosting owner. Avoid query-string/token logging at external proxies too.

Document ingestion is a FastAPI in-process background task. A restart can strand processing, and there is no durable queue/lease/retry scheduler. Drain uploads and allow tasks to finish before restarting. After an interrupted job, an authorized administrator can use `POST /api/v1/documents/{id}/reprocess`; inspect the result before attempting again. Do not advertise high-availability ingestion until durable workers and recovery monitoring are implemented.

## 7. Backups

The reference includes `scripts/backup.py` for an explicit maintenance-window backup:

```bash
python scripts/backup.py --env-file /secure/casemind/deployment.env --output /secure/backups/casemind-YYYYMMDD --quiesce
```

For an isolated disposable Compose rehearsal whose project is not the default `casemind-production`, add `--project-name <name>`. This option is for operator-controlled rehearsals and does not change the production service names.

It requires the reference services to be running, stops frontend/backend, takes a PostgreSQL custom-format dump, archives documents and attachments, creates/downloads Qdrant collection snapshots, records SHA-256 hashes and restarts frontend/backend. Partial backups lack a completed `manifest.json`; treat them as incomplete. The script does not print credentials or backup contents. It creates owner-only output outside the repository. Snapshot creation can leave retained snapshots on Qdrant; include them in the storage/retention policy.

**The script has not been run against production or a Docker-backed reference in this environment.** Before relying on it, exercise backup and restore in staging. The deployment owner must configure scheduling, encryption, off-host/independent-account copies, access control, retention and alerting. Set explicit RPO/RTO and prove them by rehearsal. For managed PostgreSQL, prefer provider snapshots/PITR plus tested logical exports. Keep encrypted copies of the original MFA/signing secret and deployment configuration separately from application data.

## 8. Rollback and recovery

1. Stop ingress writes and drain API/background work. Preserve the failed release's state and logs for diagnosis.
2. For an application-only rollback with compatible schema, restore the prior pinned images and verify readiness. Readiness deliberately requires the image's schema head; incompatible heads require an explicit migration/recovery decision.
3. The latest migration's downgrade removes workflow/event/run tables and workflow permission grants. It is destructive. Back up first and retain/export workflow history; prefer a forward fix. Never use `docker compose down -v` on production.
4. For recovery, restore to **new isolated volumes/database**, not over your only live copy. Verify every artifact hash from `manifest.json` before use. Provision the same PostgreSQL major version, application release, document root and Qdrant/embedding settings as the backup.
5. Restore the dump with a controlled database-owner credential: `pg_restore --exit-on-error --no-owner --dbname="$RECOVERY_DATABASE_URL" postgres.dump` against the empty recovery database. Reapply approved runtime grants. Keep the connection URL in the secret manager and shell tracing disabled.
6. Inspect the file archive and extract `documents.tar.gz` only into the empty recovery document volume. Restore UID/GID `10001`, private permissions and the original absolute paths. Check case attachments as well as documents.
7. For each Qdrant collection recorded in the manifest, upload its local snapshot through the private Qdrant snapshot-recovery API for the **matching Qdrant version**, supplying the API key only in a header. Do not expose public snapshot download URLs. Follow the version-specific recovery endpoint contract, and check collection dimensions/counts after recovery. If rebuilding vectors instead, reprocess authorized documents from restored SQL/files using the same embedding model and record that the index is incomplete until finished.
8. Validate schema head, record counts, sign-in/MFA, customer/team isolation, file downloads, workflow history and duplicate-delivery behavior; then run provider-backed retrieval with approved test data. Record elapsed recovery time and any lost interval.
9. Only the authorized release owner can approve traffic switching/DNS changes after recovery verification. Retain the previous environment until the recovery is accepted.

## 9. CI and publishing

`.github/workflows/ci.yml` runs on PRs and main pushes with `contents: read`: lint, TypeScript, component tests, production build, Chromium public/authenticated checks with a disposable API, backend tests, migrations on disposable PostgreSQL 16, PostgreSQL workflow concurrency tests, Compose validation and production image builds/config checks. Provider/SMTP/deployment credentials are unnecessary. Dependency caches store package downloads, not environments, databases or secrets.

`images.yml` is a manual **image preparation** workflow, not CD. It is main-only, defaults to build without publishing, uses the protected `image-publish` Environment, and can publish immutable SHA-tagged GHCR images using job-scoped `packages: write`. Create required-reviewer protection before invoking it; run it only after CI passes for the exact revision. It neither deploys nor changes DNS. No workflow has been dispatched or images published in this session.

Add provider-specific CD only after choosing a host, release command, migration job, rollout/health procedure and rollback target. Store its secrets in the protected deployment Environment. Never expose deployment credentials to pull-request jobs.
