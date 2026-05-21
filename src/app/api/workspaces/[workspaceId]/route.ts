import { createVersionSnapshot, getDefaultChatSession, getEconomy, getWorkspace, listAlerts, listChatMessages, listEvidenceMappings, listIndicatorScores, listSourceCandidates, listSourceDocuments, updateWorkspace } from "@/server/db";
import { defaultIndicatorIds, updateWorkspaceSchema, validateIndicatorSelection } from "@/server/validation";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return Response.json({ error: "Workspace not found" }, { status: 404 });
  const session = getDefaultChatSession(workspaceId);
  return Response.json({
    workspace,
    sourceCandidates: listSourceCandidates(workspaceId),
    sourceDocuments: listSourceDocuments(workspaceId),
    evidenceMappings: listEvidenceMappings(workspaceId),
    indicatorScores: listIndicatorScores(workspaceId),
    alerts: listAlerts(workspaceId),
    chatSession: session,
    chatMessages: listChatMessages(String(session.id)),
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const existing = getWorkspace(workspaceId);
  if (!existing) return Response.json({ error: "Workspace not found" }, { status: 404 });
  const parsed = updateWorkspaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid workspace payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;
  if (input.economyIds) {
    const missingEconomy = input.economyIds.find((id) => !getEconomy(id));
    if (missingEconomy) return Response.json({ error: `Unknown economy: ${missingEconomy}` }, { status: 400 });
  }

  const pillars = input.activePillars ?? existing.activePillars;
  const activeIndicatorIds = input.activeIndicatorIds?.length ? input.activeIndicatorIds : input.activePillars ? defaultIndicatorIds(pillars) : undefined;
  if (activeIndicatorIds && !validateIndicatorSelection(activeIndicatorIds, pillars)) {
    return Response.json({ error: "Active indicators must belong to the selected pillars" }, { status: 400 });
  }

  const workspace = updateWorkspace(workspaceId, { ...input, activeIndicatorIds });
  if (workspace) createVersionSnapshot(workspaceId, "Workspace configuration changed", "user");
  return Response.json({ workspace });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const workspace = updateWorkspace(workspaceId, { status: "archived" });
  if (!workspace) return Response.json({ error: "Workspace not found" }, { status: 404 });
  createVersionSnapshot(workspaceId, "Workspace archived", "user");
  return Response.json({ workspace });
}
