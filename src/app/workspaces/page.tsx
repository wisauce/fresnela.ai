"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, Copy, ExternalLink, Filter, Plus, Search, X } from "lucide-react";
import { ActionStatus, ConfirmDialog, EmptyState, HelpPopover, InlineError, StatusBadge } from "@/components/UsabilityPrimitives";
import type { Economy, PillarId, SourcePolicy, Workspace } from "@/server/types";

type FormState = {
  name: string;
  description: string;
  economyIds: string[];
  activePillars: PillarId[];
  sourcePolicy: SourcePolicy;
};

const initialForm: FormState = {
  name: "",
  description: "",
  economyIds: ["idn"],
  activePillars: ["pillar-6", "pillar-7"],
  sourcePolicy: "approval_required",
};

const sourcePolicyLabels: Record<SourcePolicy, string> = {
  allowlisted_only: "Only trusted official domains",
  approval_required: "Ask before ingesting new domains",
  manual_only: "Manual sources only",
};

function pillarLabel(pillar: string) {
  return pillar === "pillar-6" ? "Pillar 6" : "Pillar 7";
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [economies, setEconomies] = useState<Economy[]>([]);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<{ message: string; detail?: string; tone?: "neutral" | "success" | "warning" | "danger" | "loading" } | null>(null);
  const [confirmArchiveWorkspaceId, setConfirmArchiveWorkspaceId] = useState<string | null>(null);
  const [lastArchivedWorkspace, setLastArchivedWorkspace] = useState<Workspace | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [workspaceRes, economyRes] = await Promise.all([fetch("/api/workspaces"), fetch("/api/economies")]);
      if (!workspaceRes.ok || !economyRes.ok) throw new Error("Could not load workspace data.");
      const workspaceJson = await workspaceRes.json();
      const economyJson = await economyRes.json();
      setWorkspaces(workspaceJson.workspaces);
      setEconomies(economyJson.economies);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load workspace data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !modalOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && modalOpen) setModalOpen(false);
      if (event.key === "Escape" && confirmArchiveWorkspaceId) setConfirmArchiveWorkspaceId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, confirmArchiveWorkspaceId]);

  const regions = useMemo(() => ["all", ...Array.from(new Set(economies.map((economy) => economy.region))).sort()], [economies]);
  const filtered = workspaces.filter((workspace) => {
    const text = `${workspace.name} ${workspace.economies.map((economy) => economy.name).join(" ")}`.toLowerCase();
    const regionMatch = region === "all" || workspace.economies.some((economy) => economy.region === region);
    return text.includes(query.toLowerCase()) && regionMatch;
  });

  const formErrors = {
    name: form.name.trim() ? "" : "Workspace name is required.",
    economies: form.economyIds.length > 0 ? "" : "Select at least one economy.",
    pillars: form.activePillars.length > 0 ? "" : "Select at least one pillar.",
  };
  const formValid = !formErrors.name && !formErrors.economies && !formErrors.pillars;

  const submit = async () => {
    if (!formValid) {
      setActionStatus({ message: "Complete required fields before creating a workspace.", tone: "warning" });
      return;
    }
    setSaving(true);
    setActionStatus({ message: "Creating workspace...", tone: "loading" });
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        description: form.description || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const json = await res.json();
      setModalOpen(false);
      setForm(initialForm);
      setActionStatus({ message: "Workspace created", detail: json.workspace?.name, tone: "success" });
      await load();
    } else {
      const json = await res.json().catch(() => ({}));
      setActionStatus({ message: "Workspace was not created", detail: json.error || "Check the form and try again.", tone: "danger" });
    }
  };

  const duplicateWorkspace = async (workspaceId: string) => {
    setActionStatus({ message: "Duplicating workspace...", tone: "loading" });
    const res = await fetch(`/api/workspaces/${workspaceId}/duplicate`, { method: "POST" });
    if (res.ok) {
      const json = await res.json();
      setActionStatus({ message: "Workspace duplicated", detail: json.workspace?.name, tone: "success" });
      await load();
    } else {
      const json = await res.json().catch(() => ({}));
      setActionStatus({ message: "Could not duplicate workspace", detail: json.error || "Try again.", tone: "danger" });
    }
  };

  const archiveWorkspace = async (workspaceId: string) => {
    const workspace = workspaces.find((item) => item.id === workspaceId) ?? null;
    setActionStatus({ message: "Archiving workspace...", tone: "loading" });
    const res = await fetch(`/api/workspaces/${workspaceId}`, { method: "DELETE" });
    if (res.ok) {
      setLastArchivedWorkspace(workspace);
      setActionStatus({ message: "Workspace archived", detail: workspace ? `${workspace.name} can be restored with Undo.` : "You can restore it with Undo.", tone: "warning" });
      setConfirmArchiveWorkspaceId(null);
      await load();
    } else {
      const json = await res.json().catch(() => ({}));
      setActionStatus({ message: "Could not archive workspace", detail: json.error || "Try again.", tone: "danger" });
    }
  };

  const undoArchive = async () => {
    if (!lastArchivedWorkspace) return;
    const res = await fetch(`/api/workspaces/${lastArchivedWorkspace.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: lastArchivedWorkspace.status }),
    });
    if (res.ok) {
      setActionStatus({ message: "Workspace restored", detail: lastArchivedWorkspace.name, tone: "success" });
      setLastArchivedWorkspace(null);
      await load();
    } else {
      setActionStatus({ message: "Could not restore workspace", tone: "danger" });
    }
  };

  return (
    <main className="h-full overflow-y-auto bg-comfort px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 border-b border-surface-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Workspaces</h1>
            <p className="mt-1 text-sm text-ink-500">Create a project container, then run chat-driven source discovery and RDTII mapping inside it.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-400">Press <kbd className="rounded border border-surface-200 bg-white px-1.5 py-0.5">/</kbd> to search</span>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="interactive-control inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-primary-600"
            >
              <Plus className="h-4 w-4" />
              New Workspace
            </button>
          </div>
        </section>

        {actionStatus && (
          <ActionStatus
            message={actionStatus.message}
            detail={actionStatus.detail}
            tone={actionStatus.tone}
            onDismiss={() => setActionStatus(null)}
          />
        )}
        {lastArchivedWorkspace && (
          <div className="flex justify-end">
            <button type="button" onClick={undoArchive} className="interactive-control rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50">
              Undo archive
            </button>
          </div>
        )}
        {error && <InlineError message={error} onRetry={load} />}

        <section className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search workspace or economy"
              className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-300"
            />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-3">
            <Filter className="h-4 w-4 text-ink-400" />
            <select value={region} onChange={(event) => setRegion(event.target.value)} className="bg-transparent py-2 text-sm outline-none">
              {regions.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All regions" : item}
                </option>
              ))}
            </select>
          </label>
          {(query || region !== "all") && (
            <button type="button" onClick={() => { setQuery(""); setRegion("all"); }} className="interactive-control rounded-lg border border-surface-200 px-3 py-2 text-sm font-semibold text-ink-600 hover:bg-comfort-hover">
              Clear search/filter
            </button>
          )}
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <EmptyState title="Loading workspaces" message="Fetching your workspace list and RDTII economy metadata." />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search className="h-5 w-5" />}
              title="No workspaces match"
              message={workspaces.length === 0 ? "Create a workspace to give the agent a project boundary." : "Try clearing search or changing the region filter."}
              action={<button type="button" onClick={() => setModalOpen(true)} className="interactive-control rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-ink-900 hover:bg-primary-600">Create workspace</button>}
            />
          ) : filtered.map((workspace) => (
            <article key={workspace.id} className="interactive-surface flex min-h-64 flex-col rounded-xl border border-surface-200 bg-comfort p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-ink-900">{workspace.name}</h2>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">{workspace.description || "No description yet."}</p>
                </div>
                <StatusBadge>{workspace.status.replaceAll("_", " ")}</StatusBadge>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {workspace.economies.slice(0, 4).map((economy) => (
                  <span key={economy.id} className="rounded-md bg-surface-100 px-2 py-1 text-[11px] font-medium text-ink-600">
                    {economy.name}
                  </span>
                ))}
                {workspace.economies.length > 4 && <span className="rounded-md bg-surface-100 px-2 py-1 text-[11px] text-ink-500">+{workspace.economies.length - 4}</span>}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {workspace.activePillars.map((pillar) => (
                  <span key={pillar} className="rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
                    {pillarLabel(pillar)}
                  </span>
                ))}
              </div>

              <div className="mt-auto grid grid-cols-3 gap-2 border-t border-surface-100 pt-4 text-center">
                <div>
                  <p className="text-sm font-bold text-ink-900">{workspace.documentCount}</p>
                  <p className="text-[10px] text-ink-500">Docs</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink-900">{workspace.mappingCount}</p>
                  <p className="text-[10px] text-ink-500">Mappings</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-ink-900">{workspace.alertCount}</p>
                  <p className="text-[10px] text-ink-500">Alerts</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Link href={`/workspaces/${workspace.id}`} className="interactive-control inline-flex items-center gap-2 rounded-lg bg-ink-900 px-3 py-2 text-xs font-semibold text-white hover:bg-ink-800">
                  Open
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => duplicateWorkspace(workspace.id)} aria-label={`Duplicate ${workspace.name}`} className="interactive-control rounded-lg border border-surface-200 p-2 text-ink-500 hover:bg-comfort-hover">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setConfirmArchiveWorkspaceId(workspace.id)} aria-label={`Archive ${workspace.name}`} className="interactive-control rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50">
                    <Archive className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/45 px-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.currentTarget === event.target) setModalOpen(false); }}>
          <div className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-xl border border-surface-200 bg-comfort shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-surface-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-ink-900">Create Workspace</h2>
                <p className="mt-1 text-sm text-ink-500">Define the project boundary before the agent starts working.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close create workspace dialog" className="interactive-control rounded-lg p-1.5 text-ink-400 hover:bg-surface-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[65vh] space-y-4 overflow-y-auto px-5 py-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Name</span>
                <input aria-describedby="workspace-name-error" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300" placeholder="Thailand Pillar 7 Review" />
                {formErrors.name && <p id="workspace-name-error" className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Description</span>
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 h-20 w-full resize-none rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300" placeholder="What this workspace should analyze" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Economies</span>
                <select multiple value={form.economyIds} onChange={(event) => setForm({ ...form, economyIds: Array.from(event.target.selectedOptions).map((option) => option.value) })} className="mt-2 h-40 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300">
                  {economies.map((economy) => (
                    <option key={economy.id} value={economy.id}>
                      {economy.name} - {economy.region}
                    </option>
                  ))}
                </select>
                {formErrors.economies && <p className="mt-1 text-xs text-red-600">{formErrors.economies}</p>}
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Active Pillars</span>
                  <div className="mt-2 flex gap-2">
                    {(["pillar-6", "pillar-7"] as PillarId[]).map((pillar) => (
                      <label key={pillar} className="flex items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.activePillars.includes(pillar)}
                          onChange={(event) => setForm({
                            ...form,
                            activePillars: event.target.checked ? [...form.activePillars, pillar] : form.activePillars.filter((item) => item !== pillar),
                          })}
                        />
                        {pillarLabel(pillar)}
                      </label>
                    ))}
                  </div>
                  {formErrors.pillars && <p className="mt-1 text-xs text-red-600">{formErrors.pillars}</p>}
                </div>
                <label>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Source Policy
                    <HelpPopover label="Source policy help">Controls whether the agent may ingest only trusted official domains, ask before new domains, or rely on manual source URLs.</HelpPopover>
                  </span>
                  <select value={form.sourcePolicy} onChange={(event) => setForm({ ...form, sourcePolicy: event.target.value as SourcePolicy })} className="mt-2 w-full rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300">
                    <option value="approval_required">{sourcePolicyLabels.approval_required}</option>
                    <option value="allowlisted_only">{sourcePolicyLabels.allowlisted_only}</option>
                    <option value="manual_only">{sourcePolicyLabels.manual_only}</option>
                  </select>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-surface-200 bg-surface-50 px-5 py-4">
              <button type="button" onClick={() => setModalOpen(false)} className="interactive-control rounded-lg px-4 py-2 text-sm font-medium text-ink-600 hover:bg-surface-100">Cancel</button>
              <button type="button" disabled={saving || !formValid} onClick={submit} className="interactive-control rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-primary-600 disabled:opacity-50">
                {saving ? "Creating..." : "Create Workspace"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmArchiveWorkspaceId && (
        <ConfirmDialog
          title="Archive workspace?"
          message="Archived workspaces disappear from this list and cannot accept new jobs. You can undo immediately after archiving."
          confirmLabel="Archive"
          destructive
          onCancel={() => setConfirmArchiveWorkspaceId(null)}
          onConfirm={() => archiveWorkspace(confirmArchiveWorkspaceId)}
        />
      )}
    </main>
  );
}
