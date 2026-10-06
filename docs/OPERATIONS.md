# Operations

## Health

- `GET /api/v1/health/live` checks only that the API process responds.
- `GET /api/v1/health/ready` checks database connectivity, Alembic head, writable document storage and Qdrant when deployed.
- Frontend `GET /healthz` checks only the static Nginx process.

Every API response includes an `X-Request-ID`. Backend request logs are JSON and contain request ID, endpoint, status and latency; authenticated requests also attach organization and user identifiers. URLs, query strings, authorization headers, passwords, API keys, MFA material and customer content are not logged by the application middleware.

## Monitor

Alert on readiness failures, 5xx/429 rates, database connection failures, document jobs stuck in `processing`, failed workflow runs, Qdrant/provider failures, disk usage, backup freshness and certificate expiry. The repository provides application health and structured request logs; alert routing and retention remain host-specific configuration.

## Releases

Build immutable backend/frontend images, run exactly one `alembic upgrade head` release job, verify readiness and execute the authenticated staging smoke flow before production traffic. Application startup does not auto-migrate. Roll back images only when schema compatibility is confirmed; prefer forward migrations for destructive changes.

The validated local release test command is `npm test`, which uses one Vitest worker with file parallelism and isolation disabled for the mounted WSL filesystem. CI should run the same command on a native Linux runner.

## Document processing

Uploads are persisted before extraction. Without embedding credentials, documents remain `ready_for_indexing`. In-process processing can be interrupted by a restart; drain uploads before maintenance and use the authorized reprocess endpoint after inspecting failed records. A durable queue, lease, retry scheduler and dead-letter workflow are future reliability work.
