# Usability Workflow

This pass applies Nielsen's 10 usability heuristics to the workspace-centered RDTII flow.

## Workspace List

- System status is visible through loading, inline errors, and dismissible action status messages.
- Workspace source policies are shown in user-facing language instead of enum names.
- Archive is protected by confirmation, and recent archive actions can be undone.
- Search supports `/` focus and a clear search/filter control.
- Workspace creation is blocked until a name, at least one economy, and at least one pillar are selected.

## Workspace Dashboard

- Chat, source candidates, document extraction, and mapping jobs all report their latest action in a persistent status strip.
- The chat panel shows the active economies, pillars, and source policy so user requests are interpreted in context.
- Quick prompt chips reduce recall for common tasks such as finding official sources, running mapping, showing gaps, and exporting.
- Candidate cards use consistent badges and action controls for proposed, approved, ingesting, ingested, rejected, and failed states.
- Bulk candidate actions support efficient review while preserving invalid-action guards.
- Extraction method labels use plain language and OCR warnings explain when evidence needs review.
- The help panel describes the workspace workflow without taking users away from the dashboard.

## Recovery

- Failed API calls surface inline errors instead of silently continuing.
- Brave Search and OCR configuration issues should be reported in action-oriented language by the relevant backend response.
- `Esc` dismisses modal/help/status affordances, and icon-only controls include accessible labels.
