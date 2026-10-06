# Industry expansion audit

Audit started 2026-10-03. Source and executable checks take precedence over older specifications and verification reports. Release evidence is tracked in `DEPLOYMENT_READINESS_AUDIT.md`.

## Discovery and preservation

- Baseline commit: `3b1d025`. At discovery 151 tracked files were modified; `git diff --ignore-space-at-eol --stat` was empty. These pre-existing line-ending changes are preserved. Local environment files, uploads, databases, build output and logs are not release inputs.
- Inspected API registration, domain models/services/schemas, authorization, provider adapters, migrations, tests, frontend routes/providers/components, package manifests, environment examples, Compose, scripts, documentation and infrastructure directories.
- `ai/`, `rag/`, `architecture/`, `datasets/`, `deployment/`, `docker/`, `scripts/`, `shared/`, `tests/`, `training/` and `.github/workflows/` had no tracked implementation at discovery. Runtime AI lives under `backend/app/`.

## Classification at discovery

“Verified” below means the stated automated scenario passed, not comprehensive production certification. Baseline: **22 backend tests passed**, isolated SQLite and mocked providers, 2026-10-03.

| Area | Classification | Source evidence and limits |
| --- | --- | --- |
| Registration, JWT, password rotation/reset, optional MFA | Implemented and verified | `auth.py`, account/password-reset/MFA services; tests cover tenant injection rejection, session revocation, one-time recovery and TOTP replay. No production rate limiter or email verification. |
| Roles and backend authorization | Implemented and verified | Normalized permissions/roles, `require_permission`, scoped services; customer/agent/admin scenarios tested. Custom-role editing is not delivered. |
| Tenant and team isolation | Implemented and verified, bounded coverage | `authorized_case_query`, `apply_content_scope`, vector results rechecked in SQL. Tests cover cross-tenant cases/content and same-tenant cross-team retrieval. This is application-level enforcement, not PostgreSQL RLS. |
| Cases, comments, attachments, assignment | Implemented and verified | Persistent cases, status changes, internal-note filtering, downloads and assignment notifications tested. Create-time assignee permission needs hardening. |
| Case events | Partially implemented | Audit entries exist; no reusable persisted event dispatcher or workflow history at discovery. |
| Teams, invitations, onboarding | Implemented and verified | Team management, copy-link invitations, persisted onboarding exercised by backend tests. Invitation email delivery absent. |
| SLA and escalations | Implemented but not adequately verified | Priority policies, deadlines, retained escalation records; no dedicated scheduler. SLA notifications are generated when notifications are read. |
| Notifications | Implemented and verified | Private persisted assignment/reply/escalation/SLA notifications and preferences; assignment/recipient isolation tested. No push channel. |
| Email | Blocked on external configuration | Optional synchronous SMTP password-reset delivery; mock/local fallback paths do not prove delivery. No email workflow action. |
| Knowledge and Organizational Memory | Implemented and verified | Draft/publish and evidence/verification lifecycles, tenant checks covered. Not autonomous learning or automatic verification. |
| Documents and storage | Partially implemented | Size/type validation, private filesystem storage, extraction/chunking/index states tested. Persistent mount and backups absent. Extraction runs in-process; no durable queue, leases or automatic recovery. |
| AI answers, search and evidence | Implemented; live operation blocked on services | Mocked Groq/Gemini contract tests, no-provider behavior and retrieval isolation pass. Qdrant/Gemini/Groq live behavior not reverified. Source-grounding instructions do not guarantee factual correctness. No arbitrary AI actions. |
| Analytics and dashboards | Implemented but not adequately verified | Real SQL aggregates and scoped dashboards; some customer checks, limited dedicated aggregation tests. No invented business KPIs should appear on marketing pages. |
| Audit logging | Implemented but not adequately verified | Persistent organization-scoped actor/action/details records and permission-protected listing. No tamper-evident external archive or retention policy. |
| Database/migrations | Implemented but not adequately verified | 21 sequential Alembic revisions, current head `6df4cc81bd91`. SQLite `create_all` tests do not exercise PostgreSQL migrations; PostgreSQL JSON casts exist. |
| Frontend patterns | Implemented but not adequately verified | React Query, typed services, route guards, shared Radix controls, light/dark tokens and states. Existing tests cover only four permission scenarios. |
| Premium public landing specification | Partially implemented | Existing marketing page has unlabeled illustrative numbers, unsupported availability claims, weak mobile semantics, registration-only CTAs. Requested redesign remains work. |
| Phase 1 automation | Not implemented | No workflow models, migrations, API, runner, UI or tests at discovery. |
| External integrations | Not implemented | No Slack/Jira/GitHub, customer chat, voice or arbitrary tool execution. Permission names and future specs are not integrations. |
| Production infrastructure/CI/CD | Not implemented / hosting blocked | Local PostgreSQL/Qdrant Compose only, ports bound to all interfaces. No Dockerfiles, workflows, production secret validation, dependency readiness, backup/recovery implementation or identified host. |

## Scope of this delivery

Complete the public experience, bounded synchronous internal automation, and host-neutral production/CI preparation. Retain the modular monolith. Durable ingestion, external connectors, multichannel support, advanced analytics, autonomous agents and compliance programs remain future work; none should be advertised as delivered.

See `INDUSTRY_ROADMAP.md` for current stage status and the release audit for verification updates.

## Delivery update — source and checks on 2026-10-03

The discovery classifications above are intentionally retained as the initial remaining-work list. Current changes:

| Area | Current classification | Evidence |
| --- | --- | --- |
| Premium marketing specification | Implemented and verified | Original `LandingPage.tsx`, scoped marketing styles, metadata, explicit preview labels, login/register/auth-aware links. Three component tests and three production-browser viewport checks; desktop/mobile screenshots inspected. |
| Phase 1 workflows and case events | Implemented and verified | `workflow.py` models/schemas, `workflow_service.py`, API, `a203e718c901` migration, `WorkflowsPage.tsx` and editor. 26 automation backend tests plus six UI tests; real PostgreSQL duplicate concurrency and authenticated browser run history verified. |
| Case authorization and SLA interaction | Implemented and verified for changed paths | Create-time assignment permission enforced; staff/admin edits no longer misclassified as customer edits; status transitions check resolve/reopen permissions. Workflow notes do not stop first-response clocks. |
| Production settings and readiness | Implemented and verified by tests | 16 production-policy/readiness scenarios; strong-secret/origin/host validation, schema/database/storage/vector readiness and safe failure output. Host-level verification still required. |
| PostgreSQL migration chain | Implemented and verified on disposable PostgreSQL 18.6 | All 22 revisions, existing-role workflow permission backfill, latest downgrade/re-upgrade and two no-drift checks passed. CI targets PostgreSQL 16; that CI execution has not occurred in this session. |
| Production containers and CI | Implemented but not adequately verified | Dockerfiles, private persistent Compose and least-privilege CI/image workflow source added; standalone Compose v2.40.3 `config --quiet` and static wiring validation passed. Docker runtime/build and GitHub-hosted runs unavailable/not executed. |
| Backup/recovery | Partially implemented; hosting blocked | Maintenance-window backup helper, file/database/vector manifest and recovery runbook added. No executed backup/restore rehearsal, scheduler, off-host encrypted destination or accepted recovery objectives. |
| Host-specific release/CD | Blocked | No provider, environment, DNS or release authority supplied. Only manually gated image preparation is provided. Nothing deployed or published. |

Other existing areas retain their bounded discovery classifications. Full backend suite: **64 passed**; frontend suite: **13 passed**; production-browser suite: **4 passed**. Provider tests are mocked; no live Groq/Gemini/Qdrant/SMTP health or data-policy compliance is asserted. Durable document workers, automatic scheduling/retention and external integrations remain future work.
