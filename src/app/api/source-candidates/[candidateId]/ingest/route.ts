import { ingestCandidate } from "@/server/agent";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params;
  try {
    const document = await ingestCandidate(candidateId);
    return Response.json({ document });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ingestion failed";
    const status = message === "Candidate not found" ? 404 : 400;
    return Response.json({ error: message }, { status });
  }
}
