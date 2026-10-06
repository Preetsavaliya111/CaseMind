# Architecture

CaseMind is a modular monolith. React/Vite serves the browser application; FastAPI exposes the API; SQLAlchemy and Alembic manage PostgreSQL persistence; Qdrant stores document vectors; private filesystem storage holds documents and Case attachments; Groq generates answers and Gemini creates embeddings when configured.

## Request path

The browser authenticates with a short-lived bearer JWT and calls `/api/v1`. The API derives organization ownership from the authenticated user. Services apply permission, organization, team and department scope before returning records. The frontend only controls presentation and navigation; it is never the authorization boundary.

## Intelligence path

Documents are validated, stored, extracted, chunked and optionally embedded. AI retrieval combines permission-filtered lexical Case/Memory/Knowledge/document candidates with tenant-filtered Qdrant candidates. Vector hits are rehydrated through SQL access rules, deduplicated and ranked. The provider receives evidence as untrusted data and must return citations keyed to supplied sources. Human verification is required before Memory is treated as trusted organizational knowledge.

## Transactions

Case changes, audit entries and bounded Phase 1 workflow execution share the request transaction. Each workflow action set uses a savepoint, current actor permissions are rechecked and duplicate event delivery is guarded by database keys. Workflow actions cannot recursively emit more workflow events.

## Deployment boundary

The reference Compose stack places PostgreSQL and Qdrant on a private network, publishes only frontend Nginx to localhost, mounts documents persistently and runs backend/frontend with reduced privileges. A real HTTPS ingress, secrets manager, persistent host, backups, monitoring and release owner are still required for deployment.
