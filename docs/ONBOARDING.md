# CaseMind Onboarding

## Entry and persistence

New account owners and invited users receive `onboarding_completed = false`. Existing users are preserved as completed during migration. Onboarding progress is stored on the backend, so it follows the user across devices.

Persisted state:

- current onboarding step;
- completion state;
- setup answers and first-case identifier;
- viewed product tours;
- getting-started checklist dismissal.

## First registration flow

1. Create the organization and administrator account.
2. Sign in, including MFA when enabled.
3. Route incomplete users to `/onboarding`.
4. Save progress after each completed step.
5. Route completed or skipped users to Home.

## Guided setup

1. **Welcome:** explains CaseMind in one outcome-focused sentence.
2. **Team context:** optional team size, primary role, and support goal. These answers personalize emphasis and never grant permissions.
3. **How it works:** issue → related knowledge → suggestion with evidence → reviewed reusable solution.
4. **Main areas:** introduces Cases, Ask CaseMind, Organizational Memory, Knowledge, Documents, Analytics, and Team.
5. **First case:** creates a real case through the existing API; no sample result is fabricated.
6. **Case guidance:** explains information, activity, assistant, similar cases, evidence, and resolution.
7. **Add knowledge:** records whether the user intends to upload a document, create an article, or continue later.
8. **Organizational Memory and readiness:** explains the concept and completes setup.

Users may skip and explore. The saved step is retained in onboarding data, and the full tutorial can be restarted from Help & Learning.

## Product tours

Tour definitions are centralized in `frontend/src/features/onboarding/tours.ts`. The reusable tour supports targeted elements, viewport-aware placement, a dark overlay, progress, Back, Next, Skip, Finish, Escape, and arrow-key navigation.

Available tours:

- main workspace;
- Organizational Memory;
- Knowledge;
- Ask CaseMind.

A completed tour does not automatically reopen. Users can launch the main tour from Help & Learning.

## Role-based emphasis

Permissions remain authoritative. Onboarding role selection is descriptive only.

- Agents: Cases, suggestions, evidence, and resolution.
- Managers: attention queues, team workload, Analytics, recurring issues, and knowledge gaps.
- Administrators: organization, invitations, roles, teams, service levels, security, and AI Governance.
- Knowledge roles: articles, documents, review, and Organizational Memory.
- Customers: their cases and published knowledge only.

## Getting-started checklist

Home shows real progress for new organizations:

- account created;
- first case created;
- trusted knowledge added;
- first CaseMind question asked;
- teammate invited.

The checklist uses server-backed counts, hides when complete, and can be dismissed permanently per user.

## Returning users

Completed onboarding does not repeat after logout/login. Completed contextual tours remain closed. Users can restart guided setup from Help & Learning or reach tutorials through Settings.
