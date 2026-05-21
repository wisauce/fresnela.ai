import "server-only";

import { emptyOcrResult, type OcrProvider } from "./provider";

export const noneOcrProvider: OcrProvider = {
  name: "none",
  async extractText() {
    return {
      ...emptyOcrResult,
      warning: "OCR_PROVIDER is none.",
    };
  },
};
