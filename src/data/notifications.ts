export interface NotificationItem {
  id: string;
  documentName: string;
  workspaceName: string;
  status: string;
  description: string;
  timestamp: string;
  relatedPillar?: string;
}

// Global notifications aggregate amendment/review activity across all workspaces.
// Workspace-specific warnings live in workspaceAlerts.ts and power the sidebar Alerts view.
export const notificationItems: NotificationItem[] = [
  {
    id: "notif-1",
    documentName: "Digital Trade Regulation Draft 2025",
    workspaceName: "ASEAN Policy Review",
    status: "Amendment detected",
    description:
      "A new clause related to cross-border data transfer requires review under RDTII Pillar 6.",
    timestamp: "10 minutes ago",
    relatedPillar: "Pillar 6",
  },
  {
    id: "notif-2",
    documentName: "Personal Data Protection Act",
    workspaceName: "Indonesia Compliance Mapping",
    status: "Review required",
    description:
      "Updated data retention obligation may affect Pillar 7 evidence classification.",
    timestamp: "1 hour ago",
    relatedPillar: "Pillar 7",
  },
  {
    id: "notif-3",
    documentName: "E-Commerce Governance Framework",
    workspaceName: "Regional Trade Desk",
    status: "Evidence updated",
    description:
      "Mapped evidence for domestic privacy safeguards has been updated.",
    timestamp: "Yesterday",
    relatedPillar: "Pillar 7",
  },
];
