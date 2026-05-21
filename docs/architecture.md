# Architecture

The app is a Next.js 16 App Router application with route handlers for backend APIs and SQLite for local persistence.

Main layers:

- `src/app/workspaces`: workspace list and dashboard UI.
- `src/app/api`: workspace, chat, source-candidate, job, and export APIs.
- `src/server/db.ts`: SQLite schema, seed, and repository helpers.
- `src/server/search.ts`: Brave Search provider and real source-registry fallback.
- `src/server/agent.ts`: workspace-scoped chat orchestration.
- `src/server/ingestion.ts`: URL ingestion, HTML/PDF extraction, sparse-document OCR fallback.
- `src/server/ocr`: OCR provider selector with `none` and local `tesseract` providers.
- `src/server/rdtii.ts`: canonical Pillar 6/7 indicator model.

Every operational record is keyed by `workspaceId`.
