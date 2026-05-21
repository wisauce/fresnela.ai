import { duplicateWorkspaceWithOptions } from "@/server/db";
import { duplicateWorkspaceSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const parsed = duplicateWorkspaceSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return Response.json({ error: "Invalid duplicate payload", details: parsed.error.flatten() }, { status: 400 });
  const workspace = duplicateWorkspaceWithOptions(workspaceId, parsed.data ?? {});
  if (!workspace) return Response.json({ error: "Workspace not found" }, { status: 404 });
  return Response.json({ workspace }, { status: 201 });
}
