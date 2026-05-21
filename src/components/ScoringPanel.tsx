"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, CheckCircle2, User, Calendar, Scale, Info, FileText, ArrowRight } from "lucide-react";
import type { PillarData, IndicatorScore, LinkedEvidence } from "@/data/dummy";

interface ScoringPanelProps {
  pillar: PillarData;
  onEvidenceClick: (paragraphId: string) => void;
  activeParagraphId: string | null;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 0.8 ? "bg-red-100 text-red-700 border-red-200"
    : score >= 0.5 ? "bg-primary-100 text-primary-700 border-primary-200"
    : score > 0 ? "bg-primary-100 text-primary-700 border-primary-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold border ${color}`}>{score.toFixed(1)}</span>;
}

function EvidenceItem({ evidence, isActive, onClick }: { evidence: LinkedEvidence; isActive: boolean; onClick: () => void }) {
  return (
    <motion.button onClick={onClick} whileHover={{ x: 2 }} className={`w-full text-left p-2.5 rounded-lg border transition-all group ${
      isActive ? "bg-primary-100 border-primary-300 shadow-sm ring-1 ring-primary-200" : "bg-primary-50/30 border-primary-100/50 hover:bg-primary-50 hover:border-primary-200"
    }`}>
      <div className="flex items-start gap-2">
        <FileText className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? "text-primary-700" : "text-primary-500"}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-[11px] font-medium leading-tight ${isActive ? "text-primary-800" : "text-primary-700"}`}>{evidence.documentTitle}</p>
          <p className="text-[10px] text-primary-600 mt-0.5">{evidence.article}</p>
          <p className="text-[11px] text-ink-600 mt-1 leading-relaxed line-clamp-2 italic">&ldquo;{evidence.excerpt}&rdquo;</p>
        </div>
        <ArrowRight className={`w-3 h-3 shrink-0 mt-1 transition-opacity ${isActive ? "text-primary-600 opacity-100" : "text-ink-400 opacity-0 group-hover:opacity-100"}`} />
      </div>
    </motion.button>
  );
}

function IndicatorCard({ indicator, onEvidenceClick, activeParagraphId }: { indicator: IndicatorScore; onEvidenceClick: (paragraphId: string) => void; activeParagraphId: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const hasActiveEvidence = indicator.evidence.some((ev) => ev.paragraphId === activeParagraphId);

  return (
    <motion.div layout className={`border rounded-xl overflow-hidden bg-white transition-shadow ${
      hasActiveEvidence ? "border-primary-300 shadow-md ring-1 ring-primary-100" : "border-surface-200 hover:shadow-sm"
    }`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-50/50 transition-colors">
        <div className="shrink-0">{expanded ? <ChevronDown className="w-4 h-4 text-ink-400" /> : <ChevronRight className="w-4 h-4 text-ink-400" />}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-ink-500 bg-surface-100 px-1.5 py-0.5 rounded">{indicator.id}</span>
            <p className="text-sm font-medium text-ink-800 truncate">{indicator.name}</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-ink-500 flex items-center gap-1"><Scale className="w-3 h-3" />{indicator.weight}%</span>
            <span className="text-[10px] text-ink-500">{indicator.evidence.length} evidence</span>
          </div>
        </div>
        <ScoreBadge score={indicator.score} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-4 pb-4 border-t border-surface-100 pt-3 space-y-3">
              <div className="bg-surface-50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 mb-1"><Info className="w-3 h-3 text-primary-600" /><p className="text-[10px] font-semibold text-ink-600 uppercase tracking-wider">Scoring Rule</p></div>
                <p className="text-[11px] text-ink-600 leading-relaxed">{indicator.scoringRule}</p>
              </div>
              <div className="space-y-1">
                {indicator.matchedCriteria.map((c, i) => (
                  <div key={i} className="flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" /><span className="text-[11px] text-ink-700">{c}</span></div>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-semibold text-ink-600 uppercase tracking-wider mb-2">Evidence (click to view)</p>
                <div className="space-y-1.5">
                  {indicator.evidence.map((ev, i) => (
                    <EvidenceItem key={i} evidence={ev} isActive={ev.paragraphId === activeParagraphId} onClick={() => onEvidenceClick(ev.paragraphId)} />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-surface-100 flex-wrap">
                <span className="text-[10px] text-ink-500 flex items-center gap-1"><User className="w-3 h-3" />{indicator.scoredBy}</span>
                <span className="text-[10px] text-ink-500 flex items-center gap-1"><Calendar className="w-3 h-3" />{indicator.scoredDate}</span>
                <span className="text-[10px] text-ink-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Verified: {indicator.lastVerified}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function ScoringPanel({ pillar, onEvidenceClick, activeParagraphId }: ScoringPanelProps) {
  return (
    <div className="w-[440px] flex flex-col overflow-hidden border-r border-surface-200 bg-surface-50 shrink-0">
      <div className="px-4 py-3 bg-white border-b border-surface-200 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-ink-500 bg-surface-100 px-1.5 py-0.5 rounded">Pillar {pillar.number}</span>
              <h2 className="text-sm font-semibold text-ink-800">{pillar.name}</h2>
            </div>
            <p className="text-[10px] text-ink-500 mt-0.5">{pillar.indicators.length} indicators · Click evidence to highlight</p>
          </div>
          <motion.p key={pillar.weightedScore} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`text-xl font-bold font-mono ${
            pillar.weightedScore >= 0.7 ? "text-red-600" : pillar.weightedScore >= 0.4 ? "text-primary-700" : "text-emerald-600"
          }`}>{pillar.weightedScore.toFixed(2)}</motion.p>
        </div>
        <div className="mt-2 h-1.5 bg-surface-200 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pillar.weightedScore * 100}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className={`h-full rounded-full ${
            pillar.weightedScore >= 0.7 ? "bg-gradient-to-r from-red-400 to-red-600" : pillar.weightedScore >= 0.4 ? "bg-primary-500" : "bg-gradient-to-r from-emerald-400 to-emerald-600"
          }`} />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {pillar.indicators.map((indicator, index) => (
          <motion.div key={indicator.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
            <IndicatorCard indicator={indicator} onEvidenceClick={onEvidenceClick} activeParagraphId={activeParagraphId} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
