import "server-only";

import { noneOcrProvider } from "./none";
import { tesseractOcrProvider } from "./tesseract";

export function getOcrProvider() {
  const provider = (process.env.OCR_PROVIDER || "none").toLowerCase();
  if (provider === "tesseract") return tesseractOcrProvider;
  return noneOcrProvider;
}
