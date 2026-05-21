import "server-only";

import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { PDFParse } from "pdf-parse";
import { createAlert, createSourceDocument, createVersionSnapshot, getSourceCandidate, getWorkspace, isDomainAllowlisted, updateSourceCandidateStatus } from "./db";
import { getOcrProvider } from "./ocr";
import type { ExtractionMethod } from "./types";

const MIN_TEXT_CHARS = 500;
const MIN_TEXT_WORDS = 50;
const MAX_OCR_PDF_PAGES = 3;

type ExtractedPage = {
  pageNumber: number;
  text: string;
  confidence: number;
  metadata?: Record<string, unknown>;
};

type ExtractedDocument = {
  title: string;
  documentType: string;
  language: string;
  text: string;
  confidence: number;
  extractionMethod: ExtractionMethod;
  pages: ExtractedPage[];
  alerts: { type: string; severity: "Low" | "Medium" | "High"; title: string; message: string }[];
};

function isSparse(text: string) {
  const trimmed = text.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  return trimmed.length < MIN_TEXT_CHARS || words.length < MIN_TEXT_WORDS;
}

function domainOf(url: string) {
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
}

function contentType(headers: Headers, url: string) {
  const header = headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (header) return header;
  if (url.toLowerCase().endsWith(".pdf")) return "application/pdf";
  if (/\.(png|jpg|jpeg|tif|tiff|webp)$/i.test(url)) return "image/unknown";
  return "text/html";
}

function languageFromWorkspace(workspaceId: string, economyId: string) {
  const workspace = getWorkspace(workspaceId);
  const economy = workspace?.economies.find((item) => item.id === economyId);
  return economy?.languages[0] ?? "English";
}

async function extractHtml(buffer: Buffer, url: string): Promise<ExtractedDocument> {
  const html = buffer.toString("utf8");
  const dom = new JSDOM(html, { url });
  const article = new Readability(dom.window.document).parse();
  const $ = cheerio.load(html);
  const title = article?.title || $("title").text().trim() || url;
  const text = (article?.textContent || $("body").text()).replace(/\n{3,}/g, "\n\n").trim();
  return {
    title,
    documentType: "html",
    language: "Unknown",
    text,
    confidence: isSparse(text) ? 0.45 : 0.9,
    extractionMethod: isSparse(text) ? "failed" : "embedded_text",
    pages: [{ pageNumber: 1, text, confidence: isSparse(text) ? 0.45 : 0.9 }],
    alerts: isSparse(text) ? [{ type: "ocr_unavailable", severity: "Medium", title: "Sparse HTML extraction", message: "The page produced very little readable text." }] : [],
  };
}

async function extractPdf(buffer: Buffer, languageHints: string[]): Promise<ExtractedDocument> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const textResult = await parser.getText({ pageJoiner: "\n\n" });
    const text = textResult.text.trim();
    const pages = textResult.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text.trim(),
      confidence: isSparse(page.text) ? 0.45 : 0.9,
    }));
    if (!isSparse(text)) {
      return {
        title: "PDF document",
        documentType: "pdf",
        language: languageHints[0] ?? "Unknown",
        text,
        confidence: 0.9,
        extractionMethod: "embedded_text",
        pages,
        alerts: [],
      };
    }

    const provider = getOcrProvider();
    if (provider.name === "none") {
      return {
        title: "Scanned PDF document",
        documentType: "pdf",
        language: languageHints[0] ?? "Unknown",
        text,
        confidence: 0.2,
        extractionMethod: "failed",
        pages,
        alerts: [{ type: "ocr_unavailable", severity: "High", title: "OCR unavailable", message: "This PDF appears scanned or text-sparse, but OCR_PROVIDER is none." }],
      };
    }

    try {
      const screenshots = await parser.getScreenshot({ first: MAX_OCR_PDF_PAGES, imageBuffer: true, imageDataUrl: false, desiredWidth: 1800 });
      const ocrPages: ExtractedPage[] = [];
      for (const page of screenshots.pages) {
        const ocr = await provider.extractText({
          buffer: Buffer.from(page.data),
          mimeType: "image/png",
          languageHints,
        });
        ocrPages.push({ pageNumber: page.pageNumber, text: ocr.text, confidence: ocr.confidence, metadata: { ocr: true } });
      }
      const ocrText = ocrPages.map((page) => page.text).join("\n\n").trim();
      const confidence = ocrPages.length ? Number((ocrPages.reduce((sum, page) => sum + page.confidence, 0) / ocrPages.length).toFixed(2)) : 0;
      return {
        title: "OCR PDF document",
        documentType: "pdf",
        language: languageHints[0] ?? "Unknown",
        text: ocrText,
        confidence,
        extractionMethod: "ocr",
        pages: ocrPages,
        alerts: [
          { type: "ocr_used", severity: "Low", title: "OCR used", message: `OCR fallback processed the first ${MAX_OCR_PDF_PAGES} PDF page(s).` },
          ...(confidence < 0.65 ? [{ type: "low_ocr_confidence" as const, severity: "Medium" as const, title: "Low OCR confidence", message: "OCR confidence is below 0.65 and needs review." }] : []),
        ],
      };
    } catch (error) {
      return {
        title: "Scanned PDF document",
        documentType: "pdf",
        language: languageHints[0] ?? "Unknown",
        text,
        confidence: 0.1,
        extractionMethod: "failed",
        pages,
        alerts: [{ type: "ocr_failed", severity: "High", title: "OCR failed", message: error instanceof Error ? error.message : "Tesseract OCR failed." }],
      };
    }
  } finally {
    await parser.destroy();
  }
}

async function extractImage(buffer: Buffer, mimeType: string, languageHints: string[]): Promise<ExtractedDocument> {
  const provider = getOcrProvider();
  if (provider.name === "none") {
    return {
      title: "Image document",
      documentType: "image",
      language: languageHints[0] ?? "Unknown",
      text: "",
      confidence: 0,
      extractionMethod: "failed",
      pages: [],
      alerts: [{ type: "ocr_unavailable", severity: "High", title: "OCR unavailable", message: "Image documents require OCR, but OCR_PROVIDER is none." }],
    };
  }
  try {
    const ocr = await provider.extractText({ buffer, mimeType, languageHints });
    return {
      title: "OCR image document",
      documentType: "image",
      language: languageHints[0] ?? "Unknown",
      text: ocr.text,
      confidence: ocr.confidence,
      extractionMethod: "ocr",
      pages: ocr.pages,
      alerts: [
        { type: "ocr_used", severity: "Low", title: "OCR used", message: "OCR fallback processed an image document." },
        ...(ocr.confidence < 0.65 ? [{ type: "low_ocr_confidence" as const, severity: "Medium" as const, title: "Low OCR confidence", message: "OCR confidence is below 0.65 and needs review." }] : []),
      ],
    };
  } catch (error) {
    return {
      title: "Image document",
      documentType: "image",
      language: languageHints[0] ?? "Unknown",
      text: "",
      confidence: 0,
      extractionMethod: "failed",
      pages: [],
      alerts: [{ type: "ocr_failed", severity: "High", title: "OCR failed", message: error instanceof Error ? error.message : "Tesseract OCR failed." }],
    };
  }
}

export async function ingestSourceCandidate(candidateId: string) {
  const candidate = getSourceCandidate(candidateId);
  if (!candidate) throw new Error("Candidate not found");
  const workspace = getWorkspace(candidate.workspaceId);
  if (!workspace) throw new Error("Workspace not found");
  if (workspace.status === "archived") throw new Error("Archived workspaces cannot ingest sources");
  if (["rejected", "failed", "ingested"].includes(candidate.status)) throw new Error(`Cannot ingest a ${candidate.status} source candidate`);
  const allowlisted = isDomainAllowlisted(candidate.economyId, candidate.domain);
  if (workspace.sourcePolicy === "allowlisted_only" && !allowlisted) throw new Error("Only trusted official domains can be ingested in this workspace");
  if (workspace.sourcePolicy === "approval_required" && candidate.requiresApproval && candidate.status !== "approved") {
    throw new Error("Approve this source before ingestion because the domain is not trusted yet");
  }

  const response = await fetch(candidate.url, {
    headers: { "User-Agent": "fresnela-ai-rdtii-workspace/0.1" },
  });
  if (!response.ok) throw new Error(`Fetch failed with ${response.status}`);

  const mimeType = contentType(response.headers, candidate.url);
  const buffer = Buffer.from(await response.arrayBuffer());
  const languageHints = workspace.economies.find((economy) => economy.id === candidate.economyId)?.languages ?? [languageFromWorkspace(candidate.workspaceId, candidate.economyId)];

  const extracted = mimeType.includes("pdf")
    ? await extractPdf(buffer, languageHints)
    : mimeType.startsWith("image/")
      ? await extractImage(buffer, mimeType, languageHints)
      : await extractHtml(buffer, candidate.url);

  const document = createSourceDocument({
    workspaceId: candidate.workspaceId,
    economyId: candidate.economyId,
    candidateId: candidate.id,
    title: candidate.title || extracted.title,
    sourceUrl: candidate.url,
    domain: domainOf(candidate.url),
    documentType: extracted.documentType,
    language: extracted.language === "Unknown" ? languageHints[0] ?? "Unknown" : extracted.language,
    rawText: extracted.text,
    extractionConfidence: extracted.confidence,
    extractionMethod: extracted.extractionMethod,
    pages: extracted.pages,
  });

  for (const alert of extracted.alerts) {
    createAlert({
      workspaceId: candidate.workspaceId,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      relatedResource: { candidateId: candidate.id, documentId: document.id },
    });
  }

  updateSourceCandidateStatus(candidate.id, extracted.extractionMethod === "failed" ? "failed" : "ingested");
  createVersionSnapshot(candidate.workspaceId, `Source ingested: ${document.title}`, "system");
  return document;
}
