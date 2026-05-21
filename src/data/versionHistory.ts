export interface VersionHistoryItem {
  id: string;
  version: string;
  summary: string;
  timestamp: string;
  editor: string;
}

export const versionHistoryItems: VersionHistoryItem[] = [
  {
    id: "v6",
    version: "Version 6",
    summary: "Updated Pillar 6 evidence mapping",
    timestamp: "2026-01-10 14:30",
    editor: "Edited by Analyst",
  },
  {
    id: "v5",
    version: "Version 5",
    summary: "Added source document references",
    timestamp: "2026-01-09 11:15",
    editor: "Edited by Reviewer",
  },
  {
    id: "v4",
    version: "Version 4",
    summary: "Revised local storage requirement classification",
    timestamp: "2026-01-08 16:00",
    editor: "Edited by Analyst",
  },
  {
    id: "v3",
    version: "Version 3",
    summary: "Initial consolidated measure draft",
    timestamp: "2026-01-07 09:40",
    editor: "Created by System",
  },
];
