# CaseMind Design System

## Brand personality

Professional, trustworthy, calm, modern, intelligent, and approachable. The product is simple on the surface and powerful underneath.

## Color tokens

The UI uses semantic CSS variables rather than feature-specific hex values.

- Background: cool gray near `#F6F8FA`.
- Surface: white.
- Secondary surface: slate near `#F1F5F9`.
- Border: slate near `#E2E8F0`.
- Foreground: navy near `#0F172A`.
- Muted text: slate near `#64748B`.
- Primary: deep blue near `#2563EB` for primary actions and active navigation.
- Intelligence accent: restrained teal near `#0F766E` for AI-specific meaning.
- Success, warning, danger, and information colors communicate state only.

Target distribution: 70% neutral/white, 20% structural slate, 10% brand and semantic accents. Dark mode maps the same semantic tokens to accessible cool-neutral values.

## Typography

Inter is the primary display and body family. IBM Plex Mono is reserved for identifiers and optional technical detail.

- Page title: 28–32px, semibold.
- Section title: 18–22px, semibold.
- Card title: 14–16px, semibold.
- Body: 14–16px.
- Metadata: 12–13px; 10px is limited to short uppercase eyebrow labels.

## Spacing, radius, and shadows

- Base spacing follows a 4px scale.
- Page padding: 20px mobile, 24–32px desktop.
- Card gap: 12–24px according to density.
- Default radius: 10px; small controls use 6–8px.
- Cards use a 1px border and subtle shadow. Avoid glassmorphism, heavy gradients, and dramatic floating surfaces.

## Components

### Buttons

- Primary: filled blue; one obvious primary action per area.
- Secondary: white/neutral with border.
- Tertiary: ghost/text.
- Destructive: red only for destructive work.
- Loading disables repeated submission and retains the action label.

### Inputs

Every control has a visible label. Required fields are marked. Invalid fields use a red border, visible error line, and `aria-invalid`; color is never the only signal.

### Cards and tables

Cards group one concept. Tables show only decision-relevant columns, keep row actions labeled or tooltipped, and provide a teaching empty state.

### Status badges

- New/information: blue.
- Investigating/warning: amber.
- Waiting: neutral.
- Resolved/success: green.
- Closed: slate.
- Error/destructive: red.

### AI confidence and match strength

Normal view uses High, Medium, or Low confidence and Very strong match, Strong match, or Related. Raw scores, model names, latency, source IDs, and retrieval settings belong in collapsed technical details.

## Content states

- Empty: explain what the feature is, why it helps, and the next action.
- Loading: describe the user task, such as “Searching your organization’s knowledge…”
- Error: explain what happened, what remains safe, and what to do next.
- Success: confirm the outcome and the next useful action.

## Accessibility

- Meet WCAG AA contrast for text and controls.
- Preserve visible keyboard focus and the skip link.
- Use native labels and Radix accessibility behavior for dialogs/selects.
- Provide keyboard control and Escape for tours.
- Respect reduced-motion preferences.
- Do not communicate state using color alone.
- Keep dialog actions reachable within a viewport-height scroll container.

## Responsive rules

Start with a single-column mobile layout. Move to two or more columns only when content remains readable. Bottom navigation supplies the core destinations on mobile. Tours become bottom cards on narrow screens and never rely on off-screen tooltips.
