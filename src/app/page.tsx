"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Play, CheckCircle2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { WorkspacePillarsPanel } from "@/components/WorkspacePillarsPanel";
import { DocumentViewer } from "@/components/DocumentViewer";
import { MeasureEditor } from "@/components/MeasureEditor";
import { AlertsPanel } from "@/components/AlertsPanel";
import { TopBar } from "@/components/TopBar";
import {
  indonesiaData,
  consolidatedMeasure,
  sourceDocuments,
} from "@/data/dummy";
import { workspaceAlerts } from "@/data/workspaceAlerts";

export default function Home() {
  const [activeView, setActiveView] = useState<"workspace" | "alerts">("workspace");
  const [workspaceMode, setWorkspaceMode] = useState<"view" | "edit">("view");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorSessionKey, setEditorSessionKey] = useState(0);
  const [selectedWorkspace, setSelectedWorkspace] = useState("Indonesia");
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isScoringRunning, setIsScoringRunning] = useState(false);
  const [scoringMessage, setScoringMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState("2026-01-10 14:30");

  const currentWorkspaceAlerts = workspaceAlerts.filter((alert) => alert.workspace === selectedWorkspace);

  const handleEvidenceClick = (paragraphId: string) => {
    setActiveParagraphId((current) => current === paragraphId ? null : paragraphId);
  };

  const formatTimestamp = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const handleRunScoring = () => {
    setIsScoringRunning(true);
    setScoringMessage("Analyzing mapped evidence against RDTII subpillar criteria...");

    window.setTimeout(() => {
      setLastUpdated(formatTimestamp(new Date()));
      setIsScoringRunning(false);
      setScoringMessage("Scoring updated");

      window.setTimeout(() => setScoringMessage(null), 2200);
    }, 1800);
  };

  const handleWorkspaceModeChange = (mode: "view" | "edit") => {
    setActiveView("workspace");
    setWorkspaceMode(mode);
  };

  const handleCancelChanges = () => {
    // TODO: Replace this local reset with backend-backed draft discard when persistence exists.
    setHasUnsavedChanges(false);
    setEditorSessionKey((key) => key + 1);
  };

  const handleSaveChanges = () => {
    // TODO: Persist measure edits through the backend/API when editing is connected to real data.
    setHasUnsavedChanges(false);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
        countryData={indonesiaData}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
        alertCount={currentWorkspaceAlerts.length}
        onAlertsClick={() => setActiveView("alerts")}
        isScoreLoading={isScoringRunning}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          workspaceMode={workspaceMode}
          hasUnsavedChanges={hasUnsavedChanges}
          lastUpdated={lastUpdated}
          onWorkspaceModeChange={handleWorkspaceModeChange}
          onCancelChanges={handleCancelChanges}
          onSaveChanges={handleSaveChanges}
        />

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeView === "workspace" && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col"
              >
                {workspaceMode === "view" && (
                  <div className="flex items-center justify-between gap-4 border-b border-surface-200 bg-white px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink-900">RDTII Subpillar Scoring</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {scoringMessage || "Evaluate mapped evidence against scope, restriction level, compliance burden, and interoperability impact."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunScoring}
                      disabled={isScoringRunning}
                      className="flex shrink-0 items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-ink-900 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isScoringRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : scoringMessage === "Scoring updated" ? <CheckCircle2 className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isScoringRunning ? "Running scoring..." : scoringMessage === "Scoring updated" ? "Scoring updated" : "Run Scoring"}
                    </button>
                  </div>
                )}

                <div className="flex-1 overflow-hidden">
                  {workspaceMode === "view" ? (
                    <div className="flex h-full">
                      {/* Left: Scoring with Evidence */}
                      <WorkspacePillarsPanel
                        countryData={indonesiaData}
                        onEvidenceClick={handleEvidenceClick}
                        activeParagraphId={activeParagraphId}
                        isScoringLoading={isScoringRunning}
                      />

                      {/* Right: Consolidated Measure as reference */}
                      <DocumentViewer
                        measure={consolidatedMeasure}
                        activeParagraphId={activeParagraphId}
                        onParagraphClear={() => setActiveParagraphId(null)}
                      />
                    </div>
                  ) : (
                    <MeasureEditor
                      key={editorSessionKey}
                      measure={consolidatedMeasure}
                      sourceDocuments={sourceDocuments}
                      onDirtyChange={setHasUnsavedChanges}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {activeView === "alerts" && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full overflow-auto p-6"
              >
                <AlertsPanel workspaceName={selectedWorkspace} alerts={currentWorkspaceAlerts} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
