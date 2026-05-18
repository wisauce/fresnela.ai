"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Link2, ExternalLink, Edit3, CheckCircle2, AlertTriangle, ChevronDown, GitBranch, Layers, Languages } from "lucide-react";
import type { ConsolidatedMeasure, ConsolidatedParagraph, SourceDocument } from "@/data/dummy";

interface MeasureEditorProps {
  measure: ConsolidatedMeasure;
  sourceDocuments: SourceDocument[];
}

function SourceDocumentSelector({ documents, activeDocId, onSelect }: { documents: SourceDocument[]; activeDocId: string | null; onSelect: (doc: SourceDocument) => void }) {
  const [open, setOpen] = useState(false);
  const activeDoc = documents.find((d) => d.id === activeDocId);
  const typeColors: Record<string, string> = { base: "bg-emerald-100 text-emerald-700", amendment: "bg-amber-100 text-amber-700", implementing_regulation: "bg-blue-100 text-blue-700", treaty: "bg-purple-100 text-purple-700", court_decision: "bg-pink-100 text-pink-700" };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-200 hover:bg-surface-50 transition-colors text-sm w-full">
        <Layers className="w-4 h-4 text-primary-600 shrink-0" />
        <span className="text-xs text-ink-700 truncate flex-1 text-left">{activeDoc ? activeDoc.title : "Select source document..."}</span>
        <ChevronDown className="w-3.5 h-3.5 text-ink-400 shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute top-full left-0 right-0 mt-1 bg-white border border-surface-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
            {documents.map((doc) => (
              <button key={doc.id} onClick={() => { onSelect(doc); setOpen(false); }} className={`w-full px-3 py-2.5 text-left hover:bg-surface-50 transition-colors border-b border-surface-100 last:border-0 ${doc.id === activeDocId ? "bg-primary-50" : ""}`}>
                <p className="text-xs font-medium text-ink-800 leading-tight">{doc.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${typeColors[doc.type] || ""}`}>{doc.type.replace("_", " ")}</span>
                  <span className="text-[9px] text-ink-500">{doc.dateEnacted}</span>
                  <span className="text-[9px] text-ink-500 flex items-center gap-0.5"><Languages className="w-3 h-3" />{doc.language}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConsolidatedParagraphItem({ paragraph, isActive, onClick }: { paragraph: ConsolidatedParagraph; isActive: boolean; onClick: () => void }) {
  return (
    <motion.button onClick={onClick} whileHover={{ x: 2 }} className={`w-full text-left p-3 rounded-lg border transition-all ${
      isActive ? "bg-primary-100/70 border-primary-300 shadow-sm" : "bg-white border-surface-200 hover:border-primary-200 hover:bg-primary-50/20"
    }`}>
      <p className={`text-[12px] leading-relaxed ${isActive ? "text-ink-900 font-medium" : "text-ink-700"}`}>{paragraph.text}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className="text-[10px] font-mono text-ink-400">{paragraph.sourceArticle}</span>
        {paragraph.linkedIndicators.map((ind) => (
          <span key={ind} className="text-[9px] px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded font-medium flex items-center gap-0.5"><Link2 className="w-2.5 h-2.5" />{ind}</span>
        ))}
        {paragraph.isAmended && <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded">amended</span>}
      </div>
    </motion.button>
  );
}

function SourceDocumentViewer({ document, activeParagraph }: { document: SourceDocument | null; activeParagraph: ConsolidatedParagraph | null }) {
  const highlightRef = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (activeParagraph && highlightRef.current) highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); }, [activeParagraph]);

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center bg-surface-50">
        <div className="text-center"><FileText className="w-12 h-12 text-ink-200 mx-auto mb-3" /><p className="text-sm text-ink-500">Select a paragraph on the left to view its source</p><p className="text-xs text-ink-400 mt-1">The original provision will be highlighted here</p></div>
      </div>
    );
  }

  const textToHighlight = activeParagraph?.text || "";
  const anchor = textToHighlight.substring(0, 40);
  const fullText = document.fullText;
  const matchIndex = fullText.indexOf(anchor);

  const renderSourceText = () => {
    if (!activeParagraph || matchIndex === -1) {
      return <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-ink-700 font-mono">{document.fullText}</pre>;
    }
    const matchEnd = matchIndex + textToHighlight.length;
    const before = fullText.substring(0, matchIndex);
    const match = fullText.substring(matchIndex, Math.min(matchEnd, fullText.length));
    const after = fullText.substring(Math.min(matchEnd, fullText.length));
    return (
      <pre className="whitespace-pre-wrap text-[12px] leading-relaxed font-mono">
        <span className="text-ink-700">{before}</span>
        <span ref={highlightRef} className="block relative">
          <motion.span initial={{ backgroundColor: "rgba(251, 191, 36, 0)" }} animate={{ backgroundColor: "rgba(251, 191, 36, 0.25)" }} transition={{ duration: 0.5 }}
            className="bg-primary-200/40 border-l-[3px] border-primary-500 pl-3 -ml-3 py-1 rounded-r-lg text-ink-900 font-medium block">{match}</motion.span>
        </span>
        <span className="text-ink-700">{after}</span>
      </pre>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="px-4 py-3 border-b border-surface-200 bg-surface-50/50 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-ink-800">{document.title}</p>
            {document.titleOriginal && <p className="text-[10px] text-ink-500 italic mt-0.5">{document.titleOriginal}</p>}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-ink-500">{document.dateEnacted}</span><span className="text-[10px] text-ink-500">·</span>
              <span className="text-[10px] text-ink-500">{document.language}</span><span className="text-[10px] text-ink-500">·</span>
              <span className="text-[10px] font-mono text-ink-500">{Math.round(document.extractionConfidence * 100)}% confidence</span>
            </div>
          </div>
          <a href={document.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary-600 hover:text-primary-700"><ExternalLink className="w-3 h-3" />Source</a>
        </div>
      </div>

      <AnimatePresence>
        {activeParagraph && matchIndex !== -1 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden shrink-0">
            <div className="px-4 py-1.5 bg-primary-50 border-b border-primary-200 flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary-600" /><span className="text-[11px] text-primary-800 font-medium">Source text found — {activeParagraph.sourceArticle}</span></div>
          </motion.div>
        )}
        {activeParagraph && matchIndex === -1 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden shrink-0">
            <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /><span className="text-[11px] text-amber-800 font-medium">Exact match not found — may need manual verification</span></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-6 py-5">{renderSourceText()}</div>
    </div>
  );
}

export function MeasureEditor({ measure, sourceDocuments }: MeasureEditorProps) {
  const [activeParagraph, setActiveParagraph] = useState<ConsolidatedParagraph | null>(null);
  const [activeSourceDoc, setActiveSourceDoc] = useState<SourceDocument | null>(null);

  const handleParagraphClick = (paragraph: ConsolidatedParagraph) => {
    setActiveParagraph(paragraph);
    const doc = sourceDocuments.find((d) => d.id === paragraph.sourceDocumentId);
    if (doc) setActiveSourceDoc(doc);
  };

  return (
    <div className="flex h-full">
      <div className="w-[480px] flex flex-col overflow-hidden border-r border-surface-200 bg-surface-50 shrink-0">
        <div className="px-4 py-3 bg-white border-b border-surface-200 shrink-0">
          <div className="flex items-center gap-2 mb-1"><Edit3 className="w-4 h-4 text-primary-600" /><h2 className="text-sm font-semibold text-ink-800">Consolidated Measure</h2></div>
          <p className="text-[11px] text-ink-500 ml-6">Click a paragraph to view its source provision →</p>
          <div className="mt-2 ml-6 flex items-center gap-2">
            <GitBranch className="w-3 h-3 text-ink-400" /><span className="text-[10px] text-ink-500">{measure.versions.length} versions</span>
            <span className="text-[10px] text-ink-400">·</span><span className="text-[10px] text-ink-500">{measure.sourceDocuments.length} sources</span>
            <span className="text-[10px] text-ink-400">·</span><span className="text-[10px] text-ink-500">Updated: {measure.lastUpdated}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {measure.sections.map((section) => (
            <div key={section.id}>
              <h4 className="text-[11px] font-semibold text-ink-600 uppercase tracking-wider mb-2 px-1">{section.heading}</h4>
              <div className="space-y-1.5">
                {section.paragraphs.map((p) => <ConsolidatedParagraphItem key={p.id} paragraph={p} isActive={activeParagraph?.id === p.id} onClick={() => handleParagraphClick(p)} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-surface-200 bg-surface-50/50 shrink-0">
          <SourceDocumentSelector documents={sourceDocuments} activeDocId={activeSourceDoc?.id || null} onSelect={(doc) => { setActiveSourceDoc(doc); setActiveParagraph(null); }} />
        </div>
        <SourceDocumentViewer document={activeSourceDoc} activeParagraph={activeParagraph} />
      </div>
    </div>
  );
}
