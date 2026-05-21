import "server-only";

export type OcrPage = {
  pageNumber: number;
  text: string;
  confidence: number;
};

export type OcrResult = {
  text: string;
  confidence: number;
  pages: OcrPage[];
  warning?: string;
};

export type OcrProvider = {
  name: "none" | "tesseract";
  extractText(input: {
    buffer: Buffer;
    mimeType: string;
    languageHints: string[];
  }): Promise<OcrResult>;
};

export const emptyOcrResult: OcrResult = {
  text: "",
  confidence: 0,
  pages: [],
};
