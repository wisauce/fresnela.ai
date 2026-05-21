import "server-only";

import {
  createAlert,
  createAnalysisRun,
  createEvidenceMapping,
  createJob,
  createVersionSnapshot,
  getSourceDocument,
  getWorkspace,
  listDocumentParagraphs,
  listSourceDocuments,
  updateAnalysisRunStatus,
  updateJob,
  upsertIndicatorScore,
} from "./db";
import { getAiProviderConfig, runOpenAiCompatibleMapping, type AiEvidenceMappingOutput } from "./ai/provider";
import { rdtiiIndicators } from "./rdtii";

const MAX_PARAGRAPHS_PER_INDICATOR = 8;

export class MappingConfigurationError extends Error {
  jobId: string;

  constructor(message: string, jobId: string) {
    super(message);
    this.name = "MappingConfigurationError";
    this.jobId = jobId;
  }
}

function buildMappingInput(workspaceId: string) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) throw new Error("Workspace not found");
  if (workspace.status === "archived") throw new Error("Archived workspaces cannot start jobs");

  const documents = listSourceDocuments(workspaceId).filter((document) => document.status === "extracted" && document.rawText.trim());
  const paragraphs = listDocumentParagraphs(workspaceId).filter((paragraph) => paragraph.text.trim().length > 40);
  const activeIndicators = rdtiiIndicators.filter((indicator) => workspace.activeIndicatorIds.includes(indicator.id));
  return { workspace, documents, paragraphs, activeIndicators };
}

function selectCandidateParagraphs(input: ReturnType<typeof buildMappingInput>) {
  return input.activeIndicators.flatMap((indicator) => {
    const hints = indicator.evidenceHints.map((hint) => hint.toLowerCase());
    const matches = input.paragraphs
      .map((paragraph) => {
        const text = paragraph.text.toLowerCase();
        const score = hints.reduce((sum, hint) => sum + (text.includes(hint) ? 1 : 0), 0);
        return { paragraph, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PARAGRAPHS_PER_INDICATOR);
    return matches.map((match) => ({ indicator, paragraph: match.paragraph, hintMatches: match.score }));
  });
}

function systemPrompt() {
  return [
    "You map regulatory evidence to RDTII Pillar 6 and Pillar 7 indicators.",
    "Return only valid JSON with a top-level mappings array.",
    "Every mapping must cite only the provided paragraph IDs and copy a verbatim snippet that appears in the paragraph text.",
    "Scores must be exactly 0, 0.5, or 1. AI suggestions are review-required, not final.",
  ].join(" ");
}

function userPrompt(input: ReturnType<typeof buildMappingInput>, candidates: ReturnType<typeof selectCandidateParagraphs>) {
  const documents = input.documents.map((document) => ({
    id: document.id,
    economyId: document.economyId,
    title: document.title,
    sourceUrl: document.sourceUrl,
    extractionMethod: document.extractionMethod,
    extractionConfidence: document.extractionConfidence,
  }));
  const indicators = input.activeIndicators.map((indicator) => ({
    id: indicator.id,
    pillarId: indicator.pillarId,
    name: indicator.name,
    rubric: indicator.rubric,
    evidenceHints: indicator.evidenceHints,
  }));
  const paragraphs = candidates.map((candidate) => ({
    indicatorId: candidate.indicator.id,
    id: candidate.paragraph.id,
    documentId: candidate.paragraph.documentId,
    citationLabel: candidate.paragraph.citationLabel,
    text: candidate.paragraph.text.slice(0, 1800),
  }));
  return JSON.stringify({
    workspace: {
      id: input.workspace.id,
      name: input.workspace.name,
      economies: input.workspace.economies.map((economy) => ({ id: economy.id, name: economy.name })),
    },
    documents,
    indicators,
    candidateParagraphs: paragraphs,
    requiredOutput: {
      mappings: [{
        indicatorId: "string",
        sourceDocumentId: "string",
        paragraphIds: ["string"],
        citation: "string",
        verbatimSnippet: "string",
        reasoning: "string",
        scoreSuggestion: "0 | 0.5 | 1",
        confidence: "number from 0 to 1",
        uncertaintyFlags: ["string"],
        requiresReview: true,
      }],
    },
  });
}

function validateMapping(output: AiEvidenceMappingOutput, input: ReturnType<typeof buildMappingInput>) {
  const indicator = input.activeIndicators.find((item) => item.id === output.indicatorId);
  if (!indicator) return "Indicator is not active in this workspace.";
  const document = output.sourceDocumentId ? getSourceDocument(output.sourceDocumentId) : null;
  if (!document || document.workspaceId !== input.workspace.id) return "Source document does not belong to this workspace.";
  const linkedParagraphs = input.paragraphs.filter((paragraph) => output.paragraphIds.includes(paragraph.id));
  if (linkedParagraphs.length !== output.paragraphIds.length || linkedParagraphs.some((paragraph) => paragraph.documentId !== document.id)) {
    return "Paragraph IDs must belong to the cited source document and workspace.";
  }
  if (![0, 0.5, 1].includes(output.scoreSuggestion)) return "Score suggestion must be 0, 0.5, or 1.";
  if (typeof output.confidence !== "number" || output.confidence < 0 || output.confidence > 1) return "Confidence must be between 0 and 1.";
  const snippet = output.verbatimSnippet.trim();
  if (!snippet || !linkedParagraphs.some((paragraph) => paragraph.text.includes(snippet))) return "Snippet must appear verbatim in a linked paragraph.";
  return null;
}

export async function runWorkspaceMapping(workspaceId: string) {
  const input = buildMappingInput(workspaceId);
  const jobId = createJob(workspaceId, "analysis", "queued", "Queued structured mapping", {});
  const config = getAiProviderConfig();
  updateJob(jobId, { status: "running", progress: 10, currentStep: "Loaded workspace documents" });

  if (!config.apiKey) {
    const message = "AI mapping is not configured. Add AI_PROVIDER_API_KEY to run structured evidence mapping.";
    updateJob(jobId, { status: "failed", progress: 100, currentStep: "AI provider missing", errorMessage: message, result: { provider: config.provider, model: config.model } });
    createAlert({
      workspaceId,
      type: "ai_mapping_unconfigured",
      severity: "High",
      title: "AI mapping is not configured",
      message,
      relatedResource: { jobId },
    });
    throw new MappingConfigurationError(message, jobId);
  }

  if (input.documents.length === 0 || input.paragraphs.length === 0) {
    const message = "No extracted document paragraphs are available for mapping. Ingest at least one source first.";
    updateJob(jobId, { status: "failed", progress: 100, currentStep: "No evidence paragraphs", errorMessage: message, result: { provider: config.provider, model: config.model } });
    createAlert({ workspaceId, type: "mapping_no_documents", severity: "Medium", title: "No evidence available", message, relatedResource: { jobId } });
    throw new Error(message);
  }

  const candidates = selectCandidateParagraphs(input);
  if (candidates.length === 0) {
    const message = "No candidate paragraphs matched active RDTII indicator hints.";
    updateJob(jobId, { status: "failed", progress: 100, currentStep: "No candidate paragraphs", errorMessage: message, result: { provider: config.provider, model: config.model } });
    createAlert({ workspaceId, type: "mapping_no_candidates", severity: "Medium", title: "No candidate paragraphs", message, relatedResource: { jobId } });
    throw new Error(message);
  }

  const analysisRunId = createAnalysisRun({
    workspaceId,
    jobId,
    provider: config.provider,
    model: config.model,
    status: "running",
    inputSummary: {
      documentCount: input.documents.length,
      paragraphCount: input.paragraphs.length,
      candidateParagraphCount: candidates.length,
      indicatorCount: input.activeIndicators.length,
    },
  });

  updateJob(jobId, { progress: 45, currentStep: "Calling AI mapping provider", result: { analysisRunId, provider: config.provider, model: config.model } });
  try {
    const ai = await runOpenAiCompatibleMapping({
      systemPrompt: systemPrompt(),
      userPrompt: userPrompt(input, candidates),
    });
    updateJob(jobId, { progress: 75, currentStep: "Validating grounded mappings" });
    const created = [];
    let invalidCount = 0;
    for (const mapping of ai.mappings) {
      const validationError = validateMapping(mapping, input);
      if (validationError) {
        invalidCount += 1;
        createAlert({
          workspaceId,
          type: "invalid_ai_mapping",
          severity: "Medium",
          title: "AI mapping needs review",
          message: validationError,
          relatedResource: { jobId, analysisRunId, indicatorId: mapping.indicatorId },
        });
        continue;
      }
      const document = getSourceDocument(mapping.sourceDocumentId)!;
      const persisted = createEvidenceMapping({
        analysisRunId,
        workspaceId,
        economyId: document.economyId,
        indicatorId: mapping.indicatorId,
        sourceDocumentId: mapping.sourceDocumentId,
        paragraphIds: mapping.paragraphIds,
        citation: mapping.citation,
        verbatimSnippet: mapping.verbatimSnippet,
        reasoning: mapping.reasoning,
        scoreSuggestion: mapping.scoreSuggestion,
        confidence: mapping.confidence,
        uncertaintyFlags: mapping.uncertaintyFlags ?? [],
        requiresReview: true,
      });
      upsertIndicatorScore({
        workspaceId,
        economyId: document.economyId,
        indicatorId: mapping.indicatorId,
        score: mapping.scoreSuggestion,
        scoreSource: "ai_suggested",
        reviewStatus: "needs_review",
      });
      created.push(persisted);
    }
    updateAnalysisRunStatus(analysisRunId, invalidCount > 0 ? "needs_review" : "succeeded");
    updateJob(jobId, {
      status: created.length > 0 ? "needs_review" : "failed",
      progress: 100,
      currentStep: created.length > 0 ? "Mappings ready for review" : "No valid grounded mappings",
      errorMessage: created.length > 0 ? null : "AI provider returned no valid grounded mappings.",
      result: { analysisRunId, provider: config.provider, model: config.model, mappingCount: created.length, invalidCount },
    });
    if (created.length > 0) createVersionSnapshot(workspaceId, `AI mapping run: ${created.length} mapping(s)`, "system");
    return { jobId, analysisRunId, mappingCount: created.length, invalidCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI mapping failed.";
    updateAnalysisRunStatus(analysisRunId, "failed");
    updateJob(jobId, { status: "failed", progress: 100, currentStep: "Mapping failed", errorMessage: message, technicalError: message, result: { analysisRunId, provider: config.provider, model: config.model } });
    createAlert({ workspaceId, type: "ai_mapping_failed", severity: "High", title: "AI mapping failed", message, relatedResource: { jobId, analysisRunId } });
    throw error;
  }
}
