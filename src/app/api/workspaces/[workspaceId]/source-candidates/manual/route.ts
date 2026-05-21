import { createManualSourceCandidate } from "@/server/search";
import { manualSourceSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const parsed = manualSourceSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return Response.json({ error: "Invalid manual source payload", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const candidate = createManualSourceCandidate(workspaceId, parsed.data);
    return Response.json({ candidate }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not add manual source" }, { status: 400 });
  }
}
