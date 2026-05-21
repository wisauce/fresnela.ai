import { getJob } from "@/server/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  const job = getJob(jobId);
  if (!job) return Response.json({ error: "Job not found" }, { status: 404 });
  return Response.json({ job });
}
