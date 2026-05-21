"use client";

import {
  Check,
  Eye,
  Loader2,
  Pencil,
  Search,
  X,
} from "lucide-react";

interface TopBarProps {
  workspaceMode: "view" | "edit";
  hasUnsavedChanges: boolean;
  lastUpdated: string;
  modeTransitionStatus?: "entering-edit" | null;
  saveStatus?: "saving" | "saved" | null;
  onWorkspaceModeChange: (mode: "view" | "edit") => void;
  onCancelChanges: () => void;
  onSaveChanges: () => void;
}

export function TopBar({
  workspaceMode,
  hasUnsavedChanges,
  lastUpdated,
  modeTransitionStatus = null,
  saveStatus = null,
  onWorkspaceModeChange,
  onCancelChanges,
  onSaveChanges,
}: TopBarProps) {
  const isSaving = saveStatus === "saving";

  return (
    <header className="h-14 border-b border-surface-200 bg-comfort/85 backdrop-blur-sm flex items-center justify-between gap-4 px-6 shrink-0">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg border border-surface-200 bg-surface-100 py-1.5 pl-9 pr-4 text-sm transition-all focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50"
        />
      </div>

      <div className="flex shrink-0 items-end gap-2">
        <span className="hidden pb-1.5 text-xs text-ink-500 md:inline">Last updated: {lastUpdated}</span>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-1 border-r border-surface-200 pr-2">
            <button
              type="button"
              onClick={onCancelChanges}
              disabled={isSaving}
              className="interactive-control flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-comfort-hover focus:outline-none focus-visible:bg-comfort-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveChanges}
              disabled={isSaving}
              className="interactive-control flex items-center gap-1.5 rounded-lg bg-primary-500 px-2.5 py-1.5 text-xs font-semibold text-ink-900 transition-colors hover:bg-primary-600 focus:outline-none focus-visible:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        )}

        {saveStatus === "saved" && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            Changes saved
          </span>
        )}

        <div className="flex rounded-lg border border-surface-200 bg-surface-50 p-1">
          <button
            type="button"
            aria-label="View Mode"
            onClick={() => onWorkspaceModeChange("view")}
            disabled={modeTransitionStatus === "entering-edit"}
            className={`interactive-control rounded-md p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              workspaceMode === "view"
                ? "bg-primary-100 text-primary-700"
                : "text-ink-500 hover:bg-comfort-hover hover:text-ink-800"
            }`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Edit Mode"
            onClick={() => onWorkspaceModeChange("edit")}
            disabled={modeTransitionStatus === "entering-edit"}
            className={`interactive-control rounded-md p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              workspaceMode === "edit"
                ? "bg-primary-100 text-primary-700"
                : "text-ink-500 hover:bg-comfort-hover hover:text-ink-800"
            }`}
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
