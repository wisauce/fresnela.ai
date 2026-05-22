"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Play, CheckCircle2 } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { WorkspacePillarsPanel } from "@/components/WorkspacePillarsPanel";
import { DocumentViewer } from "@/components/DocumentViewer";
import { MeasureEditor } from "@/components/MeasureEditor";
import { AlertsPanel } from "@/components/AlertsPanel";
import { DocumentManagement } from "@/components/DocumentManagement";
import { ScoringChatbot } from "@/components/ScoringChatbot";
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
  const [activeView, setActiveView] = useState<"scoring" | "measure" | "alerts" | "documents">("scoring");
  const [selectedWorkspace, setSelectedWorkspace] = useState(defaultWorkspaceName);
  const searchParams = useSearchParams();
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isScoringRunning, setIsScoringRunning] = useState(false);
  const [scoringMessage, setScoringMessage] = useState<string | null>(null);
  const workspaceData = getWorkspaceData(selectedWorkspace);
  const [lastUpdated, setLastUpdated] = useState(workspaceData.lastUpdated);

  const currentWorkspaceAlerts = workspaceAlerts.filter((a) => a.workspace === selectedWorkspace);

  useEffect(() => {
    setLastUpdated(workspaceData.lastUpdated);
    setActiveParagraphId(null);
    if (typeof window !== "undefined") window.localStorage.setItem("lastWorkspace", selectedWorkspace);
  }, [selectedWorkspace, workspaceData.lastUpdated]);

  useEffect(() => {
    const p = searchParams.get("workspace");
    if (p) setSelectedWorkspace(p);
  }, [searchParams]);

  const handleEvidenceClick = (paragraphId: string) => {
    setActiveParagraphId((c) => c === paragraphId ? null : paragraphId);
  };

  const handleRunScoring = () => {
    setIsScoringRunning(true);
    setScoringMessage("Analyzing mapped evidence...");
    window.setTimeout(() => {
      const now = new Date();
      setLastUpdated(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`);
      setIsScoringRunning(false);
      setScoringMessage("Scoring updated");
      window.setTimeout(() => setScoringMessage(null), 2200);
    }, 1800);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView === "scoring" || activeView === "measure" ? "workspace" : activeView}
        onViewChange={() => setActiveView("scoring")}
        countryData={workspaceData.countryData}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
        alertCount={currentWorkspaceAlerts.length}
        onAlertsClick={() => setActiveView("alerts")}
        isScoreLoading={isScoringRunning}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          workspaceMode="view"
          hasUnsavedChanges={false}
          lastUpdated={lastUpdated}
          showWorkspaceControls={false}
          onWorkspaceModeChange={() => {}}
          onCancelChanges={() => {}}
          onSaveChanges={() => {}}
        />

        <main className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeView === "scoring" && (
              <motion.div
                key="scoring"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                className="flex h-full flex-col"
              >
                {/* Run Scoring bar */}
                <div className="flex items-center justify-between gap-4 border-b border-surface-200 bg-comfort px-4 py-2.5 shrink-0">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink-900">RDTII Subpillar Scoring</p>
                    <p className="mt-0.5 text-xs text-ink-500">{scoringMessage || "Evaluate mapped evidence against RDTII criteria."}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunScoring}
                    disabled={isScoringRunning}
                    className="interactive-control flex shrink-0 items-center gap-2 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:bg-primary-600 disabled:opacity-70"
                  >
                    {isScoringRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : scoringMessage === "Scoring updated" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    {isScoringRunning ? "Running..." : scoringMessage === "Scoring updated" ? "Updated" : "Run Scoring"}
                  </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                  <WorkspacePillarsPanel
                    countryData={workspaceData.countryData}
                    onEvidenceClick={handleEvidenceClick}
                    activeParagraphId={activeParagraphId}
                    isScoringLoading={isScoringRunning}
                  />
                  <DocumentViewer
                    measure={workspaceData.measure}
                    activeParagraphId={activeParagraphId}
                    onParagraphClear={() => setActiveParagraphId(null)}
                    onExpandToMeasure={() => setActiveView("measure")}
                  />
                </div>

                {/* Scoring Chatbot */}
                <ScoringChatbot countryData={workspaceData.countryData} />
              </motion.div>
            )}

            {activeView === "measure" && (
              <motion.div
                key="measure"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.25 }}
                className="h-full"
              >
                <MeasureEditor
                  measure={workspaceData.measure}
                  sourceDocuments={workspaceData.sourceDocuments}
                  onDirtyChange={() => {}}
                  onOpenDocumentManagement={() => setActiveView("documents")}
                  onBackToScoring={() => setActiveView("scoring")}
                />
              </motion.div>
            )}

            {activeView === "alerts" && (
              <motion.div key="alerts" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="h-full overflow-auto p-6">
                <AlertsPanel workspaceName={selectedWorkspace} alerts={currentWorkspaceAlerts} />
              </motion.div>
            )}

            {activeView === "documents" && (
              <motion.div key="documents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="h-full">
                <DocumentManagement workspaceName={selectedWorkspace} onBack={() => setActiveView("measure")} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
