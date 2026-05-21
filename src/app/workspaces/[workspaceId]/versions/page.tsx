"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Clock, RotateCcw, Save } from "lucide-react";
import { ActionStatus, EmptyState, InlineError } from "@/components/UsabilityPrimitives";

type VersionRow = {
  id: string;
  workspaceId: string;
  label: string;
  createdBy: string;
  createdAt: string;
};

export default function WorkspaceVersionsPage() {
  const params = useParams<{ workspaceId: string }>();
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<{ message: string; detail?: string; tone?: "success" | "danger" | "loading" } | null>(null);

  const load = async () => {
    setError(null);
    const res = await fetch(`/api/workspaces/${params.workspaceId}/versions`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (res.ok) setVersions(json.versions ?? []);
    else setError(json.error || "Could not load versions.");
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveVersion = async () => {
    setStatus({ message: "Saving version...", tone: "loading" });
    const res = await fetch(`/api/workspaces/${params.workspaceId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "Manual snapshot" }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus({ message: "Version saved", tone: "success" });
      await load();
    } else {
      setStatus({ message: "Could not save version", detail: json.error, tone: "danger" });
    }
  };

  const restore = async (version: VersionRow) => {
    setStatus({ message: "Restoring version...", detail: version.label, tone: "loading" });
    const res = await fetch(`/api/versions/${version.id}/restore`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus({ message: "Version restored", detail: version.label, tone: "success" });
      await load();
    } else {
      setStatus({ message: "Could not restore version", detail: json.error, tone: "danger" });
    }
  };

  return (
    <main className="h-full overflow-y-auto bg-comfort px-6 py-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link href={`/workspaces/${params.workspaceId}`} className="text-sm font-semibold text-primary-700 hover:text-primary-800">
              Back to workspace
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-ink-900">Version History</h1>
            <p className="mt-1 text-sm text-ink-500">Durable workspace snapshots from ingestion, mapping review, score changes, and manual saves.</p>
          </div>
          <button type="button" onClick={saveVersion} className="interactive-control inline-flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-ink-900 hover:bg-primary-600">
            <Save className="h-4 w-4" />
            Save Version
          </button>
        </div>

        {status && <ActionStatus message={status.message} detail={status.detail} tone={status.tone} onDismiss={() => setStatus(null)} />}
        {error && <InlineError message={error} onRetry={load} />}

        <section className="space-y-3">
          {versions.length === 0 ? (
            <EmptyState icon={<Clock className="h-5 w-5" />} title="No versions yet" message="Save a manual version or review mappings to create the first snapshot." />
          ) : versions.map((version) => (
            <article key={version.id} className="rounded-xl border border-surface-200 bg-comfort p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">{version.label}</h2>
                  <p className="mt-1 text-xs text-ink-500">{new Date(version.createdAt).toLocaleString()} · {version.createdBy}</p>
                </div>
                <button type="button" onClick={() => restore(version)} className="interactive-control inline-flex items-center gap-1.5 rounded-lg border border-surface-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-comfort-hover">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restore
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
