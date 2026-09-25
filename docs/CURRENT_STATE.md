# CaseMind current state

Audit date: 2026-09-20

## Rebuild progress — 2026-09-24

The audit below records the repository at discovery time. Since then, the rebuild has replaced the prototype production path with persistent, tenant-scoped modules for authentication, Cases, documents, Organizational Memory, Knowledge, hybrid retrieval, the AI Workspace, measured dashboard/analytics, and user administration. The public website, registration, application shell, and provider-pending states are also implemented. All frontend imports of the old mock fixtures have been removed.

The current validation baseline is 21 passing backend workflow/security tests, 4 passing frontend authorization tests, clean frontend lint and TypeScript checks, a successful Vite 8 production build, zero npm audit findings, and a real PostgreSQL Alembic upgrade through `f4201d8be76a` with no detected model/schema drift.

The live provider path is validated end to end: Gemini creates 768-dimensional document and query embeddings, Qdrant stores and retrieves tenant-filtered evidence, and Groq generates cited answers. Case editing and assignment, persisted AI interactions and feedback, inline Case intelligence, tenant-scoped global search, secure copy-link invitations, one-time password recovery, audit logs, SLA escalation, private notifications, access-controlled Case attachments, and optional authenticator-app MFA are implemented. SMTP delivery is optional: without it, authorized administrators can securely generate and share a 30-minute reset link from Users & Roles. Additional depth suitable for later milestones includes email invitation delivery and broader frontend component tests.

The sections below are retained as the original discovery audit. They describe the repository before the rebuild and are historical rather than the current implementation state.

## Enterprise authorization rebuild — started 2026-09-23

The role-based product rebuild now has its first production foundation:

- nine normalized system roles and 53 granular permission codes;
- persistent `roles`, `permissions`, `role_permissions`, and `user_roles` tables;
- backward-compatible migration of existing accounts into enterprise workspace roles;
- `/auth/me` and login responses with organization, roles, effective permissions, teams, and default workspace;
- reusable backend `require_permission()` enforcement and matching frontend permission helpers;
- Case list/detail authorization based on organization, ownership, assignment, and effective permissions;
- customer-safe Case serialization that removes internal notes at the API boundary;
- permission-scoped global search that prevents customer access to internal Memory and Documents.
- organization departments, teams, memberships, explicit Case access grants, and scoped Case visibility;
- secure seven-day, one-time invitation links that store only token fingerprints;
- public invitation preview and password setup followed by automatic role, permission, team, and workspace assignment;
- administration UI for creating and revoking pending invitations without requiring a paid email provider.

Existing-user role changes now replace the normalized backend role assignment and effective permissions rather than changing only a legacy label. The customer dashboard and analytics are also ownership-scoped, with internal Memory and Document metrics removed for unauthorized users.

Knowledge articles, Organizational Memory, Documents, global search, analytics, and both lexical and vector RAG retrieval are now team/department scoped. Published public Knowledge remains available to customers, while internal sources require both the relevant permission and organizational scope. Same-organization cross-team RAG isolation is covered by an automated security test.

A permission-aware Teams & Departments workspace now lets organization managers create departments and queues, assign or remove members, and lets team leads manage only teams they lead. Team listing and mutation scope is enforced by the backend.

Append-only organization audit events now record invitations, role and account-state changes, team and membership administration, Case lifecycle actions, document administration, Knowledge publishing, and Memory verification. A permission-protected Audit Log workspace supports chronological review and entity filtering. The next implementation slices are deeper role-specific dashboards, SLA/escalation workflows, and notifications.

Priority-based SLA policies now assign first-response and resolution deadlines, expose healthy/at-risk/breached state, backfill existing open Cases, record the first staff response, and support three retained escalation levels. Managers can configure targets in the SLA workspace, while authorized staff can escalate Cases with a required reason. The next implementation slices are notifications and deeper role-specific dashboards.

Persistent private notifications now cover Case assignment, public replies, escalation, and deduplicated SLA-risk/breach alerts. The application header displays unread state, and the notification center supports unread filtering, individual read state, and marking everything read. Recipient isolation is covered by an automated security test. The next implementation slice is deeper role-specific dashboards.

The authenticated home screen now requests a role-specific workspace dashboard. Customers see only their own request workload and published self-service content; agents see assignment and SLA queues; team leads and support managers see scoped operational load; Knowledge and AI managers see their respective review and ingestion queues; and administrators see access, structure, and audit readiness. Customer dashboard isolation is covered in the backend workflow suite.

Cases now support persisted PDF, text, Markdown, DOCX, PNG, and JPEG attachments up to the configured upload limit. Files inherit Case authorization for metadata and downloads, storage paths are tenant- and Case-scoped, content signatures are validated for common binary formats, and only the uploader or a Case administrator can remove a file. Cross-customer download isolation is covered by the backend workflow suite.

Every user can optionally enable standards-based TOTP MFA from Settings using an authenticator app. Enrollment requires the current password and an authenticator proof, secrets are encrypted at rest, ten one-time recovery codes are issued, login uses a five-minute challenge token, and previously accepted time steps cannot be replayed. MFA challenge tokens are explicitly rejected by normal authenticated endpoints, and enable/disable actions are recorded in the audit log.

Settings now supports self-service display-name updates and password rotation. A password change requires the current password, issues a replacement access token, increments the account's session version, and immediately invalidates every older access token. Profile and password changes are retained in the organization audit log.

Notification preferences are now persisted per user and enforced when assignment, reply, escalation, and SLA alerts are created. Account creation and last successful login timestamps are returned by the API and displayed in Settings. A browser-level workflow audit verified landing, login, role dashboard, Case creation, comments, status changes, global search, analytics, SLA policies, Settings, provider configuration, user administration, and audit history. That audit also found and fixed an analytics status mismatch where `in_progress` Cases were omitted from open-Case totals.

The frontend runtime is upgraded to React Router 7 and Vite 8. The production dependency audit reports zero vulnerabilities. Qdrant is running locally with the persisted `casemind_knowledge_gemini_768` collection and all shards ready.

## Executive summary

CaseMind is currently a polished frontend prototype attached to a very small authentication backend. The React application builds successfully and demonstrates most intended product areas, but its business data and AI behavior are generated from mutable in-memory fixtures. The FastAPI application contains working organization creation and basic JWT login code, while the Case, Knowledge, Memory, Chat, and RAG modules are empty shells. It is not yet a complete or production-ready application.

## Current repository architecture

- `frontend/`: React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Radix primitives, Recharts, and Zod.
- `backend/`: FastAPI, SQLAlchemy, Alembic, Pydantic, PostgreSQL-oriented models, and JWT/password helpers.
- `docs/`: extensive early product and architecture specifications. Several documents are much larger than the implementation and should be treated as design input, not as proof of delivered behavior.
- `ai/`, `rag/`, `architecture/`, `datasets/`, `deployment/`, `docker/`, `scripts/`, `shared/`, `tests/`, and `training/`: empty placeholder directories.

## Working

- The frontend production build passes (`npm run build`).
- The authenticated frontend shell, route-level code splitting, sidebar, top bar, permission helpers, error boundary, loading skeletons, reusable UI primitives, and responsive page layouts are implemented.
- Demo-quality screens exist for dashboard, cases (currently named tickets), case detail, organizational memory, knowledge, analytics, AI chat, settings, model monitoring, and users.
- Frontend form validation, query hooks, charts, empty states, badges, and several accessibility basics are present.
- SQLAlchemy models and an Alembic migration exist for organizations and users.
- Password hashing and signed access-token helpers are implemented.
- Backend routes exist for health, organization creation, registration, login, and current-user lookup.

## Partially working

- Authentication: backend primitives exist, but the frontend bypasses them and authenticates against hard-coded demo credentials. Session restoration and refresh-token behavior are not implemented.
- Authorization: frontend permission checks exist, but backend role enforcement is absent. UI checks are not a security boundary.
- Multi-tenancy: users contain an `organization_id`, but there are no tenant-scoped product queries to validate isolation.
- Case management: the UI supports listing, filtering, creation, status changes, comments, and deletion, but all operations mutate an imported JavaScript array and disappear on refresh.
- Knowledge, Memory, analytics, user administration, model monitoring, and AI workspace have designed screens but operate on fixtures.
- Database migrations cover only organizations and users.
- Dark mode is visually coherent, but the implementation effectively forces a single dark theme rather than delivering a complete theme system.

## Broken

- A clean backend environment cannot import the application from the declared requirements because `python-jose`, `passlib`, and `python-multipart` are missing.
- The backend defines two separate SQLAlchemy engines, session factories, and declarative bases (`app/core/database.py` and `app/db/database.py`). Models and dependencies use different modules, creating migration and runtime ambiguity.
- `alembic.ini` contains a committed local PostgreSQL username and password.
- Alembic does not read `DATABASE_URL` from the application settings, so migration and application connections can diverge.
- Several registered API routers contain no endpoints; the route surface implies functionality that does not exist.
- The API client expects error fields named `message`, `code`, and `details`, while FastAPI normally returns `detail`.
- The public root redirects into a protected dashboard. There is no marketing site, sign-up experience, or organization onboarding flow.

## Missing

- Persistent Cases, comments, events, assignments, attachments, SLAs, and resolution records.
- Document upload, validation, extraction, chunking, indexing, status tracking, and reprocessing.
- Qdrant client, collections, tenant filters, embeddings, semantic retrieval, hybrid retrieval, reranking, and retrieval evaluation.
- Provider-neutral AI interface, real AI analysis, citations, confidence signals, feedback, and prompt-injection boundaries.
- Persistent Knowledge and Organizational Memory entities and their evidence relationships.
- Evidence-backed AI workspace.
- Real analytics derived from stored events.
- Team invitations, role management, audit logs, integrations, notifications, and model governance.
- Backend tests for authentication, authorization, tenant isolation, and product workflows; frontend tests are also absent.
- Dockerfiles, Compose services, deployment configuration, and health/readiness checks for dependencies.
- Complete developer documentation and environment examples for the backend.

## Should keep

- React/Vite/TypeScript and FastAPI/SQLAlchemy/Alembic/PostgreSQL as the primary stack.
- A modular monolith rather than microservices.
- TanStack Query, the centralized API client, Zod form schemas, route lazy-loading, and the reusable component primitives.
- The existing information architecture and the strongest Case Detail, Memory, Knowledge, and Analytics visual concepts.
- Qdrant as the intended vector store once a real retrieval layer is implemented.
- Human review, source attribution, confidence display, and feedback as core product concepts.

## Should refactor

- Rename user-facing “Ticket” terminology to “Case” while providing API compatibility during migration.
- Replace all production-path fixture services with typed API repositories. Keep fixtures only behind an explicit demo/development flag.
- Consolidate backend database configuration and declarative metadata.
- Move authorization and tenant filtering into backend dependencies/services and test them directly.
- Split very large page components into feature-level panels and domain components.
- Replace generic AI chat behavior with a retrieval session model that returns structured answers and citations.
- Compute dashboard and analytics values from persisted events, not constants.

## Should remove

- Empty top-level placeholder directories until a concrete responsibility exists.
- Empty routers, services, schemas, and ML files that imply implemented capability. Replace them only as each real module is built.
- `backend/test_db.py`, which prints connection status rather than asserting behavior.
- Committed connection credentials and development SQL echoing.
- Demo password disclosure from the normal login screen outside an explicit demo mode.
- Duplicate auth paths (`LoginPage` directly reading fixtures and the unused `authService`).

## Technical debt

- The frontend domain contracts use camelCase and “ticket”; the backend has no corresponding contracts. A deliberate adapter layer is required.
- User roles are free-form database strings and public registration accepts a caller-selected role and organization, enabling privilege escalation.
- Email uniqueness is global rather than explicitly modeled per organization. This may be acceptable for identity, but it must be a conscious product decision.
- No updated/last-login/active fields or membership model exist.
- No pagination contract is implemented server-side.
- No test runner is configured in the frontend package.
- Large early specifications risk drifting further from executable behavior.

## Security risks

- Critical: database credentials are committed in `backend/alembic.ini`; rotate that password if it has ever been used outside a disposable local database.
- Critical: public registration accepts `organization_id` and `role`, allowing self-registration into another tenant and self-assignment of administrative roles.
- High: no backend authorization or tenant-scoped product access exists.
- High: no upload validation, size limits, safe filenames, MIME checks, or storage isolation exists because document ingestion is absent.
- High: no prompt-injection boundary exists because the AI pipeline is absent.
- Medium: access tokens are stored in local storage and no refresh/revocation strategy exists.
- Medium: no CORS policy, trusted-host configuration, rate limiting, structured audit events, or sensitive-data logging policy is implemented.
- Medium: role values and most input strings lack bounded validation.

## UX problems

- Visitors cannot learn what CaseMind is because there is no public website.
- The interface calls the central entity “Ticket” despite the desired CaseMind terminology.
- Screens present fixture metrics, AI answers, citations, model health, and memory activity as though they were live.
- The login page exposes demo passwords and displays an outdated 2024 copyright.
- There is no sign-up, onboarding, document area, global search, or command palette.
- Several pages are information dense but do not distinguish unavailable capability from empty real data.

## AI/RAG problems

- Every ML and RAG implementation file is empty.
- There is no embedding provider, vector schema, Qdrant configuration, chunking policy, metadata filtering, tenant enforcement, score threshold, deduplication, reranking, context builder, citation map, or insufficient-evidence behavior.
- AI analysis and chat responses are deterministic UI fixture logic rather than model output.
- Displayed confidence and quality values are invented fixture values rather than measured signals.

## Recommended architecture

Adopt the modular-monolith design in `TARGET_ARCHITECTURE.md`: one React application, one FastAPI application, PostgreSQL for transactional state, Qdrant for embeddings, and a small in-process/background-job boundary for ingestion and AI work. Every persistent and vector query must receive an authenticated organization context. AI output must be a structured, auditable result linked to retrieval events and citations.

## Recommended implementation order

1. Repair configuration, database metadata, authentication contracts, role enforcement, and test infrastructure.
2. Add the public website, registration/onboarding, durable session restoration, and truthful unavailable states.
3. Implement tenant-scoped Case persistence and connect the Case UI to the API.
4. Implement document storage and ingestion with explicit processing states.
5. Add Qdrant retrieval with mandatory tenant filters and retrieval tests.
6. Implement Organizational Memory and Knowledge on persisted evidence relationships.
7. Add provider-neutral AI analysis and AI Workspace responses with citations and insufficient-evidence handling.
8. Derive analytics, administration, audit logs, and feedback from real data.
9. Complete security, accessibility, responsive, performance, and deployment reviews.
