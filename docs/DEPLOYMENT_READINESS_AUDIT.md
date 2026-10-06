# Deployment readiness audit

Date: 2026-10-03. **Production NO-GO** until all release gates below are resolved. No production host or release authorization was supplied or found in repository configuration.

## Initial evidence

- `git status --short`, `git diff --stat`, `git log --oneline -5`, `git diff --ignore-space-at-eol --stat`: completed; pre-existing 151 modified files are line-ending-only relative to HEAD.
- Backend: `DATABASE_URL=sqlite:// SECRET_KEY=<test-only value> GROQ_API_KEY= GEMINI_API_KEY= SMTP_HOST= /tmp/omnirush/casemind-venv/bin/python -m pytest -q`: **22 passed**. No real credentials or production database used.
- Initial `npm test`: failed at startup because the existing installed dependencies lack Linux Rolldown bindings.
- Initial `npm run lint`: timed out after 120 seconds on the mounted filesystem; subsequent chained TypeScript command did not run.
- Python lacked pip/ensurepip; an isolated `/tmp/omnirush/casemind-venv` was bootstrapped using official pip tooling and repository requirements installed successfully.
- Docker CLI/runtime unavailable in this WSL environment. Container builds not yet verified.

## Discovery gaps

| Category | Status at discovery |
| --- | --- |
| Dockerfiles and production Compose | Not implemented |
| Frontend production API routing | Partially implemented; configurable but localhost fallback |
| Strong production configuration | Partially implemented; 32-character minimum only; no origin/host/environment policy |
| Liveness/readiness | Static liveness only; no database/schema readiness |
| Migrations | Implemented, not reverified against PostgreSQL in this session |
| CI/CD | Not implemented; `.github/workflows` empty |
| Persistent services | Local DB/vector volumes exist; uploads rely on local paths; no production plan |
| Backups/recovery | Not implemented or rehearsed |
| Hosting/TLS/DNS | Blocked on hosting decision; no release authorization |
| AI/SMTP | Code exists; live checks blocked on explicitly configured services |

## Release gates

- Passing code, migration and production image checks on the release revision.
- Approved deployment target, HTTPS ingress, exact origins/hosts and protected environment secrets.
- Private services and durable document path; tested PostgreSQL, vector and file backups with retention, restore ownership and recovery objectives.
- Live health/readiness and authenticated smoke checks on the selected staging target.
- Ingress abuse controls and operational monitoring; documented ingestion recovery limitations.

## Delivered preparation

- Premium public redesign, authentic sample labeling, auth-aware links, mobile/keyboard navigation, reduced motion and metadata.
- Persistent Phase 1 workflows/events/runs, permission-checked internal actions, atomic savepoints, organization boundaries, revision checks, audit history and bounded Workflows editor/templates/history.
- Production policy validation, trusted hosts, separate live/ready checks, database connection timeout, private persistent Compose, Dockerfiles, secret-excluding build contexts, same-origin frontend routing, Nginx headers and initial auth throttling.
- PR/main CI for frontend/backend/migrations/browser/image checks; protected manual image build/publish preparation. No hosting-specific CD or public release.
- `DEPLOYMENT.md`, `WORKFLOWS.md`, current audits/roadmap, aligned README and a maintenance-window backup helper. Backup execution and recovery remain release gates.

## Final executed checks

Commands below were executed from the indicated directory. The Python environment is isolated under `/tmp/omnirush`; no application `.env` was changed. Test configuration clears real provider settings. GitHub-hosted CI has not been run, and these local results are not a claim that every new workflow job has passed on GitHub.

| Directory | Exact command/check | Result |
| --- | --- | --- |
| `backend/` | `/tmp/omnirush/casemind-venv/bin/python -m pytest -q` | **64 passed**, two Starlette deprecation warnings from the existing 422 constant. Includes 26 automation and 16 production-policy/readiness tests. |
| `backend/` | `/tmp/omnirush/casemind-venv/bin/pip check` | **Passed**, no broken requirements. |
| `frontend/` | `npm test` | **13 passed**, three files. Script uses `vitest run src --pool=threads --maxWorkers=1`. |
| `frontend/` | `npm run lint` | **Passed**, zero warnings allowed. |
| `frontend/` | `npm run type-check` | **Passed**. |
| `frontend/` | `npx tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck playwright.config.ts e2e/landing.spec.ts e2e/workflows.spec.ts` | **Passed**, browser/config TypeScript checked separately. |
| `frontend/` | `VITE_API_BASE_URL=/api/v1 npm run build -- --outDir .release-dist` | **Passed**, Vite production build, 2,592 modules. Separate ignored output preserves the pre-existing tracked `dist/` work. |
| `frontend/` | `npm ci --dry-run --ignore-scripts --no-audit --no-fund` | **Passed**, lockfile/install consistency; this is a dry run, not a fresh CI install. |
| `backend/` | `ENVIRONMENT=test DATABASE_URL=postgresql+psycopg2://casemind_test@127.0.0.1:55432/casemind_test SECRET_KEY=test-secret-key-with-at-least-32-characters /tmp/omnirush/casemind-venv/bin/python scripts/verify_migrations.py` | **Passed** on disposable native PostgreSQL **18.6**: full upgrade, existing-role permission backfill, latest-revision downgrade/re-upgrade, no drift twice. Production/CI reference version is 16, which still needs its CI run. |
| `backend/` | Same test environment as above, `/tmp/omnirush/casemind-venv/bin/python scripts/verify_workflows_postgres.py` | **Passed**, real authenticated workflow execution and simultaneous duplicate-event delivery produce one run per event. Repeated after final case-service changes. |
| Root | `/tmp/omnirush/casemind-venv/bin/python scripts/validate_release_config.py` | **Passed**, private ports, persistent mounts, image build contexts and configuration invariants. |
| Root | `/tmp/omnirush/casemind-venv/bin/python scripts/validate_release_config.py --compose --compose-bin /tmp/omnirush/docker-compose` | **Passed**, actual Compose v2.40.3 `config --quiet` with generated disposable file references, no real secret resolution/output. |
| Root | `/tmp/omnirush/casemind-venv/bin/python -m compileall -q scripts backend/scripts` | **Passed**, script syntax only; not backup execution. |
| Root | `git -c core.whitespace=cr-at-eol diff --check --ignore-space-at-eol` | **Passed**, accounting for preserved pre-existing CRLF. No persistent Git configuration changed. |

Production browser command, from `frontend/`:

```bash
LD_LIBRARY_PATH=/tmp/omnirush/casemind-system/usr/lib/x86_64-linux-gnu \
CASEMIND_TEST_PYTHON=/tmp/omnirush/casemind-venv/bin/python \
CASEMIND_BROWSER_PRODUCTION=1 CASEMIND_BROWSER_BUILD_DIR=.release-dist \
CASEMIND_BROWSER_API=1 npm run test:browser
```

**4 passed**: public page at 390, 768 and 1440 pixels; login with a new disposable organization, auth-aware public CTA, real workflow creation/enabling, actual case-triggered note, run history and case-detail navigation. Checks capture console/page errors and HTTP errors; public checks also capture failed requests, reduced motion, mobile Escape/focus, FAQ, sign-in links and horizontal overflow. No such errors were observed. Screenshots were generated under ignored `frontend/test-results/` and desktop/mobile captures inspected. Browser execution used the production bundle via Vite preview, **not the unbuilt Nginx container**.

## Initial failures and resolutions

- Existing Windows-oriented frontend installation lacked Linux native bindings: `npm install --no-audit --no-fund` installed the required dependencies and Linux binding; lockfile updated without deleting user files.
- Mounted-filesystem Vitest fork startup timed out. Thread pool with one worker completed all 13 tests; that setting is in the normal test command.
- Chromium initially lacked system libraries; official Ubuntu packages were extracted to an isolated `/tmp/omnirush/casemind-system` prefix. No privileged OS changes were made.
- Browser checks caught a Tailwind layer import error; scoped marketing CSS was corrected, then all viewport checks passed. Test selectors and one TypeScript test option were corrected before final passes.
- New automation tests exposed administrator/customer misclassification in existing case edits; the permission check was fixed. A test assumption about initial team assignment was corrected to match actual organization onboarding.
- Plain `git diff --check --ignore-space-at-eol` treated pre-existing CRLF as trailing whitespace. The CRLF-aware invocation above passed; existing line-ending changes were retained.

## Not executed / unresolved

| Check or dependency | Why / what is needed |
| --- | --- |
| Docker production image builds and container runtime smoke checks | WSL Docker runtime/integration unavailable. Enable it or run the added CI image jobs; Compose validation is not an image build. |
| GitHub Actions execution / image publishing | Workflows added locally; nothing committed, pushed, dispatched or published. Review changes, configure Environment protection and run CI on the chosen revision. |
| Live Groq/Gemini/Qdrant and SMTP | No approved test-service configuration used. Mock provider tests do not prove live availability. Configure services and run non-sensitive staging smoke tests. |
| Backup/restore, persistent host volumes, storage migration | Helper/runbook exist, but no selected host, off-host encrypted backup destination, retention/scheduler, storage migration rehearsal or proven RPO/RTO. |
| Production TLS/ingress, real-IP throttling, monitoring and database role policy | Host-specific configuration and operating owner required. Reference settings are preparation, not a deployed guarantee. |
| Durable background ingestion | In-process tasks can be interrupted. Recovery/drain instructions documented; durable worker and retry scheduling remain unfinished. |

## Assessment

**GO for code review and host-specific staging preparation. NO-GO for public production release.** The public page and bounded Phase 1 automation are implemented and locally verified. Release-critical hosting, secret configuration, durable storage, tested backups and container/target-environment checks remain unresolved. Existing development data, local configuration and user changes were preserved; no public deployment, DNS change or data publication occurred.

## Post-audit hardening update

The subsequent hardening pass added backend logout/token-version revocation, account-version-bound MFA challenges, timing-consistent login failure handling, stricter visibility-aware content scope, customer-safe escalation serialization, published-only AI Knowledge retrieval, provider citation-key validation, structured request logs with response request IDs, and frontend logout plus Knowledge publish permission alignment. Direct regression coverage now reports **67 backend tests passed**. Frontend lint, TypeScript, production build and **13 component tests** pass; the component test command uses a single worker with file parallelism disabled because the mounted WSL filesystem can time out concurrent Vitest workers.

These changes improve code-review readiness but do not change the release assessment. Docker runtime/builds, GitHub-hosted CI, live providers, backup/restore rehearsal, host-specific TLS/monitoring, durable document workers and a selected deployment target remain unverified.

## Local production-container rehearsal — 2026-10-06

Docker Desktop was started through the Windows Docker CLI and the standalone Compose reference was exercised with disposable credentials and isolated `casemind-rehearsal` volumes. This is local infrastructure evidence, not a hosted staging deployment.

| Check | Result |
| --- | --- |
| Docker Desktop Linux engine | Passed; Docker 29.8.0 / Compose 5.5.1 |
| Backend/frontend image build | Passed; `casemind-backend:stage`, `casemind-frontend:stage` |
| PostgreSQL | Passed; PostgreSQL 16 container healthy |
| Alembic release migration | Passed; all revisions through `a203e718c901` |
| Backend readiness | Passed; database, schema, storage and Qdrant all true |
| Frontend Nginx/API proxy | Passed; `/healthz`, `/api/v1/health/live`, headers and request IDs verified |
| Qdrant authentication | Passed; private authenticated access and 768-dimensional synthetic vector contract |
| Persistence across restart | Passed; Case, document, attachment and schema head retained after backend/frontend restart |
| Core HTTP security workflow | Passed; eight role invitations, cross-tenant denial, customer-safe Case output, Memory verification, workflows, password reset and logout |
| Rate limiting | Passed; 35 rapid login attempts produced 12 `401` and 23 `429` responses |
| Production-container browser suite | Passed; 4/4 Playwright tests at 390/768/1440px plus authenticated workflow through Nginx |
| PostgreSQL migration rehearsal | Passed; disposable `casemind_test` full upgrade, permission backfill, downgrade/re-upgrade and drift check |
| PostgreSQL workflow concurrency | Passed; concurrent delivery produced one workflow run |
| Backup | Passed; PostgreSQL dump, documents archive and Qdrant snapshot with manifest hashes |
| Restore rehearsal | Passed in isolated `casemind-recovery`; restored users, Cases, Knowledge, verified Memory, workflow history, files and Qdrant collection dimension/points |

The browser suite ran in the official Playwright container because the host WSL environment lacks Chromium's `libnspr4.so`. Groq and Gemini credentials were intentionally disabled for this rehearsal. Qdrant retrieval was tested with synthetic 768-dimensional vectors; no live embedding or generation success is claimed.

The backup helper now accepts `--project-name` for isolated Compose rehearsals. The completed rehearsal artifacts were stored outside the repository with owner-only permissions during execution; no raw provider or deployment secret was included in the repository.

After verification, the disposable `casemind-rehearsal` and `casemind-recovery` Compose projects, volumes, generated credentials and temporary recovery scripts were removed. The built stage images remain available locally for repeatable validation.
