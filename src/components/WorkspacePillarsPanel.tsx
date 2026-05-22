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
  Pencil,
  Scale,
  User,
  X,
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
  "6.1": "Ban & Local Processing Requirements",
  "6.2": "Local Storage Requirements",
  "6.3": "Infrastructure Requirements",
  "6.4": "Conditional Flow Regimes",
  "6.5": "Binding Agreements",
  "7.1": "Data Protection Framework",
  "7.2": "Cybersecurity Framework",
  "7.3": "Data Retention",
  "7.4": "DPIA/DPO",
  "7.5": "Government Access",
};

// Possible scores per subpillar
const possibleScores: Record<string, number[]> = {
  "6.1": [0, 0.5, 1],
  "6.2": [0, 0.5, 1],
  "6.3": [0, 1],
  "6.4": [0, 0.5, 1],
  "6.5": [0, 1],
  "7.1": [0, 0.5, 1],
  "7.2": [0, 0.5, 1],
  "7.3": [0, 1],
  "7.4": [0, 0.25, 0.5, 1],
  "7.5": [0, 1],
};

const scoringDetails: Record<string, ScoringDetail> = {
  "6.1": { scoringRule: "Score is high when regulation restricts cross-border transfer broadly.", detectedCondition: "Transfer is allowed only with coordination or supervisory authority involvement.", reasoning: "The measure creates procedural friction for cross-border transfers.", complianceImplication: "Organizations may need transfer review workflows and documentation." },
  "6.2": { scoringRule: "Score is moderate when local storage obligations apply to specific data.", detectedCondition: "Local accessibility requirement for electronic system data.", reasoning: "A copy of data must remain accessible in Indonesia.", complianceImplication: "Moderate compliance burden due to local accessibility requirements." },
  "6.3": { scoringRule: "Score is high when infrastructure must be located domestically.", detectedCondition: "Domestic processing and local infrastructure requirements.", reasoning: "Evidence points to domestic data center and processing obligations.", complianceImplication: "High infrastructure burden for covered operators." },
  "6.4": { scoringRule: "Score is high when transfer is permitted only under conditions.", detectedCondition: "Conditional transfer regime based on adequacy or safeguards.", reasoning: "Transfers possible only after meeting legal conditions.", complianceImplication: "Organizations need transfer assessments or safeguards." },
  "6.5": { scoringRule: "Score reflects binding commitments on data flows.", detectedCondition: "International commitment allows business-related data transfers.", reasoning: "Commitment supports interoperability with policy exceptions.", complianceImplication: "Lower restriction impact, monitor exceptions." },
  "7.1": { scoringRule: "Score is lower when comprehensive data protection exists.", detectedCondition: "Horizontal personal data protection framework identified.", reasoning: "Comprehensive law reduces gap in privacy governance.", complianceImplication: "Must align privacy practices with data protection obligations." },
  "7.2": { scoringRule: "Score is moderate for non-dedicated cybersecurity framework.", detectedCondition: "Cybersecurity controls exist but not standalone.", reasoning: "Framework creates safeguards but may not cover all rights.", complianceImplication: "Moderate review burden across overlapping instruments." },
  "7.3": { scoringRule: "Score increases when mandatory retention periods apply.", detectedCondition: "Minimum retention period for electronic transaction data.", reasoning: "Mandatory retention increases compliance burden.", complianceImplication: "Teams need retention schedules and deletion exceptions." },
  "7.4": { scoringRule: "Score increases when DPO/DPIA duties are required.", detectedCondition: "DPO and DPIA obligations apply to controllers.", reasoning: "Accountability measures create operational requirements.", complianceImplication: "Need responsible officers and risk assessments." },
  "7.5": { scoringRule: "Score is high when broad government access exists.", detectedCondition: "Government access and law enforcement duties present.", reasoning: "Broad access powers affect privacy protection strength.", complianceImplication: "Need procedures for lawful access requests." },
};

function ScoreBadge({ score, loading = false }: { score: number; loading?: boolean }) {
  const color = score >= 0.8 ? "bg-red-100 text-red-700 border-red-200"
    : score >= 0.5 ? "bg-primary-100 text-primary-700 border-primary-200"
    : score > 0 ? "bg-primary-100 text-primary-700 border-primary-200"
    : "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (loading) {
    return <span className="inline-flex h-6 w-10 items-center justify-center overflow-hidden rounded-md border border-surface-200 bg-surface-100"><motion.span initial={{ x: "-140%" }} animate={{ x: "140%" }} transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }} className="h-full w-1/2 bg-primary-300/70 blur-[1px]" /></span>;
  }
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold font-mono ${color}`}>{score.toFixed(score === 0.25 ? 2 : 1)}</span>;
}

function EvidenceItem({ evidence, isActive, onClick, onRemove }: { evidence: LinkedEvidence; isActive: boolean; onClick: () => void; onRemove: () => void }) {
  return (
    <div className={`relative rounded-lg border p-2.5 transition-all group ${
      isActive ? "bg-primary-100 border-primary-300 shadow-sm ring-1 ring-primary-200" : "bg-primary-50/30 border-primary-100/50 hover:bg-primary-50 hover:border-primary-200"
    }`}>
      <button type="button" onClick={onRemove} className="absolute -right-1.5 -top-1.5 z-10 hidden h-5 w-5 items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 group-hover:flex" aria-label="Remove evidence">
        <X className="h-3 w-3" />
      </button>
      <button type="button" onClick={onClick} className="w-full text-left">
        <div className="flex items-start gap-2">
          <FileText className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary-700" : "text-primary-500"}`} />
          <div className="min-w-0 flex-1">
            <p className={`text-[11px] font-medium leading-tight ${isActive ? "text-primary-800" : "text-primary-700"}`}>{evidence.documentTitle}</p>
            <p className="mt-0.5 text-[10px] text-primary-600">{evidence.article}</p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-ink-600 italic">&ldquo;{evidence.excerpt}&rdquo;</p>
          </div>
          <ArrowRight className={`mt-1 h-3 w-3 shrink-0 transition-opacity ${isActive ? "text-primary-600 opacity-100" : "text-ink-400 opacity-0 group-hover:opacity-100"}`} />
        </div>
      </button>
    </div>
  );
}

// Editable text field with pencil icon
function EditableField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div>
      <div className="flex items-center gap-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="interactive-control rounded p-0.5 text-ink-400 hover:text-primary-700 hover:bg-primary-50">
            <Pencil className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-1">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full rounded-md border border-primary-300 bg-white px-2 py-1.5 text-[11px] leading-relaxed text-ink-700 outline-none focus:ring-2 focus:ring-primary-200 resize-none" rows={2} />
          <div className="mt-1 flex gap-1">
            <button type="button" onClick={save} className="rounded px-2 py-0.5 text-[10px] font-semibold bg-primary-500 text-ink-900 hover:bg-primary-600">Save</button>
            <button type="button" onClick={cancel} className="rounded px-2 py-0.5 text-[10px] font-medium text-ink-500 hover:bg-surface-100">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-[11px] leading-relaxed text-ink-700">{value}</p>
      )}
    </div>
  );
}

function SubpillarItem({ indicator, activeParagraphId, onEvidenceClick, isScoringLoading }: { indicator: IndicatorScore; activeParagraphId: string | null; onEvidenceClick: (paragraphId: string) => void; isScoringLoading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [score, setScore] = useState(indicator.score);
  const [evidence, setEvidence] = useState(indicator.evidence);
  const [detectedCondition, setDetectedCondition] = useState(scoringDetails[indicator.id]?.detectedCondition || indicator.matchedCriteria.join(", "));
  const [reasoning, setReasoning] = useState(scoringDetails[indicator.id]?.reasoning || indicator.scoringRule);
  const [complianceImplication, setComplianceImplication] = useState(scoringDetails[indicator.id]?.complianceImplication || "Review operational impact.");
  const hasActiveEvidence = evidence.some((ev) => ev.paragraphId === activeParagraphId);
  const scores = possibleScores[indicator.id] || [0, 0.5, 1];

  const handleRemoveEvidence = (paragraphId: string) => {
    setEvidence((prev) => prev.filter((ev) => ev.paragraphId !== paragraphId));
  };

  // Drop handler for adding evidence
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.type === "evidence" && !evidence.some((ev) => ev.paragraphId === data.paragraphId)) {
        setEvidence((prev) => [...prev, { paragraphId: data.paragraphId, sourceDocumentId: data.sourceDocumentId, documentTitle: data.documentTitle, article: data.article, excerpt: data.excerpt, confidence: data.confidence || 0.9 }]);
      }
    } catch { /* ignore invalid drops */ }
  };

  return (
    <motion.div
      layout
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDrop={handleDrop}
      className={`interactive-surface overflow-hidden rounded-xl border bg-comfort ${
        hasActiveEvidence ? "border-primary-300 shadow-md ring-1 ring-primary-100" : "border-surface-200"
      }`}
    >
      <button type="button" onClick={() => setExpanded((o) => !o)} className="interactive-control flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-comfort-hover">
        <div className="shrink-0">{expanded ? <ChevronDown className="h-4 w-4 text-ink-400" /> : <ChevronRight className="h-4 w-4 text-ink-400" />}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-500">{indicator.id}</span>
            <p className="truncate text-sm font-medium text-ink-800">{subpillarLabels[indicator.id] || indicator.name}</p>
          </div>
          <div className="mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1 text-[10px] text-ink-500"><Scale className="h-3 w-3" />{indicator.weight}%</span>
            <span className="text-[10px] text-ink-500">{evidence.length} evidence</span>
          </div>
        </div>
        <ScoreBadge score={score} loading={isScoringLoading} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="space-y-3 border-t border-surface-100 px-4 pb-4 pt-3">
              {/* Score dropdown */}
              <div className="flex items-center gap-3 rounded-lg bg-surface-50 p-2.5">
                <div className="flex items-center gap-1.5">
                  <Info className="h-3 w-3 text-primary-600" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">Score</p>
                </div>
                <select
                  value={score}
                  onChange={(e) => setScore(parseFloat(e.target.value))}
                  className="rounded-md border border-surface-200 bg-white px-2 py-1 text-xs font-bold font-mono text-ink-800 outline-none focus:ring-2 focus:ring-primary-300"
                >
                  {scores.map((s) => (
                    <option key={s} value={s}>{s.toFixed(s === 0.25 ? 2 : 1)}</option>
                  ))}
                </select>
                <p className="text-[10px] text-ink-500 flex-1">{scoringDetails[indicator.id]?.scoringRule || indicator.scoringRule}</p>
              </div>

              {/* Editable fields */}
              <div className="grid gap-2">
                <EditableField label="Detected Condition" value={detectedCondition} onChange={setDetectedCondition} />
                <EditableField label="Reasoning" value={reasoning} onChange={setReasoning} />
                <EditableField label="Compliance Implication" value={complianceImplication} onChange={setComplianceImplication} />
              </div>

              {/* Evidence with remove + drop zone */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-600">Evidence</p>
                  <p className="text-[9px] text-ink-400 italic">Drag clauses from the right panel to add</p>
                </div>
                <div className="space-y-1.5 min-h-[40px] rounded-lg border-2 border-dashed border-transparent transition-colors [&.drag-over]:border-primary-300 [&.drag-over]:bg-primary-50/30">
                  {evidence.length === 0 && (
                    <p className="py-4 text-center text-[11px] text-ink-400 italic">No evidence linked. Drag clauses here from the document viewer.</p>
                  )}
                  {evidence.map((ev) => (
                    <EvidenceItem key={ev.paragraphId} evidence={ev} isActive={ev.paragraphId === activeParagraphId} onClick={() => onEvidenceClick(ev.paragraphId)} onRemove={() => handleRemoveEvidence(ev.paragraphId)} />
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
      <button type="button" onClick={() => setOpen((c) => !c)} className="interactive-control flex w-full items-center gap-3 bg-comfort px-4 py-3 text-left transition-colors hover:bg-comfort-hover">
        {open ? <ChevronDown className="h-4 w-4 text-ink-400" /> : <ChevronRight className="h-4 w-4 text-ink-400" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-surface-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-500">Pillar {pillar.number}</span>
            <h2 className="truncate text-sm font-semibold text-ink-900">{pillar.name}</h2>
          </div>
          <p className="mt-0.5 text-[10px] text-ink-500">{pillar.indicators.length} subpillars · Drag evidence from the right to add sources</p>
        </div>
        {isScoringLoading ? (
          <div className="h-7 w-14 overflow-hidden rounded-md bg-surface-100"><motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }} className="h-full w-1/2 bg-primary-300/70" /></div>
        ) : (
          <motion.span key={pillar.weightedScore} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`font-mono text-xl font-bold ${pillar.weightedScore >= 0.7 ? "text-red-600" : pillar.weightedScore >= 0.4 ? "text-primary-700" : "text-emerald-600"}`}>{pillar.weightedScore.toFixed(2)}</motion.span>
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
      <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
        <p className="text-[11px] font-medium text-blue-800">💡 To add evidence: highlight text on the right panel, then drag it onto a subpillar here.</p>
      </div>
      <div className="space-y-3">
        {countryData.pillars.map((pillar) => (
          <PillarAccordion key={pillar.id} pillar={pillar} defaultOpen={pillar.number === 6} activeParagraphId={activeParagraphId} onEvidenceClick={onEvidenceClick} isScoringLoading={isScoringLoading} />
        ))}
      </div>
    </div>
  );
}
