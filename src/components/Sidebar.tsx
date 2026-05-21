"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  AlertTriangle,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { CountryData } from "@/data/dummy";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeView: string;
  onViewChange: (view: "workspace") => void;
  countryData: CountryData;
  selectedWorkspace: string;
  onWorkspaceChange: (workspace: string) => void;
  alertCount: number;
  onAlertsClick: () => void;
  isScoreLoading?: boolean;
}

const workspaceOptions = ["Indonesia", "Singapore", "Malaysia", "Thailand"];

export function Sidebar({
  collapsed,
  onToggle,
  activeView,
  onViewChange,
  countryData,
  selectedWorkspace,
  onWorkspaceChange,
  alertCount,
  onAlertsClick,
  isScoreLoading = false,
}: SidebarProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative z-30 h-full bg-ink-900 text-white flex flex-col shrink-0"
    >
      {/* Workspace Switcher */}
      <div className="relative border-b border-ink-700/50 p-3">
        <button
          type="button"
          onClick={() => !collapsed && setWorkspaceOpen((open) => !open)}
          className={`flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors ${
            collapsed ? "justify-center" : "hover:bg-ink-800"
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600">
            <BriefcaseBusiness className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{selectedWorkspace}</p>
                <p className="truncate text-[10px] text-ink-400">Evidence Workspace</p>
              </div>
              <ChevronDown className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${workspaceOpen ? "rotate-180" : ""}`} />
            </>
          )}
        </button>

        {!collapsed && workspaceOpen && (
          <div className="absolute left-3 right-3 top-[58px] z-20 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-xl">
            {workspaceOptions.map((workspace) => (
              <button
                key={workspace}
                type="button"
                onClick={() => {
                  onWorkspaceChange(workspace);
                  setWorkspaceOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-ink-800"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-[10px] font-bold text-primary-300">
                  {workspace.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{workspace}</p>
                  <p className="truncate text-[10px] text-ink-500">Evidence Workspace</p>
                </div>
                {selectedWorkspace === workspace && <Check className="h-4 w-4 text-primary-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-ink-700/50 px-2 py-3">
        <div className="space-y-1">
          <motion.button
            type="button"
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewChange("workspace")}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
              activeView === "workspace"
                ? "bg-primary-500/20 text-primary-300"
                : "text-ink-300 hover:bg-ink-800 hover:text-white"
            }`}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Workspace</span>}
          </motion.button>

          <button
            type="button"
            onClick={onAlertsClick}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
              activeView === "alerts"
                ? "bg-primary-500/20 text-primary-300"
                : "text-ink-300 hover:bg-ink-800 hover:text-white"
            }`}
          >
            <span className="relative shrink-0">
              <AlertTriangle className="h-5 w-5" />
              {collapsed && alertCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold leading-none text-white">
                  {alertCount}
                </span>
              )}
            </span>
            {!collapsed && (
              <>
                <span className="text-sm font-medium">Alerts</span>
                <span className="ml-auto rounded-full bg-primary-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {alertCount}
                </span>
              </>
            )}
          </button>

          <Link
            href="/version-history"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
              activeView === "version-history"
                ? "bg-primary-500/20 text-primary-300"
                : "text-ink-300 hover:bg-ink-800 hover:text-white"
            }`}
          >
            <Clock className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="text-sm font-medium">Version History</span>}
          </Link>
        </div>
      </div>

      <div className="flex-1" />

      {/* Overall Score */}
      <div className="border-t border-ink-700/50 p-4">
        {!collapsed ? (
          <div className="bg-ink-800 rounded-xl p-3">
            <p className="text-[10px] text-ink-500 uppercase tracking-wider mb-1">Overall RDTII Score</p>
            {isScoreLoading ? (
              <div className="space-y-2">
                <div className="h-8 w-20 animate-pulse rounded bg-ink-700" />
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-700">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
                    className="h-full w-1/2 rounded-full bg-primary-400/70"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold text-primary-400">{countryData.overallScore.toFixed(2)}</span>
                  <span className="text-xs text-ink-500 mb-1">/ 1.00</span>
                </div>
                <div className="mt-2 h-1.5 bg-ink-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${countryData.overallScore * 100}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full"
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary-500/20 bg-ink-800 text-[11px] font-bold text-primary-400">
              {isScoreLoading ? <span className="h-3 w-6 animate-pulse rounded bg-ink-700" /> : countryData.overallScore.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 z-40 w-6 h-6 bg-ink-700 border border-ink-600 rounded-full flex items-center justify-center hover:bg-ink-600 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-ink-300" /> : <ChevronLeft className="w-3 h-3 text-ink-300" />}
      </button>
    </motion.aside>
  );
}
