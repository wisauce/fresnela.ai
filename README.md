# Fresnela.ai RDTII Evidence Workspace

AI-assisted regulatory evidence workspace for the Regional Digital Trade Integration Index (RDTII). The app is now organized around CRUD-able workspaces: every source candidate, chat message, job, mapping, alert, version, and export is scoped to a `workspaceId`.

## Implemented Vertical Slice

- SQLite-backed workspace persistence with first-run seed data.
- 102 RDTII-economy metadata seed.
- Canonical Pillar 6 and Pillar 7 indicator definitions.
- Workspace CRUD APIs and `/workspaces` UI.
- Workspace-scoped chatbot entrypoint.
- Brave Search source discovery with real source-registry fallback when `BRAVE_SEARCH_API_KEY` is absent.
- Source candidate proposal, approval, rejection, and ingestion-state APIs.
- Provider-backed analysis runs, evidence mappings, score suggestions, alerts, versions, and JSON/CSV workspace exports.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000/workspaces`.

## Environment

Create `.env.local` when provider-backed search or mapping is needed:

```env
DATABASE_URL=file:./data/fresnela.sqlite

BRAVE_SEARCH_API_KEY=

AI_PROVIDER_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_API_KEY=
AI_PROVIDER_MODEL=gpt-4.1-mini

OCR_PROVIDER=none # none | tesseract
OCR_PROVIDER_API_KEY=
```

Without `BRAVE_SEARCH_API_KEY`, source discovery uses only real seeded source registries and manual URLs. It does not create fake official-looking URLs.

## Demo Flow

1. Go to `/workspaces`.
2. Create a workspace such as `Thailand Pillar 7 Review`.
3. Open the workspace.
4. Ask the agent: `Find Pillar 7 official sources`.
5. Approve or reject proposed source URLs.
6. Ingest an approved candidate to extract HTML/PDF text or run OCR when configured.
7. Run mapping. If `AI_PROVIDER_API_KEY` is missing, the app creates a failed job and alert with a configuration message; if configured, it creates grounded mappings for review.
8. Export JSON or CSV.

## Usability And Workflow Guide

- The workspace list shows loading, error, success, archive, duplicate, and restore states inline. Use `/` to focus search, and clear filters when results look too narrow.
- Workspace creation is guarded before submission: name, at least one economy, and at least one pillar are required.
- Archiving asks for confirmation and can be undone by restoring the previous workspace status.
- Inside a workspace, the status strip records the latest chat, source, ingestion, export, or mapping action with a timestamp.
- Chat is scoped to the visible workspace context: economies, active pillars, and source policy are shown above the prompt box.
- Source candidates use consistent status badges and action rules. Proposed sources can be approved or rejected; rejected, failed, and in-progress candidates are protected from invalid ingestion actions.
- Confidence and OCR labels use domain language: source confidence is a ranking aid, embedded text means text extracted from the document, and OCR means text recovered from scanned pages.
- Quick prompt chips cover common tasks: find Pillar 6/7 sources, run mapping, show gaps, and export.
- Keyboard affordances: `Ctrl+Enter` sends chat, `Esc` closes help/status panels, and modal controls have visible close buttons.
- Help popovers and the workspace help panel explain source policy, source confidence, OCR extraction, RDTII indicators, and export contents without crowding the main workflow.

## Current Limits

HTML/PDF text extraction, local Tesseract OCR, source registry fallback, provider-backed mapping, mapping review, score suggestions, version snapshots, and exports are implemented. Real AI mapping requires `AI_PROVIDER_API_KEY`; without it, the app reports the missing configuration truthfully.
