"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { AlertsPanel } from "@/components/AlertsPanel";
import { defaultWorkspaceName, getWorkspaceData } from "@/data/dummy";
import { workspaceAlerts } from "@/data/workspaceAlerts";

export default function WorkspaceAlertsPage() {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(defaultWorkspaceName);
  const workspaceData = getWorkspaceData(selectedWorkspace);

  const currentWorkspaceAlerts = workspaceAlerts.filter((alert) => alert.workspace === selectedWorkspace);

  return (
    <div className="flex h-full overflow-hidden">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeView="alerts"
        onViewChange={() => router.push("/")}
        countryData={workspaceData.countryData}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceChange={setSelectedWorkspace}
        alertCount={currentWorkspaceAlerts.length}
        onAlertsClick={() => undefined}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          workspaceMode="view"
          hasUnsavedChanges={false}
          lastUpdated="2026-01-10 14:30"
          showWorkspaceControls={false}
          onWorkspaceModeChange={() => router.push("/")}
          onCancelChanges={() => undefined}
          onSaveChanges={() => undefined}
        />

        <main className="flex-1 overflow-y-auto bg-surface-50 p-6">
          <AlertsPanel workspaceName={selectedWorkspace} alerts={currentWorkspaceAlerts} />
        </main>
      </div>
    </div>
  );
}
