# CaseMind target architecture

## Architectural style

CaseMind should be a modular monolith. It has one deployable FastAPI backend and one React frontend, with PostgreSQL and Qdrant as infrastructure dependencies. This keeps module boundaries clear without creating operational overhead that a solo developer cannot justify.

## Runtime topology

```text
Browser
  -> React application
  -> FastAPI REST API
       -> PostgreSQL (transactional source of truth)
       -> Qdrant (derived semantic index)
       -> Object/file storage (uploaded source files)
       -> AI providers through an internal provider interface
       -> background task runner for ingestion and long AI jobs
```

PostgreSQL is authoritative. Qdrant entries and extracted document artifacts are rebuildable projections. A vector hit never grants access: its payload must contain `organization_id`, and the backend must apply that filter on every search.

## Backend modules

```text
backend/app/
  api/                 # HTTP transport and dependency wiring only
  core/                # settings, security, errors, logging
  db/                  # one engine, one session factory, one Base
  models/              # SQLAlchemy persistence models
  schemas/             # public request/response contracts
  modules/             # domain services and repositories
    auth/
    organizations/
    users/
    cases/
    documents/
    knowledge/
    memory/
    retrieval/
    ai/
    analytics/
    audit/
  providers/           # AI, vector, and file-storage adapters
  workers/             # bounded background jobs
```

During incremental migration, the current `services/` layout may remain. New behavior should still keep route handlers thin and organize business rules by domain rather than creating generic utility modules.

## Frontend architecture

```text
frontend/src/
  app/                  # providers, authenticated shell, public shell
  routes/               # route definitions and guards
  components/ui/        # domain-neutral accessible primitives
  components/common/    # shared product components
  features/             # product domains and their API adapters
  services/             # API client and transport concerns
  types/                # truly shared contracts only
  styles/               # design tokens and global rules
```

Feature services call the central API client. Components never import production data from `mocks/`. Demo fixtures may be selected only through an explicit development-only adapter and must be visibly labeled as demo data.

## Core relational model

- `organizations`: tenant boundary.
- `users` and, when needed, `memberships`: identity, role, and account state.
- `cases`, `case_comments`, `case_events`, `case_attachments`: support record and immutable activity history.
- `documents`, `document_versions`, `document_chunks`: upload state, extraction provenance, and chunk metadata.
- `knowledge_articles`: curated content and publication lifecycle.
- `memory_items`, `memory_sources`, `memory_relations`: reusable patterns, root causes, resolutions, workarounds, and evidence.
- `ai_analyses`, `ai_recommendations`, `citations`, `feedback`: auditable AI outputs and human decisions.
- `retrieval_events` and `retrieval_results`: measurable retrieval behavior and source use.
- `audit_logs`: security- and administration-relevant changes.

Every tenant-owned table has a non-null `organization_id` and an index beginning with that column for common access paths. Cross-tenant foreign keys must be prevented through service invariants and, where practical, composite database constraints.

## Authentication and authorization

- Public sign-up creates a new organization and its first administrator in one transaction.
- Existing-organization users are created through an authenticated invitation/admin flow.
- Passwords are hashed with a maintained password-hashing scheme.
- Short-lived access tokens include user and organization identity plus a token version/identifier.
- The backend resolves the current membership on every request; role checks are backend dependencies or domain policies.
- Frontend route guards improve UX but are never treated as enforcement.
- High-impact changes create audit records.

## Tenant isolation

The authenticated organization context is required by every Cases, Documents, Knowledge, Memory, Retrieval, AI, Analytics, and Administration service method. Repository methods accept `organization_id` as a required argument. Object-storage paths and Qdrant payload filters include the same tenant ID. Automated tests attempt cross-tenant reads, mutations, joins, vector searches, and guessed IDs.

## Case flow

```text
Create Case -> Case event -> optional AI analysis job
  -> retrieve tenant evidence
  -> store structured analysis + citations
  -> human accepts/modifies/rejects recommendation
  -> resolve Case
  -> candidate Memory Item
  -> human validation/publication
```

Case deletion should normally be soft deletion or archival. The activity timeline is append-oriented and records status, assignment, priority, resolution, and AI decision changes.

## Document ingestion

```text
Upload
  -> validate size, extension, detected MIME, and safe filename
  -> store source and create an `uploaded` record
  -> extraction job (`processing`)
  -> normalize and chunk
  -> embed in bounded batches
  -> upsert Qdrant points with tenant/security metadata
  -> mark `indexed`
```

Failures store a safe error category and remain visible as `failed`; the UI must never imply successful indexing. Reprocessing creates a new version or idempotently replaces the current derived index.

## Retrieval and RAG

1. Validate the user and organization context.
2. Normalize the question and derive filters without treating retrieved text as instructions.
3. Search allowed source types with mandatory tenant filters.
4. Apply score thresholds, deduplication, per-source limits, and optional lexical/vector fusion.
5. Rerank only when its measurable value justifies cost and latency.
6. Build a size-bounded context with stable citation identifiers.
7. Send system instructions, user question, and untrusted retrieved context in distinct prompt sections.
8. Return a structured answer with citations, retrieval metadata, and an explicit insufficient-evidence outcome.
9. Persist latency, model identity, retrieval results, citations, and user feedback without logging secrets or unnecessary sensitive text.

Suggested Qdrant payload fields: `organization_id`, `source_type`, `source_id`, `chunk_id`, `document_id`, `case_id`, `product`, `category`, `visibility`, `created_at`, and `version`.

## AI provider boundary

Business services depend on interfaces such as `ChatProvider` and `EmbeddingProvider`, not a vendor SDK. Configuration selects a server-side provider/model. API keys remain server-side. Provider errors map to stable application errors and do not leak secrets. Deterministic fakes are used in tests only.

## API conventions

- Base path: `/api/v1`.
- Plural resources: `/cases`, `/documents`, `/knowledge-articles`, `/memory-items`.
- Consistent pagination: `items`, `page`, `page_size`, `total`, `pages`.
- Stable structured errors: `code`, `message`, optional field `details`, and request ID.
- Expensive operations return a job or processing resource rather than holding an HTTP request indefinitely.

## Background work

Start with FastAPI background tasks or a small database-backed worker abstraction for local development. Move to a dedicated queue only when retry, concurrency, durability, or deployment measurements require it. Jobs must be idempotent and record status, attempts, timestamps, and safe failure details.

## Observability

- Structured logs with request ID, organization ID, user ID, module, outcome, and latency where appropriate.
- Never log passwords, tokens, provider keys, full uploaded documents, or full AI prompts by default.
- Health endpoint for process health; readiness endpoint for PostgreSQL and optionally Qdrant.
- Measured operational, retrieval, and AI metrics. No invented quality scores.

## Deployment model

- Frontend static build served by a web host/CDN.
- One FastAPI container and one worker container from the same backend image when durable jobs are introduced.
- Managed or containerized PostgreSQL and Qdrant.
- Environment-specific configuration with secrets supplied outside version control.
- Alembic migrations run as an explicit release step.

## Quality gates

- Frontend: formatting, lint, strict typecheck, unit/component tests, production build.
- Backend: formatting/lint, type checks for core modules, unit/integration tests, migration upgrade test, import/startup test.
- Security: tenant-isolation tests, role matrix tests, upload abuse tests, dependency scanning, and secret scanning.
- AI/RAG: retrieval fixture evaluation, citation mapping tests, empty-evidence tests, prompt-injection regression cases, and latency/failure tracking.

