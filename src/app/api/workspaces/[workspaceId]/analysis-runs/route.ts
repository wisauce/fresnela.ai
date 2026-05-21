import { MappingConfigurationError, runWorkspaceMapping } from "@/server/mapping";

export const runtime = "nodejs";

export async function POST(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  try {
    const result = await runWorkspaceMapping(workspaceId);
    return Response.json(result, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mapping failed";
    const jobId = error instanceof MappingConfigurationError ? error.jobId : null;
    return Response.json({ error: message, jobId }, { status: message === "Workspace not found" ? 404 : 400 });
  }
}
