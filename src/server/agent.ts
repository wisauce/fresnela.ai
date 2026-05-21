import "server-only";

import { addChatMessage, createAgentTask, createVersionSnapshot, getDefaultChatSession, getSourceCandidate, getWorkspace, updateAgentTask, updateSourceCandidateStatus } from "./db";
import { ingestSourceCandidate } from "./ingestion";
import { MappingConfigurationError, runWorkspaceMapping } from "./mapping";
import { proposeSourceUrls } from "./search";

function includesAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

export async function handleWorkspaceChat(input: { workspaceId: string; sessionId?: string; message: string }) {
  const workspace = getWorkspace(input.workspaceId);
  if (!workspace) throw new Error("Workspace not found");
  const session = input.sessionId ? { id: input.sessionId } : getDefaultChatSession(input.workspaceId);
  addChatMessage(String(session.id), "user", input.message);

  const lower = input.message.toLowerCase();
  let content = "";
  let metadata: Record<string, unknown> = {};
  let taskId: string | null = null;

  if (includesAny(lower, ["find", "source", "sources", "url", "official"])) {
    taskId = createAgentTask({ sessionId: String(session.id), workspaceId: input.workspaceId, intent: "propose_sources", plan: { message: input.message } });
    try {
      const pillarIds = lower.includes("pillar 6") ? ["pillar-6" as const] : lower.includes("pillar 7") ? ["pillar-7" as const] : workspace.activePillars;
      const result = await proposeSourceUrls(input.workspaceId, { pillarIds, maxResults: 6 });
      content = `${result.summary} I saved them to this workspace as source candidates. Review candidates marked approval required before ingestion.`;
      metadata = { type: "source_proposals", ...result };
      updateAgentTask(taskId, { status: "succeeded", plan: { message: input.message, resultCount: result.candidates.length } });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not propose sources.";
      content = message;
      metadata = { type: "source_proposals_failed" };
      updateAgentTask(taskId, { status: "failed", plan: { message: input.message, error: message } });
    }
  } else if (includesAny(lower, ["run mapping", "score", "analyze", "analyse", "mapping"])) {
    taskId = createAgentTask({ sessionId: String(session.id), workspaceId: input.workspaceId, intent: "run_mapping", plan: { message: input.message } });
    try {
      const result = await runWorkspaceMapping(input.workspaceId);
      content = result.mappingCount > 0
        ? `Mapping completed with ${result.mappingCount} evidence mapping(s). Review the suggested scores before treating them as final.`
        : "Mapping ran but did not create grounded evidence mappings. Check documents and alerts.";
      metadata = { type: "analysis_job", ...result };
      updateAgentTask(taskId, { status: "succeeded", plan: { message: input.message, mappingCount: result.mappingCount }, jobIds: [result.jobId] });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Mapping failed.";
      content = message;
      metadata = { type: "analysis_job_failed", jobId: error instanceof MappingConfigurationError ? error.jobId : null };
      updateAgentTask(taskId, { status: "failed", plan: { message: input.message, error: message }, jobIds: error instanceof MappingConfigurationError ? [error.jobId] : [] });
    }
  } else if (includesAny(lower, ["export"])) {
    taskId = createAgentTask({ sessionId: String(session.id), workspaceId: input.workspaceId, intent: "export_results", status: "succeeded", plan: { message: input.message } });
    content = "Workspace exports are available from the dashboard buttons: JSON and CSV.";
    metadata = { type: "export_help" };
  } else if (includesAny(lower, ["approve"])) {
    taskId = createAgentTask({ sessionId: String(session.id), workspaceId: input.workspaceId, intent: "approval_help", status: "succeeded", plan: { message: input.message } });
    content = "Use the Approve buttons on source candidate cards so the action is tied to an exact candidate.";
    metadata = { type: "approval_help" };
  } else {
    taskId = createAgentTask({ sessionId: String(session.id), workspaceId: input.workspaceId, intent: "guidance", status: "succeeded", plan: { message: input.message } });
    content = `This chat is scoped to ${workspace.name}. Try: "Find Pillar 7 official sources", "Run mapping", or "Export this workspace".`;
    metadata = { type: "guidance" };
  }

  const assistant = addChatMessage(String(session.id), "assistant", content, metadata);
  return { sessionId: String(session.id), message: assistant, metadata: { ...metadata, taskId } };
}

export function approveCandidate(id: string) {
  const candidate = getSourceCandidate(id);
  if (!candidate) return null;
  const workspace = getWorkspace(candidate.workspaceId);
  if (!workspace || workspace.status === "archived") throw new Error("Archived workspaces cannot approve sources");
  if (candidate.status !== "proposed") throw new Error(`Cannot approve a ${candidate.status} source candidate`);
  const updated = updateSourceCandidateStatus(id, "approved");
  createVersionSnapshot(candidate.workspaceId, `Source approved: ${candidate.domain}`, "user");
  return updated;
}

export function rejectCandidate(id: string) {
  const candidate = getSourceCandidate(id);
  if (!candidate) return null;
  const workspace = getWorkspace(candidate.workspaceId);
  if (!workspace || workspace.status === "archived") throw new Error("Archived workspaces cannot reject sources");
  if (candidate.status === "ingested") throw new Error("Cannot reject an already ingested source candidate");
  const updated = updateSourceCandidateStatus(id, "rejected");
  createVersionSnapshot(candidate.workspaceId, `Source rejected: ${candidate.domain}`, "user");
  return updated;
}

export async function ingestCandidate(id: string) {
  return ingestSourceCandidate(id);
}
