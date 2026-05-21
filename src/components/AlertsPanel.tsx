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
  if (severity === "Medium") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function AlertCard({ alert, index }: { alert: WorkspaceAlert; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="overflow-hidden rounded-xl border border-surface-200 bg-white shadow-sm"
    >
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-primary-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityClass(alert.severity)}`}>
                {alert.severity}
              </span>
              <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-ink-600">
                {alert.type}
              </span>
              <span className="text-[10px] text-ink-400">{alert.timestamp}</span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-ink-800">{alert.message}</p>
            {(alert.relatedPillar || alert.relatedSubpillar) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {alert.relatedPillar && (
                  <span className="rounded-md bg-primary-50 px-2 py-1 text-[10px] font-semibold text-primary-700">
                    {alert.relatedPillar}
                  </span>
                )}
                {alert.relatedSubpillar && (
                  <span className="rounded-md bg-surface-100 px-2 py-1 text-[10px] font-medium text-ink-600">
                    {alert.relatedSubpillar}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
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
        <section className="rounded-xl border border-dashed border-surface-300 bg-white px-6 py-12 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />
          <h2 className="mt-3 text-sm font-semibold text-ink-800">No workspace alerts</h2>
          <p className="mt-1 text-sm text-ink-500">This workspace has no unresolved warnings or review items.</p>
        </section>
      )}
    </div>
  );
}
