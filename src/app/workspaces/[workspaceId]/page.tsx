"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Bot, Check, Download, ExternalLink, FileSearch, HelpCircle, Loader2, Play, Send, X } from "lucide-react";
import { ActionStatus, EmptyState, HelpPopover, InlineError, StatusBadge } from "@/components/UsabilityPrimitives";
import type { ChatMessage, EvidenceMapping, IndicatorScore, SourceCandidate, SourceDocument, Workspace } from "@/server/types";

type WorkspacePayload = {
  workspace: Workspace;
  sourceCandidates: SourceCandidate[];
  sourceDocuments: SourceDocument[];
  evidenceMappings: EvidenceMapping[];
  indicatorScores: IndicatorScore[];
  alerts: { id: string; title: string; message: string; severity: string; status: string; createdAt: string }[];
  chatSession: { id: string };
  chatMessages: ChatMessage[];
};

function statusText(status: string) {
  return status.replaceAll("_", " ");
}

const sourcePolicyLabels: Record<string, string> = {
  allowlisted_only: "Only trusted official domains",
  approval_required: "Ask before ingesting new domains",
  manual_only: "Manual sources only",
};

const extractionLabels: Record<string, string> = {
  embedded_text: "Text extracted from document",
  ocr: "OCR from scanned document",
  failed: "Extraction needs attention",
  manual: "Manual text",
};

const candidateTone: Record<string, "neutral" | "success" | "warning" | "danger" | "loading"> = {
  proposed: "warning",
  approved: "success",
  rejected: "danger",
  ingested: "success",
  failed: "danger",
  ingesting: "loading",
};

export default function WorkspaceDashboardPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const [payload, setPayload] = useState<WorkspacePayload | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [actionStatus, setActionStatus] = useState<{ message: string; detail?: string; tone?: "neutral" | "success" | "warning" | "danger" | "loading"; timestamp: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [candidateFilter, setCandidateFilter] = useState("all");
  const [confidenceFilter, setConfidenceFilter] = useState("all");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [pendingCandidateIds, setPendingCandidateIds] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const res = await fetch(`/api/workspaces/${workspaceId}`, { cache: "no-store" });
    if (res.ok) setPayload(await res.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowHelp(false);
        setActionStatus(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const workspace = payload?.workspace;
  const sourceCandidates = useMemo(() => payload?.sourceCandidates ?? [], [payload?.sourceCandidates]);
  const sourceDocuments = payload?.sourceDocuments ?? [];
  const evidenceMappings = payload?.evidenceMappings ?? [];
  const indicatorScores = payload?.indicatorScores ?? [];
  const alerts = payload?.alerts ?? [];
  const messages = payload?.chatMessages ?? [];
  const health = {
    needsApproval: sourceCandidates.filter((candidate) => candidate.status === "proposed").length,
    ocrWarnings: sourceDocuments.filter((document) => document.extractionMethod === "ocr" && document.extractionConfidence < 0.65).length,
    failedCandidates: sourceCandidates.filter((candidate) => candidate.status === "failed").length + alerts.filter((alert) => alert.status !== "resolved").length,
  };
  const filteredCandidates = sourceCandidates.filter((candidate) => {
    const status = pendingCandidateIds.includes(candidate.id) ? "ingesting" : candidate.status;
    const statusMatch = candidateFilter === "all" || status === candidateFilter;
    const confidenceMatch = confidenceFilter === "all" || (confidenceFilter === "low" ? candidate.confidence < 0.65 : candidate.confidence >= 0.65);
    return statusMatch && confidenceMatch;
  });
  const sourceStats = useMemo(() => ({
    proposed: sourceCandidates.filter((candidate) => candidate.status === "proposed").length,
    approved: sourceCandidates.filter((candidate) => candidate.status === "approved").length,
    ingested: sourceCandidates.filter((candidate) => candidate.status === "ingested").length,
  }), [sourceCandidates]);

  const setStatus = (message: string, tone: "neutral" | "success" | "warning" | "danger" | "loading" = "neutral", detail?: string) => {
    setActionStatus({ message, tone, detail, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
  };

  const send = async (override?: string) => {
    const text = override ?? message;
    if (!text.trim() || !payload || sending) return;
    setSending(true);
    setActionError(null);
    setStatus("Sending request to workspace agent...", "loading");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, sessionId: payload.chatSession.id, message: text }),
    });
    if (res.ok) {
      setMessage("");
      setStatus("Agent response received", "success", "Workspace data has been refreshed.");
    } else {
      const json = await res.json().catch(() => ({}));
      setActionError(json.error || "The agent could not process that request.");
      setStatus("Agent request failed", "danger");
    }
    setSending(false);
    await load();
  };

  const candidateAction = async (candidateId: string, action: "approve" | "reject" | "ingest") => {
    setActionError(null);
    if (action === "ingest") setPendingCandidateIds((current) => [...new Set([...current, candidateId])]);
    setStatus(`${action === "ingest" ? "Ingesting" : action === "approve" ? "Approving" : "Rejecting"} source candidate...`, "loading");
    const res = await fetch(`/api/source-candidates/${candidateId}/${action}`, { method: "POST" });
    if (res.ok) {
      setStatus(action === "ingest" ? "Source ingested" : action === "approve" ? "Source approved" : "Source rejected", action === "reject" ? "warning" : "success");
    } else {
      const json = await res.json().catch(() => ({}));
      setActionError(json.error || `Could not ${action} source candidate.`);
      setStatus(`Could not ${action} source candidate`, "danger");
    }
    setPendingCandidateIds((current) => current.filter((id) => id !== candidateId));
    await load();
  };

  const runMapping = async () => {
    setActionError(null);
    setStatus("Starting structured mapping job...", "loading");
    const res = await fetch(`/api/workspaces/${workspaceId}/analysis-runs`, { method: "POST" });
    const json = await res.json();
    if (res.ok) {
      setStatus("Mapping completed", "success", `${json.mappingCount ?? 0} mapping(s) ready for review`);
      await load();
    } else {
      setActionError(json.error || "Could not start mapping job.");
      setStatus("Could not start mapping job", "danger", json.jobId ? `Job ${json.jobId}` : undefined);
    }
  };

  const addManualSource = async () => {
    if (!manualUrl.trim()) return;
    setActionError(null);
    setStatus("Adding manual source...", "loading");
    const res = await fetch(`/api/workspaces/${workspaceId}/source-candidates/manual`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: manualUrl.trim() }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setManualUrl("");
      setStatus("Manual source added", "success", json.candidate?.domain);
      await load();
    } else {
      setActionError(json.error || "Could not add manual source.");
      setStatus("Could not add manual source", "danger");
    }
  };

  const reviewMapping = async (mappingId: string, reviewStatus: "approved" | "rejected") => {
    setActionError(null);
    setStatus(`${reviewStatus === "approved" ? "Approving" : "Rejecting"} evidence mapping...`, "loading");
    const res = await fetch(`/api/evidence-mappings/${mappingId}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus(`Mapping ${reviewStatus}`, reviewStatus === "approved" ? "success" : "warning");
      await load();
    } else {
      setActionError(json.error || "Could not update mapping review.");
      setStatus("Could not update mapping", "danger");
    }
  };

  const uploadFile = async (file: File | null) => {
    if (!file || !workspace) return;
    setActionError(null);
    setStatus("Uploading source file...", "loading");
    const formData = new FormData();
    formData.set("file", file);
    formData.set("economyId", workspace.economyIds[0]);
    const res = await fetch(`/api/workspaces/${workspaceId}/source-documents/upload`, { method: "POST", body: formData });
    const json = await res.json().catch(() => ({}));
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    if (res.ok) {
      setStatus("Uploaded source ingested", "success", json.document?.title);
      await load();
    } else {
      setActionError(json.error || "Could not upload source file.");
      setStatus("Could not upload source file", "danger");
    }
  };

  const bulkAction = async (action: "approve" | "reject" | "ingest") => {
    const ids = selectedCandidateIds.filter((id) => {
      const candidate = sourceCandidates.find((item) => item.id === id);
      if (!candidate) return false;
      if (action === "ingest") return candidate.status === "approved";
      if (action === "approve") return candidate.status === "proposed";
      return candidate.status !== "rejected";
    });
    for (const id of ids) await candidateAction(id, action);
    setSelectedCandidateIds([]);
  };

  if (!workspace) {
    return (
      <main className="flex h-full items-center justify-center bg-comfort">
        <Loader2 className="h-5 w-5 animate-spin text-primary-700" />
      </main>
    );
  }

  return (
    <main className="flex h-full flex-col overflow-hidden bg-comfort">
      <section className="border-b border-surface-200 bg-comfort px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link href="/workspaces" className="text-xs font-semibold text-primary-700 hover:text-primary-800">Workspaces</Link>
              <span className="text-xs text-ink-300">/</span>
              <span className="truncate text-xs text-ink-500">{workspace.name}</span>
            </div>
            <h1 className="mt-1 truncate text-xl font-bold text-ink-900">{workspace.name}</h1>
            <p className="mt-1 text-sm text-ink-500">{workspace.description || "Workspace-scoped regulatory evidence review."}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">{statusText(workspace.status)}</span>
            <a href={`/api/workspaces/${workspace.id}/export.json`} className="interactive-control inline-flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-comfort-hover">
              <Download className="h-4 w-4" />
              JSON
            </a>
            <a href={`/api/workspaces/${workspace.id}/export.csv`} className="interactive-control inline-flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-comfort-hover">
              <Download className="h-4 w-4" />
              CSV
            </a>
            <button onClick={runMapping} className="interactive-control inline-flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-xs font-semibold text-ink-900 hover:bg-primary-600">
              <Play className="h-4 w-4" />
              Run Mapping
            </button>
            <button type="button" onClick={() => setShowHelp(true)} className="interactive-control inline-flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-comfort-hover">
              <HelpCircle className="h-4 w-4" />
              Help
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-4">
          <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-500">Economies</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{workspace.economies.map((economy) => economy.name).join(", ")}</p>
          </div>
          <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-500">Source Candidates</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{sourceCandidates.length}</p>
          </div>
          <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-500">Approved</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{sourceStats.approved}</p>
          </div>
          <div className="rounded-lg border border-surface-200 bg-surface-50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-ink-500">Documents</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{sourceDocuments.length}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs text-ink-600">{health.needsApproval} candidates need approval</div>
          <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs text-ink-600">{health.ocrWarnings} OCR warnings</div>
          <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs text-ink-600">{health.failedCandidates} failed actions or alerts</div>
        </div>
        {actionStatus && (
          <div className="mt-3">
            <ActionStatus message={actionStatus.message} detail={`${actionStatus.detail ? `${actionStatus.detail} · ` : ""}${actionStatus.timestamp}`} tone={actionStatus.tone} onDismiss={() => setActionStatus(null)} />
          </div>
        )}
        {actionError && <div className="mt-3"><InlineError message={actionError} onRetry={load} /></div>}
      </section>

      <section className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)_420px]">
        <aside className="flex min-h-0 flex-col border-r border-surface-200 bg-comfort">
          <div className="border-b border-surface-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary-700" />
              <h2 className="text-sm font-semibold text-ink-900">Workspace Agent</h2>
            </div>
            <p className="mt-1 text-xs text-ink-500">Chat is scoped to this workspace.</p>
            <div className="mt-2 rounded-lg bg-surface-50 p-2 text-[11px] leading-relaxed text-ink-500">
              {workspace.economies.map((economy) => economy.name).join(", ")} · {workspace.activePillars.map((pillar) => pillar === "pillar-6" ? "Pillar 6" : "Pillar 7").join(", ")} · {sourcePolicyLabels[workspace.sourcePolicy]}
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="rounded-lg border border-dashed border-surface-300 bg-surface-50 p-4 text-sm text-ink-600">
                Try “Find Pillar 7 official sources” or “Run mapping”.
              </div>
            )}
            {messages.map((item) => (
              <div key={item.id} className={`rounded-lg px-3 py-2 text-sm ${item.role === "user" ? "ml-8 bg-primary-100 text-primary-900" : "mr-8 border border-surface-200 bg-white text-ink-700"}`}>
                {item.content}
              </div>
            ))}
          </div>
          <div className="border-t border-surface-200 p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {["Find Pillar 7 official sources", "Find Pillar 6 data flow sources", "Run mapping", "Show gaps", "Export workspace"].map((prompt) => (
                <button key={prompt} type="button" onClick={() => send(prompt)} className="interactive-control rounded-full border border-surface-200 px-2 py-1 text-[10px] font-medium text-ink-600 hover:bg-comfort-hover">
                  {prompt}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                ref={chatInputRef}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) void send();
                }}
                placeholder="Ask the agent... Ctrl+Enter to send"
                className="min-w-0 flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button type="button" aria-label="Send chat message" onClick={() => send()} disabled={sending} className="interactive-control rounded-lg bg-primary-500 p-2 text-ink-900 hover:bg-primary-600 disabled:opacity-50">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </aside>

        <section className="min-h-0 overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1">
                <h2 className="text-base font-semibold text-ink-900">Source Candidates</h2>
                <HelpPopover label="Source candidate help">Approve unknown domains before ingestion. Confidence estimates source authority and RDTII relevance; it is not final evidence.</HelpPopover>
              </div>
              <p className="text-xs text-ink-500">Approve before ingesting unknown domains.</p>
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <input
              value={manualUrl}
              onChange={(event) => setManualUrl(event.target.value)}
              placeholder="Add manual official URL"
              className="min-w-64 rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button type="button" onClick={addManualSource} disabled={!manualUrl.trim()} className="interactive-control rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-40">Add URL</button>
            <label className="interactive-control cursor-pointer rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-comfort-hover">
              Upload text file
              <input ref={uploadInputRef} type="file" accept=".txt,.md,.html,.json,text/*,application/json" className="sr-only" onChange={(event) => void uploadFile(event.target.files?.[0] ?? null)} />
            </label>
            <select value={candidateFilter} onChange={(event) => setCandidateFilter(event.target.value)} className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none">
              <option value="all">All statuses</option>
              <option value="proposed">Needs approval</option>
              <option value="approved">Approved</option>
              <option value="ingesting">Ingesting</option>
              <option value="ingested">Ingested</option>
              <option value="failed">Failed</option>
              <option value="rejected">Rejected</option>
            </select>
            <select value={confidenceFilter} onChange={(event) => setConfidenceFilter(event.target.value)} className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs outline-none">
              <option value="all">All confidence</option>
              <option value="low">Low confidence</option>
              <option value="good">Good confidence</option>
            </select>
            {selectedCandidateIds.length > 0 && (
              <>
                <button type="button" onClick={() => bulkAction("approve")} className="interactive-control rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Approve selected</button>
                <button type="button" onClick={() => bulkAction("ingest")} className="interactive-control rounded-lg border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-700 hover:bg-primary-50">Ingest selected</button>
                <button type="button" onClick={() => bulkAction("reject")} className="interactive-control rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50">Reject selected</button>
              </>
            )}
          </div>
          <div className="space-y-3">
            {filteredCandidates.length === 0 ? (
              <EmptyState
                icon={<FileSearch className="h-5 w-5" />}
                title="No source candidates here"
                message={sourceCandidates.length === 0 ? "Ask the agent to find official sources for the active pillars." : "Try changing the status or confidence filters."}
              />
            ) : filteredCandidates.map((candidate) => {
              const displayStatus = pendingCandidateIds.includes(candidate.id) ? "ingesting" : candidate.status;
              return (
              <article key={candidate.id} className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${candidate.title || candidate.domain}`}
                      checked={selectedCandidateIds.includes(candidate.id)}
                      onChange={(event) => setSelectedCandidateIds((current) => event.target.checked ? [...current, candidate.id] : current.filter((id) => id !== candidate.id))}
                      className="mt-1"
                    />
                    <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink-900">{candidate.title || candidate.domain}</h3>
                    <a href={candidate.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-primary-700 hover:text-primary-800">
                      <span className="truncate">{candidate.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                    </div>
                  </div>
                  <StatusBadge tone={candidateTone[displayStatus]}>{statusText(displayStatus)}</StatusBadge>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-600">{candidate.snippet || candidate.reason}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-primary-50 px-2 py-1 text-[10px] font-semibold text-primary-700">confidence {candidate.confidence.toFixed(2)}</span>
                  <span className="rounded-md bg-surface-100 px-2 py-1 text-[10px] text-ink-600">{candidate.domain}</span>
                  {candidate.relevanceTags.map((tag) => (
                    <span key={tag} className="rounded-md bg-surface-100 px-2 py-1 text-[10px] text-ink-600">{tag.replaceAll("_", " ")}</span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => candidateAction(candidate.id, "approve")} disabled={candidate.status !== "proposed" || pendingCandidateIds.includes(candidate.id)} className="interactive-control inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-40">
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button onClick={() => candidateAction(candidate.id, "ingest")} disabled={candidate.status !== "approved" || pendingCandidateIds.includes(candidate.id)} className="interactive-control inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-40">
                    {pendingCandidateIds.includes(candidate.id) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSearch className="h-3.5 w-3.5" />}
                    {pendingCandidateIds.includes(candidate.id) ? "Ingesting" : "Ingest"}
                  </button>
                  <button onClick={() => candidateAction(candidate.id, "reject")} disabled={candidate.status === "rejected" || pendingCandidateIds.includes(candidate.id)} className="interactive-control inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40">
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </article>
            );})}
          </div>
        </section>

        <aside className="min-h-0 overflow-y-auto border-l border-surface-200 bg-comfort p-4">
          <h2 className="text-base font-semibold text-ink-900">Evidence Review</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">Grounded mappings, scores, documents, and extraction warnings.</p>
          <div className="mt-4 rounded-xl border border-surface-200 bg-surface-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Evidence Mappings</p>
            <div className="mt-3 space-y-2">
              {evidenceMappings.length === 0 ? (
                <p className="text-xs text-ink-500">No grounded mappings yet. Ingest sources, configure AI_PROVIDER_API_KEY, then run mapping.</p>
              ) : evidenceMappings.map((mapping) => {
                const document = sourceDocuments.find((item) => item.id === mapping.sourceDocumentId);
                const score = indicatorScores.find((item) => item.economyId === mapping.economyId && item.indicatorId === mapping.indicatorId);
                return (
                  <div key={mapping.id} className="rounded-lg border border-surface-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-ink-900">{mapping.indicatorId} · score {mapping.scoreSuggestion}</p>
                        <p className="mt-0.5 text-[10px] text-ink-500">{document?.title || "Unknown document"} · {mapping.citation}</p>
                      </div>
                      <StatusBadge tone={mapping.reviewStatus === "approved" ? "success" : mapping.reviewStatus === "rejected" ? "danger" : "warning"}>{statusText(mapping.reviewStatus)}</StatusBadge>
                    </div>
                    <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-ink-700">{mapping.verbatimSnippet}</p>
                    <p className="mt-2 text-[10px] text-ink-500">{mapping.reasoning}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">{Math.round(mapping.confidence * 100)}% confidence</span>
                      {score && <span className="rounded-md bg-surface-100 px-2 py-0.5 text-[10px] text-ink-600">{score.scoreSource.replaceAll("_", " ")}</span>}
                    </div>
                    {mapping.reviewStatus === "needs_review" && (
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => reviewMapping(mapping.id, "approved")} className="interactive-control rounded-lg border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50">Approve</button>
                        <button type="button" onClick={() => reviewMapping(mapping.id, "rejected")} className="interactive-control rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-700 hover:bg-red-50">Reject</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-surface-200 bg-surface-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Extracted Documents</p>
            <div className="mt-3 space-y-2">
              {sourceDocuments.length === 0 ? (
                <p className="text-xs text-ink-500">No extracted documents yet.</p>
              ) : sourceDocuments.map((document) => (
                <div key={document.id} className="rounded-lg border border-surface-200 bg-white p-3">
                  <p className="line-clamp-2 text-xs font-semibold text-ink-900">{document.title}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-md bg-surface-100 px-2 py-0.5 text-[10px] text-ink-600">{extractionLabels[document.extractionMethod] || document.extractionMethod}</span>
                    <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">{Math.round(document.extractionConfidence * 100)}% confidence</span>
                    <span className="rounded-md bg-surface-100 px-2 py-0.5 text-[10px] text-ink-600">{document.documentType}</span>
                  </div>
                  {document.extractionMethod === "ocr" && document.extractionConfidence < 0.65 && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-md border border-primary-200 bg-primary-50 px-2 py-1 text-[10px] text-primary-800">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                      Review this OCR text before using it for scoring.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-surface-200 bg-surface-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Active Indicators</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {workspace.activeIndicatorIds.map((indicatorId) => (
                <span key={indicatorId} className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-ink-700 shadow-sm">
                  {indicatorId} {indicatorId.startsWith("6.") ? "Pillar 6" : "Pillar 7"}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>
      {showHelp && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-900/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="workspace-help-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setShowHelp(false); }}>
          <div className="w-full max-w-xl rounded-xl border border-surface-200 bg-comfort shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-surface-200 px-5 py-4">
              <div>
                <h2 id="workspace-help-title" className="text-base font-semibold text-ink-900">How this workspace works</h2>
                <p className="mt-1 text-sm text-ink-500">A workspace is the project boundary for chat, sources, documents, mappings, alerts, and exports.</p>
              </div>
              <button type="button" aria-label="Close workspace help" onClick={() => setShowHelp(false)} className="interactive-control rounded-lg p-1.5 text-ink-400 hover:bg-surface-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 px-5 py-4 text-sm leading-relaxed text-ink-600">
              <p><strong>1. Ask the agent</strong> to find official sources for the active economies and pillars.</p>
              <p><strong>2. Approve candidates</strong> before ingesting domains that are not already trusted.</p>
              <p><strong>3. Ingest sources</strong> to extract HTML/PDF text or OCR scanned pages when enabled.</p>
              <p><strong>4. Run mapping</strong> to create a structured analysis job and review evidence before export.</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
