"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { notificationItems } from "@/data/notifications";

const statusStyles: Record<string, string> = {
  "Amendment detected": "bg-primary-100 text-primary-700 border-primary-200",
  "Review required": "bg-blue-100 text-blue-700 border-blue-200",
  "Evidence updated": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export function GlobalNavbar() {
  const alertCount = notificationItems.length;

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-surface-200 bg-white text-ink-900 shadow-sm">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg transition-opacity hover:opacity-90 focus:outline-none focus-visible:bg-surface-50">
          <Image
            src="/Logo.svg"
            alt="RDTII Evidence Workspace"
            width={480}
            height={144}
            className="h-12 w-auto shrink-0 object-contain"
            priority
          />
          <div className="min-w-0">
            {/* <p className="truncate text-sm font-semibold leading-tight text-white">RDTII Evidence Workspace</p>
            <p className="hidden text-[10px] leading-tight text-ink-400 sm:block">AI legal-regulatory intelligence</p> */}
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/manage-workspace"
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#444444] transition-colors hover:bg-surface-50 hover:text-ink-900 focus:outline-none focus-visible:bg-surface-100 focus-visible:text-ink-900"
          >
            Manage Workspace
          </Link>

          <div className="group relative">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex rounded-lg p-2 text-[#444444] transition-colors hover:bg-surface-50 hover:text-ink-900 focus:outline-none focus-visible:bg-surface-100 focus-visible:text-ink-900"
            >
              <Bell className="h-5 w-5" />
              {alertCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold leading-none text-ink-900 ring-2 ring-white">
                  {alertCount}
                </span>
              )}
            </Link>

            <div className="invisible absolute right-0 top-full w-80 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="flex max-h-[28rem] flex-col overflow-hidden rounded-xl border border-surface-200 bg-white text-ink-800 shadow-xl shadow-ink-900/15">
                {notificationItems.length > 0 ? (
                  <div className="overflow-y-auto py-1">
                    {notificationItems.map((item) => (
                      <Link
                        key={item.id}
                        href="/notifications"
                        className="block border-b border-surface-100 px-4 py-3 last:border-0 transition-colors hover:bg-surface-50 focus:outline-none focus-visible:bg-surface-100"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-800">{item.title}</p>
                          <span className="shrink-0 text-[10px] text-ink-400">{item.time}</span>
                        </div>
                        <p className="mt-0.5 truncate text-[10px] font-medium text-primary-700">{item.workspaceName}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[item.status] || "border-surface-200 bg-surface-100 text-ink-600"}`}>
                            {item.status}
                          </span>
                          <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-ink-500">
                            {item.relatedPillar}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-medium text-ink-700">No notifications</p>
                    <p className="mt-1 text-xs text-ink-500">Document amendments and review tasks will appear here.</p>
                  </div>
                )}

                <Link
                  href="/notifications"
                  className="mt-auto flex items-center justify-between border-t border-surface-200 bg-surface-50 px-4 py-3 text-xs font-semibold text-ink-700 transition-colors hover:bg-surface-100 hover:text-ink-900 focus:outline-none focus-visible:bg-surface-100"
                >
                  <span>View all notifications</span>
                  <span className="font-mono text-[10px] text-ink-400">{alertCount}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* TODO: Wire this to future full-page settings overlay with language settings. */}
          <button
            type="button"
            aria-label="Settings"
            className="rounded-lg p-2 text-[#444444] transition-colors hover:bg-surface-50 hover:text-ink-900 focus:outline-none focus-visible:bg-surface-100 focus-visible:text-ink-900"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
