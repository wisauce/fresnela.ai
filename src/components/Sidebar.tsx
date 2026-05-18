"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Database,
  Shield,
  FilePenLine,
} from "lucide-react";
import type { CountryData, PillarData } from "@/data/dummy";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  activeView: string;
  onViewChange: (view: "workspace" | "editor" | "alerts") => void;
  countryData: CountryData;
  selectedPillar: PillarData;
  onPillarSelect: (pillar: PillarData) => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  activeView,
  onViewChange,
  countryData,
  selectedPillar,
  onPillarSelect,
}: SidebarProps) {
  const navItems = [
    { id: "workspace" as const, icon: LayoutDashboard, label: "Workspace" },
    { id: "editor" as const, icon: FilePenLine, label: "Measure Editor" },
    { id: "alerts" as const, icon: AlertTriangle, label: "Alerts" },
  ];

  const pillarIcons: Record<string, typeof Database> = {
    "pillar-6": Database,
    "pillar-7": Shield,
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-full bg-ink-900 text-white flex flex-col shrink-0 relative"
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-ink-700/50">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-white">R</span>
          </div>
          {!collapsed && (
            <div className="whitespace-nowrap">
              <p className="text-sm font-semibold text-white">RDTII</p>
              <p className="text-[10px] text-ink-400">Evidence Workspace</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-hidden">
        <div className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-primary-500/20 text-primary-300"
                    : "text-ink-300 hover:bg-ink-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Pillar Selector */}
        {!collapsed && (
          <div className="mt-6 pt-4 border-t border-ink-700/50">
            <p className="px-3 text-[11px] font-semibold text-ink-500 uppercase tracking-wider mb-2">
              Active Pillars
            </p>
            <div className="space-y-1">
              {countryData.pillars.map((pillar) => {
                const Icon = pillarIcons[pillar.id] || Database;
                const isSelected = selectedPillar.id === pillar.id;
                return (
                  <motion.button
                    key={pillar.id}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onPillarSelect(pillar)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isSelected
                        ? "bg-primary-500/10 text-primary-300 border border-primary-500/30"
                        : "text-ink-400 hover:bg-ink-800 hover:text-ink-200"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="text-left overflow-hidden">
                      <p className="text-xs font-medium truncate">Pillar {pillar.number}</p>
                      <p className="text-[10px] text-ink-500 truncate">{pillar.name}</p>
                    </div>
                    <span className={`ml-auto text-xs font-mono font-bold shrink-0 ${
                      pillar.weightedScore >= 0.7 ? "text-red-400" :
                      pillar.weightedScore >= 0.4 ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      {pillar.weightedScore.toFixed(2)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Overall Score */}
      {!collapsed && (
        <div className="p-4 border-t border-ink-700/50">
          <div className="bg-ink-800 rounded-xl p-3">
            <p className="text-[10px] text-ink-500 uppercase tracking-wider mb-1">Overall RDTII Score</p>
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
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-ink-700 border border-ink-600 rounded-full flex items-center justify-center hover:bg-ink-600 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-ink-300" /> : <ChevronLeft className="w-3 h-3 text-ink-300" />}
      </button>
    </motion.aside>
  );
}
