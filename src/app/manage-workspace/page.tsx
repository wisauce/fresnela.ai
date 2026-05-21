"use client";

import { useState } from "react";
import {
  AlertTriangle,
  FileText,
  Grid2X2,
  List,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { countryOptions, workspaceItems, type WorkspaceItem } from "@/data/workspaces";
import { workspaceAlerts } from "@/data/workspaceAlerts";

type ViewMode = "list" | "grid";

const countryCodes: Record<string, string> = {
  Indonesia: "ID",
  Singapore: "SG",
  Malaysia: "MY",
  Thailand: "TH",
  Vietnam: "VN",
  Philippines: "PH",
  "Brunei Darussalam": "BN",
  Cambodia: "KH",
  Laos: "LA",
  Myanmar: "MM",
};

function StatusBadge({ status }: { status: WorkspaceItem["status"] }) {
  const className =
    status === "Active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-primary-200 bg-primary-50 text-primary-700";

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}>
      {status}
    </span>
  );
}

function PillarPill({ pillar }: { pillar: string }) {
  const className = pillar === "Pillar 6"
    ? "border-[#FF2076] bg-[#FBE6F4] text-[#700B49]"
    : pillar === "Pillar 7"
      ? "border-[#FF66C4] bg-[#FBE6F4] text-[#700B49]"
      : "border-surface-200 bg-surface-100 text-ink-600";

  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {pillar}
    </span>
  );
}

function AttentionBadge({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
      <AlertTriangle className="h-3 w-3 text-primary-700" />
      <span>{count}</span>
      <span>Need review</span>
    </span>
  );
}

function OpenWorkspaceButton() {
  return (
    // TODO: Navigate to a workspace detail route when that frontend route exists.
    <button
      type="button"
      className="interactive-control rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:bg-primary-50"
    >
      Open Workspace
    </button>
  );
}

function WorkspaceCard({ workspace, attentionCount }: { workspace: WorkspaceItem; attentionCount: number }) {
  return (
    <article className="interactive-surface flex min-h-[210px] flex-col rounded-xl border border-surface-200 bg-comfort p-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-[11px] font-bold text-primary-700">
              {workspace.countryCode}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-semibold text-ink-900">{workspace.workspaceName}</h2>
              <p className="flex items-center gap-1 text-xs text-ink-500">
                <MapPin className="h-3 w-3" />
                {workspace.countryName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex min-h-6 items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {workspace.activePillars.map((pillar) => (
            <PillarPill key={pillar} pillar={pillar} />
          ))}
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 border-t border-surface-100 pt-3">
        <div className="min-w-0 space-y-1 text-xs text-ink-500">
          <div className="flex items-center gap-1.5 truncate">
            <FileText className="h-3.5 w-3.5 shrink-0 text-ink-400" />
            <span>{workspace.documentCount} documents</span>
          </div>
          <p className="truncate">Updated {workspace.lastUpdated}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusBadge status={workspace.status} />
          <AttentionBadge count={attentionCount} />
          <OpenWorkspaceButton />
        </div>
      </div>
    </article>
  );
}

function WorkspaceRow({ workspace, attentionCount }: { workspace: WorkspaceItem; attentionCount: number }) {
  return (
    <tr className="border-b border-surface-100 transition-colors hover:bg-comfort-hover last:border-0">
      <td className="min-w-[260px] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-700">
            {workspace.countryCode}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-ink-900">{workspace.workspaceName}</h2>
            <p className="text-xs text-ink-500">{workspace.countryName}</p>
          </div>
        </div>
      </td>
      <td className="min-w-[180px] px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {workspace.activePillars.map((pillar) => (
            <PillarPill key={pillar} pillar={pillar} />
          ))}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <StatusBadge status={workspace.status} />
          <AttentionBadge count={attentionCount} />
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-600">{workspace.documentCount} documents</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-ink-500">{workspace.lastUpdated}</td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <OpenWorkspaceButton />
      </td>
    </tr>
  );
}

export default function ManageWorkspacePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(countryOptions[0]);
  const [workspaceTitle, setWorkspaceTitle] = useState("");
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(workspaceItems);

  const getAttentionCount = (workspace: WorkspaceItem) =>
    workspaceAlerts.filter((alert) => alert.workspace === workspace.countryName).length;

  const handleAddWorkspace = () => {
    const code = countryCodes[selectedCountry] || selectedCountry.slice(0, 2).toUpperCase();
    const title = workspaceTitle.trim() || `${selectedCountry} Regulatory Workspace`;

    // TODO: Replace this local-only add with backend/API workspace creation.
    setWorkspaces((current) => [
      ...current,
      {
        id: `workspace-${code.toLowerCase()}-${current.length + 1}`,
        countryName: selectedCountry,
        countryCode: code,
        workspaceName: title,
        documentCount: 0,
        activePillars: ["Pillar 6", "Pillar 7"],
        lastUpdated: "Not reviewed yet",
        status: "Draft",
      },
    ]);
    setWorkspaceTitle("");
    setModalOpen(false);
  };

  return (
    <main className="h-full overflow-y-auto bg-comfort px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 border-b border-surface-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Manage Workspace</h1>
            <p className="mt-1 text-sm text-ink-500">Create and manage country-based regulatory workspaces.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-surface-200 bg-comfort-hover p-1">
              <button
                type="button"
                onClick={() => setViewMode("list")}
              className={`interactive-control flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "list" ? "bg-primary-100 text-primary-700" : "text-ink-500 hover:bg-comfort-hover"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
              className={`interactive-control flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "grid" ? "bg-primary-100 text-primary-700" : "text-ink-500 hover:bg-comfort-hover"
                }`}
              >
                <Grid2X2 className="h-3.5 w-3.5" />
                Grid
              </button>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="interactive-control flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-600 focus:outline-none focus-visible:bg-primary-600"
            >
              <Plus className="h-4 w-4 text-primary-700" />
              Add Workspace
            </button>
          </div>
        </section>

        {viewMode === "list" ? (
          <section className="overflow-x-auto rounded-xl border border-surface-200 bg-comfort shadow-sm">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-3">Workspace</th>
                  <th className="px-4 py-3">Active Pillars</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Documents</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((workspace) => (
                  <WorkspaceRow key={workspace.id} workspace={workspace} attentionCount={getAttentionCount(workspace)} />
                ))}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {workspaces.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} attentionCount={getAttentionCount(workspace)} />
            ))}
          </section>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-surface-200 bg-comfort shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-surface-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-ink-900">Add New Workspace</h2>
                <p className="mt-1 text-sm text-ink-500">Name the workspace and select a country to create a regulatory workspace.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="interactive-control rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-surface-100 hover:text-ink-700 focus:outline-none focus-visible:bg-surface-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <label htmlFor="workspace-title" className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Workspace Title
                </label>
                <input
                  id="workspace-title"
                  type="text"
                  value={workspaceTitle}
                  onChange={(event) => setWorkspaceTitle(event.target.value)}
                  placeholder="e.g. Thailand Digital Trade Workspace"
                  className="mt-2 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-ink-800 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                />
              </div>

              <div>
                <label htmlFor="country" className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Country
                </label>
                <select
                  id="country"
                  value={selectedCountry}
                  onChange={(event) => setSelectedCountry(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                >
                  {countryOptions.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-surface-200 bg-surface-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="interactive-control rounded-lg px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:bg-surface-100 focus:outline-none focus-visible:bg-surface-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddWorkspace}
                className="interactive-control rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 focus:outline-none focus-visible:bg-primary-600"
              >
                Add Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
