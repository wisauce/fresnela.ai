import { createSourceDocument, createVersionSnapshot, getWorkspace } from "@/server/db";

export const runtime = "nodejs";

function stripHtml(text: string) {
  return text.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function POST(request: Request, { params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = await params;
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return Response.json({ error: "Workspace not found" }, { status: 404 });
  if (workspace.status === "archived") return Response.json({ error: "Archived workspaces cannot ingest uploaded files" }, { status: 400 });

  const form = await request.formData();
  const file = form.get("file");
  const economyId = String(form.get("economyId") || workspace.economyIds[0] || "");
  if (!(file instanceof File)) return Response.json({ error: "Upload requires a file" }, { status: 400 });
  if (!workspace.economyIds.includes(economyId)) return Response.json({ error: "Economy is not in this workspace" }, { status: 400 });

  const mimeType = file.type || "text/plain";
  if (!mimeType.startsWith("text/") && mimeType !== "application/json") {
    return Response.json({ error: "File upload currently supports text, HTML, and JSON files. Use URL ingestion for PDF/image OCR." }, { status: 400 });
  }

  const raw = await file.text();
  const text = mimeType === "text/html" ? stripHtml(raw) : raw.trim();
  if (!text) return Response.json({ error: "Uploaded file did not contain readable text" }, { status: 400 });
  const document = createSourceDocument({
    workspaceId,
    economyId,
    candidateId: null,
    title: file.name,
    sourceUrl: `upload://${file.name}`,
    domain: "uploaded-file",
    documentType: mimeType === "text/html" ? "html_upload" : "text_upload",
    language: workspace.economies.find((economy) => economy.id === economyId)?.languages[0] ?? "Unknown",
    rawText: text,
    extractionConfidence: 1,
    extractionMethod: "manual",
    pages: [{ pageNumber: 1, text, confidence: 1, metadata: { upload: true, mimeType } }],
  });
  createVersionSnapshot(workspaceId, `File uploaded: ${file.name}`, "user");
  return Response.json({ document }, { status: 201 });
}
