import Link from "next/link";
import { Bell } from "lucide-react";
import { listAlerts } from "@/server/db";

const severityStyles: Record<string, string> = {
  High: "bg-red-50 text-red-700 border-red-200",
  Medium: "bg-primary-100 text-primary-700 border-primary-200",
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const runtime = "nodejs";

export default function NotificationsPage() {
  const alerts = listAlerts();

  return (
    <main className="h-full overflow-y-auto bg-comfort px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="border-b border-surface-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ink-900">Notifications</h1>
              <p className="mt-1 text-sm text-ink-500">Real alerts created by source ingestion, OCR, mapping, and review workflows.</p>
            </div>
          </div>
        </section>

        {alerts.length > 0 ? (
          <section className="space-y-3">
            {alerts.map((item) => (
              <article key={item.id} className="interactive-surface rounded-xl border border-surface-200 bg-comfort p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-ink-900">{item.title}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">{item.message}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${severityStyles[item.severity] || "border-surface-200 bg-surface-100 text-ink-600"}`}>
                    {item.severity}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                  <span><span className="font-semibold text-ink-700">Status:</span> {item.status}</span>
                  <span><span className="font-semibold text-ink-700">Created:</span> {new Date(item.createdAt).toLocaleString()}</span>
                  <Link href={`/workspaces/${item.workspaceId}`} className="font-semibold text-primary-700 hover:text-primary-800">Open workspace</Link>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-xl border border-dashed border-surface-300 bg-comfort px-6 py-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-ink-300" />
            <h2 className="mt-3 text-sm font-semibold text-ink-800">No notifications yet</h2>
            <p className="mt-1 text-sm text-ink-500">Alerts will appear here only when real workspace actions create them.</p>
          </section>
        )}
      </div>
    </main>
  );
}
