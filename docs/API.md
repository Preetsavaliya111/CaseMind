# API overview

All product routes are under `/api/v1`. Except for health, registration, and login, endpoints require a bearer access token.

- `/auth`: organization registration, login, current user, profile/password management with session revocation, one-time password recovery, public invitation acceptance, and optional authenticator-app MFA enrollment/verification.
- `/cases`: paginated Case lifecycle, status changes, comments, access-controlled attachments, and archival.
- `/documents`: secure upload, status, extracted chunks, reprocessing, and archival.
- `/memory-items`: evidence-linked Organizational Memory, verification, and archival.
- `/knowledge`: curated article drafts, updates, publishing, search, and archival.
- `/ai/status` and `/ai/query`: provider readiness and evidence-backed answers.
- `/analytics/overview`: measured Case and knowledge-readiness aggregates.
- `/dashboard/workspace`: permission- and scope-aware metrics and priorities tailored to the user's effective workspace role.
- `/admin/users`: tenant-scoped role and account-state management, including administrator-issued one-time password reset links.
- `/admin/invitations`: create, list, and revoke secure organization invitations.
- `/organization/departments` and `/organization/teams`: scoped organizational structure and team membership management.
- `/audit-events`: permission-protected organization activity history with action and entity filters.
- `/sla/policies` and `/sla/summary`: SLA target administration and scoped operational health.
- `/cases/{id}/escalations`: permission-protected Case escalation with retained reason and level history.
- `/notifications`: private persistent inbox, unread counts, read-state management, and enforced per-user alert preferences.
- `/admin/ai-configuration`: non-secret provider and retrieval configuration.

Organization ownership is derived from the authenticated user; clients cannot select an organization identifier for product queries. OpenAPI documentation at `/docs` is the canonical field-level reference.
