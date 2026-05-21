import { getWorkspaceExport } from "@/server/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const bundle = getWorkspaceExport(workspaceId);
  if (!bundle) return Response.json({ error: "Workspace not found" }, { status: 404 });
  return Response.json(bundle);
}
