"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, Minus, RefreshCw, FileWarning } from "lucide-react";
import type { RegulationAlert } from "@/data/dummy";

interface AlertsPanelProps { alerts: RegulationAlert[] }

function AlertCard({ alert, index }: { alert: RegulationAlert; index: number }) {
  const statusConfig = {
    new: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "New", labelBg: "bg-amber-100 text-amber-700" },
    reviewing: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Under Review", labelBg: "bg-blue-100 text-blue-700" },
    reviewed: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", label: "Reviewed", labelBg: "bg-emerald-100 text-emerald-700" },
  };
  const config = statusConfig[alert.status];
  const StatusIcon = config.icon;
  const changeIcons = {
    no_change: { icon: Minus, color: "text-ink-400", label: "No change expected" },
    increase: { icon: RefreshCw, color: "text-red-500", label: "Score may increase" },
    decrease: { icon: RefreshCw, color: "text-emerald-500", label: "Score may decrease" },
    verify: { icon: RefreshCw, color: "text-amber-500", label: "Needs verification" },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className={`border ${config.border} rounded-xl overflow-hidden ${config.bg}`}>
      <div className="px-5 py-4">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${config.color}`}><StatusIcon className="w-5 h-5" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.labelBg}`}>{config.label}</span>
              <span className="text-[10px] text-ink-500">{alert.publishedDate}</span>
              <span className="text-[10px] text-ink-500">·</span>
              <span className="text-[10px] text-ink-500">{alert.language}</span>
            </div>
            <h3 className="text-sm font-semibold text-ink-800 leading-tight">{alert.title}</h3>
            {alert.titleOriginal && <p className="text-xs text-ink-500 mt-0.5 italic">{alert.titleOriginal}</p>}
          </div>
        </div>
      </div>
      <div className="px-5 pb-4">
        <p className="text-[11px] font-semibold text-ink-600 uppercase tracking-wider mb-2">Potential Impact</p>
        <div className="space-y-2">
          {alert.impactedIndicators.map((impact, i) => {
            const changeConfig = changeIcons[impact.expectedChange];
            const ChangeIcon = changeConfig.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 + i * 0.05 }} className="bg-white/70 border border-surface-200/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono bg-surface-100 px-1.5 py-0.5 rounded text-ink-600">{impact.indicatorId}</span>
                    <span className="text-xs font-medium text-ink-700">{impact.indicatorName}</span>
                  </div>
                  <div className="flex items-center gap-1.5"><ChangeIcon className={`w-3.5 h-3.5 ${changeConfig.color}`} /><span className={`text-[10px] font-medium ${changeConfig.color}`}>{changeConfig.label}</span></div>
                </div>
                <p className="text-[11px] text-ink-600 leading-relaxed">{impact.reason}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
      <div className="px-5 py-3 bg-white/50 border-t border-surface-200/50 flex items-center gap-2">
        {alert.status === "new" && (
          <><motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-3 py-1.5 bg-primary-500 text-white text-xs font-medium rounded-lg hover:bg-primary-600 transition-colors">Review</motion.button>
          <button className="px-3 py-1.5 text-xs text-ink-600 hover:bg-surface-100 rounded-lg transition-colors">Dismiss</button></>
        )}
        {alert.status === "reviewing" && <button className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 transition-colors">Continue Review</button>}
        {alert.status === "reviewed" && <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Complete — no score changes</span>}
      </div>
    </motion.div>
  );
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const newAlerts = alerts.filter((a) => a.status === "new");
  const reviewingAlerts = alerts.filter((a) => a.status === "reviewing");
  const reviewedAlerts = alerts.filter((a) => a.status === "reviewed");

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2"><FileWarning className="w-6 h-6 text-primary-600" /><h1 className="text-xl font-bold text-ink-800">Regulation Change Alerts</h1></div>
        <p className="text-sm text-ink-500">New and amended regulations that may impact RDTII scores.</p>
      </div>
      {newAlerts.length > 0 && (<section><h2 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />Requires Attention ({newAlerts.length})</h2><div className="space-y-4">{newAlerts.map((a, i) => <AlertCard key={a.id} alert={a} index={i} />)}</div></section>)}
      {reviewingAlerts.length > 0 && (<section><h2 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" />Under Review ({reviewingAlerts.length})</h2><div className="space-y-4">{reviewingAlerts.map((a, i) => <AlertCard key={a.id} alert={a} index={i} />)}</div></section>)}
      {reviewedAlerts.length > 0 && (<section><h2 className="text-sm font-semibold text-ink-700 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Completed ({reviewedAlerts.length})</h2><div className="space-y-4">{reviewedAlerts.map((a, i) => <AlertCard key={a.id} alert={a} index={i} />)}</div></section>)}
    </div>
  );
}
