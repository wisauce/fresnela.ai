"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { notificationItems } from "@/data/notifications";

export function GlobalNavbar() {
  const alertCount = notificationItems.length;

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 border-b border-primary-500/20 bg-ink-950 text-white shadow-[0_1px_0_rgba(251,191,36,0.08)]">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400/50">
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
            className="rounded-lg px-3 py-2 text-sm font-medium text-[#444444] transition-colors hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400/60"
          >
            Manage Workspace
          </Link>

          <div className="group relative">
            <Link
              href="/notifications"
              aria-label="Notifications"
              className="relative flex rounded-lg p-2 text-[#444444] transition-colors hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400/60"
            >
              <Bell className="h-5 w-5" />
              {alertCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-ink-950">
                  {alertCount}
                </span>
              )}
            </Link>

            <div className="invisible absolute right-0 top-full w-80 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="overflow-hidden rounded-xl border border-surface-200 bg-white text-ink-800 shadow-xl shadow-ink-900/15">
                <Link
                  href="/notifications"
                  className="flex items-center justify-between border-b border-surface-200 bg-surface-50 px-4 py-3 text-xs font-semibold text-ink-700 transition-colors hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-400/50"
                >
                  <span>View all notifications</span>
                  <span className="font-mono text-[10px] text-ink-400">{alertCount}</span>
                </Link>

                {notificationItems.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto py-1">
                    {notificationItems.map((item) => (
                      <Link
                        key={item.id}
                        href="/notifications"
                        className="block border-b border-surface-100 px-4 py-3 last:border-0 transition-colors hover:bg-surface-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-400/40"
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="truncate text-xs font-semibold text-ink-800">{item.documentName}</p>
                          <span className="shrink-0 text-[10px] text-ink-400">{item.timestamp}</span>
                        </div>
                        <p className="text-[10px] font-medium text-primary-700">{item.workspaceName}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                            {item.status}
                          </span>
                          {item.relatedPillar && (
                            <span className="rounded-full bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-ink-500">
                              {item.relatedPillar}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-ink-600">{item.description}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-medium text-ink-700">No notifications</p>
                    <p className="mt-1 text-xs text-ink-500">Document amendments and review tasks will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TODO: Wire this to future full-page settings overlay with language settings. */}
          <button
            type="button"
            aria-label="Settings"
            className="rounded-lg p-2 text-[#444444] transition-colors hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-400/60"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
