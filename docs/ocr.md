# Local OCR

OCR is configured with:

```env
OCR_PROVIDER=none # none | tesseract
OCR_PROVIDER_API_KEY=
```

`none` keeps OCR disabled and creates alerts when a document appears scanned.

`tesseract` uses `tesseract.js` locally. It requires no API key. Ingestion uses normal HTML/PDF text extraction first, then falls back to OCR when extracted text is below 500 characters or 50 words.

For sparse PDFs, the first three pages are rendered to images and passed to Tesseract. OCR confidence is stored on the source document and page metadata.
