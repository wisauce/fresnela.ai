"use client";

import { motion } from "framer-motion";
import { Bell, Search, Globe } from "lucide-react";
import type { CountryData } from "@/data/dummy";

interface TopBarProps {
  countryData: CountryData;
  activeView: string;
  alertCount: number;
}

export function TopBar({ countryData, activeView, alertCount }: TopBarProps) {
  const viewTitles: Record<string, string> = {
    workspace: "Scoring Workspace",
    editor: "Consolidated Measure Editor",
    alerts: "Regulation Alerts",
  };

  return (
    <header className="h-14 border-b border-surface-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{countryData.flag}</span>
        <h1 className="text-lg font-semibold text-ink-800">{countryData.name}</h1>
        <span className="text-ink-300">·</span>
        <span className="text-sm text-ink-500">{viewTitles[activeView]}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-1.5 text-sm bg-surface-100 border border-surface-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400 transition-all"
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative p-2 rounded-lg hover:bg-surface-100 transition-colors"
        >
          <Bell className="w-5 h-5 text-ink-600" />
          {alertCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {alertCount}
            </motion.span>
          )}
        </motion.button>

        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-200 hover:bg-surface-100 transition-colors text-sm">
          <Globe className="w-4 h-4 text-ink-500" />
          <span className="text-ink-700">Indonesia</span>
        </button>
      </div>
    </header>
  );
}
