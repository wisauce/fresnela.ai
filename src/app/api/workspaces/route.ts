import { createWorkspace, getEconomy, listWorkspaces } from "@/server/db";
import { defaultIndicatorIds, createWorkspaceSchema, validateIndicatorSelection } from "@/server/validation";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ workspaces: listWorkspaces() });
}

export async function POST(request: Request) {
  const parsed = createWorkspaceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid workspace payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  const missingEconomy = input.economyIds.find((id) => !getEconomy(id));
  if (missingEconomy) return Response.json({ error: `Unknown economy: ${missingEconomy}` }, { status: 400 });

  const activeIndicatorIds = input.activeIndicatorIds?.length ? input.activeIndicatorIds : defaultIndicatorIds(input.activePillars);
  if (!validateIndicatorSelection(activeIndicatorIds, input.activePillars)) {
    return Response.json({ error: "Active indicators must belong to the selected pillars" }, { status: 400 });
  }

  const workspace = createWorkspace({
    ...input,
    activeIndicatorIds,
    description: input.description ?? null,
    status: "sources_needed",
  });
  return Response.json({ workspace }, { status: 201 });
}
