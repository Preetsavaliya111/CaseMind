# Security controls and release limitations

CaseMind uses bearer JWTs, bcrypt password hashes, encrypted TOTP secrets, organization-scoped SQL queries and backend permission checks. The browser is not a security boundary: every API endpoint rechecks authentication, role permissions, organization ownership and content scope.

## Current controls

- Registration always creates a new organization and assigns the initial user `org_admin`.
- JWTs contain an access type, expiry and account token version. Password changes, password resets, MFA changes and logout invalidate prior tokens.
- MFA challenges are short-lived, account-version-bound and reject reused TOTP time steps. Recovery codes are stored as keyed hashes.
- Cases, comments, attachments, documents, Knowledge, Memory, notifications and workflows require organization and permission checks.
- Internal comments and escalation history are removed from customer Case responses.
- Retrieved context is untrusted data. It is placed after the system instructions, tenant-filtered, permission-filtered and rehydrated through SQL before generation.
- Provider citations must reference an evidence key supplied to the provider. Unverifiable citation output is rejected.
- Uploads use generated storage paths, size/type/signature checks and private filesystem storage.
- Production settings reject weak secrets, wildcard origins/hosts, non-PostgreSQL databases, relative storage paths and unprotected Qdrant configuration.

## Operational requirements

Use HTTPS at the ingress, keep PostgreSQL/Qdrant private, set exact `CORS_ORIGINS` and `TRUSTED_HOSTS`, configure real-client IP handling at the trusted proxy, and keep API/provider secrets server-side. Never place `.env` files in the repository or frontend build context.

## Known limitations

The current document processor runs in the API process/background task and is not a durable queue. Filesystem storage requires a persistent private volume and is single-instance in the reference Compose deployment. No compliance certification, SSO/SCIM, external connector, autonomous tool execution, voice channel or billing capability is claimed.

## Security verification

Run the backend authorization and tenant-isolation tests before release. Perform a staging test with two organizations, customer and staff accounts, uploaded files, internal notes, Knowledge visibility and AI retrieval. Treat any cross-tenant result, customer exposure of internal content, weak-secret acceptance or missing audit event as a release blocker.
