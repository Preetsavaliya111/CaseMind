# Incident response

## First response

1. Declare the incident and record the UTC start time, affected environment, owner and request IDs.
2. If confidentiality or tenant isolation may be affected, stop public traffic and revoke affected accounts/tokens by increasing token versions or disabling accounts.
3. Preserve application, ingress, provider and database logs without copying secrets or unnecessary customer content.
4. Check readiness, database health, storage capacity, Qdrant availability, provider status, recent migrations and workflow/document failure records.

## Recovery

Use the least disruptive safe action: restart a failed stateless process, pause document uploads, roll back compatible images, or recover into isolated services from a verified backup. Do not run destructive migrations or `docker compose down -v` on production.

## Closeout

Document timeline, impact, tenant scope, detection, request IDs, root cause, data exposure assessment, recovery actions and follow-up owners. Add a regression test for confirmed defects and update `DEPLOYMENT_READINESS_AUDIT.md` with the exact evidence.

## Severity guidance

- **Critical:** cross-tenant access, credential compromise, customer exposure of internal content, data loss or unavailable production service.
- **High:** authentication bypass, privilege escalation, sustained provider/database outage or unsafe migration.
- **Medium:** a bounded workflow, document or notification failure without data exposure.
- **Low:** isolated UI or non-sensitive operational defect.
