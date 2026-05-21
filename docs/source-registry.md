# Source Registry

Source discovery uses Brave Search when `BRAVE_SEARCH_API_KEY` is configured.

When the key is absent, source proposal uses only real seeded source registries and manual URLs. Unknown or low-confidence domains require approval before ingestion.

Candidate confidence is calculated from authority, relevance, primary-source, and freshness scores.

Approved candidates can be ingested. Ingestion extracts embedded HTML/PDF text first, then uses `OCR_PROVIDER=tesseract` when text is sparse or the source is an image.
