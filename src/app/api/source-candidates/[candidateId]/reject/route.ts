import { rejectCandidate } from "@/server/agent";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params;
  try {
    const candidate = rejectCandidate(candidateId);
    if (!candidate) return Response.json({ error: "Candidate not found" }, { status: 404 });
    return Response.json({ candidate });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not reject source" }, { status: 400 });
  }
}
