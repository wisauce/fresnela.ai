"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  indonesiaDocuments,
  scrapeResults,
  suggestedScrapeTargets,
  type WorkspaceDocument,
} from "@/data/documents";

interface DocumentManagementProps {
  workspaceName: string;
  onBack: () => void;
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

// ─── Scraper Agent Modal ─────────────────────────────────────────────────────

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

function ScraperAgentModal({ workspaceName, onClose, onDocumentScraped }: {
  workspaceName: string;
  onClose: () => void;
  onDocumentScraped: (doc: WorkspaceDocument) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: `Hi! I can help you find and scrape regulatory sources for ${workspaceName}.\n\nTry:\n• "Suggest sources"\n• "Scrape https://..."\n• "Find Pillar 6 sources"\n• "Find Pillar 7 sources"` },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const addMsg = (role: "assistant", content: string) => {
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}-${Math.random()}`, role, content }]);
    scrollToBottom();
  };

  const simulateScrape = (url: string, title?: string) => {
    const domain = new URL(url).hostname.replace("www.", "");
    addMsg("assistant", `🔄 Scraping **${domain}**... Extracting regulatory text.`);

    const delay = 2500 + Math.random() * 2000;
    setTimeout(() => {
      const result = scrapeResults[url] || scrapeResults["default"];
      const newDoc: WorkspaceDocument = {
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: title || result.title,
        sourceUrl: url,
        domain,
        type: "scraped",
        status: "ready",
        language: result.language,
        extractedText: result.extractedText,
        paragraphCount: result.paragraphCount,
        confidence: result.confidence,
        addedAt: new Date().toLocaleString("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace("T", " "),
      };
      onDocumentScraped(newDoc);
      addMsg("assistant", `✅ Done! Extracted **${result.paragraphCount} paragraphs** from "${result.title}" (${Math.round(result.confidence * 100)}% confidence). Document added to your workspace.`);
    }, delay);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isSending) return;
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, role: "user", content: text }]);
    setInput("");
    setIsSending(true);
    scrollToBottom();

    setTimeout(() => {
      const lower = text.toLowerCase();

      // Direct URL
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        try { new URL(urlMatch[0]); simulateScrape(urlMatch[0]); setIsSending(false); return; } catch { /* ignore */ }
      }

      if (lower.includes("scrape") && !urlMatch) {
        // "scrape N" from suggestions
        const numMatch = lower.match(/scrape\s*(\d+)/);
        if (numMatch) {
          const idx = parseInt(numMatch[1]) - 1;
          const target = suggestedScrapeTargets[idx];
          if (target) { simulateScrape(target.url, target.title); }
          else { addMsg("assistant", "I couldn't find that number. Say 'suggest sources' to see the list."); }
          setIsSending(false);
          return;
        }
        addMsg("assistant", `Paste a URL to scrape, or say "suggest sources" and I'll recommend official regulatory URLs.`);
        setIsSending(false);
        return;
      }

      if (lower.includes("suggest") || lower.includes("find") || lower.includes("search") || lower.includes("discover")) {
        const isP6 = lower.includes("pillar 6") || lower.includes("cross-border") || lower.includes("localization");
        const isP7 = lower.includes("pillar 7") || lower.includes("data protection") || lower.includes("privacy") || lower.includes("cybersecurity");
        let targets = suggestedScrapeTargets;
        if (isP6) targets = targets.filter((s) => s.relevanceTags.some((t) => t.includes("localization") || t.includes("cross_border") || t.includes("infrastructure") || t.includes("trade")));
        if (isP7) targets = targets.filter((s) => s.relevanceTags.some((t) => t.includes("data_protection") || t.includes("cybersecurity") || t.includes("dpo") || t.includes("government")));

        let msg = `Here are official regulatory sources for ${workspaceName}${isP6 ? " (Pillar 6)" : isP7 ? " (Pillar 7)" : ""}:\n\n`;
        targets.forEach((s, i) => { msg += `${i + 1}. **${s.title}**\n   ${s.url}\n   ${s.relevanceTags.join(", ")} · ${Math.round(s.confidence * 100)}% relevance\n\n`; });
        msg += `Say "scrape 1", "scrape 2", etc. to extract text from any of these.`;
        addMsg("assistant", msg);
        setIsSending(false);
        return;
      }

      addMsg("assistant", `I can help with:\n• **"Suggest sources"** — find official regulatory URLs\n• **"Scrape [URL]"** — extract text from a URL\n• **"Find Pillar 6 sources"** or **"Find Pillar 7 sources"**`);
      setIsSending(false);
    }, 700 + Math.random() * 500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-900/50 px-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="flex h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-surface-200 bg-comfort shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-200 px-5 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
              <Bot className="h-4 w-4 text-primary-700" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink-900">Source Scraper Agent</h2>
              <p className="text-[10px] text-ink-500">Find and extract regulatory text from official URLs</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="interactive-control rounded-lg p-1.5 text-ink-400 hover:bg-surface-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === "user" ? "bg-primary-100 text-primary-900" : "border border-surface-200 bg-white text-ink-700"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-surface-200 p-3 shrink-0">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {["Suggest sources", "Find Pillar 6 sources", "Find Pillar 7 sources"].map((p) => (
              <button key={p} type="button" onClick={() => setInput(p)} className="interactive-control rounded-full border border-surface-200 px-2.5 py-1 text-[10px] font-medium text-ink-600 hover:bg-comfort-hover">{p}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask to find sources, or paste a URL to scrape..."
              className="min-w-0 flex-1 rounded-lg border border-surface-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-300"
            />
            <button type="button" onClick={handleSend} disabled={isSending || !input.trim()} className="interactive-control rounded-lg bg-primary-500 p-2 text-ink-900 hover:bg-primary-600 disabled:opacity-50">
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Document Management Page ───────────────────────────────────────────

export function DocumentManagement({ workspaceName, onBack }: DocumentManagementProps) {
  const [documents, setDocuments] = useState<WorkspaceDocument[]>(
    workspaceName === "Indonesia" ? indonesiaDocuments : []
  );
  const [showScraper, setShowScraper] = useState(false);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUpload = (file: File | null) => {
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
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === newDoc.id
            ? { ...doc, status: "ready" as const, extractedText: `Extracted regulatory text from "${file.name}". Contains provisions relevant to RDTII indicators for ${workspaceName}.`, paragraphCount: Math.floor(Math.random() * 12) + 3, confidence: 0.85 + Math.random() * 0.1, language: "Indonesian" }
            : doc
        )
      );
    }, 2000);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDocumentScraped = (doc: WorkspaceDocument) => {
    setDocuments((prev) => [doc, ...prev]);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-surface-200 bg-comfort px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="interactive-control rounded-lg p-1.5 text-ink-500 hover:bg-comfort-hover hover:text-ink-800">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-bold text-ink-900">Documents</h1>
            <p className="text-xs text-ink-500">Source documents for {workspaceName} workspace · {documents.length} total</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="interactive-control inline-flex cursor-pointer items-center gap-2 rounded-lg border border-surface-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-comfort-hover">
              <Upload className="h-4 w-4" />
              Upload File
              <input ref={fileInputRef} type="file" accept=".txt,.md,.html,.pdf,.json,.doc,.docx" className="sr-only" onChange={(e) => handleUpload(e.target.files?.[0] ?? null)} />
            </label>
            <button
              type="button"
              onClick={() => setShowScraper(true)}
              className="interactive-control inline-flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-xs font-semibold text-ink-900 hover:bg-primary-600"
            >
              <Globe className="h-4 w-4" />
              Scrape Source
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative max-w-sm">
          <FileText className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-lg border border-surface-200 bg-white py-1.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-3">
          {filteredDocs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-300 bg-surface-50 px-6 py-16 text-center">
              <FileText className="mx-auto h-10 w-10 text-ink-200" />
              <h2 className="mt-4 text-sm font-semibold text-ink-800">
                {documents.length === 0 ? "No documents yet" : "No documents match your search"}
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                {documents.length === 0 ? "Upload a file or use the scraper agent to add regulatory sources." : "Try a different search term."}
              </p>
              {documents.length === 0 && (
                <div className="mt-5 flex items-center justify-center gap-3">
                  <label className="interactive-control inline-flex cursor-pointer items-center gap-2 rounded-lg border border-surface-200 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-comfort-hover">
                    <Upload className="h-4 w-4" />
                    Upload File
                    <input type="file" accept=".txt,.md,.html,.pdf,.json,.doc,.docx" className="sr-only" onChange={(e) => handleUpload(e.target.files?.[0] ?? null)} />
                  </label>
                  <button type="button" onClick={() => setShowScraper(true)} className="interactive-control inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-ink-900 hover:bg-primary-600">
                    <Globe className="h-4 w-4" />
                    Scrape Source
                  </button>
                </div>
              )}
            </div>
          ) : (
            filteredDocs.map((doc, index) => (
              <motion.article
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="interactive-surface rounded-xl border border-surface-200 bg-comfort p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${doc.type === "uploaded" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"}`}>
                      {doc.type === "uploaded" ? <Upload className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-ink-900">{doc.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-500">
                        <span>{doc.domain}</span>
                        <span className="text-ink-300">·</span>
                        <span>{doc.language}</span>
                        <span className="text-ink-300">·</span>
                        <span>{doc.addedAt}</span>
                        {doc.fileSize && (<><span className="text-ink-300">·</span><span>{doc.fileSize}</span></>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DocumentStatusBadge status={doc.status} />
                    <button type="button" onClick={() => setDocuments((prev) => prev.filter((d) => d.id !== doc.id))} aria-label="Remove" className="interactive-control rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {doc.status === "ready" && (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">{doc.paragraphCount} paragraphs</span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{Math.round(doc.confidence * 100)}% confidence</span>
                      {doc.sourceUrl && (
                        <a href={doc.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-surface-100 px-2 py-0.5 text-[10px] text-ink-600 hover:text-primary-700">
                          <ExternalLink className="h-3 w-3" />Source
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                        className="interactive-control rounded-md bg-surface-100 px-2 py-0.5 text-[10px] font-medium text-ink-600 hover:bg-surface-200"
                      >
                        {expandedDocId === doc.id ? "Hide text ▲" : "Show text ▼"}
                      </button>
                    </div>
                    <AnimatePresence>
                      {expandedDocId === doc.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <pre className="mt-3 rounded-lg border border-surface-200 bg-surface-50 p-3 text-xs leading-relaxed text-ink-700 font-mono max-h-56 overflow-y-auto whitespace-pre-wrap">{doc.extractedText}</pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.article>
            ))
          )}
        </div>
      </div>

      {/* Scraper Agent Modal */}
      <AnimatePresence>
        {showScraper && (
          <ScraperAgentModal
            workspaceName={workspaceName}
            onClose={() => setShowScraper(false)}
            onDocumentScraped={handleDocumentScraped}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
