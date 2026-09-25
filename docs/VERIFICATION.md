# CaseMind verification record

Last verified: 2026-09-25

## Automated checks

- Backend: 21 workflow, security, authorization, tenancy, password-recovery, MFA, notification, attachment, SLA, and retrieval tests pass.
- Frontend: ESLint and TypeScript checks pass.
- Frontend tests: 4 effective-permission and workspace-role tests pass.
- Production build: Vite 8 build completes successfully.
- Dependency security: `npm audit` reports zero findings and Python dependency consistency passes.
- Database: Alembic is at `f4201d8be76a` and autogenerate detects no pending schema operations.

## Live dependency checks

- FastAPI health and OpenAPI: healthy.
- React development application: healthy.
- PostgreSQL: validated through migrations and the complete API workflow suite.
- Qdrant: `/readyz` returns 200; the Gemini 768-dimensional collection is present and ready.
- Groq and Gemini: server configuration is present and shown without exposing credentials.
- Live provider workflow: document indexed, 3 evidence items retrieved, 4 citations returned, and 4 synchronized search results found using `openai/gpt-oss-20b` through Groq.

## Browser workflow checks

The following paths were exercised in the running application with a dedicated isolated audit organization:

1. Public landing page and login.
2. Role-specific administrator dashboard.
3. Case creation and persisted Case detail.
4. Public Case comment and status transition to In Progress.
5. Global search returning the newly created Case.
6. Dashboard and analytics synchronization after the transition.
7. Documents, Memory, Knowledge, Teams, SLA, notifications, and Evidence Workspace loading states.
8. Settings profile, password, MFA, account timestamps, and notification preferences.
9. AI provider configuration, user administration, and audit event history.
10. Fresh browser session with no application console warnings or errors.

The 2026-09-25 UI repair pass additionally verified centered, viewport-bounded dialogs; red field-level validation; the redesigned Create Case workspace; normalized assignee role labels; PostgreSQL-compatible assignee filtering; and reachable actions in Create Case, Edit Case, Knowledge, invitation, team, and escalation forms. See `QA_AUDIT_2026-09-25.md` for the full defect table.

The audit discovered and corrected the open-Case analytics status mapping, missing account timestamps, non-functional notification preferences, schema/model drift, and outdated vulnerable frontend tooling.
