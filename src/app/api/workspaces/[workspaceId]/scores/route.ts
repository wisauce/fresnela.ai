import { createVersionSnapshot, getWorkspace, upsertIndicatorScore } from "@/server/db";
import { scoreOverrideSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return Response.json({ error: "Workspace not found" }, { status: 404 });
  if (workspace.status === "archived") return Response.json({ error: "Archived workspaces cannot update scores" }, { status: 400 });
  const parsed = scoreOverrideSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Invalid score payload", details: parsed.error.flatten() }, { status: 400 });
  if (!workspace.economyIds.includes(parsed.data.economyId)) return Response.json({ error: "Economy is not in this workspace" }, { status: 400 });
  if (!workspace.activeIndicatorIds.includes(parsed.data.indicatorId)) return Response.json({ error: "Indicator is not active in this workspace" }, { status: 400 });
  const score = upsertIndicatorScore({
    workspaceId,
    economyId: parsed.data.economyId,
    indicatorId: parsed.data.indicatorId,
    score: parsed.data.score,
    scoreSource: "manual_override",
    reviewStatus: "approved",
  });
  createVersionSnapshot(workspaceId, `Manual score override: ${parsed.data.indicatorId}`, "user");
  return Response.json({ score });
}
