import "server-only";

import { createSourceCandidate, createSourceCandidateEvaluation, getWorkspace, isDomainAllowlisted, listSourceCandidates, listSourceRegistriesForEconomy } from "./db";
import { rdtiiIndicators } from "./rdtii";
import type { PillarId, SourceCandidate } from "./types";

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

function normalizeUrl(url: string) {
  const parsed = new URL(url);
  parsed.hash = "";
  return parsed.toString();
}

function domainOf(url: string) {
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

function officialScore(domain: string) {
  if (domain.endsWith(".gov") || domain.includes(".gov.") || domain.endsWith(".go.th")) return 0.85;
  if (domain.includes("gazette") || domain.includes("parliament") || domain.includes("ministry")) return 0.8;
  if (domain.includes("law") || domain.includes("legal") || domain.includes("regulator")) return 0.65;
  return 0.35;
}

function relevanceTags(text: string) {
  const lower = text.toLowerCase();
  const tags = new Set<string>();
  if (lower.includes("data protection") || lower.includes("personal data") || lower.includes("privacy")) tags.add("data_protection_framework");
  if (lower.includes("cyber")) tags.add("cybersecurity_framework");
  if (lower.includes("cross-border") || lower.includes("transfer")) tags.add("cross_border_data_transfer");
  if (lower.includes("localization") || lower.includes("localisation") || lower.includes("local processing")) tags.add("data_localization");
  if (lower.includes("retention") || lower.includes("retain")) tags.add("data_retention");
  if (lower.includes("officer") || lower.includes("impact assessment") || lower.includes("dpia")) tags.add("dpo_dpia");
  if (tags.size === 0) tags.add("unknown_needs_review");
  return [...tags];
}

function indicatorsFromText(text: string, pillars: PillarId[]) {
  const lower = text.toLowerCase();
  return rdtiiIndicators
    .filter((indicator) => pillars.includes(indicator.pillarId))
    .filter((indicator) => indicator.evidenceHints.some((hint) => lower.includes(hint.toLowerCase())))
    .map((indicator) => indicator.id);
}

async function braveSearch(query: string, count: number): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];
  const params = new URLSearchParams({
    q: query,
    count: String(Math.min(count, 10)),
    safesearch: "strict",
    text_decorations: "false",
  });
  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });
  if (!response.ok) return [];
  const payload = await response.json();
  return (payload.web?.results ?? []).map((result: { title?: string; url?: string; description?: string }) => ({
    title: result.title ?? "Untitled source",
    url: result.url ?? "",
    snippet: result.description ?? "",
  })).filter((result: SearchResult) => result.url);
}

function registryResults(economyId: string, economyName: string, pillars: PillarId[]): SearchResult[] {
  const topic = pillars.includes("pillar-7") ? "personal data protection" : "cross-border data transfer";
  return listSourceRegistriesForEconomy(economyId).map((registry) => ({
    title: `${registry.sourceName}: ${topic}`,
    url: `https://${registry.domain}`,
    snippet: `Known official ${registry.sourceType} for ${economyName}. Web search is not configured; open the source and add a precise manual URL when needed.`,
  }));
}

function buildQueries(economyName: string, pillars: PillarId[], query?: string) {
  if (query) return [query];
  const queries = new Set<string>();
  if (pillars.includes("pillar-7")) {
    queries.add(`${economyName} official personal data protection law`);
    queries.add(`${economyName} government cybersecurity law official`);
    queries.add(`${economyName} data protection officer impact assessment law`);
    queries.add(`${economyName} data retention law electronic transactions official`);
  }
  if (pillars.includes("pillar-6")) {
    queries.add(`${economyName} official cross border data transfer law`);
    queries.add(`${economyName} data localization regulation official`);
    queries.add(`${economyName} electronic transactions law official gazette`);
    queries.add(`${economyName} digital trade agreement data flows`);
  }
  return [...queries].slice(0, 12);
}

export function createManualSourceCandidate(workspaceId: string, input: { url: string; economyId?: string; title?: string }) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) throw new Error("Workspace not found");
  if (workspace.status === "archived") throw new Error("Archived workspaces cannot accept manual sources");
  const economy = input.economyId
    ? workspace.economies.find((item) => item.id === input.economyId)
    : workspace.economies[0];
  if (!economy) throw new Error("Target economy is not in this workspace");

  const normalizedUrl = normalizeUrl(input.url);
  const domain = domainOf(input.url);
  const allowlisted = isDomainAllowlisted(economy.id, domain);
  if (workspace.sourcePolicy === "allowlisted_only" && !allowlisted) {
    throw new Error("Only trusted official domains are allowed in this workspace. Add this domain to the source registry before ingesting.");
  }
  const existing = listSourceCandidates(workspaceId).find((candidate) => candidate.normalizedUrl === normalizedUrl);
  if (existing) return existing;

  const candidate = createSourceCandidate({
    workspaceId,
    economyId: economy.id,
    url: input.url,
    normalizedUrl,
    domain,
    title: input.title || `Manual source: ${domain}`,
    snippet: "Manual URL added by the user.",
    proposedPillars: workspace.activePillars,
    proposedIndicators: workspace.activeIndicatorIds,
    relevanceTags: ["manual_source"],
    confidence: allowlisted ? 0.85 : 0.55,
    reason: allowlisted ? "Manual source on a trusted official domain." : "Manual source requires approval because the domain is not allowlisted.",
    requiresApproval: workspace.sourcePolicy === "approval_required" && !allowlisted,
    status: workspace.sourcePolicy === "approval_required" && !allowlisted ? "proposed" : "approved",
  });
  createSourceCandidateEvaluation({
    candidateId: candidate.id,
    authorityScore: allowlisted ? 0.85 : 0.35,
    relevanceScore: 0.5,
    primarySourceScore: allowlisted ? 0.75 : 0.4,
    freshnessScore: 0.5,
    classification: { provider: "manual", allowlisted, sourcePolicy: workspace.sourcePolicy },
  });
  return candidate;
}

export async function proposeSourceUrls(workspaceId: string, input: {
  economyId?: string;
  pillarIds?: PillarId[];
  indicatorIds?: string[];
  query?: string;
  maxResults?: number;
}) {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) throw new Error("Workspace not found");
  if (workspace.status === "archived") throw new Error("Archived workspaces cannot accept source proposals");
  if (workspace.sourcePolicy === "manual_only") throw new Error("This workspace is set to manual sources only. Add a manual URL instead of running web proposals.");

  const economy = input.economyId
    ? workspace.economies.find((item) => item.id === input.economyId)
    : workspace.economies[0];
  if (!economy) throw new Error("Target economy is not in this workspace");

  const pillars = input.pillarIds?.length ? input.pillarIds : workspace.activePillars;
  const queries = buildQueries(economy.name, pillars, input.query);
  const maxResults = input.maxResults ?? 8;
  const seen = new Set(listSourceCandidates(workspaceId).map((candidate) => candidate.normalizedUrl));
  const results: SearchResult[] = [];

  for (const searchQuery of queries) {
    const found = await braveSearch(searchQuery, 10);
    results.push(...found);
  }
  if (results.length === 0) results.push(...registryResults(economy.id, economy.name, pillars));

  const created: SourceCandidate[] = [];
  for (const result of results) {
    if (created.length >= maxResults) break;
    let normalizedUrl: string;
    let domain: string;
    try {
      normalizedUrl = normalizeUrl(result.url);
      domain = domainOf(result.url);
    } catch {
      continue;
    }
    if (seen.has(normalizedUrl)) continue;
    seen.add(normalizedUrl);

    const sourceText = `${result.title} ${result.snippet}`;
    const authorityScore = officialScore(domain);
    const tags = relevanceTags(sourceText);
    const proposedIndicators = indicatorsFromText(sourceText, pillars);
    const relevanceScore = tags.includes("unknown_needs_review") ? 0.45 : 0.75;
    const primarySourceScore = /gazette|law|act|regulation|official|government/i.test(sourceText) ? 0.8 : 0.45;
    const freshnessScore = 0.55;
    const confidence = Number((0.4 * authorityScore + 0.35 * relevanceScore + 0.15 * primarySourceScore + 0.1 * freshnessScore).toFixed(2));
    const allowlisted = isDomainAllowlisted(economy.id, domain);
    if (workspace.sourcePolicy === "allowlisted_only" && !allowlisted) continue;
    const requiresApproval = workspace.sourcePolicy === "approval_required" && (!allowlisted || confidence < 0.8);

    const candidate = createSourceCandidate({
      workspaceId,
      economyId: economy.id,
      url: result.url,
      normalizedUrl,
      domain,
      title: result.title,
      snippet: result.snippet,
      proposedPillars: pillars,
      proposedIndicators: proposedIndicators.length ? proposedIndicators : (input.indicatorIds ?? []),
      relevanceTags: tags,
      confidence,
      reason: `${domain} scored ${confidence}; ${tags.join(", ")} relevance detected.`,
      requiresApproval,
      status: requiresApproval ? "proposed" : "approved",
    });
    createSourceCandidateEvaluation({
      candidateId: candidate.id,
      authorityScore,
      relevanceScore,
      primarySourceScore,
      freshnessScore,
      classification: { tags, allowlisted, sourcePolicy: workspace.sourcePolicy, provider: process.env.BRAVE_SEARCH_API_KEY ? "brave" : "source_registry" },
    });
    created.push(candidate);
  }

  return {
    candidates: created,
    summary: process.env.BRAVE_SEARCH_API_KEY
      ? `Found ${created.length} source candidates using Brave Search.`
      : `Web search is not configured; created ${created.length} candidates from real source registries only.`,
    needsUserApproval: created.some((candidate) => candidate.requiresApproval),
  };
}
