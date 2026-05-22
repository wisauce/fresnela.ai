export interface WorkspaceDocument {
  id: string;
  title: string;
  sourceUrl: string;
  domain: string;
  type: "scraped" | "uploaded";
  status: "scraping" | "extracting" | "ready" | "failed";
  language: string;
  extractedText: string;
  paragraphCount: number;
  confidence: number;
  addedAt: string;
  fileSize?: string;
}

export interface ScrapeTarget {
  id: string;
  url: string;
  domain: string;
  title: string;
  snippet: string;
  confidence: number;
  relevanceTags: string[];
}

// Pre-populated documents for Indonesia workspace
export const indonesiaDocuments: WorkspaceDocument[] = [
  {
    id: "doc-1",
    title: "GR No. 71/2019 - Electronic System and Transaction Provision",
    sourceUrl: "https://jdih.kominfo.go.id/produk_hukum/view/id/695",
    domain: "jdih.kominfo.go.id",
    type: "scraped",
    status: "ready",
    language: "Indonesian",
    extractedText: `GOVERNMENT REGULATION OF THE REPUBLIC OF INDONESIA NUMBER 71 OF 2019
ON THE PROVISION OF ELECTRONIC SYSTEM AND TRANSACTION

Article 9
(1) Electronic System Operators for public service must place their data centers and disaster recovery centers within the territory of the Republic of Indonesia.
(2) Electronic System Operators that process personal data must conduct data processing within the territory of the Republic of Indonesia.

Article 15
(1) Electronic System Operators must provide access to Electronic Systems and Electronic Data for supervision and law enforcement.
(3) A copy of the data must be accessible within the territory of Indonesia.

Article 16
(1) Electronic System Operators must retain electronic transaction data for a minimum period of 5 years.

Article 20
(1) Transfer of personal data to outside Indonesia shall be carried out in coordination with the Minister and based on applicable laws.`,
    paragraphCount: 12,
    confidence: 0.97,
    addedAt: "2026-01-08 09:15",
  },
  {
    id: "doc-2",
    title: "UU No. 27/2022 - Personal Data Protection Law",
    sourceUrl: "https://jdih.kominfo.go.id/produk_hukum/view/id/850",
    domain: "jdih.kominfo.go.id",
    type: "scraped",
    status: "ready",
    language: "Indonesian",
    extractedText: `LAW OF THE REPUBLIC OF INDONESIA NUMBER 27 OF 2022 ON PERSONAL DATA PROTECTION

Article 56
(1) Transfer of Personal Data outside Indonesia may be carried out if the destination country has equivalent or higher protection level.
(2) Transfer may also be based on agreement between governments or binding corporate rules.

Article 53
(1) The Personal Data Controller and Processor must appoint a Data Protection Officer.

Article 54
The Controller must conduct a Data Protection Impact Assessment for high-risk processing.`,
    paragraphCount: 18,
    confidence: 0.95,
    addedAt: "2026-01-08 09:20",
  },
];

// Simulated scrape results that will be returned after scraping
export const scrapeResults: Record<string, { title: string; extractedText: string; paragraphCount: number; confidence: number; language: string }> = {
  "https://jdih.kominfo.go.id/produk_hukum/view/id/742": {
    title: "MCI Regulation No. 5/2020 - Private Electronic System Operators",
    extractedText: `REGULATION OF THE MINISTER OF COMMUNICATION AND INFORMATICS NUMBER 5 OF 2020

Article 21
(1) Private Scope Electronic System Operators must place their data centers within the territory of Indonesia.
(2) If unable to place locally, must ensure access to data for supervision and ability to process within Indonesia.

Article 22
(1) Must maintain at least one local server within Indonesia for data accessibility and law enforcement cooperation.`,
    paragraphCount: 8,
    confidence: 0.91,
    language: "Indonesian",
  },
  "https://rcepsec.org/legal-text/": {
    title: "RCEP Agreement - Chapter 12: Electronic Commerce",
    extractedText: `REGIONAL COMPREHENSIVE ECONOMIC PARTNERSHIP AGREEMENT - CHAPTER 12

Article 12.15: Cross-Border Transfer of Information by Electronic Means
2. A Party shall not prevent cross-border transfer of information by electronic means where such activity is for the conduct of the business of a covered person.
3. Nothing in this Article shall prevent a Party from adopting measures to achieve a legitimate public policy objective, provided the measure is not arbitrary discrimination.`,
    paragraphCount: 6,
    confidence: 0.99,
    language: "English",
  },
  "https://peraturan.bpk.go.id/Details/234567": {
    title: "Law No. 1/2024 - ITE Second Amendment",
    extractedText: `LAW NUMBER 1 OF 2024 ON THE SECOND AMENDMENT TO LAW NUMBER 11 OF 2008

Article 31
(2) Interception provisions shall not apply to wiretapping carried out in the framework of law enforcement at the request of the police or prosecutor's office.

Article 40
(1) The Government shall protect the public interest from misuse of Electronic Information.
(2) The Government may terminate access to Electronic Information with unlawful content.`,
    paragraphCount: 9,
    confidence: 0.93,
    language: "Indonesian",
  },
  "default": {
    title: "Regulatory Document",
    extractedText: "Regulatory text extracted from source. Contains provisions related to data governance, electronic systems, and cross-border data transfer requirements.",
    paragraphCount: 5,
    confidence: 0.75,
    language: "Indonesian",
  },
};

// Suggested URLs for scraping (shown as suggestions in the UI)
export const suggestedScrapeTargets: ScrapeTarget[] = [
  {
    id: "target-1",
    url: "https://jdih.kominfo.go.id/produk_hukum/view/id/742",
    domain: "jdih.kominfo.go.id",
    title: "MCI Regulation No. 5/2020 - Private ESO Requirements",
    snippet: "Implementing regulation extending infrastructure and data center requirements to private scope electronic system operators.",
    confidence: 0.88,
    relevanceTags: ["data_localization", "infrastructure"],
  },
  {
    id: "target-2",
    url: "https://rcepsec.org/legal-text/",
    domain: "rcepsec.org",
    title: "RCEP Agreement - Chapter 12: Electronic Commerce",
    snippet: "Regional trade agreement with binding commitments on cross-border data flows.",
    confidence: 0.92,
    relevanceTags: ["cross_border_transfer", "trade_agreement"],
  },
  {
    id: "target-3",
    url: "https://peraturan.bpk.go.id/Details/234567",
    domain: "peraturan.bpk.go.id",
    title: "Law No. 1/2024 - ITE Second Amendment",
    snippet: "Cybersecurity provisions and government access to electronic data.",
    confidence: 0.85,
    relevanceTags: ["cybersecurity", "government_access"],
  },
  {
    id: "target-4",
    url: "https://jdih.kominfo.go.id/produk_hukum/view/id/920",
    domain: "jdih.kominfo.go.id",
    title: "GR No. 17/2025 - Child Protection in Electronic Systems",
    snippet: "DPIA requirements for child data processing and verifiable parental consent obligations.",
    confidence: 0.82,
    relevanceTags: ["dpo_dpia", "data_protection"],
  },
  {
    id: "target-5",
    url: "https://bssn.go.id/kebijakan/peraturan-bssn",
    domain: "bssn.go.id",
    title: "BSSN Regulation on Critical Infrastructure Protection",
    snippet: "National cybersecurity agency regulation on critical information infrastructure protection.",
    confidence: 0.78,
    relevanceTags: ["cybersecurity", "infrastructure"],
  },
];
