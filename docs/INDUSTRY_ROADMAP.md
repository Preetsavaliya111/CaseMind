# CaseMind roadmap

Updated 2026-10-03. Status is based on source inspection and current checks, not earlier design specifications.

| Stage | Status | Completion criteria |
| --- | --- | --- |
| Repository audit | Complete | Source inventory, five-way classification and baseline backend evidence recorded in `INDUSTRY_EXPANSION_AUDIT.md`. |
| Premium public experience | Implemented and verified | Original responsive layout, explicitly illustrative interactive preview, accurate capabilities/data-use FAQs, auth-aware CTA, semantic navigation and reduced motion. Component tests and production-browser checks at 390/768/1440px passed. |
| Phase 1 automation | Implemented and verified within stated scope | Models/migration/API, bounded internal actions, actor permissions, atomic outcomes, revision checks, run history and starter UI. 26 backend automation tests, six UI interaction tests, authenticated browser execution and PostgreSQL concurrent-delivery checks passed. See `WORKFLOWS.md`. |
| Production preparation | Implemented; runtime deployment verification blocked | Dockerfiles, standalone private-network Compose, secret/origin policy, readiness, CI, manual image preparation, backup helper and runbook added. Compose configuration validated. Docker builds, actual backup/restore and hosting setup remain unverified. |
| Release verification | Complete for available checks; production NO-GO | 64 backend tests, 13 frontend tests, lint, TypeScript, production build, four browser checks, native PostgreSQL migrations/concurrency and Compose validation passed. Exact commands and limits in `DEPLOYMENT_READINESS_AUDIT.md`. |

## Phase 1 boundaries

- Events: created, assigned, priority changed, status changed, resolved.
- Conditions: equality on existing case priority/status/category/team/user; tag membership; all conditions must match.
- Actions: assign active organization user/team, set supported priority/status, add internal note, notify an authorized internal user in-app.
- Execution authority: triggering actor's current permissions, never the workflow owner's elevated privileges. Customer-created events may be recorded as skipped when an internal action is not permitted.
- Internal synchronous execution in the case transaction, per-workflow savepoints, persistent outcomes. No background queue or external side effects required.
- Explicit limits, at most one run per workflow/event, no workflow-generated event chaining. Starter templates are editable drafts, not active integrations.

## Remaining release gates and later work

1. Select host/region/domain and deployment method; configure protected GitHub Environment, TLS, production secrets and exact origins.
2. Provision persistent PostgreSQL, Qdrant and document storage; assign backup ownership/retention/RPO/RTO and rehearse restore.
3. Verify production images/migrations and host-level health checks; exercise configured AI and SMTP with approved non-sensitive test data.
4. Rate limiting and operational alerting at the ingress; ingestion worker durability/retry/recovery before claiming reliable asynchronous processing at scale.
5. Broader authorization, performance, accessibility, load and AI evaluation coverage.
6. Future phases require separate product decisions: external connector credentials and permissions, durable job/outbox architecture, customer channels, automation scheduling and advanced rule logic. No dates or capability claims are implied.
