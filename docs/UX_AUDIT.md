# CaseMind UX Audit

## Scope

This audit covers the public landing page, authentication, application shell, first-use journey, Home, Cases, Ask CaseMind, Organizational Memory, Knowledge, Documents, Analytics, team/admin areas, shared forms, dialogs, tables, empty states, and responsive behavior.

## Baseline findings

### Navigation

- The sidebar exposed every operational area in one uninterrupted list.
- Labels such as **Evidence AI** and **Memory** did not explain their purpose to a new or non-technical user.
- Help was not a first-class destination.
- Permissions correctly hid restricted administration routes and must remain the source of navigation visibility.

### First-use experience

- Registration created a real organization and administrator, but first login opened the normal dashboard immediately.
- Onboarding state was not stored on the user, so a reliable cross-device setup flow was impossible.
- The empty dashboard and empty feature pages did not form a coherent getting-started journey.

### Terminology

User-facing copy included RAG, indexed documents, chunks, ingestion, retrieval, vector entries, provider/model names, evidence passages, and processing pipeline language. These terms describe implementation rather than user outcomes.

Replacement language:

| Internal language | Normal product language |
| --- | --- |
| RAG / retrieval | Search company knowledge |
| Indexed | Ready for AI search |
| Processing pipeline | Preparing your document |
| Chunks / passages | Sources available |
| Evidence Workspace | Ask CaseMind |
| Similarity score | Match strength |
| Memory Engine | Organizational Memory |
| Provider not configured | AI setup is not ready |

Technical terminology remains appropriate in AI Governance and explicitly expanded technical details.

### Information hierarchy

- Home emphasized operational metrics before obvious next actions.
- AI screens showed model details and numeric match percentages by default.
- Document status emphasized the processing implementation.
- Organizational Memory needed a one-sentence explanation for first-time users.

### Empty, loading, error, and success states

- Shared `EmptyState` provides a consistent base, but descriptions varied in how well they taught purpose and next action.
- Some errors stated failure without explaining what remained safe or what to try next.
- Loading language sometimes described system operations rather than the user-visible task.

### Design consistency

- Shared Button, Card, Input, Dialog, Badge, and table components provide good consistency.
- The previous palette was primarily monochrome and dark-first, while the requested product direction is cool-neutral, calm, light-first enterprise software.
- Page widths and headers vary; new work should use the shared page header and max-width rhythm documented in `DESIGN_SYSTEM.md`.

### Accessibility and responsive behavior

- Existing strengths: visible focus styles, skip link, Radix dialogs/selects, form labels, permission-aware mobile navigation, and reduced-motion support.
- Risks addressed: tour keyboard controls, viewport-aware tour placement, error text plus borders/icons, scrollable dialogs, and mobile onboarding layouts.
- Continued review: complex data tables on narrow screens and full screen-reader testing of dynamic AI answers.

## Implemented response

- Persistent per-user onboarding state with skip, resume data, restart, tours viewed, and checklist dismissal.
- Guided welcome, team context, simple product explanation, main-area introduction, real first-case creation, case guidance, knowledge prompt, and Organizational Memory explanation.
- Reusable accessible tour system with centralized definitions.
- Role-aware navigation and permission preservation.
- Help & Learning page and tutorial restart path.
- Real-data getting-started checklist.
- Command Center primary actions and attention-first greeting.
- Plain-language landing, login, AI, document, memory, and knowledge copy.
- Cool-neutral light-first design tokens; dark mode remains available.

## Follow-up review policy

Every new screen should answer: where am I, what is this, why does it matter, what should I do next, what did CaseMind find, why should I trust it, and where did the information come from?
