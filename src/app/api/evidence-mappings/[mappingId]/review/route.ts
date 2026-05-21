import { createVersionSnapshot, getEvidenceMapping, getWorkspace, updateEvidenceMappingReview, upsertIndicatorScore } from "@/server/db";
import { reviewMappingSchema } from "@/server/validation";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ mappingId: string }> }) {
  const { mappingId } = await params;
  const mapping = getEvidenceMapping(mappingId);
  if (!mapping) return Response.json({ error: "Evidence mapping not found" }, { status: 404 });
  const workspace = getWorkspace(mapping.workspaceId);
  if (!workspace || workspace.status === "archived") return Response.json({ error: "Archived workspaces cannot update mapping review" }, { status: 400 });
  const parsed = reviewMappingSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Invalid review payload", details: parsed.error.flatten() }, { status: 400 });

  const updated = updateEvidenceMappingReview(mappingId, parsed.data);
  if (updated && parsed.data.reviewStatus === "approved") {
    upsertIndicatorScore({
      workspaceId: updated.workspaceId,
      economyId: updated.economyId,
      indicatorId: updated.indicatorId,
      score: updated.scoreSuggestion,
      scoreSource: "reviewer_approved",
      reviewStatus: "approved",
    });
  }
  createVersionSnapshot(mapping.workspaceId, `Mapping ${parsed.data.reviewStatus}: ${mapping.indicatorId}`, "user");
  return Response.json({ mapping: updated });
}
