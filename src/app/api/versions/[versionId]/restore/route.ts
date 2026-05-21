import { restoreVersion } from "@/server/db";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ versionId: string }> }) {
  const { versionId } = await params;
  const workspace = restoreVersion(versionId);
  if (!workspace) return Response.json({ error: "Version not found or cannot be restored" }, { status: 404 });
  return Response.json({ workspace });
}
