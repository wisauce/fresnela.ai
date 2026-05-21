# AI Mapping Schema

Planned structured mapping output:

```ts
type AiEvidenceMapping = {
  indicatorId: string;
  sourceDocumentId: string;
  paragraphIds: string[];
  citation: string;
  verbatimSnippet: string;
  reasoning: string;
  scoreSuggestion: 0 | 0.5 | 1;
  confidence: number;
  uncertaintyFlags: string[];
  requiresReview: boolean;
};
```

The app should reject or flag outputs where snippets are not grounded in extracted source text.
