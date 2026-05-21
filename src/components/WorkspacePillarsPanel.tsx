"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  Info,
  Scale,
  User,
} from "lucide-react";
import type { CountryData, IndicatorScore, LinkedEvidence, PillarData } from "@/data/dummy";

interface WorkspacePillarsPanelProps {
  countryData: CountryData;
  onEvidenceClick: (paragraphId: string) => void;
  activeParagraphId: string | null;
}

const subpillarLabels: Record<string, string> = {
  "6.1": "Cross-border data transfer restrictions",
  "6.2": "Local storage requirements",
  "6.3": "Local processing requirements",
  "6.4": "Conditional flow regimes",
  "6.5": "Other cross-border data policy measures",
  "7.1": "Data protection legal framework",
  "7.2": "Data subject rights",
  "7.3": "Data retention obligations",
  "7.4": "Compliance and accountability requirements",
  "7.5": "Privacy enforcement mechanisms",
};

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 0.8 ? "bg-red-100 text-red-700 border-red-200"
    : score >= 0.5 ? "bg-amber-100 text-amber-700 border-amber-200"
    : score > 0 ? "bg-yellow-100 text-yellow-700 border-yellow-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";

  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold font-mono ${color}`}>{score.toFixed(1)}</span>;
}

function EvidenceItem({ evidence, isActive, onClick }: { evidence: LinkedEvidence; isActive: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={`w-full rounded-lg border p-2.5 text-left transition-all group ${
        isActive
          ? "bg-primary-100 border-primary-300 shadow-sm ring-1 ring-primary-200"
          : "bg-primary-50/30 border-primary-100/50 hover:bg-primary-50 hover:border-primary-200"
      }`}
    >
      <div className="flex items-start gap-2">
        <FileText className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary-700" : "text-primary-500"}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-medium leading-tight ${isActive ? "text-primary-800" : "text-primary-700"}`}>{evidence.documentTitle}</p>
          <p className="mt-0.5 text-[10px] text-primary-600">{evidence.article}</p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-600 italic">&ldquo;{evidence.excerpt}&rdquo;</p>
        </div>
        <ArrowRight className={`mt-1 h-3 w-3 shrink-0 transition-opacity ${isActive ? "text-primary-600 opacity-100" : "text-ink-400 opacity-0 group-hover:opacity-100"}`} />
      </div>
    </motion.button>
  );
}

function SubpillarItem({ indicator, activeParagraphId, onEvidenceClick }: { indicator: IndicatorScore; activeParagraphId: string | null; onEvidenceClick: (paragraphId: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasActiveEvidence = indicator.evidence.some((ev) => ev.paragraphId === activeParagraphId);

  return (
    <motion.div
      layout
      className={`overflow-hidden rounded-xl border bg-white transition-shadow ${
        hasActiveEvidence ? "border-primary-300 shadow-md ring-1 ring-primary-100" : "border-surface-200 hover:shadow-sm"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-50/50"
      >
        <div className="shrink-0">{expanded ? <ChevronDown className="h-4 w-4 text-ink-400" /> : <ChevronRight className="h-4 w-4 text-ink-400" />}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-500">{indicator.id}</span>
            <p className="truncate text-sm font-medium text-ink-800">
              {subpillarLabels[indicator.id] || indicator.name}
            </p>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-ink-500"><Scale className="h-3 w-3" />{indicator.weight}%</span>
            <span className="text-[10px] text-ink-500">{indicator.evidence.length} evidence</span>
          </div>
        </div>
        <ScoreBadge score={indicator.score} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="space-y-3 border-t border-surface-100 px-4 pb-4 pt-3">
              <div className="rounded-lg bg-surface-50 p-2.5">
                <div className="mb-1 flex items-center gap-1.5">
                  <Info className="h-3 w-3 text-primary-600" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">Scoring Rule</p>
                </div>
                <p className="text-[11px] leading-relaxed text-ink-600">{indicator.scoringRule}</p>
              </div>

              <div className="space-y-1">
                {indicator.matchedCriteria.map((criteria) => (
                  <div key={criteria} className="flex items-start gap-1.5">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                    <span className="text-[11px] text-ink-700">{criteria}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-600">Evidence</p>
                <div className="space-y-1.5">
                  {indicator.evidence.map((ev) => (
                    <EvidenceItem key={ev.paragraphId} evidence={ev} isActive={ev.paragraphId === activeParagraphId} onClick={() => onEvidenceClick(ev.paragraphId)} />
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-surface-100 pt-2">
                <span className="flex items-center gap-1 text-[10px] text-ink-500"><User className="h-3 w-3" />{indicator.scoredBy}</span>
                <span className="flex items-center gap-1 text-[10px] text-ink-500"><Calendar className="h-3 w-3" />{indicator.scoredDate}</span>
                <span className="flex items-center gap-1 text-[10px] text-ink-500"><CheckCircle2 className="h-3 w-3" />Verified: {indicator.lastVerified}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PillarAccordion({ pillar, defaultOpen, activeParagraphId, onEvidenceClick }: { pillar: PillarData; defaultOpen: boolean; activeParagraphId: string | null; onEvidenceClick: (paragraphId: string) => void }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-surface-200 bg-surface-50 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left transition-colors hover:bg-surface-50"
      >
        {open ? <ChevronDown className="h-4 w-4 text-ink-400" /> : <ChevronRight className="h-4 w-4 text-ink-400" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-500">Pillar {pillar.number}</span>
            <h2 className="truncate text-sm font-semibold text-ink-900">{pillar.name}</h2>
          </div>
          <p className="mt-0.5 text-[10px] text-ink-500">{pillar.indicators.length} subpillars · Click evidence to highlight clauses</p>
        </div>
        <motion.span
          key={pillar.weightedScore}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`font-mono text-xl font-bold ${
            pillar.weightedScore >= 0.7 ? "text-red-600" : pillar.weightedScore >= 0.4 ? "text-amber-600" : "text-emerald-600"
          }`}
        >
          {pillar.weightedScore.toFixed(2)}
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="space-y-2 border-t border-surface-200 p-3">
              {pillar.indicators.map((indicator) => (
                <SubpillarItem key={indicator.id} indicator={indicator} activeParagraphId={activeParagraphId} onEvidenceClick={onEvidenceClick} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function WorkspacePillarsPanel({ countryData, onEvidenceClick, activeParagraphId }: WorkspacePillarsPanelProps) {
  return (
    <div className="w-[480px] shrink-0 overflow-y-auto border-r border-surface-200 bg-surface-50 p-3">
      <div className="mb-3 rounded-xl border border-surface-200 bg-white px-4 py-3">
        <h1 className="text-sm font-semibold text-ink-900">RDTII Pillars</h1>
        <p className="mt-0.5 text-[11px] text-ink-500">Review Pillar 6 and Pillar 7 subpillars with linked regulatory evidence.</p>
      </div>

      <div className="space-y-3">
        {countryData.pillars.map((pillar) => (
          <PillarAccordion
            key={pillar.id}
            pillar={pillar}
            defaultOpen={pillar.number === 6}
            activeParagraphId={activeParagraphId}
            onEvidenceClick={onEvidenceClick}
          />
        ))}
      </div>
    </div>
  );
}
