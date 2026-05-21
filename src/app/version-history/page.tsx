"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, FileText, RotateCcw } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { indonesiaData } from "@/data/dummy";
import { versionHistoryItems } from "@/data/versionHistory";
import { workspaceAlerts } from "@/data/workspaceAlerts";

export default function VersionHistoryPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState("Indonesia");
  const [selectedVersionId, setSelectedVersionId] = useState(versionHistoryItems[0].id);

  const selectedVersion =
    versionHistoryItems.find((item) => item.id === selectedVersionId) || versionHistoryItems[0];

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView="version-history"
        onViewChange={() => router.push("/")}
        countryData={indonesiaData}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
        alertCount={workspaceAlerts.filter((alert) => alert.workspace === selectedWorkspace).length}
        onAlertsClick={() => router.push("/alerts")}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          workspaceMode="view"
          hasUnsavedChanges={false}
          lastUpdated="2026-01-10 14:30"
          onWorkspaceModeChange={() => router.push("/")}
          onCancelChanges={() => undefined}
          onSaveChanges={() => undefined}
        />

        <main className="relative z-0 flex-1 overflow-hidden bg-surface-50">
          <div className="flex h-full">
            <aside className="w-80 shrink-0 overflow-y-auto border-r border-surface-200 bg-white">
              <div className="sticky top-0 border-b border-surface-200 bg-white px-4 py-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary-600" />
                  <h2 className="text-sm font-semibold text-ink-900">Versions</h2>
                </div>
              </div>

              <div className="p-3">
                {versionHistoryItems.map((item) => {
                  const isSelected = item.id === selectedVersionId;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedVersionId(item.id)}
                      className={`mb-2 w-full rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? "border-primary-300 bg-primary-50 ring-1 ring-primary-200"
                          : "border-surface-200 bg-white hover:bg-surface-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-ink-900">{item.version}</p>
                        {isSelected && (
                          <span className="rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-ink-600">{item.summary}</p>
                      <p className="mt-2 text-[10px] text-ink-400">{item.timestamp}</p>
                      <p className="mt-0.5 text-[10px] text-ink-500">{item.editor}</p>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="flex-1 overflow-y-auto px-6 py-6">
              <div className="mx-auto max-w-4xl space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-ink-900">Version History</h1>
                  <p className="mt-1 text-sm text-ink-500">
                    Review previous changes made to this workspace and its regulatory evidence mapping.
                  </p>
                </div>

                <article className="rounded-xl border border-surface-200 bg-white shadow-sm">
                  <div className="border-b border-surface-200 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary-600" />
                      <h2 className="text-base font-semibold text-ink-900">{selectedVersion.version}</h2>
                    </div>
                    <p className="mt-1 text-sm text-ink-500">{selectedVersion.summary}</p>
                  </div>

                  <div className="grid gap-4 px-5 py-5 md:grid-cols-3">
                    <div className="rounded-lg bg-surface-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Timestamp</p>
                      <p className="mt-2 text-sm font-medium text-ink-800">{selectedVersion.timestamp}</p>
                    </div>
                    <div className="rounded-lg bg-surface-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Editor</p>
                      <p className="mt-2 text-sm font-medium text-ink-800">{selectedVersion.editor}</p>
                    </div>
                    <div className="rounded-lg bg-surface-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Workspace</p>
                      <p className="mt-2 text-sm font-medium text-ink-800">Indonesia Evidence Workspace</p>
                    </div>
                  </div>

                  <div className="border-t border-surface-200 px-5 py-5">
                    <h3 className="text-sm font-semibold text-ink-800">Preview</h3>
                    <div className="mt-3 rounded-lg border border-surface-200 bg-surface-50 p-4">
                      <p className="text-sm leading-relaxed text-ink-700">
                        This version captures the regulatory evidence state for Pillar 6 and Pillar 7 at the selected
                        point in time, including clause mappings, source references, and reviewer context.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-md bg-primary-50 px-2 py-1 text-[10px] font-semibold text-primary-700">
                          Affected: Pillar 6
                        </span>
                        <span className="rounded-md bg-surface-100 px-2 py-1 text-[10px] font-medium text-ink-600">
                          Evidence mapping
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-surface-200 bg-white px-5 py-4">
                    {/* TODO: Wire restore to backend version restoration when persistence exists. */}
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-lg border border-surface-200 px-4 py-2 text-sm font-semibold text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Restore this version
                    </button>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
