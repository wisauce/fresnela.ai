import "server-only";

import { recognize } from "tesseract.js";
import type { OcrProvider } from "./provider";

const languageMap: Record<string, string> = {
  english: "eng",
  indonesian: "ind",
  malay: "msa",
  thai: "tha",
  vietnamese: "vie",
  spanish: "spa",
  french: "fra",
  portuguese: "por",
  arabic: "ara",
  chinese: "chi_sim",
  japanese: "jpn",
  korean: "kor",
  russian: "rus",
};

function tesseractLanguages(hints: string[]) {
  const codes = new Set<string>(["eng"]);
  for (const hint of hints) {
    const code = languageMap[hint.toLowerCase()];
    if (code) codes.add(code);
  }
  return [...codes].slice(0, 2).join("+");
}

export const tesseractOcrProvider: OcrProvider = {
  name: "tesseract",
  async extractText(input) {
    if (!input.mimeType.startsWith("image/")) {
      return {
        text: "",
        confidence: 0,
        pages: [],
        warning: `Tesseract provider expects an image buffer, received ${input.mimeType}.`,
      };
    }

    const result = await recognize(input.buffer, tesseractLanguages(input.languageHints));
    const text = result.data.text.trim();
    const confidence = Number(((result.data.confidence ?? 0) / 100).toFixed(2));

    return {
      text,
      confidence,
      pages: [{ pageNumber: 1, text, confidence }],
    };
  },
};
