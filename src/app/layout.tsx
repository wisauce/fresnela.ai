import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RDTII Regulatory Evidence Workspace",
  description: "AI-powered regulatory analysis tool for the Regional Digital Trade Integration Index",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface-50 antialiased">
        {children}
      </body>
    </html>
  );
}
