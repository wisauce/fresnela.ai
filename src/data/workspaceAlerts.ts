// Workspace alerts are scoped to the currently selected workspace only.
// They are separate from global notifications, which aggregate activity across all workspaces.
export interface WorkspaceAlert {
  id: string;
  workspace: string;
  title: string;
  type: "Missing Evidence" | "Low Confidence Mapping" | "Outdated Source";
  message: string;
  severity: "High" | "Medium" | "Low";
  timestamp: string;
  relatedPillar?: string;
  relatedSubpillar?: string;
}

export const workspaceAlerts: WorkspaceAlert[] = [
  {
    id: "workspace-alert-id-1",
    workspace: "Indonesia",
    title: "Missing Evidence in Local Storage Requirement",
    type: "Missing Evidence",
    message: "Pillar 6.2 has local storage requirements but no linked source paragraph.",
    severity: "High",
    timestamp: "2026-01-10 14:30",
    relatedPillar: "Pillar 6",
    relatedSubpillar: "6.2 Local storage requirements",
  },
  {
    id: "workspace-alert-id-2",
    workspace: "Indonesia",
    title: "Low Confidence Data Retention Mapping",
    type: "Low Confidence Mapping",
    message: "Pillar 7.3 data retention classification requires analyst review.",
    severity: "Medium",
    timestamp: "2026-01-10 13:10",
    relatedPillar: "Pillar 7",
    relatedSubpillar: "7.3 Data retention obligations",
  },
  {
    id: "workspace-alert-sg-1",
    workspace: "Singapore",
    title: "Outdated Cross-Border Transfer Source",
    type: "Outdated Source",
    message: "Source document has been updated and requires re-checking.",
    severity: "Medium",
    timestamp: "2026-01-09 10:00",
    relatedPillar: "Pillar 6",
  },
];
