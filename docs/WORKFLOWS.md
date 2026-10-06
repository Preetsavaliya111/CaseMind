# Phase 1 workflows

Workflows are bounded, organization-scoped rules inside the existing modular monolith. They are available to organization admins and support managers through **Workflows** in the sidebar (also the profile menu on mobile).

## Supported behavior

- Events: `case.created`, `case.assigned`, `case.priority_changed`, `case.status_changed`, `case.resolved`.
- Equality conditions: existing priority, status, category, team and assignee. Tags support `contains`; tags are normalized to lowercase. All conditions must match the event's immutable post-change snapshot.
- Actions, in configured order: assign an active case-handling user, assign an active team, set a supported priority/status, add an internal note, notify one authorized internal user in-app.
- Limits: 50 workflows per organization, six conditions and five actions per workflow; names 100 characters, descriptions 500, notes 1,000, notification messages 300. Unknown fields, unsupported actions/events and invalid targets are rejected.
- Templates are disabled editable drafts. Saving a template does not activate it unless the enable checkbox is selected.

Creation with a supplied assignee emits both created and assigned events. Resolution emits both status-changed and resolved events. Unchanged assignment/priority/status does not emit another event. Automatic team selection at creation is part of the created snapshot, not a separate assignment event.

## Authority and visibility

`workflow.view` or `workflow.manage` plus organization-wide case access and internal-note permission are required for management and history. This phase is intentionally for organization managers; it is not a team-scoped workflow editor.

The **triggering actor** executes actions with current permissions and case visibility. The workflow owner's privileges are not borrowed. For example, a customer-created case can match a rule but cannot cause an assignment or internal note that the customer is not authorized to perform. An agent's status event cannot cause a priority change if the agent lacks that permission. A notification recipient must be active, internal, in the same organization, and able to view the case when the action runs. Action targets are revalidated at execution time.

Run history is restricted to currently accessible, unarchived cases. Internal-note contents are never returned to customers. Automated internal notes do **not** count as a first staff response for SLA tracking. Workflow priority changes use the existing SLA recalculation service; status changes use the shared lifecycle validation.

## Transactions and delivery

Case mutations persist a `case_events` record with actor, organization, case, event type, condition snapshot and candidate workflow IDs. Rules run synchronously before the case transaction commits. Each workflow executes in its own savepoint: if an action fails, all actions in that workflow roll back, while the original case update and a safe run outcome remain. Previously successful workflows on the same event are independent.

`workflow_runs` retains the event ID, actor, case, workflow revision, definition snapshot, executed action types/indexes, status, timestamps and safe failure codes. A PostgreSQL event-row lock serializes duplicate delivery, and the unique `(workflow_id, event_id)` constraint prevents duplicate runs. Idempotency applies to **event delivery**, not to repeated HTTP case-create requests. There is no client event-injection or replay endpoint.

Workflow-triggered changes suppress further workflow events through a session-local execution guard. An enabled rule cannot recursively trigger itself or another rule. Matching uses the original event snapshot; actions additionally check current case scope. Workflow edits use revision checks and return `409` for stale edits.

Audit events record creation, edits, enable/disable and execution results. Raw exception text, external responses and secrets are not stored as failure details. There are no external side effects, email actions, schedules, arbitrary expressions, code execution or autonomous AI tools in this phase.

## API

All paths are under `/api/v1/workflows` and require authentication.

| Method/path | Operation |
| --- | --- |
| `GET /` | List organization workflows (maximum 50) |
| `GET /options` | Valid organization users, teams and internal notification recipients |
| `POST /` | Create a validated workflow |
| `GET /{id}` | Read a workflow |
| `PUT /{id}` | Replace definition, with current `revision` |
| `PATCH /{id}/enabled` | Enable/disable, with current `revision` |
| `GET /{id}/runs?page=1&page_size=20` | Paginated current-scope run history (maximum page size 100) |

Disabled workflows retain their history. Workflow deletion and automatic history retention are not implemented. Define retention before large-scale operation. Failed/skipped runs are diagnostic records, not retry jobs; correct the rule or permissions and trigger a new legitimate case event.
