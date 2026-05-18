"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/Sidebar";
import { ScoringPanel } from "@/components/ScoringPanel";
import { DocumentViewer } from "@/components/DocumentViewer";
import { MeasureEditor } from "@/components/MeasureEditor";
import { AlertsPanel } from "@/components/AlertsPanel";
import { TopBar } from "@/components/TopBar";
import {
  indonesiaData,
  consolidatedMeasure,
  sourceDocuments,
  regulationAlerts,
} from "@/data/dummy";

export default function Home() {
  const [activeView, setActiveView] = useState<"workspace" | "editor" | "alerts">("workspace");
  const [selectedPillar, setSelectedPillar] = useState(indonesiaData.pillars[0]);
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleEvidenceClick = (paragraphId: string) => {
    setActiveParagraphId(paragraphId);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView={activeView}
        onViewChange={setActiveView}
        countryData={indonesiaData}
        selectedPillar={selectedPillar}
        onPillarSelect={setSelectedPillar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          countryData={indonesiaData}
          activeView={activeView}
          alertCount={regulationAlerts.filter((a) => a.status === "new").length}
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
                className="flex h-full"
              >
                {/* Left: Scoring with Evidence */}
                <ScoringPanel
                  pillar={selectedPillar}
                  onEvidenceClick={handleEvidenceClick}
                  activeParagraphId={activeParagraphId}
                />

                {/* Right: Consolidated Measure as reference */}
                <DocumentViewer
                  measure={consolidatedMeasure}
                  activeParagraphId={activeParagraphId}
                  onParagraphClear={() => setActiveParagraphId(null)}
                />
              </motion.div>
            )}

            {activeView === "editor" && (
              <motion.div
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <MeasureEditor
                  measure={consolidatedMeasure}
                  sourceDocuments={sourceDocuments}
                />
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
                <AlertsPanel alerts={regulationAlerts} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
