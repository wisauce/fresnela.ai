"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const currentWorkspaceAlerts = workspaceAlerts.filter((alert) => alert.workspace === selectedWorkspace);

  const handleEvidenceClick = (paragraphId: string) => {
    setActiveParagraphId(paragraphId);
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
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          workspaceMode={workspaceMode}
          hasUnsavedChanges={hasUnsavedChanges}
          lastUpdated="2026-01-10 14:30"
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
                <div className="flex-1 overflow-hidden">
                  {workspaceMode === "view" ? (
                    <div className="flex h-full">
                      {/* Left: Scoring with Evidence */}
                      <WorkspacePillarsPanel
                        countryData={indonesiaData}
                        onEvidenceClick={handleEvidenceClick}
                        activeParagraphId={activeParagraphId}
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
