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
  isScoringLoading?: boolean;
}

interface ScoringDetail {
  scoringRule: string;
  detectedCondition: string;
  reasoning: string;
  complianceImplication: string;
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

const scoringDetails: Record<string, ScoringDetail> = {
  "6.1": {
    scoringRule: "Score is high when regulation restricts cross-border transfer broadly or creates approval barriers across major data categories.",
    detectedCondition: "Transfer is allowed only with coordination or supervisory authority involvement.",
    reasoning: "The measure creates procedural friction for cross-border transfers, but does not operate as a complete transfer prohibition.",
    complianceImplication: "Organizations may need transfer review workflows and documentation before sending data abroad.",
  },
  "6.2": {
    scoringRule: "Score is moderate when local storage or accessibility obligations apply to a specific category of data without prohibiting transfer.",
    detectedCondition: "Local accessibility requirement for a specific set of electronic system data.",
    reasoning: "A copy of certain electronic system data must remain accessible in Indonesia, creating storage readiness duties without a full localization ban.",
    complianceImplication: "Moderate compliance burden due to local accessibility and storage readiness requirements.",
  },
  "6.3": {
    scoringRule: "Score is high when processing or infrastructure must be located domestically for covered operators or broad service categories.",
    detectedCondition: "Domestic processing and local infrastructure requirements for electronic system operators.",
    reasoning: "The evidence points to domestic data center, disaster recovery, and processing obligations that constrain operational architecture.",
    complianceImplication: "High infrastructure burden for covered operators that need local facilities or domestic processing capacity.",
  },
  "6.4": {
    scoringRule: "Score is high when cross-border transfer is permitted only under conditions such as adequacy, consent, approval, or binding safeguards.",
    detectedCondition: "Conditional transfer regime based on adequacy, safeguards, consent, or coordination.",
    reasoning: "Transfers remain possible, but only after meeting legal conditions that affect interoperability and data mobility.",
    complianceImplication: "Organizations need transfer assessments, consent records, or safeguards before moving covered data.",
  },
  "6.5": {
    scoringRule: "Score reflects whether other measures create additional restrictions or whether binding commitments preserve transfer openness.",
    detectedCondition: "International commitment allows business-related data transfers with public policy exceptions.",
    reasoning: "The commitment supports interoperability but still allows exceptions where justified by legitimate policy objectives.",
    complianceImplication: "Lower restriction impact, though teams must monitor exceptions that could narrow transfer rights.",
  },
  "7.1": {
    scoringRule: "Score is lower when a comprehensive data protection framework exists and applies horizontally across sectors.",
    detectedCondition: "Horizontal personal data protection framework identified.",
    reasoning: "A comprehensive law reduces the gap in privacy governance and establishes baseline rights and obligations.",
    complianceImplication: "Organizations must align privacy practices with general data protection obligations.",
  },
  "7.2": {
    scoringRule: "Score is moderate when cybersecurity or privacy-adjacent rights exist through non-dedicated or sectoral frameworks.",
    detectedCondition: "Cybersecurity and public interest controls exist but are not a standalone comprehensive framework.",
    reasoning: "The framework creates safeguards and government powers but may not cover all privacy rights uniformly.",
    complianceImplication: "Moderate review burden to map obligations across overlapping legal instruments.",
  },
  "7.3": {
    scoringRule: "Score increases when mandatory retention periods apply to personal or transaction data categories.",
    detectedCondition: "Minimum retention period for selected electronic transaction data.",
    reasoning: "Mandatory retention increases compliance burden and may affect data minimization and storage operations.",
    complianceImplication: "Teams need retention schedules, storage controls, and deletion exceptions for covered data.",
  },
  "7.4": {
    scoringRule: "Score increases when accountability duties such as DPO, DPIA, reporting, or documentation are required.",
    detectedCondition: "DPO and DPIA obligations apply to controllers, processors, or high-risk processing.",
    reasoning: "Accountability measures increase governance maturity but also create operational compliance requirements.",
    complianceImplication: "Organizations may need responsible officers, risk assessments, and audit-ready documentation.",
  },
  "7.5": {
    scoringRule: "Score is high when enforcement or access mechanisms allow broad government access or weak independent oversight.",
    detectedCondition: "Government access and law enforcement cooperation duties are present.",
    reasoning: "Broad access powers can affect privacy protection strength and increase disclosure obligations.",
    complianceImplication: "Organizations need procedures for lawful access requests and oversight documentation.",
  },
};

function ScoreBadge({ score, loading = false }: { score: number; loading?: boolean }) {
  const color = score >= 0.8 ? "bg-red-100 text-red-700 border-red-200"
    : score >= 0.5 ? "bg-primary-100 text-primary-700 border-primary-200"
    : score > 0 ? "bg-primary-100 text-primary-700 border-primary-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";

  if (loading) {
    return (
      <span className="inline-flex h-6 w-10 items-center justify-center overflow-hidden rounded-md border border-surface-200 bg-surface-100">
        <motion.span
          initial={{ x: "-140%" }}
          animate={{ x: "140%" }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
          className="h-full w-1/2 bg-primary-300/70 blur-[1px]"
        />
      </span>
    );
  }

  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold font-mono ${color}`}>{score.toFixed(1)}</span>;
}

function EvidenceItem({ evidence, isActive, onClick }: { evidence: LinkedEvidence; isActive: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
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

function SubpillarItem({ indicator, activeParagraphId, onEvidenceClick, isScoringLoading }: { indicator: IndicatorScore; activeParagraphId: string | null; onEvidenceClick: (paragraphId: string) => void; isScoringLoading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasActiveEvidence = indicator.evidence.some((ev) => ev.paragraphId === activeParagraphId);

  return (
    <motion.div
      layout
      className={`interactive-surface overflow-hidden rounded-xl border bg-comfort ${
        hasActiveEvidence ? "border-primary-300 shadow-md ring-1 ring-primary-100" : "border-surface-200"
      }`}
    >
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="interactive-control flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-comfort-hover"
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
        <ScoreBadge score={indicator.score} loading={isScoringLoading} />
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
                <p className="text-[11px] leading-relaxed text-ink-600">{scoringDetails[indicator.id]?.scoringRule || indicator.scoringRule}</p>
              </div>

              <div className="grid gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Detected Condition</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-700">{scoringDetails[indicator.id]?.detectedCondition || indicator.matchedCriteria.join(", ")}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Reasoning</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-700">{scoringDetails[indicator.id]?.reasoning || indicator.scoringRule}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Compliance Implication</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-ink-700">{scoringDetails[indicator.id]?.complianceImplication || "Review operational impact against RDTII criteria."}</p>
                </div>
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

function PillarAccordion({ pillar, defaultOpen, activeParagraphId, onEvidenceClick, isScoringLoading }: { pillar: PillarData; defaultOpen: boolean; activeParagraphId: string | null; onEvidenceClick: (paragraphId: string) => void; isScoringLoading: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="interactive-surface overflow-hidden rounded-xl border border-surface-200 bg-comfort shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="interactive-control flex w-full items-center gap-3 bg-comfort px-4 py-3 text-left transition-colors hover:bg-comfort-hover"
      >
        {open ? <ChevronDown className="h-4 w-4 text-ink-400" /> : <ChevronRight className="h-4 w-4 text-ink-400" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-500">Pillar {pillar.number}</span>
            <h2 className="truncate text-sm font-semibold text-ink-900">{pillar.name}</h2>
          </div>
          <p className="mt-0.5 text-[10px] text-ink-500">{pillar.indicators.length} subpillars · Click evidence to highlight clauses</p>
        </div>
        {isScoringLoading ? (
          <div className="h-7 w-14 overflow-hidden rounded-md bg-surface-100">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
              className="h-full w-1/2 bg-primary-300/70"
            />
          </div>
        ) : (
          <motion.span
            key={pillar.weightedScore}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-mono text-xl font-bold ${
              pillar.weightedScore >= 0.7 ? "text-red-600" : pillar.weightedScore >= 0.4 ? "text-primary-700" : "text-emerald-600"
            }`}
          >
            {pillar.weightedScore.toFixed(2)}
          </motion.span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="space-y-2 border-t border-surface-200 p-3">
              {pillar.indicators.map((indicator) => (
                <SubpillarItem key={indicator.id} indicator={indicator} activeParagraphId={activeParagraphId} onEvidenceClick={onEvidenceClick} isScoringLoading={isScoringLoading} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export function WorkspacePillarsPanel({ countryData, onEvidenceClick, activeParagraphId, isScoringLoading = false }: WorkspacePillarsPanelProps) {
  return (
    <div className="w-[480px] shrink-0 overflow-y-auto border-r border-surface-200 bg-comfort p-3">
      <div className="space-y-3">
        {countryData.pillars.map((pillar) => (
          <PillarAccordion
            key={pillar.id}
            pillar={pillar}
            defaultOpen={pillar.number === 6}
            activeParagraphId={activeParagraphId}
            onEvidenceClick={onEvidenceClick}
            isScoringLoading={isScoringLoading}
          />
        ))}
      </div>
    </div>
  );
}
