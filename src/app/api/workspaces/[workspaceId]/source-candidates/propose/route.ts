import { proposeSourceUrls } from "@/server/search";
import { proposeSourcesSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const parsed = proposeSourcesSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid source proposal payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const result = await proposeSourceUrls(workspaceId, parsed.data);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to propose sources" }, { status: 400 });
  }
}
