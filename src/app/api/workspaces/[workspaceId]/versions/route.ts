import { createVersionSnapshot, getWorkspace, listVersions } from "@/server/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  if (!getWorkspace(workspaceId)) return Response.json({ error: "Workspace not found" }, { status: 404 });
  return Response.json({ versions: listVersions(workspaceId) });
}

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return Response.json({ error: "Workspace not found" }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const id = createVersionSnapshot(workspaceId, typeof body.label === "string" && body.label.trim() ? body.label.trim() : "Manual snapshot", "user");
  return Response.json({ id }, { status: 201 });
}
