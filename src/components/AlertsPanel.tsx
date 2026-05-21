"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, FileWarning } from "lucide-react";
import type { WorkspaceAlert } from "@/data/workspaceAlerts";

interface AlertsPanelProps {
  workspaceName: string;
  alerts: WorkspaceAlert[];
}

function severityClass(severity: WorkspaceAlert["severity"]) {
  if (severity === "High") return "border-red-200 bg-red-50 text-red-700";
  if (severity === "Medium") return "border-primary-200 bg-primary-50 text-primary-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function AlertCard({ alert, index }: { alert: WorkspaceAlert; index: number }) {
  const relatedLabel = alert.relatedSubpillar || alert.relatedPillar || "Workspace";

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="interactive-surface rounded-xl border border-surface-200 bg-comfort px-4 py-3 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-primary-600" />
          <h2 className="truncate text-sm font-semibold text-ink-900">{alert.title}</h2>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityClass(alert.severity)}`}>
          {alert.severity}
        </span>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-6 text-xs text-ink-500">
        <span className="font-medium text-ink-600">{relatedLabel}</span>
        <span className="text-ink-300">·</span>
        <span>{alert.timestamp}</span>
      </div>

      <div className="mt-2 pl-6">
        <p className="text-sm leading-relaxed text-ink-700">{alert.message}</p>
        {alert.relatedPillar && alert.relatedSubpillar && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
              {alert.relatedPillar}
            </span>
            <span className="rounded-md bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-ink-600">
              {alert.type}
            </span>
          </div>
        )}
      </div>
    </motion.article>
  );
}

export function AlertsPanel({ workspaceName, alerts }: AlertsPanelProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <FileWarning className="h-6 w-6 text-primary-600" />
          <h1 className="text-xl font-bold text-ink-800">{workspaceName} Workspace Alerts</h1>
        </div>
        <p className="text-sm text-ink-500">Warnings and review items that require attention in this workspace.</p>
      </div>

      {alerts.length > 0 ? (
        <section className="space-y-3">
          {alerts.map((alert, index) => (
            <AlertCard key={alert.id} alert={alert} index={index} />
          ))}
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-surface-300 bg-comfort px-6 py-12 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <h2 className="mt-3 text-sm font-semibold text-ink-800">No workspace alerts</h2>
          <p className="mt-1 text-sm text-ink-500">This workspace has no unresolved warnings or review items.</p>
        </section>
      )}
    </div>
  );
}
