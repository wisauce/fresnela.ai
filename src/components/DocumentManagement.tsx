"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  indonesiaDocuments,
  scrapeResults,
  suggestedScrapeTargets,
  type ScrapeTarget,
  type WorkspaceDocument,
} from "@/data/documents";

interface DocumentManagementProps {
  workspaceName: string;
}

const statusStyles: Record<string, { label: string; className: string }> = {
  ready: { label: "Ready", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  scraping: { label: "Scraping...", className: "border-blue-200 bg-blue-50 text-blue-700" },
  extracting: { label: "Extracting...", className: "border-primary-200 bg-primary-50 text-primary-700" },
  failed: { label: "Failed", className: "border-red-200 bg-red-50 text-red-700" },
};

function DocumentStatusBadge({ status }: { status: string }) {
  const style = statusStyles[status] || statusStyles.ready;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.className}`}>
      {(status === "scraping" || status === "extracting") && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "ready" && <CheckCircle2 className="h-3 w-3" />}
      {style.label}
    </span>
  );
}

export function DocumentManagement({ workspaceName }: DocumentManagementProps) {
  const [documents, setDocuments] = useState<WorkspaceDocument[]>(
    workspaceName === "Indonesia" ? indonesiaDocuments : []
  );
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scrapingTargets, setScrapingTargets] = useState<string[]>([]);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUploadFile = (file: File | null) => {
    if (!file) return;
    const newDoc: WorkspaceDocument = {
      id: `doc-upload-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ""),
      sourceUrl: "",
      domain: "local upload",
      type: "uploaded",
      status: "extracting",
      language: "Unknown",
      extractedText: "",
      paragraphCount: 0,
      confidence: 0,
      addedAt: new Date().toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace("T", " "),
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
    };
    setDocuments((prev) => [newDoc, ...prev]);

    // Simulate extraction
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === newDoc.id
            ? {
                ...doc,
                status: "ready" as const,
                extractedText: `Extracted text content from uploaded file "${file.name}". This document contains regulatory provisions that may be relevant to RDTII Pillar 6 and Pillar 7 indicators for ${workspaceName}.`,
                paragraphCount: Math.floor(Math.random() * 15) + 3,
                confidence: 0.85 + Math.random() * 0.1,
                language: "Indonesian",
              }
            : doc
        )
      );
    }, 2000 + Math.random() * 1500);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleScrapeUrl = (url: string, target?: ScrapeTarget) => {
    const targetId = target?.id || url;
    setScrapingTargets((prev) => [...prev, targetId]);

    const newDoc: WorkspaceDocument = {
      id: `doc-scrape-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: target?.title || `Scraping: ${new URL(url).hostname}...`,
      sourceUrl: url,
      domain: new URL(url).hostname.replace("www.", ""),
      type: "scraped",
      status: "scraping",
      language: "Unknown",
      extractedText: "",
      paragraphCount: 0,
      confidence: 0,
      addedAt: new Date().toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace("T", " "),
    };
    setDocuments((prev) => [newDoc, ...prev]);

    // Simulate scraping delay
    const delay = 2000 + Math.random() * 2500;
    setTimeout(() => {
      const result = scrapeResults[url] || scrapeResults["default"];
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === newDoc.id
            ? {
                ...doc,
                title: result.title,
                status: "ready" as const,
                extractedText: result.extractedText,
                paragraphCount: result.paragraphCount,
                confidence: result.confidence,
                language: result.language,
              }
            : doc
        )
      );
      setScrapingTargets((prev) => prev.filter((id) => id !== targetId));
    }, delay);
  };

  const handleManualScrape = () => {
    if (!scrapeUrl.trim()) return;
    try {
      new URL(scrapeUrl); // validate
      handleScrapeUrl(scrapeUrl.trim());
      setScrapeUrl("");
      setShowScrapeModal(false);
    } catch {
      // invalid URL, do nothing
    }
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-surface-200 bg-comfort px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink-900">Document Management</h1>
            <p className="mt-1 text-sm text-ink-500">
              Manage regulatory source documents for the {workspaceName} workspace. Upload files or scrape URLs to extract regulatory text.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-surface-200 bg-surface-50 px-3 py-1 text-xs font-semibold text-ink-600">
              {documents.length} document{documents.length !== 1 ? "s" : ""}
            </span>
            <label className="interactive-control inline-flex cursor-pointer items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-comfort-hover">
              <Upload className="h-4 w-4" />
              Upload File
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.html,.pdf,.json,.doc,.docx"
                className="sr-only"
                onChange={(e) => handleUploadFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              onClick={() => setShowScrapeModal(true)}
              className="interactive-control inline-flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-xs font-semibold text-ink-900 hover:bg-primary-600"
            >
              <Globe className="h-4 w-4" />
              Scrape URL
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-4 relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl space-y-3">
          {filteredDocuments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-300 bg-surface-50 px-6 py-12 text-center">
              <FileText className="mx-auto h-8 w-8 text-ink-300" />
              <h2 className="mt-3 text-sm font-semibold text-ink-800">
                {documents.length === 0 ? "No documents yet" : "No documents match your search"}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {documents.length === 0
                  ? "Upload a file or scrape a URL to add regulatory source documents."
                  : "Try a different search term."}
              </p>
              {documents.length === 0 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <label className="interactive-control inline-flex cursor-pointer items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-comfort-hover">
                    <Upload className="h-4 w-4" />
                    Upload File
                    <input type="file" accept=".txt,.md,.html,.pdf,.json,.doc,.docx" className="sr-only" onChange={(e) => handleUploadFile(e.target.files?.[0] ?? null)} />
                  </label>
                  <button type="button" onClick={() => setShowScrapeModal(true)} className="interactive-control inline-flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-xs font-semibold text-ink-900 hover:bg-primary-600">
                    <Globe className="h-4 w-4" />
                    Scrape URL
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredDocuments.map((doc, index) => (
              <motion.article
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className="interactive-surface rounded-xl border border-surface-200 bg-comfort p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${doc.type === "uploaded" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {doc.type === "uploaded" ? <Upload className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink-900">{doc.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                        <span>{doc.domain}</span>
                        <span className="text-ink-300">·</span>
                        <span>{doc.language}</span>
                        <span className="text-ink-300">·</span>
                        <span>{doc.addedAt}</span>
                        {doc.fileSize && (
                          <>
                            <span className="text-ink-300">·</span>
                            <span>{doc.fileSize}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DocumentStatusBadge status={doc.status} />
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(doc.id)}
                      aria-label="Remove document"
                      className="interactive-control rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {doc.status === "ready" && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                      {doc.paragraphCount} paragraphs
                    </span>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      {Math.round(doc.confidence * 100)}% confidence
                    </span>
                    {doc.sourceUrl && (
                      <a href={doc.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-surface-100 px-2 py-0.5 text-[10px] text-ink-600 hover:text-primary-700">
                        <ExternalLink className="h-3 w-3" />
                        Source
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                      className="interactive-control rounded-md bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-ink-600 hover:bg-surface-200"
                    >
                      {expandedDocId === doc.id ? "Hide text" : "Show text"}
                    </button>
                  </div>
                )}

                <AnimatePresence>
                  {expandedDocId === doc.id && doc.status === "ready" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 rounded-lg border border-surface-200 bg-surface-50 p-3">
                        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-ink-700 font-mono max-h-64 overflow-y-auto">
                          {doc.extractedText}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            ))
          )}
        </div>
      </div>

      {/* Scrape Modal */}
      <AnimatePresence>
        {showScrapeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/45 px-4 backdrop-blur-sm"
            onMouseDown={(e) => { if (e.currentTarget === e.target) setShowScrapeModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl rounded-xl border border-surface-200 bg-comfort shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-surface-200 px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold text-ink-900">Scrape Regulatory Source</h2>
                  <p className="mt-1 text-sm text-ink-500">Enter a URL or select from suggested sources to scrape regulatory text.</p>
                </div>
                <button type="button" onClick={() => setShowScrapeModal(false)} aria-label="Close" className="interactive-control rounded-lg p-1.5 text-ink-400 hover:bg-surface-100">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
                {/* Manual URL input */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink-500">Enter URL</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleManualScrape(); }}
                      placeholder="https://jdih.kominfo.go.id/..."
                      className="min-w-0 flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300"
                    />
                    <button
                      type="button"
                      onClick={handleManualScrape}
                      disabled={!scrapeUrl.trim()}
                      className="interactive-control inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-primary-600 disabled:opacity-40"
                    >
                      <Globe className="h-4 w-4" />
                      Scrape
                    </button>
                  </div>
                </div>

                {/* Suggested targets */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-ink-500">Suggested Sources for {workspaceName}</label>
                  <div className="mt-2 space-y-2">
                    {suggestedScrapeTargets.map((target) => {
                      const alreadyAdded = documents.some((doc) => doc.sourceUrl === target.url);
                      const isScraping = scrapingTargets.includes(target.id);
                      return (
                        <div key={target.id} className="rounded-lg border border-surface-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-ink-900">{target.title}</p>
                              <p className="mt-0.5 text-xs text-ink-500 truncate">{target.url}</p>
                              <p className="mt-1 text-xs text-ink-600">{target.snippet}</p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                                  {Math.round(target.confidence * 100)}% relevance
                                </span>
                                {target.relevanceTags.map((tag) => (
                                  <span key={tag} className="rounded-md bg-surface-100 px-2 py-0.5 text-[10px] text-ink-600">
                                    {tag.replaceAll("_", " ")}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleScrapeUrl(target.url, target);
                                setShowScrapeModal(false);
                              }}
                              disabled={alreadyAdded || isScraping}
                              className="interactive-control shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-40"
                            >
                              {isScraping ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : alreadyAdded ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : (
                                <Plus className="h-3.5 w-3.5" />
                              )}
                              {alreadyAdded ? "Added" : isScraping ? "Scraping" : "Scrape"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t border-surface-200 bg-surface-50 px-5 py-3">
                <button type="button" onClick={() => setShowScrapeModal(false)} className="interactive-control rounded-lg px-4 py-2 text-sm font-medium text-ink-600 hover:bg-surface-100">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
