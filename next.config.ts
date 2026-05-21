import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "tesseract.js", "pdf-parse"],
};

export default nextConfig;
