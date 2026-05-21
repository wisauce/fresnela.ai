"use client";

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, HelpCircle, Info, Loader2, X } from "lucide-react";

type Tone = "neutral" | "success" | "warning" | "danger" | "loading";

const toneStyles: Record<Tone, string> = {
  neutral: "border-surface-200 bg-surface-50 text-ink-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-primary-200 bg-primary-50 text-primary-800",
  danger: "border-red-200 bg-red-50 text-red-700",
  loading: "border-blue-200 bg-blue-50 text-blue-700",
};

const toneIcons: Record<Tone, ReactNode> = {
  neutral: <Info className="h-4 w-4" />,
  success: <CheckCircle2 className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  danger: <AlertTriangle className="h-4 w-4" />,
  loading: <Loader2 className="h-4 w-4 animate-spin" />,
};

export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${toneStyles[tone]}`}>
      {children}
    </span>
  );
}

export function ActionStatus({
  message,
  detail,
  tone = "neutral",
  onDismiss,
}: {
  message: string;
  detail?: string;
  tone?: Tone;
  onDismiss?: () => void;
}) {
  return (
    <div aria-live="polite" className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${toneStyles[tone]}`}>
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 shrink-0">{toneIcons[tone]}</span>
        <span className="min-w-0">
          <span className="block font-semibold">{message}</span>
          {detail && <span className="mt-0.5 block text-xs opacity-80">{detail}</span>}
        </span>
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss status" className="interactive-control rounded-md p-1 opacity-70 hover:bg-white/50 hover:opacity-100">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function InlineError({ message, retryLabel, onRetry }: { message: string; retryLabel?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{message}</span>
        </div>
        {onRetry && (
          <button type="button" onClick={onRetry} className="interactive-control shrink-0 rounded-md border border-red-200 px-2 py-1 text-xs font-semibold hover:bg-red-100">
            {retryLabel || "Retry"}
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, message, action }: { icon?: ReactNode; title: string; message: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-surface-300 bg-surface-50 p-8 text-center">
      {icon && <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-white text-ink-300">{icon}</div>}
      <p className="mt-3 text-sm font-semibold text-ink-800">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink-900/45 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="w-full max-w-md rounded-xl border border-surface-200 bg-comfort shadow-2xl">
        <div className="px-5 py-4">
          <h2 id="confirm-title" className="text-base font-semibold text-ink-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-surface-200 bg-surface-50 px-5 py-4">
          <button type="button" onClick={onCancel} className="interactive-control rounded-lg px-4 py-2 text-sm font-medium text-ink-600 hover:bg-surface-100">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`interactive-control rounded-lg px-4 py-2 text-sm font-semibold ${destructive ? "bg-red-600 text-white hover:bg-red-700" : "bg-primary-500 text-ink-900 hover:bg-primary-600"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function HelpPopover({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      <button type="button" aria-label={label} className="interactive-control rounded-md p-1 text-ink-400 hover:bg-surface-100 hover:text-ink-700">
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      <span className="pointer-events-none invisible absolute right-0 top-full z-30 mt-2 w-64 rounded-lg border border-surface-200 bg-white p-3 text-xs leading-relaxed text-ink-600 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        {children}
      </span>
    </span>
  );
}
