# CaseMind

CaseMind is an AI-powered support intelligence and organizational memory platform. It connects support Cases, documents, root causes, prior resolutions, and human decisions so recurring problems can be solved with evidence instead of repeated investigation.

## Current implementation

The modular-monolith application includes:

- a responsive public product website;
- organization and administrator registration;
- one-time password recovery with optional SMTP delivery and an administrator link fallback;
- JWT login and current-session restoration;
- a protected application shell with role-aware navigation;
- tenant-scoped Case persistence, filtering, editing, assignment, status changes, comments, and archival;
- secure document upload, extraction, chunking, status tracking, embedding, and Qdrant indexing;
- evidence-linked Organizational Memory with draft and verification workflows;
- curated Knowledge articles with draft, version, publishing, and archival lifecycles;
- a hybrid, tenant-filtered retrieval service, inline Case intelligence, an evidence-backed AI Workspace, citations, and persisted feedback;
- tenant-scoped global search across Cases, Memory, Knowledge, and Documents;
- real Command Center and Analytics aggregates instead of fixture metrics;
- tenant-scoped user administration and truthful AI configuration reporting;
- normalized enterprise roles and permissions with backend-enforced Case ownership and customer-safe serialization;
- organization-scoped Phase 1 workflows with case events, internal actions, atomic run history and permission checks;
- PostgreSQL migrations and SQLite-based API tests;
- production Dockerfiles, a private-network Compose reference, readiness checks and GitHub Actions CI;
- a documented target architecture for Documents, Knowledge, Organizational Memory, retrieval, and AI.

Provider-backed answering and semantic indexing require server-side Groq/Gemini configuration and Qdrant. Without them, the product reports unavailable/pending states. Provider terms, availability and cost depend on your accounts; no free-service or performance guarantee is implied.

**Release status: production NO-GO pending host selection, production secrets/storage/backup configuration and release-environment verification.** See the current [implementation audit](docs/INDUSTRY_EXPANSION_AUDIT.md), [roadmap](docs/INDUSTRY_ROADMAP.md), [deployment evidence](docs/DEPLOYMENT_READINESS_AUDIT.md), [deployment runbook](docs/DEPLOYMENT.md) and [workflow contract](docs/WORKFLOWS.md). Older reports under `docs/` are historical, not proof of the current release.

## Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Radix UI
- Backend: FastAPI, Pydantic, SQLAlchemy, Alembic
- Transactional database: PostgreSQL
- Semantic index: Qdrant
- Architecture: modular monolith

## Prerequisites

- Node.js 24 (used by CI and production build)
- Python 3.14 (used by CI and production image)
- PostgreSQL 16 (or Docker)
- Qdrant (local executable or Docker) for document retrieval

## Local setup

### 1. Start infrastructure

```bash
docker compose up -d postgres qdrant
```

Docker is optional. Existing native PostgreSQL and Qdrant services work as long as `DATABASE_URL` and `QDRANT_URL` point to them. The database named in `DATABASE_URL` must exist; Alembic creates and updates the application tables.

### 2. Configure and run the backend

From `backend/`, copy `.env.example` to `.env` and replace the local password and secret.

```bash
python -m venv venv
./venv/Scripts/pip install -r requirements.txt
./venv/Scripts/alembic upgrade head
./venv/Scripts/uvicorn main:app --reload
```

On macOS/Linux, use `venv/bin/...` instead of `venv/Scripts/...`.

The API is available at `http://localhost:8000`; interactive docs are at `http://localhost:8000/docs`.

### 3. Configure and run the frontend

From `frontend/`, copy `.env.example` to `.env`, then run:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`, create a workspace, then sign in.

## Environment variables

Backend:

- `DATABASE_URL`: SQLAlchemy database URL.
- `SECRET_KEY`: random secret of at least 32 characters in development, at least 64 in staging/production.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: access-token lifetime.
- `CORS_ORIGINS`: comma-separated allowed frontend origins.
- `LOG_SQL`: enables SQL statement logging for local diagnosis only.
- `DOCUMENT_STORAGE_PATH`: local or mounted private document storage path.
- `MAX_UPLOAD_BYTES`: server-side upload limit.
- `PROCESS_DOCUMENTS_INLINE`: useful for deterministic local development; otherwise in-process background tasks. Durable queue/recovery is not implemented.
- `GROQ_API_KEY` and `GROQ_CHAT_MODEL`: server-side Groq credential and answer model.
- `GEMINI_API_KEY`, `GEMINI_EMBEDDING_MODEL`, and `GEMINI_EMBEDDING_DIMENSIONS`: server-side Gemini embedding configuration.
- `QDRANT_URL`, `QDRANT_API_KEY`, and `QDRANT_COLLECTION`: semantic index configuration.

Frontend:

- `VITE_API_BASE_URL`: API base URL, including `/api/v1`.
- `VITE_APP_NAME` and `VITE_APP_VERSION`: display/build metadata.

## Quality checks

```bash
# frontend
npm run lint
npm run type-check
npm test
npm run build

# backend
python -m compileall app main.py
pytest -q

# optional live provider check while the local API is running
python scripts/verify_live_stack.py
```

The backend suite uses isolated SQLite and mocked providers; it cannot certify production service availability. For PostgreSQL migration validation, provision an **empty disposable** database whose name ends in `_test`, set `ENVIRONMENT=test`, `DATABASE_URL` and a test-only `SECRET_KEY`, then run `python scripts/verify_migrations.py` and `python scripts/verify_workflows_postgres.py` from `backend/`. The migration script refuses existing tables and rehearses the latest downgrade only on that disposable database.

Browser checks: install Python backend dependencies and run `npx playwright install --with-deps chromium` from `frontend/`, then `CASEMIND_BROWSER_API=1 npm run test:browser`. This starts a temporary local API and tests login, workflow creation/execution/history and public layouts at 390/768/1440px. Use `CASEMIND_TEST_PYTHON` if Python is in a virtual environment. Build first and add `CASEMIND_BROWSER_PRODUCTION=1` to test the production bundle. See the release audit for exact executed commands and limits.

## Repository map

```text
frontend/        React application and design system
backend/         FastAPI API, domain services, models, and migrations
docs/            product documentation plus current/target architecture
compose.yaml     local PostgreSQL and Qdrant services
compose.production.yaml  host-neutral production reference
.github/workflows/       CI and manually gated image preparation
```

## Security notes

- Never commit `.env` files or provider credentials.
- Public sign-up always creates a new organization and an initial administrator; it cannot select an existing tenant or arbitrary role.
- Tenant-owned Case queries are filtered by the authenticated organization in the backend.
- Retrieved documents are treated as untrusted context, separated from system instructions, and tenant-filtered before prompt construction.
- No compliance certification is claimed by this project.

