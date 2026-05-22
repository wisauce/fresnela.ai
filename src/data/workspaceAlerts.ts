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
  {
    id: "workspace-alert-my-1",
    workspace: "Malaysia",
    title: "Missing Evidence for Data Retention",
    type: "Missing Evidence",
    message: "Pillar 7.3 requires retention obligations evidence before final scoring.",
    severity: "High",
    timestamp: "2026-01-08 09:20",
    relatedPillar: "Pillar 7",
    relatedSubpillar: "7.3 Data retention obligations",
  },
  {
    id: "workspace-alert-th-1",
    workspace: "Thailand",
    title: "Low Confidence Mapping for Cross-Border Transfers",
    type: "Low Confidence Mapping",
    message: "Conditional transfer regime mapping needs secondary verification.",
    severity: "Medium",
    timestamp: "2026-01-07 15:05",
    relatedPillar: "Pillar 6",
    relatedSubpillar: "6.4 Conditional flow regimes",
  },
  {
    id: "workspace-alert-vn-1",
    workspace: "Vietnam",
    title: "Outdated Localization Reference",
    type: "Outdated Source",
    message: "Localization requirement document was amended in late 2025.",
    severity: "Medium",
    timestamp: "2026-01-09 11:45",
    relatedPillar: "Pillar 6",
  },
  {
    id: "workspace-alert-ph-1",
    workspace: "Philippines",
    title: "Missing Evidence for DPO Requirement",
    type: "Missing Evidence",
    message: "Pillar 7.4 needs updated DPO clause evidence for 2026 review.",
    severity: "High",
    timestamp: "2026-01-06 13:55",
    relatedPillar: "Pillar 7",
    relatedSubpillar: "7.4 Compliance obligations",
  },
  {
    id: "workspace-alert-bn-1",
    workspace: "Brunei Darussalam",
    title: "Low Confidence Mapping for Local Storage",
    type: "Low Confidence Mapping",
    message: "Local storage requirement mapping requires secondary analyst review.",
    severity: "Low",
    timestamp: "2026-01-05 10:10",
    relatedPillar: "Pillar 6",
    relatedSubpillar: "6.2 Local storage requirements",
  },
  {
    id: "workspace-alert-kh-1",
    workspace: "Cambodia",
    title: "Missing Evidence for Cross-Border Transfer",
    type: "Missing Evidence",
    message: "Pillar 6.4 lacks confirmatory clause for transfer conditions.",
    severity: "High",
    timestamp: "2026-01-04 09:40",
    relatedPillar: "Pillar 6",
    relatedSubpillar: "6.4 Conditional flow regimes",
  },
  {
    id: "workspace-alert-la-1",
    workspace: "Laos",
    title: "Outdated Evidence for Data Protection Framework",
    type: "Outdated Source",
    message: "Data protection framework reference is from 2023 and needs refresh.",
    severity: "Medium",
    timestamp: "2026-01-03 08:55",
    relatedPillar: "Pillar 7",
  },
  {
    id: "workspace-alert-mm-1",
    workspace: "Myanmar",
    title: "Low Confidence Mapping for Cybersecurity Controls",
    type: "Low Confidence Mapping",
    message: "Cybersecurity framework evidence is partial and requires validation.",
    severity: "Low",
    timestamp: "2026-01-02 14:15",
    relatedPillar: "Pillar 7",
    relatedSubpillar: "7.2 Cybersecurity framework",
  },
];
