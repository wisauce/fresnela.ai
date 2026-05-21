import "server-only";

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { economiesSeed } from "./economies";
import { rdtiiIndicators } from "./rdtii";
import type { DocumentParagraph, Economy, EvidenceMapping, ExtractionMethod, IndicatorScore, PillarId, SourceCandidate, SourceDocument, SourcePolicy, Workspace, WorkspaceStatus } from "./types";

type Row = Record<string, unknown>;

const now = () => new Date().toISOString();

function dbPath() {
  const configured = process.env.DATABASE_URL;
  if (configured?.startsWith("file:./data/")) return join(process.cwd(), "data", configured.slice("file:./data/".length));
  if (configured?.startsWith("file:data/")) return join(process.cwd(), "data", configured.slice("file:data/".length));
  if (configured && configured !== "file:./data/fresnela.sqlite") return configured.replace(/^file:/, "");
  return join(process.cwd(), "data", "fresnela.sqlite");
}

const path = dbPath();
mkdirSync(join(process.cwd(), "data"), { recursive: true });

const sqlite = new Database(path);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const sourceRegistrySeed = [
  { economyId: "idn", domain: "jdih.kominfo.go.id", sourceName: "Indonesia Ministry of Communication and Informatics JDIH", sourceType: "legal_portal", languageHints: ["Indonesian"], isAllowlisted: true, notes: "Official legal documentation portal." },
  { economyId: "idn", domain: "peraturan.bpk.go.id", sourceName: "Indonesia BPK Regulation Database", sourceType: "legal_database", languageHints: ["Indonesian"], isAllowlisted: true, notes: "Official Indonesian regulation database." },
  { economyId: "tha", domain: "ratchakitcha.soc.go.th", sourceName: "Thailand Royal Gazette", sourceType: "gazette", languageHints: ["Thai", "English"], isAllowlisted: true, notes: "Official gazette source." },
  { economyId: "tha", domain: "pdpc.or.th", sourceName: "Thailand Personal Data Protection Committee", sourceType: "regulator", languageHints: ["Thai", "English"], isAllowlisted: true, notes: "Official data protection regulator." },
  { economyId: "sgp", domain: "sso.agc.gov.sg", sourceName: "Singapore Statutes Online", sourceType: "legal_portal", languageHints: ["English"], isAllowlisted: true, notes: "Official Singapore statutes source." },
  { economyId: "sgp", domain: "pdpc.gov.sg", sourceName: "Singapore PDPC", sourceType: "regulator", languageHints: ["English"], isAllowlisted: true, notes: "Official data protection regulator." },
  { economyId: "mys", domain: "lom.agc.gov.my", sourceName: "Laws of Malaysia", sourceType: "legal_portal", languageHints: ["Malay", "English"], isAllowlisted: true, notes: "Official laws portal." },
  { economyId: "mys", domain: "pdp.gov.my", sourceName: "Malaysia Personal Data Protection Department", sourceType: "regulator", languageHints: ["Malay", "English"], isAllowlisted: true, notes: "Official data protection regulator." },
];

function json<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function bool(value: unknown) {
  return value === 1 || value === true;
}

function runSchema() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS economies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      iso2 TEXT,
      iso3 TEXT,
      region TEXT NOT NULL,
      subregion TEXT NOT NULL,
      languagesJson TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rdtii_indicators (
      id TEXT PRIMARY KEY,
      pillarId TEXT NOT NULL,
      pillarNumber INTEGER NOT NULL,
      name TEXT NOT NULL,
      weight REAL NOT NULL,
      rubricJson TEXT NOT NULL,
      evidenceHintsJson TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      ownerId TEXT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      sourcePolicy TEXT NOT NULL,
      activePillarsJson TEXT NOT NULL,
      activeIndicatorIdsJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspace_economies (
      workspaceId TEXT NOT NULL,
      economyId TEXT NOT NULL,
      PRIMARY KEY (workspaceId, economyId),
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (economyId) REFERENCES economies(id)
    );

    CREATE TABLE IF NOT EXISTS source_registries (
      id TEXT PRIMARY KEY,
      economyId TEXT NOT NULL,
      domain TEXT NOT NULL,
      sourceName TEXT NOT NULL,
      sourceType TEXT NOT NULL,
      languageHintsJson TEXT NOT NULL,
      isAllowlisted INTEGER NOT NULL,
      notes TEXT,
      FOREIGN KEY (economyId) REFERENCES economies(id)
    );

    CREATE TABLE IF NOT EXISTS source_candidates (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      economyId TEXT NOT NULL,
      url TEXT NOT NULL,
      normalizedUrl TEXT NOT NULL,
      domain TEXT NOT NULL,
      title TEXT,
      snippet TEXT,
      proposedPillarsJson TEXT NOT NULL,
      proposedIndicatorsJson TEXT NOT NULL,
      relevanceTagsJson TEXT NOT NULL,
      confidence REAL NOT NULL,
      reason TEXT NOT NULL,
      requiresApproval INTEGER NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (economyId) REFERENCES economies(id)
    );

    CREATE TABLE IF NOT EXISTS source_candidate_evaluations (
      id TEXT PRIMARY KEY,
      candidateId TEXT NOT NULL,
      authorityScore REAL NOT NULL,
      relevanceScore REAL NOT NULL,
      primarySourceScore REAL NOT NULL,
      freshnessScore REAL NOT NULL,
      classificationJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (candidateId) REFERENCES source_candidates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS source_documents (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      economyId TEXT NOT NULL,
      candidateId TEXT,
      title TEXT NOT NULL,
      sourceUrl TEXT NOT NULL,
      domain TEXT NOT NULL,
      documentType TEXT NOT NULL,
      language TEXT NOT NULL,
      retrievedAt TEXT NOT NULL,
      contentHash TEXT NOT NULL,
      rawText TEXT NOT NULL,
      extractionConfidence REAL NOT NULL,
      extractionMethod TEXT NOT NULL DEFAULT 'embedded_text',
      status TEXT NOT NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_pages (
      id TEXT PRIMARY KEY,
      documentId TEXT NOT NULL,
      pageNumber INTEGER NOT NULL,
      text TEXT NOT NULL,
      metadataJson TEXT NOT NULL,
      FOREIGN KEY (documentId) REFERENCES source_documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_paragraphs (
      id TEXT PRIMARY KEY,
      documentId TEXT NOT NULL,
      pageId TEXT,
      paragraphIndex INTEGER NOT NULL,
      text TEXT NOT NULL,
      citationLabel TEXT NOT NULL,
      charStart INTEGER NOT NULL,
      charEnd INTEGER NOT NULL,
      language TEXT NOT NULL,
      confidence REAL NOT NULL,
      FOREIGN KEY (documentId) REFERENCES source_documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      title TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      metadataJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (sessionId) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_tasks (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      workspaceId TEXT NOT NULL,
      intent TEXT NOT NULL,
      status TEXT NOT NULL,
      planJson TEXT NOT NULL,
      jobIdsJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      progress INTEGER NOT NULL,
      currentStep TEXT NOT NULL,
      errorMessage TEXT,
      technicalError TEXT,
      resultJson TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS analysis_runs (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      jobId TEXT,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT NOT NULL,
      inputSummaryJson TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence_mappings (
      id TEXT PRIMARY KEY,
      analysisRunId TEXT,
      workspaceId TEXT NOT NULL,
      economyId TEXT NOT NULL,
      indicatorId TEXT NOT NULL,
      sourceDocumentId TEXT,
      paragraphIdsJson TEXT NOT NULL,
      citation TEXT NOT NULL,
      verbatimSnippet TEXT NOT NULL,
      reasoning TEXT NOT NULL,
      scoreSuggestion REAL NOT NULL,
      confidence REAL NOT NULL,
      uncertaintyFlagsJson TEXT NOT NULL,
      requiresReview INTEGER NOT NULL,
      reviewStatus TEXT NOT NULL,
      reviewerNotes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS indicator_scores (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      economyId TEXT NOT NULL,
      indicatorId TEXT NOT NULL,
      score REAL NOT NULL,
      scoreSource TEXT NOT NULL,
      reviewStatus TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      type TEXT NOT NULL,
      severity TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      relatedResourceJson TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS versions (
      id TEXT PRIMARY KEY,
      workspaceId TEXT NOT NULL,
      label TEXT NOT NULL,
      snapshotJson TEXT NOT NULL,
      createdBy TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
}

function seed() {
  const createdAt = now();
  const economyCount = sqlite.prepare("SELECT COUNT(*) AS count FROM economies").get() as { count: number };
  if (economyCount.count === 0) {
    const insert = sqlite.prepare("INSERT OR IGNORE INTO economies (id, name, iso2, iso3, region, subregion, languagesJson, createdAt) VALUES (@id, @name, @iso2, @iso3, @region, @subregion, @languagesJson, @createdAt)");
    const tx = sqlite.transaction(() => {
      for (const economy of economiesSeed) insert.run({ ...economy, languagesJson: JSON.stringify(economy.languages), createdAt });
    });
    tx();
  }

  const indicatorCount = sqlite.prepare("SELECT COUNT(*) AS count FROM rdtii_indicators").get() as { count: number };
  if (indicatorCount.count === 0) {
    const insert = sqlite.prepare("INSERT OR IGNORE INTO rdtii_indicators (id, pillarId, pillarNumber, name, weight, rubricJson, evidenceHintsJson) VALUES (@id, @pillarId, @pillarNumber, @name, @weight, @rubricJson, @evidenceHintsJson)");
    const tx = sqlite.transaction(() => {
      for (const indicator of rdtiiIndicators) {
        insert.run({
          ...indicator,
          rubricJson: JSON.stringify(indicator.rubric),
          evidenceHintsJson: JSON.stringify(indicator.evidenceHints),
        });
      }
    });
    tx();
  }

  const registryCount = sqlite.prepare("SELECT COUNT(*) AS count FROM source_registries").get() as { count: number };
  if (registryCount.count === 0) {
    const insert = sqlite.prepare("INSERT OR IGNORE INTO source_registries (id, economyId, domain, sourceName, sourceType, languageHintsJson, isAllowlisted, notes) VALUES (@id, @economyId, @domain, @sourceName, @sourceType, @languageHintsJson, @isAllowlisted, @notes)");
    const tx = sqlite.transaction(() => {
      for (const registry of sourceRegistrySeed) {
        insert.run({
          id: randomUUID(),
          ...registry,
          languageHintsJson: JSON.stringify(registry.languageHints),
          isAllowlisted: registry.isAllowlisted ? 1 : 0,
        });
      }
    });
    tx();
  }

  const workspaceCount = sqlite.prepare("SELECT COUNT(*) AS count FROM workspaces").get() as { count: number };
  if (workspaceCount.count === 0) {
    const workspaceId = "workspace-indonesia-seed";
    const sessionId = "chat-session-indonesia-seed";
    const tx = sqlite.transaction(() => {
      sqlite.prepare(`
        INSERT OR IGNORE INTO workspaces (id, ownerId, name, description, status, sourcePolicy, activePillarsJson, activeIndicatorIdsJson, createdAt, updatedAt)
        VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        workspaceId,
        "Indonesia RDTII Evidence Workspace",
        "Seed workspace for Pillar 6 and Pillar 7 evidence review.",
        "needs_review",
        "approval_required",
        JSON.stringify(["pillar-6", "pillar-7"]),
        JSON.stringify(rdtiiIndicators.map((indicator) => indicator.id)),
        createdAt,
        createdAt,
      );
      sqlite.prepare("INSERT OR IGNORE INTO workspace_economies (workspaceId, economyId) VALUES (?, ?)").run(workspaceId, "idn");
      sqlite.prepare("INSERT OR IGNORE INTO chat_sessions (id, workspaceId, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)").run(sessionId, workspaceId, "Workspace chat", createdAt, createdAt);
    });
    tx();
  }
}

runSchema();
const sourceDocumentColumns = sqlite.prepare("PRAGMA table_info(source_documents)").all() as { name: string }[];
if (!sourceDocumentColumns.some((column) => column.name === "extractionMethod")) {
  sqlite.prepare("ALTER TABLE source_documents ADD COLUMN extractionMethod TEXT NOT NULL DEFAULT 'embedded_text'").run();
}

function economyFromRow(row: Row): Economy {
  return {
    id: String(row.id),
    name: String(row.name),
    iso2: row.iso2 ? String(row.iso2) : null,
    iso3: row.iso3 ? String(row.iso3) : null,
    region: String(row.region),
    subregion: String(row.subregion),
    languages: json(String(row.languagesJson), [] as string[]),
    createdAt: String(row.createdAt),
  };
}

function workspaceFromRow(row: Row): Workspace {
  const economies = listEconomiesForWorkspace(String(row.id));
  const documentCount = Number((sqlite.prepare("SELECT COUNT(*) AS count FROM source_documents WHERE workspaceId = ?").get(row.id) as { count: number }).count);
  const mappingCount = Number((sqlite.prepare("SELECT COUNT(*) AS count FROM evidence_mappings WHERE workspaceId = ?").get(row.id) as { count: number }).count);
  const alertCount = Number((sqlite.prepare("SELECT COUNT(*) AS count FROM alerts WHERE workspaceId = ? AND status != 'resolved'").get(row.id) as { count: number }).count);

  return {
    id: String(row.id),
    ownerId: row.ownerId ? String(row.ownerId) : null,
    name: String(row.name),
    description: row.description ? String(row.description) : null,
    status: String(row.status) as WorkspaceStatus,
    economyIds: economies.map((economy) => economy.id),
    economies,
    activePillars: json(String(row.activePillarsJson), [] as PillarId[]),
    activeIndicatorIds: json(String(row.activeIndicatorIdsJson), [] as string[]),
    sourcePolicy: String(row.sourcePolicy) as SourcePolicy,
    documentCount,
    mappingCount,
    alertCount,
    lastUpdatedAt: String(row.updatedAt),
    createdAt: String(row.createdAt),
  };
}

function candidateFromRow(row: Row): SourceCandidate {
  return {
    id: String(row.id),
    workspaceId: String(row.workspaceId),
    economyId: String(row.economyId),
    url: String(row.url),
    normalizedUrl: String(row.normalizedUrl),
    domain: String(row.domain),
    title: row.title ? String(row.title) : null,
    snippet: row.snippet ? String(row.snippet) : null,
    proposedPillars: json(String(row.proposedPillarsJson), [] as PillarId[]),
    proposedIndicators: json(String(row.proposedIndicatorsJson), [] as string[]),
    relevanceTags: json(String(row.relevanceTagsJson), [] as string[]),
    confidence: Number(row.confidence),
    reason: String(row.reason),
    requiresApproval: bool(row.requiresApproval),
    status: String(row.status) as SourceCandidate["status"],
    createdAt: String(row.createdAt),
  };
}

function sourceDocumentFromRow(row: Row): SourceDocument {
  return {
    id: String(row.id),
    workspaceId: String(row.workspaceId),
    economyId: String(row.economyId),
    candidateId: row.candidateId ? String(row.candidateId) : null,
    title: String(row.title),
    sourceUrl: String(row.sourceUrl),
    domain: String(row.domain),
    documentType: String(row.documentType),
    language: String(row.language),
    retrievedAt: String(row.retrievedAt),
    contentHash: String(row.contentHash),
    rawText: String(row.rawText),
    extractionConfidence: Number(row.extractionConfidence),
    extractionMethod: String(row.extractionMethod) as ExtractionMethod,
    status: String(row.status),
  };
}

function paragraphFromRow(row: Row): DocumentParagraph {
  return {
    id: String(row.id),
    documentId: String(row.documentId),
    pageId: row.pageId ? String(row.pageId) : null,
    paragraphIndex: Number(row.paragraphIndex),
    text: String(row.text),
    citationLabel: String(row.citationLabel),
    charStart: Number(row.charStart),
    charEnd: Number(row.charEnd),
    language: String(row.language),
    confidence: Number(row.confidence),
  };
}

function evidenceMappingFromRow(row: Row): EvidenceMapping {
  return {
    id: String(row.id),
    analysisRunId: row.analysisRunId ? String(row.analysisRunId) : null,
    workspaceId: String(row.workspaceId),
    economyId: String(row.economyId),
    indicatorId: String(row.indicatorId),
    sourceDocumentId: row.sourceDocumentId ? String(row.sourceDocumentId) : null,
    paragraphIds: json(String(row.paragraphIdsJson), [] as string[]),
    citation: String(row.citation),
    verbatimSnippet: String(row.verbatimSnippet),
    reasoning: String(row.reasoning),
    scoreSuggestion: Number(row.scoreSuggestion) as 0 | 0.5 | 1,
    confidence: Number(row.confidence),
    uncertaintyFlags: json(String(row.uncertaintyFlagsJson), [] as string[]),
    requiresReview: bool(row.requiresReview),
    reviewStatus: String(row.reviewStatus) as EvidenceMapping["reviewStatus"],
    reviewerNotes: row.reviewerNotes ? String(row.reviewerNotes) : null,
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

function indicatorScoreFromRow(row: Row): IndicatorScore {
  return {
    id: String(row.id),
    workspaceId: String(row.workspaceId),
    economyId: String(row.economyId),
    indicatorId: String(row.indicatorId),
    score: Number(row.score),
    scoreSource: String(row.scoreSource) as IndicatorScore["scoreSource"],
    reviewStatus: String(row.reviewStatus),
    updatedAt: String(row.updatedAt),
  };
}

export function listEconomies() {
  return (sqlite.prepare("SELECT * FROM economies ORDER BY name").all() as Row[]).map(economyFromRow);
}

export function getEconomy(id: string) {
  const row = sqlite.prepare("SELECT * FROM economies WHERE id = ?").get(id) as Row | undefined;
  return row ? economyFromRow(row) : null;
}

export function listEconomiesForWorkspace(workspaceId: string) {
  return (sqlite.prepare(`
    SELECT e.* FROM economies e
    INNER JOIN workspace_economies we ON we.economyId = e.id
    WHERE we.workspaceId = ?
    ORDER BY e.name
  `).all(workspaceId) as Row[]).map(economyFromRow);
}

export function listWorkspaces(includeArchived = false) {
  const rows = sqlite.prepare(`SELECT * FROM workspaces ${includeArchived ? "" : "WHERE status != 'archived'"} ORDER BY updatedAt DESC`).all() as Row[];
  return rows.map(workspaceFromRow);
}

export function getWorkspace(id: string) {
  const row = sqlite.prepare("SELECT * FROM workspaces WHERE id = ?").get(id) as Row | undefined;
  return row ? workspaceFromRow(row) : null;
}

export function createWorkspace(input: {
  name: string;
  description?: string | null;
  economyIds: string[];
  activePillars: PillarId[];
  activeIndicatorIds: string[];
  sourcePolicy: SourcePolicy;
  status?: WorkspaceStatus;
}) {
  const id = randomUUID();
  const timestamp = now();
  const tx = sqlite.transaction(() => {
    sqlite.prepare(`
      INSERT INTO workspaces (id, ownerId, name, description, status, sourcePolicy, activePillarsJson, activeIndicatorIdsJson, createdAt, updatedAt)
      VALUES (@id, NULL, @name, @description, @status, @sourcePolicy, @activePillarsJson, @activeIndicatorIdsJson, @createdAt, @updatedAt)
    `).run({
      id,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "draft",
      sourcePolicy: input.sourcePolicy,
      activePillarsJson: JSON.stringify(input.activePillars),
      activeIndicatorIdsJson: JSON.stringify(input.activeIndicatorIds),
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    const insertEconomy = sqlite.prepare("INSERT INTO workspace_economies (workspaceId, economyId) VALUES (?, ?)");
    for (const economyId of input.economyIds) insertEconomy.run(id, economyId);
    sqlite.prepare("INSERT INTO chat_sessions (id, workspaceId, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), id, "Workspace chat", timestamp, timestamp);
  });
  tx();
  return getWorkspace(id)!;
}

export function updateWorkspace(id: string, input: Partial<{
  name: string;
  description: string | null;
  economyIds: string[];
  activePillars: PillarId[];
  activeIndicatorIds: string[];
  sourcePolicy: SourcePolicy;
  status: WorkspaceStatus;
}>) {
  const existing = getWorkspace(id);
  if (!existing) return null;
  const next = { ...existing, ...input };
  const timestamp = now();
  const tx = sqlite.transaction(() => {
    sqlite.prepare(`
      UPDATE workspaces
      SET name = @name, description = @description, status = @status, sourcePolicy = @sourcePolicy,
        activePillarsJson = @activePillarsJson, activeIndicatorIdsJson = @activeIndicatorIdsJson, updatedAt = @updatedAt
      WHERE id = @id
    `).run({
      id,
      name: next.name,
      description: next.description,
      status: next.status,
      sourcePolicy: next.sourcePolicy,
      activePillarsJson: JSON.stringify(next.activePillars),
      activeIndicatorIdsJson: JSON.stringify(next.activeIndicatorIds),
      updatedAt: timestamp,
    });
    if (input.economyIds) {
      sqlite.prepare("DELETE FROM workspace_economies WHERE workspaceId = ?").run(id);
      const insertEconomy = sqlite.prepare("INSERT INTO workspace_economies (workspaceId, economyId) VALUES (?, ?)");
      for (const economyId of input.economyIds) insertEconomy.run(id, economyId);
    }
  });
  tx();
  return getWorkspace(id);
}

export function duplicateWorkspace(id: string) {
  return duplicateWorkspaceWithOptions(id, {});
}

export function duplicateWorkspaceWithOptions(id: string, options: { mode?: "config_only" | "include_sources" | "include_documents" | "include_mappings" }) {
  const workspace = getWorkspace(id);
  if (!workspace) return null;
  const copy = createWorkspace({
    name: `${workspace.name} Copy`,
    description: workspace.description,
    economyIds: workspace.economyIds,
    activePillars: workspace.activePillars,
    activeIndicatorIds: workspace.activeIndicatorIds,
    sourcePolicy: workspace.sourcePolicy,
    status: "draft",
  });
  const mode = options.mode ?? "config_only";
  if (mode === "config_only") return copy;
  const timestamp = now();
  const tx = sqlite.transaction(() => {
    if (["include_sources", "include_documents", "include_mappings"].includes(mode)) {
      const insertCandidate = sqlite.prepare(`
        INSERT INTO source_candidates (
          id, workspaceId, economyId, url, normalizedUrl, domain, title, snippet, proposedPillarsJson,
          proposedIndicatorsJson, relevanceTagsJson, confidence, reason, requiresApproval, status, createdAt
        )
        SELECT ?, ?, economyId, url, normalizedUrl, domain, title, snippet, proposedPillarsJson,
          proposedIndicatorsJson, relevanceTagsJson, confidence, reason, requiresApproval, status, ?
        FROM source_candidates WHERE id = ?
      `);
      for (const candidate of listSourceCandidates(id)) insertCandidate.run(randomUUID(), copy.id, timestamp, candidate.id);
    }
    const documentIdMap = new Map<string, string>();
    const paragraphIdMap = new Map<string, string>();
    if (["include_documents", "include_mappings"].includes(mode)) {
      const documents = sqlite.prepare("SELECT * FROM source_documents WHERE workspaceId = ?").all(id) as Row[];
      const insertDocument = sqlite.prepare(`
        INSERT INTO source_documents (
          id, workspaceId, economyId, candidateId, title, sourceUrl, domain, documentType, language,
          retrievedAt, contentHash, rawText, extractionConfidence, extractionMethod, status
        ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertPage = sqlite.prepare("INSERT INTO document_pages (id, documentId, pageNumber, text, metadataJson) VALUES (?, ?, ?, ?, ?)");
      const insertParagraph = sqlite.prepare(`
        INSERT INTO document_paragraphs (id, documentId, pageId, paragraphIndex, text, citationLabel, charStart, charEnd, language, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const document of documents) {
        const newDocumentId = randomUUID();
        documentIdMap.set(String(document.id), newDocumentId);
        insertDocument.run(
          newDocumentId,
          copy.id,
          document.economyId,
          document.title,
          document.sourceUrl,
          document.domain,
          document.documentType,
          document.language,
          timestamp,
          document.contentHash,
          document.rawText,
          document.extractionConfidence,
          document.extractionMethod,
          document.status,
        );
        const pageIdMap = new Map<string, string>();
        const pages = sqlite.prepare("SELECT * FROM document_pages WHERE documentId = ?").all(document.id) as Row[];
        for (const page of pages) {
          const newPageId = randomUUID();
          pageIdMap.set(String(page.id), newPageId);
          insertPage.run(newPageId, newDocumentId, page.pageNumber, page.text, page.metadataJson);
        }
        const paragraphs = sqlite.prepare("SELECT * FROM document_paragraphs WHERE documentId = ?").all(document.id) as Row[];
        for (const paragraph of paragraphs) {
          const newParagraphId = randomUUID();
          paragraphIdMap.set(String(paragraph.id), newParagraphId);
          insertParagraph.run(
            newParagraphId,
            newDocumentId,
            paragraph.pageId ? pageIdMap.get(String(paragraph.pageId)) ?? null : null,
            paragraph.paragraphIndex,
            paragraph.text,
            paragraph.citationLabel,
            paragraph.charStart,
            paragraph.charEnd,
            paragraph.language,
            paragraph.confidence,
          );
        }
      }
    }
    if (["include_mappings"].includes(mode)) {
      const insertMapping = sqlite.prepare(`
        INSERT INTO evidence_mappings (
          id, analysisRunId, workspaceId, economyId, indicatorId, sourceDocumentId, paragraphIdsJson, citation,
          verbatimSnippet, reasoning, scoreSuggestion, confidence, uncertaintyFlagsJson, requiresReview,
          reviewStatus, reviewerNotes, createdAt, updatedAt
        )
        VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const mapping of listEvidenceMappings(id)) {
        insertMapping.run(
          randomUUID(),
          copy.id,
          mapping.economyId,
          mapping.indicatorId,
          mapping.sourceDocumentId ? documentIdMap.get(mapping.sourceDocumentId) ?? mapping.sourceDocumentId : null,
          JSON.stringify(mapping.paragraphIds.map((paragraphId) => paragraphIdMap.get(paragraphId) ?? paragraphId)),
          mapping.citation,
          mapping.verbatimSnippet,
          mapping.reasoning,
          mapping.scoreSuggestion,
          mapping.confidence,
          JSON.stringify(mapping.uncertaintyFlags),
          mapping.requiresReview ? 1 : 0,
          mapping.reviewStatus,
          mapping.reviewerNotes,
          timestamp,
          timestamp,
        );
        upsertIndicatorScore({
          workspaceId: copy.id,
          economyId: mapping.economyId,
          indicatorId: mapping.indicatorId,
          score: mapping.scoreSuggestion,
          scoreSource: "ai_suggested",
          reviewStatus: mapping.reviewStatus,
        });
      }
    }
  });
  tx();
  return getWorkspace(copy.id);
}

export function listSourceCandidates(workspaceId: string) {
  return (sqlite.prepare("SELECT * FROM source_candidates WHERE workspaceId = ? ORDER BY createdAt DESC").all(workspaceId) as Row[]).map(candidateFromRow);
}

export function getSourceCandidate(id: string) {
  const row = sqlite.prepare("SELECT * FROM source_candidates WHERE id = ?").get(id) as Row | undefined;
  return row ? candidateFromRow(row) : null;
}

export function createSourceCandidate(input: Omit<SourceCandidate, "id" | "createdAt">) {
  const id = randomUUID();
  const createdAt = now();
  sqlite.prepare(`
    INSERT INTO source_candidates (
      id, workspaceId, economyId, url, normalizedUrl, domain, title, snippet, proposedPillarsJson,
      proposedIndicatorsJson, relevanceTagsJson, confidence, reason, requiresApproval, status, createdAt
    )
    VALUES (
      @id, @workspaceId, @economyId, @url, @normalizedUrl, @domain, @title, @snippet, @proposedPillarsJson,
      @proposedIndicatorsJson, @relevanceTagsJson, @confidence, @reason, @requiresApproval, @status, @createdAt
    )
  `).run({
    ...input,
    id,
    proposedPillarsJson: JSON.stringify(input.proposedPillars),
    proposedIndicatorsJson: JSON.stringify(input.proposedIndicators),
    relevanceTagsJson: JSON.stringify(input.relevanceTags),
    requiresApproval: input.requiresApproval ? 1 : 0,
    createdAt,
  });
  return candidateFromRow(sqlite.prepare("SELECT * FROM source_candidates WHERE id = ?").get(id) as Row);
}

export function createSourceCandidateEvaluation(input: {
  candidateId: string;
  authorityScore: number;
  relevanceScore: number;
  primarySourceScore: number;
  freshnessScore: number;
  classification: Record<string, unknown>;
}) {
  const id = randomUUID();
  sqlite.prepare(`
    INSERT INTO source_candidate_evaluations (
      id, candidateId, authorityScore, relevanceScore, primarySourceScore, freshnessScore, classificationJson, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.candidateId,
    input.authorityScore,
    input.relevanceScore,
    input.primarySourceScore,
    input.freshnessScore,
    JSON.stringify(input.classification),
    now(),
  );
  return id;
}

export function listSourceCandidateEvaluations(workspaceId: string) {
  return sqlite.prepare(`
    SELECT e.* FROM source_candidate_evaluations e
    INNER JOIN source_candidates c ON c.id = e.candidateId
    WHERE c.workspaceId = ?
    ORDER BY e.createdAt DESC
  `).all(workspaceId);
}

export function listSourceRegistriesForEconomy(economyId: string) {
  return (sqlite.prepare("SELECT * FROM source_registries WHERE economyId = ? ORDER BY isAllowlisted DESC, sourceName").all(economyId) as Row[]).map((row) => ({
    id: String(row.id),
    economyId: String(row.economyId),
    domain: String(row.domain),
    sourceName: String(row.sourceName),
    sourceType: String(row.sourceType),
    languageHints: json(String(row.languageHintsJson), [] as string[]),
    isAllowlisted: bool(row.isAllowlisted),
    notes: row.notes ? String(row.notes) : null,
  }));
}

export function isDomainAllowlisted(economyId: string, domain: string) {
  const normalized = domain.replace(/^www\./, "").toLowerCase();
  const row = sqlite.prepare("SELECT * FROM source_registries WHERE economyId = ? AND isAllowlisted = 1").all(economyId) as Row[];
  return row.some((item) => normalized === String(item.domain) || normalized.endsWith(`.${String(item.domain)}`));
}

export function updateSourceCandidateStatus(id: string, status: SourceCandidate["status"]) {
  sqlite.prepare("UPDATE source_candidates SET status = ? WHERE id = ?").run(status, id);
  const row = sqlite.prepare("SELECT * FROM source_candidates WHERE id = ?").get(id) as Row | undefined;
  return row ? candidateFromRow(row) : null;
}

export function listSourceDocuments(workspaceId: string) {
  return (sqlite.prepare("SELECT * FROM source_documents WHERE workspaceId = ? ORDER BY retrievedAt DESC").all(workspaceId) as Row[]).map(sourceDocumentFromRow);
}

export function getSourceDocument(id: string) {
  const row = sqlite.prepare("SELECT * FROM source_documents WHERE id = ?").get(id) as Row | undefined;
  return row ? sourceDocumentFromRow(row) : null;
}

export function listDocumentPages(workspaceId: string) {
  return sqlite.prepare(`
    SELECT p.* FROM document_pages p
    INNER JOIN source_documents d ON d.id = p.documentId
    WHERE d.workspaceId = ?
    ORDER BY d.retrievedAt DESC, p.pageNumber ASC
  `).all(workspaceId);
}

export function listDocumentParagraphs(workspaceId: string) {
  return (sqlite.prepare(`
    SELECT p.* FROM document_paragraphs p
    INNER JOIN source_documents d ON d.id = p.documentId
    WHERE d.workspaceId = ?
    ORDER BY d.retrievedAt DESC, p.documentId, p.paragraphIndex ASC
  `).all(workspaceId) as Row[]).map(paragraphFromRow);
}

export function listDocumentParagraphsForDocument(documentId: string) {
  return (sqlite.prepare("SELECT * FROM document_paragraphs WHERE documentId = ? ORDER BY paragraphIndex ASC").all(documentId) as Row[]).map(paragraphFromRow);
}

export function createAlert(input: {
  workspaceId: string;
  type: string;
  severity: "Low" | "Medium" | "High";
  title: string;
  message: string;
  relatedResource?: Record<string, unknown>;
}) {
  const id = randomUUID();
  sqlite.prepare(`
    INSERT INTO alerts (id, workspaceId, type, severity, title, message, relatedResourceJson, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)
  `).run(id, input.workspaceId, input.type, input.severity, input.title, input.message, JSON.stringify(input.relatedResource ?? {}), now());
  return id;
}

export function createSourceDocument(input: {
  workspaceId: string;
  economyId: string;
  candidateId: string | null;
  title: string;
  sourceUrl: string;
  domain: string;
  documentType: string;
  language: string;
  rawText: string;
  extractionConfidence: number;
  extractionMethod: ExtractionMethod;
  pages: { pageNumber: number; text: string; confidence: number; metadata?: Record<string, unknown> }[];
}) {
  const id = randomUUID();
  const retrievedAt = now();
  const contentHash = createHash("sha256").update(input.rawText || input.sourceUrl).digest("hex");
  const tx = sqlite.transaction(() => {
    sqlite.prepare(`
      INSERT INTO source_documents (
        id, workspaceId, economyId, candidateId, title, sourceUrl, domain, documentType, language,
        retrievedAt, contentHash, rawText, extractionConfidence, extractionMethod, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'extracted')
    `).run(
      id,
      input.workspaceId,
      input.economyId,
      input.candidateId,
      input.title,
      input.sourceUrl,
      input.domain,
      input.documentType,
      input.language,
      retrievedAt,
      contentHash,
      input.rawText,
      input.extractionConfidence,
      input.extractionMethod,
    );

    const pageInsert = sqlite.prepare("INSERT INTO document_pages (id, documentId, pageNumber, text, metadataJson) VALUES (?, ?, ?, ?, ?)");
    const paragraphInsert = sqlite.prepare(`
      INSERT INTO document_paragraphs (id, documentId, pageId, paragraphIndex, text, citationLabel, charStart, charEnd, language, confidence)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    let globalOffset = 0;
    for (const page of input.pages.length ? input.pages : [{ pageNumber: 1, text: input.rawText, confidence: input.extractionConfidence }]) {
      const pageId = randomUUID();
      pageInsert.run(pageId, id, page.pageNumber, page.text, JSON.stringify({ ...(page.metadata ?? {}), confidence: page.confidence, extractionMethod: input.extractionMethod }));
      const paragraphs = splitParagraphs(page.text);
      paragraphs.forEach((paragraph, index) => {
        const start = globalOffset;
        const end = start + paragraph.length;
        paragraphInsert.run(randomUUID(), id, pageId, index, paragraph, `p.${page.pageNumber}.${index + 1}`, start, end, input.language, page.confidence);
        globalOffset = end + 1;
      });
    }
    sqlite.prepare("UPDATE workspaces SET updatedAt = ? WHERE id = ?").run(retrievedAt, input.workspaceId);
  });
  tx();
  return sourceDocumentFromRow(sqlite.prepare("SELECT * FROM source_documents WHERE id = ?").get(id) as Row);
}

function splitParagraphs(text: string) {
  const blocks = text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  if (blocks.length > 0) return blocks;
  const sentences = text.split(/(?<=[.!?])\s+/).map((part) => part.trim()).filter(Boolean);
  return sentences.length ? sentences : [text.trim()].filter(Boolean);
}

export function getDefaultChatSession(workspaceId: string) {
  let row = sqlite.prepare("SELECT * FROM chat_sessions WHERE workspaceId = ? ORDER BY createdAt LIMIT 1").get(workspaceId) as Row | undefined;
  if (!row) {
    const timestamp = now();
    const id = randomUUID();
    sqlite.prepare("INSERT INTO chat_sessions (id, workspaceId, title, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)").run(id, workspaceId, "Workspace chat", timestamp, timestamp);
    row = sqlite.prepare("SELECT * FROM chat_sessions WHERE id = ?").get(id) as Row;
  }
  return row;
}

export function addChatMessage(sessionId: string, role: "user" | "assistant" | "system", content: string, metadata: Record<string, unknown> = {}) {
  const id = randomUUID();
  sqlite.prepare("INSERT INTO chat_messages (id, sessionId, role, content, metadataJson, createdAt) VALUES (?, ?, ?, ?, ?, ?)").run(id, sessionId, role, content, JSON.stringify(metadata), now());
  return { id, sessionId, role, content, metadata, createdAt: now() };
}

export function createAgentTask(input: {
  sessionId: string;
  workspaceId: string;
  intent: string;
  status?: string;
  plan?: Record<string, unknown>;
  jobIds?: string[];
}) {
  const id = randomUUID();
  const timestamp = now();
  sqlite.prepare(`
    INSERT INTO agent_tasks (id, sessionId, workspaceId, intent, status, planJson, jobIdsJson, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.sessionId,
    input.workspaceId,
    input.intent,
    input.status ?? "running",
    JSON.stringify(input.plan ?? {}),
    JSON.stringify(input.jobIds ?? []),
    timestamp,
    timestamp,
  );
  return id;
}

export function updateAgentTask(id: string, input: { status: string; plan?: Record<string, unknown>; jobIds?: string[] }) {
  const existing = sqlite.prepare("SELECT * FROM agent_tasks WHERE id = ?").get(id) as Row | undefined;
  if (!existing) return null;
  sqlite.prepare("UPDATE agent_tasks SET status = ?, planJson = ?, jobIdsJson = ?, updatedAt = ? WHERE id = ?").run(
    input.status,
    JSON.stringify(input.plan ?? json(String(existing.planJson), {})),
    JSON.stringify(input.jobIds ?? json(String(existing.jobIdsJson), [] as string[])),
    now(),
    id,
  );
  return id;
}

export function listChatMessages(sessionId: string) {
  return (sqlite.prepare("SELECT * FROM chat_messages WHERE sessionId = ? ORDER BY createdAt").all(sessionId) as Row[]).map((row) => ({
    id: String(row.id),
    sessionId: String(row.sessionId),
    role: String(row.role),
    content: String(row.content),
    metadata: json(String(row.metadataJson), {}),
    createdAt: String(row.createdAt),
  }));
}

export function createJob(workspaceId: string, type: string, status = "succeeded", currentStep = "Completed", result: Record<string, unknown> = {}) {
  const id = randomUUID();
  const timestamp = now();
  sqlite.prepare(`
    INSERT INTO jobs (id, workspaceId, type, status, progress, currentStep, errorMessage, technicalError, resultJson, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)
  `).run(id, workspaceId, type, status, status === "succeeded" ? 100 : 0, currentStep, JSON.stringify(result), timestamp, timestamp);
  return id;
}

export function updateJob(id: string, input: Partial<{
  status: string;
  progress: number;
  currentStep: string;
  errorMessage: string | null;
  technicalError: string | null;
  result: Record<string, unknown>;
}>) {
  const existing = getJob(id);
  if (!existing) return null;
  const existingJob = existing as Row & { result?: Record<string, unknown> };
  sqlite.prepare(`
    UPDATE jobs
    SET status = ?, progress = ?, currentStep = ?, errorMessage = ?, technicalError = ?, resultJson = ?, updatedAt = ?
    WHERE id = ?
  `).run(
    input.status ?? String(existingJob.status),
    input.progress ?? Number(existingJob.progress),
    input.currentStep ?? String(existingJob.currentStep),
    input.errorMessage === undefined ? existingJob.errorMessage ?? null : input.errorMessage,
    input.technicalError === undefined ? existingJob.technicalError ?? null : input.technicalError,
    JSON.stringify(input.result ?? existingJob.result ?? {}),
    now(),
    id,
  );
  return getJob(id);
}

export function getJob(id: string) {
  const row = sqlite.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as Row | undefined;
  return row ? { ...row, result: json(String(row.resultJson), {}) } : null;
}

export function createAnalysisRun(input: {
  workspaceId: string;
  jobId: string;
  provider: string;
  model: string;
  status: string;
  inputSummary: Record<string, unknown>;
}) {
  const id = randomUUID();
  sqlite.prepare(`
    INSERT INTO analysis_runs (id, workspaceId, jobId, provider, model, status, inputSummaryJson, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.workspaceId, input.jobId, input.provider, input.model, input.status, JSON.stringify(input.inputSummary), now());
  return id;
}

export function updateAnalysisRunStatus(id: string, status: string) {
  sqlite.prepare("UPDATE analysis_runs SET status = ? WHERE id = ?").run(status, id);
}

export function listAnalysisRuns(workspaceId: string) {
  return sqlite.prepare("SELECT * FROM analysis_runs WHERE workspaceId = ? ORDER BY createdAt DESC").all(workspaceId);
}

export function createEvidenceMapping(input: {
  analysisRunId: string;
  workspaceId: string;
  economyId: string;
  indicatorId: string;
  sourceDocumentId: string | null;
  paragraphIds: string[];
  citation: string;
  verbatimSnippet: string;
  reasoning: string;
  scoreSuggestion: 0 | 0.5 | 1;
  confidence: number;
  uncertaintyFlags: string[];
  requiresReview: boolean;
  reviewStatus?: EvidenceMapping["reviewStatus"];
}) {
  const id = randomUUID();
  const timestamp = now();
  sqlite.prepare(`
    INSERT INTO evidence_mappings (
      id, analysisRunId, workspaceId, economyId, indicatorId, sourceDocumentId, paragraphIdsJson, citation,
      verbatimSnippet, reasoning, scoreSuggestion, confidence, uncertaintyFlagsJson, requiresReview,
      reviewStatus, reviewerNotes, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `).run(
    id,
    input.analysisRunId,
    input.workspaceId,
    input.economyId,
    input.indicatorId,
    input.sourceDocumentId,
    JSON.stringify(input.paragraphIds),
    input.citation,
    input.verbatimSnippet,
    input.reasoning,
    input.scoreSuggestion,
    input.confidence,
    JSON.stringify(input.uncertaintyFlags),
    input.requiresReview ? 1 : 0,
    input.reviewStatus ?? "needs_review",
    timestamp,
    timestamp,
  );
  return evidenceMappingFromRow(sqlite.prepare("SELECT * FROM evidence_mappings WHERE id = ?").get(id) as Row);
}

export function listEvidenceMappings(workspaceId: string) {
  return (sqlite.prepare("SELECT * FROM evidence_mappings WHERE workspaceId = ? ORDER BY updatedAt DESC").all(workspaceId) as Row[]).map(evidenceMappingFromRow);
}

export function getEvidenceMapping(id: string) {
  const row = sqlite.prepare("SELECT * FROM evidence_mappings WHERE id = ?").get(id) as Row | undefined;
  return row ? evidenceMappingFromRow(row) : null;
}

export function updateEvidenceMappingReview(id: string, input: { reviewStatus: EvidenceMapping["reviewStatus"]; reviewerNotes?: string | null }) {
  const timestamp = now();
  sqlite.prepare("UPDATE evidence_mappings SET reviewStatus = ?, reviewerNotes = ?, updatedAt = ? WHERE id = ?").run(input.reviewStatus, input.reviewerNotes ?? null, timestamp, id);
  const row = sqlite.prepare("SELECT * FROM evidence_mappings WHERE id = ?").get(id) as Row | undefined;
  return row ? evidenceMappingFromRow(row) : null;
}

export function upsertIndicatorScore(input: {
  workspaceId: string;
  economyId: string;
  indicatorId: string;
  score: number;
  scoreSource: IndicatorScore["scoreSource"];
  reviewStatus: string;
}) {
  const existing = sqlite.prepare("SELECT * FROM indicator_scores WHERE workspaceId = ? AND economyId = ? AND indicatorId = ?").get(input.workspaceId, input.economyId, input.indicatorId) as Row | undefined;
  const timestamp = now();
  if (existing) {
    const existingSource = String(existing.scoreSource);
    if (existingSource === "manual_override" && input.scoreSource === "ai_suggested") return indicatorScoreFromRow(existing);
    if (existingSource === "reviewer_approved" && input.scoreSource === "ai_suggested") return indicatorScoreFromRow(existing);
    sqlite.prepare("UPDATE indicator_scores SET score = ?, scoreSource = ?, reviewStatus = ?, updatedAt = ? WHERE id = ?").run(input.score, input.scoreSource, input.reviewStatus, timestamp, existing.id);
    return indicatorScoreFromRow(sqlite.prepare("SELECT * FROM indicator_scores WHERE id = ?").get(existing.id) as Row);
  }
  const id = randomUUID();
  sqlite.prepare(`
    INSERT INTO indicator_scores (id, workspaceId, economyId, indicatorId, score, scoreSource, reviewStatus, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.workspaceId, input.economyId, input.indicatorId, input.score, input.scoreSource, input.reviewStatus, timestamp);
  return indicatorScoreFromRow(sqlite.prepare("SELECT * FROM indicator_scores WHERE id = ?").get(id) as Row);
}

export function listIndicatorScores(workspaceId: string) {
  return (sqlite.prepare("SELECT * FROM indicator_scores WHERE workspaceId = ? ORDER BY economyId, indicatorId").all(workspaceId) as Row[]).map(indicatorScoreFromRow);
}

export function listAlerts(workspaceId?: string) {
  const rows = workspaceId
    ? sqlite.prepare("SELECT * FROM alerts WHERE workspaceId = ? ORDER BY createdAt DESC").all(workspaceId)
    : sqlite.prepare("SELECT * FROM alerts ORDER BY createdAt DESC").all();
  return (rows as Row[]).map((row) => ({
    id: String(row.id),
    workspaceId: String(row.workspaceId),
    type: String(row.type),
    severity: String(row.severity),
    title: String(row.title),
    message: String(row.message),
    relatedResource: json(String(row.relatedResourceJson), {}),
    status: String(row.status),
    createdAt: String(row.createdAt),
  }));
}

export function createVersionSnapshot(workspaceId: string, label: string, createdBy = "system") {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return null;
  const id = randomUUID();
  const snapshot = {
    workspace,
    sourceCandidates: listSourceCandidates(workspaceId),
    sourceDocuments: listSourceDocuments(workspaceId),
    documentPages: listDocumentPages(workspaceId),
    documentParagraphs: listDocumentParagraphs(workspaceId),
    analysisRuns: listAnalysisRuns(workspaceId),
    evidenceMappings: listEvidenceMappings(workspaceId),
    indicatorScores: listIndicatorScores(workspaceId),
    alerts: listAlerts(workspaceId),
  };
  sqlite.prepare("INSERT INTO versions (id, workspaceId, label, snapshotJson, createdBy, createdAt) VALUES (?, ?, ?, ?, ?, ?)").run(id, workspaceId, label, JSON.stringify(snapshot), createdBy, now());
  return id;
}

export function listVersions(workspaceId: string) {
  return sqlite.prepare("SELECT id, workspaceId, label, createdBy, createdAt FROM versions WHERE workspaceId = ? ORDER BY createdAt DESC").all(workspaceId);
}

export function getVersion(id: string) {
  const row = sqlite.prepare("SELECT * FROM versions WHERE id = ?").get(id) as Row | undefined;
  return row ? { ...row, snapshot: json(String(row.snapshotJson), {}) } : null;
}

export function restoreVersion(versionId: string) {
  const version = getVersion(versionId) as { workspaceId?: string; snapshot?: { workspace?: Workspace; evidenceMappings?: EvidenceMapping[]; indicatorScores?: IndicatorScore[] } } | null;
  if (!version?.workspaceId || !version.snapshot?.workspace) return null;
  const workspaceId = String(version.workspaceId);
  const snapshot = version.snapshot;
  const timestamp = now();
  const tx = sqlite.transaction(() => {
    sqlite.prepare(`
      UPDATE workspaces
      SET name = ?, description = ?, status = ?, sourcePolicy = ?, activePillarsJson = ?, activeIndicatorIdsJson = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      snapshot.workspace!.name,
      snapshot.workspace!.description,
      snapshot.workspace!.status,
      snapshot.workspace!.sourcePolicy,
      JSON.stringify(snapshot.workspace!.activePillars),
      JSON.stringify(snapshot.workspace!.activeIndicatorIds),
      timestamp,
      workspaceId,
    );
    sqlite.prepare("DELETE FROM workspace_economies WHERE workspaceId = ?").run(workspaceId);
    const insertEconomy = sqlite.prepare("INSERT INTO workspace_economies (workspaceId, economyId) VALUES (?, ?)");
    for (const economyId of snapshot.workspace!.economyIds) insertEconomy.run(workspaceId, economyId);
    sqlite.prepare("DELETE FROM evidence_mappings WHERE workspaceId = ?").run(workspaceId);
    const insertMapping = sqlite.prepare(`
      INSERT INTO evidence_mappings (
        id, analysisRunId, workspaceId, economyId, indicatorId, sourceDocumentId, paragraphIdsJson, citation,
        verbatimSnippet, reasoning, scoreSuggestion, confidence, uncertaintyFlagsJson, requiresReview,
        reviewStatus, reviewerNotes, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const mapping of snapshot.evidenceMappings ?? []) {
      insertMapping.run(
        randomUUID(),
        mapping.analysisRunId,
        workspaceId,
        mapping.economyId,
        mapping.indicatorId,
        mapping.sourceDocumentId,
        JSON.stringify(mapping.paragraphIds),
        mapping.citation,
        mapping.verbatimSnippet,
        mapping.reasoning,
        mapping.scoreSuggestion,
        mapping.confidence,
        JSON.stringify(mapping.uncertaintyFlags),
        mapping.requiresReview ? 1 : 0,
        mapping.reviewStatus,
        mapping.reviewerNotes,
        timestamp,
        timestamp,
      );
    }
    sqlite.prepare("DELETE FROM indicator_scores WHERE workspaceId = ?").run(workspaceId);
    const insertScore = sqlite.prepare(`
      INSERT INTO indicator_scores (id, workspaceId, economyId, indicatorId, score, scoreSource, reviewStatus, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const score of snapshot.indicatorScores ?? []) {
      insertScore.run(randomUUID(), workspaceId, score.economyId, score.indicatorId, score.score, score.scoreSource, score.reviewStatus, timestamp);
    }
  });
  tx();
  createVersionSnapshot(workspaceId, "Restore point after version restore", "system");
  return getWorkspace(workspaceId);
}

export function getWorkspaceExport(id: string) {
  const workspace = getWorkspace(id);
  if (!workspace) return null;
  return {
    workspace,
    sourceCandidates: listSourceCandidates(id),
    sourceCandidateEvaluations: listSourceCandidateEvaluations(id),
    sourceDocuments: listSourceDocuments(id),
    documentPages: listDocumentPages(id),
    documentParagraphs: listDocumentParagraphs(id),
    analysisRuns: listAnalysisRuns(id),
    evidenceMappings: listEvidenceMappings(id),
    indicatorScores: listIndicatorScores(id),
    alerts: listAlerts(id),
    versions: listVersions(id),
    exportedAt: now(),
  };
}

seed();

export const db = sqlite;
