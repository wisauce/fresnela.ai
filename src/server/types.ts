export type WorkspaceStatus =
  | "draft"
  | "sources_needed"
  | "ready_to_ingest"
  | "processing"
  | "needs_review"
  | "reviewed"
  | "archived";

export type PillarId = "pillar-6" | "pillar-7";

export type SourcePolicy = "allowlisted_only" | "approval_required" | "manual_only";

export type CandidateStatus = "proposed" | "approved" | "rejected" | "ingested" | "failed";

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "needs_review";

export type ExtractionMethod = "embedded_text" | "ocr" | "manual" | "failed";

export interface Economy {
  id: string;
  name: string;
  iso2: string | null;
  iso3: string | null;
  region: string;
  subregion: string;
  languages: string[];
  createdAt: string;
}

export interface Workspace {
  id: string;
  ownerId: string | null;
  name: string;
  description: string | null;
  status: WorkspaceStatus;
  economyIds: string[];
  economies: Economy[];
  activePillars: PillarId[];
  activeIndicatorIds: string[];
  sourcePolicy: SourcePolicy;
  documentCount: number;
  mappingCount: number;
  alertCount: number;
  lastUpdatedAt: string;
  createdAt: string;
}

export interface RdtiiIndicator {
  id: string;
  pillarId: PillarId;
  pillarNumber: 6 | 7;
  name: string;
  weight: number;
  rubric: Record<string, unknown>;
  evidenceHints: string[];
}

export interface SourceCandidate {
  id: string;
  workspaceId: string;
  economyId: string;
  url: string;
  normalizedUrl: string;
  domain: string;
  title: string | null;
  snippet: string | null;
  proposedPillars: PillarId[];
  proposedIndicators: string[];
  relevanceTags: string[];
  confidence: number;
  reason: string;
  requiresApproval: boolean;
  status: CandidateStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SourceDocument {
  id: string;
  workspaceId: string;
  economyId: string;
  candidateId: string | null;
  title: string;
  sourceUrl: string;
  domain: string;
  documentType: string;
  language: string;
  retrievedAt: string;
  contentHash: string;
  rawText: string;
  extractionConfidence: number;
  extractionMethod: ExtractionMethod;
  status: string;
}

export interface DocumentParagraph {
  id: string;
  documentId: string;
  pageId: string | null;
  paragraphIndex: number;
  text: string;
  citationLabel: string;
  charStart: number;
  charEnd: number;
  language: string;
  confidence: number;
}

export interface EvidenceMapping {
  id: string;
  analysisRunId: string | null;
  workspaceId: string;
  economyId: string;
  indicatorId: string;
  sourceDocumentId: string | null;
  paragraphIds: string[];
  citation: string;
  verbatimSnippet: string;
  reasoning: string;
  scoreSuggestion: 0 | 0.5 | 1;
  confidence: number;
  uncertaintyFlags: string[];
  requiresReview: boolean;
  reviewStatus: "needs_review" | "approved" | "rejected";
  reviewerNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IndicatorScore {
  id: string;
  workspaceId: string;
  economyId: string;
  indicatorId: string;
  score: number;
  scoreSource: "ai_suggested" | "reviewer_approved" | "manual_override";
  reviewStatus: string;
  updatedAt: string;
}
