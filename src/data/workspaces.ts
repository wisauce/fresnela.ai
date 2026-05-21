export interface WorkspaceItem {
  id: string;
  countryName: string;
  countryCode: string;
  workspaceName: string;
  documentCount: number;
  activePillars: string[];
  lastUpdated: string;
  status: "Active" | "Draft";
}

export const workspaceItems: WorkspaceItem[] = [
  {
    id: "workspace-id",
    countryName: "Indonesia",
    countryCode: "ID",
    workspaceName: "Indonesia Regulatory Workspace",
    documentCount: 12,
    activePillars: ["Pillar 6", "Pillar 7"],
    lastUpdated: "2026-01-10",
    status: "Active",
  },
  {
    id: "workspace-sg",
    countryName: "Singapore",
    countryCode: "SG",
    workspaceName: "Singapore Digital Trade Workspace",
    documentCount: 8,
    activePillars: ["Pillar 6", "Pillar 7"],
    lastUpdated: "2026-01-08",
    status: "Active",
  },
  {
    id: "workspace-my",
    countryName: "Malaysia",
    countryCode: "MY",
    workspaceName: "Malaysia Data Policy Workspace",
    documentCount: 5,
    activePillars: ["Pillar 7"],
    lastUpdated: "2026-01-05",
    status: "Draft",
  },
];

export const countryOptions = [
  "Indonesia",
  "Singapore",
  "Malaysia",
  "Thailand",
  "Vietnam",
  "Philippines",
  "Brunei Darussalam",
  "Cambodia",
  "Laos",
  "Myanmar",
];
