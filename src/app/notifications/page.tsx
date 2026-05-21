import { Bell, Clock, Layers, MessageSquareText, Tag } from "lucide-react";
import { notificationItems } from "@/data/notifications";

const statusStyles: Record<string, string> = {
  "Amendment detected": "bg-primary-100 text-primary-700 border-primary-200",
  "Review required": "bg-blue-100 text-blue-700 border-blue-200",
  "Evidence updated": "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function NotificationsPage() {
  return (
    <main className="h-full overflow-y-auto bg-surface-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="border-b border-surface-200 pb-5">
          <div className="flex items-center gap-3">
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
        </section>

        {notificationItems.length > 0 ? (
          <section className="space-y-3">
            {notificationItems.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold text-ink-900">{item.title}</h2>
                        <span className="rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
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
                  </div>

                  <div className="w-full rounded-lg border border-surface-200 bg-surface-50 p-3 text-xs text-ink-500 lg:w-80">
                    <div className="space-y-3">
                      <div className="grid grid-cols-[92px_1fr] items-start gap-2">
                        <span className="flex items-center gap-1.5 font-medium text-ink-600">
                          <Layers className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                          Workspace
                        </span>
                        <span className="min-w-0 truncate text-ink-700">{item.workspaceName}</span>
                      </div>
                      <div className="grid grid-cols-[92px_1fr] items-start gap-2">
                        <span className="flex items-center gap-1.5 font-medium text-ink-600">
                          <Tag className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                          Pillar
                        </span>
                        <span className="text-ink-700">{item.relatedPillar}</span>
                      </div>
                      <div className="grid grid-cols-[92px_1fr] items-start gap-2">
                        <span className="flex items-center gap-1.5 font-medium text-ink-600">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                          Time
                        </span>
                        <span className="text-ink-700">{item.timestamp}</span>
                      </div>
                      <div className="grid grid-cols-[92px_1fr] items-start gap-2">
                        <span className="flex items-center gap-1.5 font-medium text-ink-600">
                          <MessageSquareText className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                          To Do
                        </span>
                        <p className="leading-relaxed text-ink-600">{item.toDo}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-surface-300 bg-white px-6 py-12 text-center">
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
