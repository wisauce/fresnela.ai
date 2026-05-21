import { getWorkspaceExport } from "@/server/db";

export const runtime = "nodejs";

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

type AnalysisRunRow = {
  id?: unknown;
  provider?: string;
  model?: string;
};

export async function GET(_request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const bundle = getWorkspaceExport(workspaceId);
  if (!bundle) return Response.json({ error: "Workspace not found" }, { status: 404 });
  const rows: unknown[][] = [
    ["workspace", "economy", "region", "pillar", "indicator", "score", "score_source", "source_title", "source_url", "citation", "snippet", "confidence", "review_status", "provider", "model", "updated_at"],
  ];
  for (const score of bundle.indicatorScores) {
    const economy = bundle.workspace.economies.find((item) => item.id === score.economyId);
    const mapping = bundle.evidenceMappings.find((item) => item.economyId === score.economyId && item.indicatorId === score.indicatorId);
    const document = mapping?.sourceDocumentId ? bundle.sourceDocuments.find((item) => item.id === mapping.sourceDocumentId) : null;
    const analysisRuns = bundle.analysisRuns as AnalysisRunRow[];
    const run = mapping?.analysisRunId ? analysisRuns.find((item) => item.id === mapping.analysisRunId) : undefined;
    rows.push([
      bundle.workspace.name,
      economy?.name ?? score.economyId,
      economy?.region ?? "",
      score.indicatorId.startsWith("6.") ? "Pillar 6" : "Pillar 7",
      score.indicatorId,
      score.score,
      score.scoreSource,
      document?.title ?? "",
      document?.sourceUrl ?? "",
      mapping?.citation ?? "",
      mapping?.verbatimSnippet ?? "",
      mapping?.confidence ?? "",
      mapping?.reviewStatus ?? score.reviewStatus,
      run?.provider ?? "",
      run?.model ?? "",
      score.updatedAt,
    ]);
  }
  if (bundle.indicatorScores.length === 0) {
    for (const economy of bundle.workspace.economies) {
      rows.push([bundle.workspace.name, economy.name, economy.region, "", "", "", "", "", "", "", "", "", "", "", "", bundle.exportedAt]);
    }
  }
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${bundle.workspace.id}-export.csv"`,
    },
  });
}
