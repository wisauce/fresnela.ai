export interface NotificationItem {
  id: string;
  title: string;
  documentName: string;
  workspaceName: string;
  status: string;
  description: string;
  time: string;
  timestamp: string;
  relatedPillar: string;
  toDo: string;
}

// Global notifications aggregate amendment/review activity across all workspaces.
// Workspace-specific warnings live in workspaceAlerts.ts and power the sidebar Alerts view.
export const notificationItems: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Local Storage Requirement Review",
    documentName: "Local Storage Requirement Review",
    workspaceName: "Indonesia Compliance Mapping",
    status: "Amendment detected",
    description:
      "A new clause may affect the scoring of Pillar 6.2 because it introduces a local accessibility requirement for a specific category of electronic system data.",
    time: "10 minutes ago",
    timestamp: "2026-01-10 14:30",
    relatedPillar: "Pillar 6.2",
    toDo: "Review whether the clause should be scored as a moderate local storage requirement rather than a full data localization restriction.",
  },
  {
    id: "notif-2",
    title: "Data Retention Obligation Review",
    documentName: "Data Retention Obligation Review",
    workspaceName: "Indonesia Compliance Mapping",
    status: "Review required",
    description:
      "Updated wording may affect Pillar 7.3 because the regulation introduces a mandatory retention period for selected categories of personal data.",
    time: "1 hour ago",
    timestamp: "2026-01-10 13:10",
    relatedPillar: "Pillar 7.3",
    toDo: "Confirm whether the obligation increases compliance burden and should change the current retention scoring level.",
  },
  {
    id: "notif-3",
    title: "Cross-Border Transfer Condition Updated",
    documentName: "Cross-Border Transfer Condition Updated",
    workspaceName: "ASEAN Policy Review",
    status: "Evidence updated",
    description:
      "A source paragraph has been mapped to Pillar 6.4 because cross-border transfer is allowed only under specific conditions such as consent, approval, or adequacy.",
    time: "Yesterday",
    timestamp: "2026-01-09 16:20",
    relatedPillar: "Pillar 6.4",
    toDo: "Verify whether the condition creates a conditional flow regime under the RDTII scoring criteria.",
  },
  {
    id: "notif-4",
    title: "Privacy Compliance Obligation Added",
    documentName: "Privacy Compliance Obligation Added",
    workspaceName: "Regional Privacy Review",
    status: "Review required",
    description:
      "A new compliance requirement may affect Pillar 7.4 because it introduces accountability obligations such as reporting, documentation, or responsible officer requirements.",
    time: "Yesterday",
    timestamp: "2026-01-09 10:45",
    relatedPillar: "Pillar 7.4",
    toDo: "Check whether the obligation should increase the compliance obligation score.",
  },
];
