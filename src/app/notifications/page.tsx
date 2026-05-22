"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { notificationItems } from "@/data/notifications";

const statusStyles: Record<string, string> = {
  "Amendment detected": "bg-primary-100 text-primary-700 border-primary-200",
  "Review required": "bg-blue-100 text-blue-700 border-blue-200",
  "Evidence updated": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function NotificationsPage() {
  const router = useRouter();

  const handleBackToWorkspace = () => {
    const lastWorkspace = typeof window !== "undefined"
      ? window.localStorage.getItem("lastWorkspace")
      : null;

    if (lastWorkspace) {
      router.push(`/?workspace=${encodeURIComponent(lastWorkspace)}`);
      return;
    }

    router.push("/");
  };

  return (
    <main className="h-full overflow-y-auto bg-comfort px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="border-b border-surface-200 pb-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">Notifications</h1>
              <p className="mt-1 text-sm text-ink-500">
                Track RDTII scoring reviews, evidence updates, and amendment checks across regulatory workspaces.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleBackToWorkspace}
            className="interactive-control mt-4 inline-flex items-center gap-2 rounded-lg border border-surface-200 px-4 py-2 text-sm font-semibold text-ink-600 transition-colors hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 focus:outline-none focus-visible:bg-primary-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back to workspace
          </button>
        </section>

        {notificationItems.length > 0 ? (
          <section className="space-y-3">
            {notificationItems.map((item) => (
              <article
                key={item.id}
                className="interactive-surface rounded-xl border border-surface-200 bg-comfort p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-ink-900">{item.title}</h2>
                    <span className="rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700">
                      {item.relatedPillar}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${
                      statusStyles[item.status] || "border-surface-200 bg-surface-100 text-ink-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.description}</p>

                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                  <span>
                    <span className="font-semibold text-ink-700">Workspace:</span> {item.workspaceName}
                  </span>
                  <span>
                    <span className="font-semibold text-ink-700">Related Pillar:</span> {item.relatedPillar}
                  </span>
                  <span>
                    <span className="font-semibold text-ink-700">Timestamp:</span> {item.timestamp}
                  </span>
                </div>

                <div className="mt-4 border-t border-surface-200 bg-comfort-hover px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">To Do</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-800">{item.toDo}</p>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-surface-300 bg-comfort px-6 py-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-ink-300" />
            <h2 className="mt-3 text-sm font-semibold text-ink-800">No notifications yet</h2>
            <p className="mt-1 text-sm text-ink-500">
              Document amendments and review tasks will appear here when available.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
