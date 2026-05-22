"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Play, CheckCircle2, Pencil } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { WorkspacePillarsPanel } from "@/components/WorkspacePillarsPanel";
import { DocumentViewer } from "@/components/DocumentViewer";
import { MeasureEditor } from "@/components/MeasureEditor";
import { AlertsPanel } from "@/components/AlertsPanel";
import { DocumentManagement } from "@/components/DocumentManagement";
import { TopBar } from "@/components/TopBar";
import {
  defaultWorkspaceName,
  getWorkspaceData,
} from "@/data/dummy";
import { workspaceAlerts } from "@/data/workspaceAlerts";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary-700" /></div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [activeView, setActiveView] = useState<"workspace" | "alerts" | "documents">("workspace");
  const [workspaceMode, setWorkspaceMode] = useState<"view" | "edit">("view");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editorSessionKey, setEditorSessionKey] = useState(0);
  const [selectedWorkspace, setSelectedWorkspace] = useState(defaultWorkspaceName);
  const searchParams = useSearchParams();
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isScoringRunning, setIsScoringRunning] = useState(false);
  const [scoringMessage, setScoringMessage] = useState<string | null>(null);
  const workspaceData = getWorkspaceData(selectedWorkspace);
  const [lastUpdated, setLastUpdated] = useState(workspaceData.lastUpdated);
  const [modeTransitionStatus, setModeTransitionStatus] = useState<"entering-edit" | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | null>(null);

  const currentWorkspaceAlerts = workspaceAlerts.filter((alert) => alert.workspace === selectedWorkspace);

  useEffect(() => {
    setLastUpdated(workspaceData.lastUpdated);
    setActiveParagraphId(null);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lastWorkspace", selectedWorkspace);
    }
  }, [selectedWorkspace, workspaceData.lastUpdated]);

  useEffect(() => {
    const workspaceParam = searchParams.get("workspace");
    if (workspaceParam) {
      setSelectedWorkspace(workspaceParam);
    }
  }, [searchParams]);

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
    if (mode === "edit" && workspaceMode !== "edit") {
      setModeTransitionStatus("entering-edit");
      window.setTimeout(() => {
        setWorkspaceMode("edit");
        setModeTransitionStatus(null);
      }, 750);
      return;
    }

    setModeTransitionStatus(null);
    setWorkspaceMode(mode);
  };

  const handleCancelChanges = () => {
    // TODO: Replace this local reset with backend-backed draft discard when persistence exists.
    setHasUnsavedChanges(false);
    setEditorSessionKey((key) => key + 1);
  };

  const handleSaveChanges = () => {
    // TODO: Persist measure edits through the backend/API when editing is connected to real data.
    setSaveStatus("saving");
    window.setTimeout(() => {
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
      window.setTimeout(() => setSaveStatus(null), 1600);
    }, 850);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
        countryData={workspaceData.countryData}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
        alertCount={currentWorkspaceAlerts.length}
        onAlertsClick={() => setActiveView("alerts")}
        onDocumentsClick={() => setActiveView("documents")}
        isScoreLoading={isScoringRunning}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          workspaceMode={workspaceMode}
          hasUnsavedChanges={hasUnsavedChanges}
          lastUpdated={lastUpdated}
          modeTransitionStatus={modeTransitionStatus}
          saveStatus={saveStatus}
          showWorkspaceControls={activeView === "workspace"}
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
                className="relative flex h-full flex-col"
              >
                <AnimatePresence>
                  {modeTransitionStatus === "entering-edit" && (
                    <motion.div
                      key="entering-edit"
                      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                      animate={{ opacity: 1, backdropFilter: "blur(2px)" }}
                      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 z-20 flex items-center justify-center bg-comfort/65"
                    >
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        className="flex items-center gap-3 rounded-xl border border-surface-200 bg-comfort px-4 py-3 text-sm font-semibold text-ink-800 shadow-lg"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </span>
                        <span>Entering edit mode...</span>
                        <Pencil className="h-4 w-4 text-ink-400" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {workspaceMode === "view" && (
                  <div className="flex items-center justify-between gap-4 border-b border-surface-200 bg-comfort px-4 py-3">
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
                      className="interactive-control flex shrink-0 items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-ink-900 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
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
                        countryData={workspaceData.countryData}
                        onEvidenceClick={handleEvidenceClick}
                        activeParagraphId={activeParagraphId}
                        isScoringLoading={isScoringRunning}
                      />

                      {/* Right: Consolidated Measure as reference */}
                      <DocumentViewer
                        measure={workspaceData.measure}
                        activeParagraphId={activeParagraphId}
                        onParagraphClear={() => setActiveParagraphId(null)}
                      />
                    </div>
                  ) : (
                    <MeasureEditor
                      key={editorSessionKey}
                      measure={workspaceData.measure}
                      sourceDocuments={workspaceData.sourceDocuments}
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

            {activeView === "documents" && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <DocumentManagement workspaceName={selectedWorkspace} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
