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
  {
    id: "workspace-th",
    countryName: "Thailand",
    countryCode: "TH",
    workspaceName: "Thailand Digital Regulation Workspace",
    documentCount: 9,
    activePillars: ["Pillar 6", "Pillar 7"],
    lastUpdated: "2026-01-07",
    status: "Active",
  },
  {
    id: "workspace-vn",
    countryName: "Vietnam",
    countryCode: "VN",
    workspaceName: "Vietnam Data Governance Workspace",
    documentCount: 11,
    activePillars: ["Pillar 6", "Pillar 7"],
    lastUpdated: "2026-01-09",
    status: "Active",
  },
  {
    id: "workspace-ph",
    countryName: "Philippines",
    countryCode: "PH",
    workspaceName: "Philippines Privacy Workspace",
    documentCount: 7,
    activePillars: ["Pillar 7"],
    lastUpdated: "2026-01-06",
    status: "Active",
  },
  {
    id: "workspace-bn",
    countryName: "Brunei Darussalam",
    countryCode: "BN",
    workspaceName: "Brunei Digital Compliance Workspace",
    documentCount: 3,
    activePillars: ["Pillar 6"],
    lastUpdated: "2026-01-05",
    status: "Draft",
  },
  {
    id: "workspace-kh",
    countryName: "Cambodia",
    countryCode: "KH",
    workspaceName: "Cambodia Regulatory Mapping Workspace",
    documentCount: 4,
    activePillars: ["Pillar 6"],
    lastUpdated: "2026-01-04",
    status: "Draft",
  },
  {
    id: "workspace-la",
    countryName: "Laos",
    countryCode: "LA",
    workspaceName: "Laos Digital Policy Workspace",
    documentCount: 2,
    activePillars: ["Pillar 6"],
    lastUpdated: "2026-01-03",
    status: "Draft",
  },
  {
    id: "workspace-mm",
    countryName: "Myanmar",
    countryCode: "MM",
    workspaceName: "Myanmar Evidence Workspace",
    documentCount: 2,
    activePillars: ["Pillar 6"],
    lastUpdated: "2026-01-02",
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
