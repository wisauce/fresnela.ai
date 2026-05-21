"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Link2, X, GitBranch, Calendar, ChevronRight } from "lucide-react";
import type { ConsolidatedMeasure, ConsolidatedParagraph, MeasureVersion } from "@/data/dummy";

interface DocumentViewerProps {
  measure: ConsolidatedMeasure;
  activeParagraphId: string | null;
  onParagraphClear: () => void;
}

function VersionTimeline({ versions, selectedDate, onDateChange }: { versions: MeasureVersion[]; selectedDate: string; onDateChange: (date: string) => void }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-1">
      {versions.map((version, i) => {
        const isCurrent = i === versions.length - 1 || (i < versions.length - 1 && selectedDate < versions[i + 1].date && selectedDate >= version.date);
        return (
          <button key={version.id} onClick={() => onDateChange(version.date)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all ${
            isCurrent ? "bg-primary-500 text-white shadow-sm" : selectedDate >= version.date ? "bg-primary-100 text-primary-700" : "bg-surface-100 text-ink-500 hover:bg-surface-200"
          }`} title={version.description}>
            <span className={`w-1.5 h-1.5 rounded-full ${version.changeType === "enacted" ? "bg-emerald-400" : version.changeType === "amended" ? "bg-primary-400" : "bg-blue-400"}`} />
            {version.label}
            {i < versions.length - 1 && <ChevronRight className="w-3 h-3 text-ink-300 ml-0.5" />}
          </button>
        );
      })}
    </div>
  );
}

function ParagraphBlock({ paragraph, isActive }: { paragraph: ConsolidatedParagraph; isActive: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (isActive && ref.current) ref.current.scrollIntoView({ behavior: "smooth", block: "center" }); }, [isActive]);

  return (
    <motion.div ref={ref} animate={isActive ? { backgroundColor: "rgba(251, 191, 36, 0.15)" } : { backgroundColor: "rgba(0,0,0,0)" }} transition={{ duration: 0.4 }}
      className={`relative pl-4 py-2 rounded-r-lg transition-all ${isActive ? "border-l-[3px] border-primary-500" : paragraph.linkedIndicators.length > 0 ? "border-l-2 border-primary-200/60 hover:bg-primary-50/20" : "border-l-2 border-transparent"}`}>
      <p className={`text-[13px] leading-relaxed ${isActive ? "text-ink-900 font-medium" : "text-ink-700"}`}>{paragraph.text}</p>
      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
        <span className="text-[10px] font-mono text-ink-400">{paragraph.sourceArticle}</span>
        {paragraph.linkedIndicators.map((ind) => (
          <span key={ind} className="text-[9px] px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded font-medium flex items-center gap-0.5"><Link2 className="w-2.5 h-2.5" />{ind}</span>
        ))}
        {paragraph.isAmended && <span className="text-[9px] px-1.5 py-0.5 bg-primary-50 text-primary-700 rounded">amended</span>}
      </div>
    </motion.div>
  );
}

export function DocumentViewer({ measure, activeParagraphId, onParagraphClear }: DocumentViewerProps) {
  const [selectedDate, setSelectedDate] = useState(measure.lastUpdated);
  const isParagraphVisible = (p: ConsolidatedParagraph) => {
    if (p.effectiveFrom > selectedDate) return false;
    if (p.effectiveUntil && p.effectiveUntil <= selectedDate) return false;
    return true;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-comfort">
      <div className="px-5 py-3 border-b border-surface-200 bg-comfort-hover/70 shrink-0">
        <div className="flex items-center gap-2 mb-1"><FileText className="w-4 h-4 text-primary-600" /><h3 className="text-sm font-semibold text-ink-800">{measure.title}</h3></div>
        <p className="text-[11px] text-ink-500 ml-6">{measure.subtitle}</p>
        <div className="mt-2 ml-6 flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-ink-400 shrink-0" />
          <VersionTimeline versions={measure.versions} selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <div className="flex items-center gap-1 ml-auto shrink-0"><Calendar className="w-3 h-3 text-ink-400" /><span className="text-[10px] font-mono text-ink-500">as of {selectedDate}</span></div>
        </div>
      </div>

      <AnimatePresence>
        {activeParagraphId && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden shrink-0">
            <div className="px-5 py-2 bg-primary-50 border-b border-primary-200 flex items-center justify-between">
              <div className="flex items-center gap-2"><Link2 className="w-3.5 h-3.5 text-primary-600" /><span className="text-xs text-primary-800 font-medium">Highlighting linked evidence</span></div>
              <button onClick={onParagraphClear} className="p-1 rounded hover:bg-primary-100 transition-colors"><X className="w-3.5 h-3.5 text-primary-600" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto px-8 py-6 bg-comfort">
        <div className="max-w-3xl mx-auto space-y-8">
          {!activeParagraphId && (
            <div className="rounded-xl border border-dashed border-surface-300 bg-surface-50 px-5 py-6 text-center">
              <FileText className="mx-auto h-6 w-6 text-ink-300" />
              <p className="mt-2 text-sm font-medium text-ink-700">Select a paragraph to view its source and scoring rationale.</p>
              <p className="mt-1 text-xs text-ink-500">Click linked evidence from a subpillar card to highlight its source clause here.</p>
            </div>
          )}

          {measure.sections.map((section) => {
            const visible = section.paragraphs.filter(isParagraphVisible);
            if (visible.length === 0) return null;
            return (
              <div key={section.id}>
                <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">{section.heading}</h4>
                {section.description && <p className="text-[11px] text-ink-400 mb-3">{section.description}</p>}
                <div className="space-y-1">{visible.map((p) => <ParagraphBlock key={p.id} paragraph={p} isActive={p.id === activeParagraphId} />)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
