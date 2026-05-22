"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Loader2, MessageCircle, Minus, Send, X } from "lucide-react";
import type { CountryData } from "@/data/dummy";

interface ScoringChatbotProps {
  countryData: CountryData;
}

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

function generateResponse(question: string, countryData: CountryData): string {
  const lower = question.toLowerCase();
  const p6 = countryData.pillars.find((p) => p.number === 6);
  const p7 = countryData.pillars.find((p) => p.number === 7);

  // Score explanation for specific indicators
  for (const pillar of countryData.pillars) {
    for (const ind of pillar.indicators) {
      if (lower.includes(ind.id) || lower.includes(ind.name.toLowerCase())) {
        return `**${ind.id} — ${ind.name}** (Score: ${ind.score.toFixed(1)})\n\n` +
          `**Scoring rule:** ${ind.scoringRule}\n\n` +
          `**Matched criteria:** ${ind.matchedCriteria.join("; ")}\n\n` +
          `**Evidence:** ${ind.evidence.length} source(s) linked — ${ind.evidence.map((e) => `${e.documentTitle} (${e.article})`).join(", ")}\n\n` +
          `**Scored by:** ${ind.scoredBy} on ${ind.scoredDate}`;
      }
    }
  }

  // Pillar-level questions
  if (lower.includes("pillar 6") || lower.includes("cross-border")) {
    if (!p6) return "No Pillar 6 data available for this workspace.";
    return `**Pillar 6 — ${p6.name}** (Weighted score: ${p6.weightedScore.toFixed(2)})\n\n` +
      p6.indicators.map((ind) => `• **${ind.id}** ${ind.name}: ${ind.score.toFixed(1)} (weight ${ind.weight}%)`).join("\n") +
      `\n\nThe highest-scoring indicators (most restrictive) are ${p6.indicators.filter((i) => i.score >= 0.8).map((i) => i.id).join(", ") || "none above 0.8"}. ` +
      `Indonesia's cross-border data policies are characterized by local processing mandates, infrastructure requirements, and conditional transfer regimes.`;
  }

  if (lower.includes("pillar 7") || lower.includes("data protection") || lower.includes("privacy")) {
    if (!p7) return "No Pillar 7 data available for this workspace.";
    return `**Pillar 7 — ${p7.name}** (Weighted score: ${p7.weightedScore.toFixed(2)})\n\n` +
      p7.indicators.map((ind) => `• **${ind.id}** ${ind.name}: ${ind.score.toFixed(1)} (weight ${ind.weight}%)`).join("\n") +
      `\n\nThe comprehensive PDP Law (27/2022) brings 7.1 to 0, but mandatory retention (7.3) and government access (7.5) both score 1.0, indicating significant compliance burden.`;
  }

  // Overall score
  if (lower.includes("overall") || lower.includes("total") || lower.includes("summary")) {
    return `**${countryData.name} Overall RDTII Score: ${countryData.overallScore.toFixed(2)}**\n\n` +
      countryData.pillars.map((p) => `• Pillar ${p.number} (${p.name}): ${p.weightedScore.toFixed(2)}`).join("\n") +
      `\n\nHigher scores indicate more restrictive data policies. The overall score is ${countryData.overallScore > 0.5 ? "above" : "below"} the midpoint, suggesting ${countryData.overallScore > 0.5 ? "moderate-to-high" : "relatively open"} regulatory restrictiveness.`;
  }

  // Why questions
  if (lower.includes("why") && lower.includes("score")) {
    return `Scores are determined by the RDTII methodology:\n\n` +
      `• **0** = No restriction / framework exists\n` +
      `• **0.5** = Partial / conditional / sector-specific\n` +
      `• **1** = Full restriction / requirement present\n\n` +
      `Each indicator has specific criteria. Ask about a specific indicator (e.g. "explain 6.1") to see why it received its score.`;
  }

  if (lower.includes("justify") || lower.includes("rationale") || lower.includes("explain")) {
    return `To explain a specific scoring decision, ask about the indicator by number (e.g. "Why is 6.3 scored 1?") or by name (e.g. "Explain infrastructure requirements").\n\nI can also compare pillars, explain methodology, or discuss evidence gaps.`;
  }

  // Gaps
  if (lower.includes("gap") || lower.includes("missing") || lower.includes("weak")) {
    const allIndicators = countryData.pillars.flatMap((p) => p.indicators);
    const lowEvidence = allIndicators.filter((i) => i.evidence.length <= 1);
    if (lowEvidence.length === 0) return "All indicators have multiple evidence sources linked. No obvious gaps detected.";
    return `**Potential evidence gaps:**\n\n` +
      lowEvidence.map((i) => `• **${i.id}** ${i.name} — only ${i.evidence.length} evidence source(s)`).join("\n") +
      `\n\nConsider adding more sources for these indicators to strengthen the scoring justification.`;
  }

  // Default
  return `I can help you understand the RDTII scoring for ${countryData.name}. Try asking:\n\n` +
    `• "Explain Pillar 6 scores"\n` +
    `• "Why is 6.1 scored 1.0?"\n` +
    `• "What's the overall summary?"\n` +
    `• "Are there any evidence gaps?"\n` +
    `• "Justify the infrastructure score"`;
}

export function ScoringChatbot({ countryData }: ScoringChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: `Hi! I can help you understand the RDTII scoring decisions for ${countryData.name}. Ask me about any indicator, pillar, or the overall score.` },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || isSending) return;
    setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, role: "user", content: text }]);
    setInput("");
    setIsSending(true);
    scrollToBottom();

    setTimeout(() => {
      const response = generateResponse(text, countryData);
      setMessages((prev) => [...prev, { id: `msg-${Date.now()}-r`, role: "assistant", content: response }]);
      setIsSending(false);
      scrollToBottom();
    }, 600 + Math.random() * 800);
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-ink-900 text-white shadow-lg hover:bg-ink-800 transition-colors"
        aria-label="Open scoring assistant"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-xl border border-surface-200 bg-comfort shadow-2xl transition-all ${
          isMinimized ? "h-12 w-72" : "h-[480px] w-96"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surface-200 bg-ink-900 px-4 py-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary-400" />
            <span className="text-xs font-semibold text-white">Scoring Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setIsMinimized(!isMinimized)} className="rounded p-1 text-ink-400 hover:text-white hover:bg-ink-700 transition-colors" aria-label={isMinimized ? "Expand" : "Minimize"}>
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded p-1 text-ink-400 hover:text-white hover:bg-ink-700 transition-colors" aria-label="Close">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary-100 text-primary-900"
                      : "border border-surface-200 bg-white text-ink-700"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="rounded-xl border border-surface-200 bg-white px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-ink-400" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-3 pb-1 flex flex-wrap gap-1">
              {["Overall summary", "Explain Pillar 6", "Evidence gaps", "Why is 6.1 scored 1?"].map((p) => (
                <button key={p} type="button" onClick={() => setInput(p)} className="interactive-control rounded-full border border-surface-200 px-2 py-0.5 text-[9px] font-medium text-ink-500 hover:bg-comfort-hover">{p}</button>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-surface-200 p-2.5 shrink-0">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ask about scoring decisions..."
                  className="min-w-0 flex-1 rounded-lg border border-surface-200 px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary-300"
                />
                <button type="button" onClick={handleSend} disabled={isSending || !input.trim()} className="interactive-control rounded-lg bg-primary-500 p-1.5 text-ink-900 hover:bg-primary-600 disabled:opacity-50">
                  {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
