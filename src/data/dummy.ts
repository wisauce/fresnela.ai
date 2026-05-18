// ============ TYPE DEFINITIONS ============

export interface SourceDocument {
  id: string;
  title: string;
  titleOriginal?: string;
  type: "base" | "amendment" | "implementing_regulation" | "court_decision" | "treaty";
  country: string;
  dateEnacted: string;
  dateEffective: string;
  sourceUrl: string;
  language: string;
  translationStatus: "original" | "translated" | "pending";
  extractionConfidence: number;
  fullText: string; // The raw text of this source document
}

export interface ConsolidatedParagraph {
  id: string;
  text: string;
  sourceDocumentId: string;
  sourceArticle: string; // e.g. "Article 9(2)"
  effectiveFrom: string;
  effectiveUntil?: string;
  isAmended: boolean;
  amendedBy?: string;
  linkedIndicators: string[];
}

export interface ConsolidatedSection {
  id: string;
  heading: string;
  description?: string;
  paragraphs: ConsolidatedParagraph[];
}

export interface MeasureVersion {
  id: string;
  date: string;
  label: string;
  description: string;
  sourceDocumentId: string;
  changeType: "enacted" | "amended" | "supplemented";
}

export interface ConsolidatedMeasure {
  id: string;
  country: string;
  countryFlag: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  versions: MeasureVersion[];
  sourceDocuments: SourceDocument[];
  sections: ConsolidatedSection[];
}

export interface LinkedEvidence {
  paragraphId: string;
  sourceDocumentId: string;
  documentTitle: string;
  article: string;
  excerpt: string;
  confidence: number;
}

export interface IndicatorScore {
  id: string;
  pillarId: string;
  name: string;
  weight: number;
  score: number;
  evidence: LinkedEvidence[];
  scoringRule: string;
  matchedCriteria: string[];
  scoredBy: string;
  scoredDate: string;
  lastVerified: string;
}

export interface PillarData {
  id: string;
  number: number;
  name: string;
  weightedScore: number;
  indicators: IndicatorScore[];
}

export interface CountryData {
  id: string;
  name: string;
  flag: string;
  overallScore: number;
  asiaPacificAvgDiff: number;
  subregionalAvgDiff: number;
  pillars: PillarData[];
}

export interface RegulationAlert {
  id: string;
  title: string;
  titleOriginal?: string;
  country: string;
  publishedDate: string;
  language: string;
  status: "new" | "reviewing" | "reviewed";
  impactedIndicators: {
    pillarId: string;
    pillarName: string;
    indicatorId: string;
    indicatorName: string;
    currentScore: number;
    expectedChange: "no_change" | "increase" | "decrease" | "verify";
    reason: string;
  }[];
}

// ============ SOURCE DOCUMENTS ============

export const sourceDocuments: SourceDocument[] = [
  {
    id: "src-1",
    title: "Government Regulation No. 71/2019 on Electronic System and Transaction",
    titleOriginal: "PP No. 71 Tahun 2019 tentang PSTE",
    type: "base",
    country: "Indonesia",
    dateEnacted: "2019-10-10",
    dateEffective: "2019-10-10",
    sourceUrl: "https://jdih.kominfo.go.id/produk_hukum/view/id/695",
    language: "Indonesian",
    translationStatus: "translated",
    extractionConfidence: 0.97,
    fullText: `GOVERNMENT REGULATION OF THE REPUBLIC OF INDONESIA NUMBER 71 OF 2019
ON THE PROVISION OF ELECTRONIC SYSTEM AND TRANSACTION

CHAPTER IV - ELECTRONIC SYSTEM OPERATION

Article 9
(1) Electronic System Operators for public service must place their data centers and disaster recovery centers within the territory of the Republic of Indonesia for the purposes of law enforcement, protection, and enforcement of sovereignty over data of Indonesian citizens.
(2) Electronic System Operators that process personal data must conduct data processing within the territory of the Republic of Indonesia.
(3) The provisions regarding the placement of data centers and disaster recovery centers as referred to in paragraph (1) shall be further regulated by a Government Regulation.

Article 15
(1) Electronic System Operators that operate in the territory of Indonesia must provide access to Electronic Systems and Electronic Data for the purposes of supervision and law enforcement.
(2) In the event that the Electronic System Operator stores data outside the territory of Indonesia, the Electronic System Operator must still provide access as referred to in paragraph (1).
(3) A copy of the data managed, processed, and/or stored by the Electronic System Operator must be accessible within the territory of Indonesia.

Article 16
(1) Electronic System Operators must retain electronic transaction data for a minimum period of 5 (five) years from the date of the transaction.
(2) The retained data must be made available upon request by authorized law enforcement agencies in accordance with applicable laws and regulations.

Article 20
(1) The transfer of personal data managed by Electronic System Operators in the territory of Indonesia to outside the territory of Indonesia shall be carried out:
  a. in coordination with the Minister or the authorized institution;
  b. based on the provisions of laws and regulations; and
  c. after coordination with the relevant supervisory authority.
(2) The coordination as referred to in paragraph (1) letter a shall be carried out to ensure the protection of personal data in the destination country.`,
  },
  {
    id: "src-2",
    title: "Personal Data Protection Law No. 27/2022",
    titleOriginal: "UU No. 27 Tahun 2022 tentang PDP",
    type: "base",
    country: "Indonesia",
    dateEnacted: "2022-10-17",
    dateEffective: "2024-10-17",
    sourceUrl: "https://jdih.kominfo.go.id/produk_hukum/view/id/850",
    language: "Indonesian",
    translationStatus: "translated",
    extractionConfidence: 0.95,
    fullText: `LAW OF THE REPUBLIC OF INDONESIA NUMBER 27 OF 2022
ON PERSONAL DATA PROTECTION

CHAPTER IV - TRANSFER OF PERSONAL DATA

Article 56
(1) The transfer of Personal Data to outside the territory of the Republic of Indonesia may be carried out if:
  a. the country of destination of the transfer of Personal Data has an equivalent or higher level of Personal Data Protection than that stipulated in this Law;
  b. there is adequate and binding Personal Data Protection; or
  c. the consent of the Personal Data Subject has been obtained.
(2) In the event that the provisions as referred to in paragraph (1) letter a cannot be fulfilled, the transfer of Personal Data to outside the territory of the Republic of Indonesia may be carried out based on:
  a. an agreement between the Government of the Republic of Indonesia and the government of the destination country; or
  b. a binding corporate agreement.

CHAPTER VIII - DATA PROTECTION OFFICER

Article 53
(1) The Personal Data Controller and the Personal Data Processor must appoint a Data Protection Officer.
(2) The Data Protection Officer shall be appointed based on professional quality, knowledge of Personal Data Protection law and practice, and the ability to fulfill duties.

Article 54
The Personal Data Controller must conduct a Data Protection Impact Assessment in the event that the processing of Personal Data has a high risk to the Personal Data Subject.`,
  },
  {
    id: "src-3",
    title: "MCI Regulation No. 5/2020 on Private Electronic System Operators",
    titleOriginal: "Permenkominfo No. 5 Tahun 2020",
    type: "implementing_regulation",
    country: "Indonesia",
    dateEnacted: "2020-11-24",
    dateEffective: "2020-11-24",
    sourceUrl: "https://jdih.kominfo.go.id/produk_hukum/view/id/742",
    language: "Indonesian",
    translationStatus: "translated",
    extractionConfidence: 0.91,
    fullText: `REGULATION OF THE MINISTER OF COMMUNICATION AND INFORMATICS NUMBER 5 OF 2020
ON PRIVATE SCOPE ELECTRONIC SYSTEM OPERATORS

Article 21
(1) Private Scope Electronic System Operators that provide services to users in the territory of Indonesia must place their data centers and/or disaster recovery centers within the territory of Indonesia.
(2) In the event that the Private Scope Electronic System Operator cannot place data centers and/or disaster recovery centers within the territory of Indonesia, the Electronic System Operator must ensure:
  a. access to data for supervision purposes; and
  b. the ability to conduct data processing within the territory of Indonesia.

Article 22
(1) Private Scope Electronic System Operators must maintain at least one local server within the territory of Indonesia for the purpose of data accessibility and law enforcement cooperation.`,
  },
  {
    id: "src-4",
    title: "Law No. 1/2024 — ITE Second Amendment",
    titleOriginal: "UU No. 1 Tahun 2024 tentang Perubahan Kedua UU ITE",
    type: "amendment",
    country: "Indonesia",
    dateEnacted: "2024-01-02",
    dateEffective: "2024-01-02",
    sourceUrl: "https://jdih.kominfo.go.id/produk_hukum/view/id/900",
    language: "Indonesian",
    translationStatus: "translated",
    extractionConfidence: 0.93,
    fullText: `LAW OF THE REPUBLIC OF INDONESIA NUMBER 1 OF 2024
ON THE SECOND AMENDMENT TO LAW NUMBER 11 OF 2008 ON ELECTRONIC INFORMATION AND TRANSACTIONS

Article 31
(1) Any Person intentionally and without right or unlawfully performs interception or wiretapping of Electronic Information and/or Electronic Documents in a certain Computer and/or Electronic System belonging to another Person.
(2) The provisions as referred to in paragraph (1) shall not apply to interception or wiretapping carried out in the framework of law enforcement at the request of the police, prosecutor's office, or other institutions whose authority is stipulated by law.
(3) The provisions regarding the procedures for interception as referred to in paragraph (2) shall be regulated by Government Regulation.

Article 40
(1) The Government shall protect the public interest from any kind of disturbance as a result of misuse of Electronic Information and Electronic Transactions that disturb public order.
(2) The Government may terminate access and/or order Electronic System Operators to terminate access to Electronic Information and/or Electronic Documents that have unlawful content.`,
  },
  {
    id: "src-5",
    title: "RCEP Agreement — Chapter 12: Electronic Commerce",
    type: "treaty",
    country: "Indonesia",
    dateEnacted: "2022-01-01",
    dateEffective: "2023-01-02",
    sourceUrl: "https://rcepsec.org/legal-text/",
    language: "English",
    translationStatus: "original",
    extractionConfidence: 0.99,
    fullText: `REGIONAL COMPREHENSIVE ECONOMIC PARTNERSHIP AGREEMENT
CHAPTER 12 - ELECTRONIC COMMERCE

Article 12.15: Cross-Border Transfer of Information by Electronic Means

1. The Parties recognise that each Party may have its own regulatory requirements concerning the transfer of information by electronic means.

2. A Party shall not prevent cross-border transfer of information by electronic means where such activity is for the conduct of the business of a covered person.

3. Nothing in this Article shall prevent a Party from adopting or maintaining measures inconsistent with paragraph 2 to achieve a legitimate public policy objective, provided that the measure:
  (a) is not applied in a manner which would constitute a means of arbitrary or unjustifiable discrimination or a disguised restriction on trade; and
  (b) does not impose restrictions on transfers of information greater than are required to achieve the objective.`,
  },
  {
    id: "src-6",
    title: "GR No. 17/2025 on Child Protection in Electronic Systems",
    titleOriginal: "PP No. 17 Tahun 2025 tentang Pelindungan Anak dalam PSE",
    type: "amendment",
    country: "Indonesia",
    dateEnacted: "2025-03-10",
    dateEffective: "2025-03-10",
    sourceUrl: "https://jdih.kominfo.go.id/produk_hukum/view/id/920",
    language: "Indonesian",
    translationStatus: "translated",
    extractionConfidence: 0.89,
    fullText: `GOVERNMENT REGULATION OF THE REPUBLIC OF INDONESIA NUMBER 17 OF 2025
ON THE GOVERNANCE OF ELECTRONIC SYSTEM OPERATIONS FOR CHILD PROTECTION

Article 5
(1) Electronic System Operators that process data of children must conduct a Data Protection Impact Assessment prior to commencing data processing activities involving child users.
(2) Electronic System Operators must obtain verifiable parental consent before collecting, processing, or storing personal data of children under the age of 17.
(3) The Data Protection Impact Assessment as referred to in paragraph (1) must include an evaluation of the risks to the rights and freedoms of the child.`,
  },
];


// ============ ONE CONSOLIDATED MEASURE FOR INDONESIA (Pillar 6 & 7) ============

export const consolidatedMeasure: ConsolidatedMeasure = {
  id: "IDN-P6P7",
  country: "Indonesia",
  countryFlag: "🇮🇩",
  title: "Indonesia — Cross-border Data & Domestic Data Protection",
  subtitle: "Consolidated regulatory measure covering Pillar 6 (Cross-border Data Policies) and Pillar 7 (Domestic Data Protection & Privacy)",
  lastUpdated: "2026-01-10",
  versions: [
    { id: "v1", date: "2019-10-10", label: "GR 71/2019", description: "Base electronic system regulation with data localization mandates", sourceDocumentId: "src-1", changeType: "enacted" },
    { id: "v2", date: "2020-11-24", label: "MCI 5/2020", description: "Extended infrastructure requirements to private operators", sourceDocumentId: "src-3", changeType: "supplemented" },
    { id: "v3", date: "2022-10-17", label: "PDP Law 27/2022", description: "Comprehensive personal data protection framework", sourceDocumentId: "src-2", changeType: "enacted" },
    { id: "v4", date: "2023-01-02", label: "RCEP", description: "Binding commitment on cross-border data flows", sourceDocumentId: "src-5", changeType: "enacted" },
    { id: "v5", date: "2024-01-02", label: "ITE Amendment", description: "Cybersecurity and government access provisions", sourceDocumentId: "src-4", changeType: "amended" },
    { id: "v6", date: "2025-03-10", label: "GR 17/2025", description: "Child data protection DPIA requirements", sourceDocumentId: "src-6", changeType: "amended" },
  ],
  sourceDocuments: sourceDocuments,
  sections: [
    {
      id: "sec-ban-processing",
      heading: "Ban & Local Processing Requirements",
      description: "Regulations mandating that data processing occur within Indonesian territory",
      paragraphs: [
        {
          id: "p-1",
          text: "Electronic System Operators that process personal data must conduct data processing within the territory of the Republic of Indonesia.",
          sourceDocumentId: "src-1",
          sourceArticle: "GR 71/2019, Article 9(2)",
          effectiveFrom: "2019-10-10",
          isAmended: false,
          linkedIndicators: ["6.1"],
        },
        {
          id: "p-2",
          text: "In the event that the Private Scope Electronic System Operator cannot place data centers within the territory of Indonesia, the Electronic System Operator must ensure the ability to conduct data processing within the territory of Indonesia.",
          sourceDocumentId: "src-3",
          sourceArticle: "MCI 5/2020, Article 21(2)(b)",
          effectiveFrom: "2020-11-24",
          isAmended: false,
          linkedIndicators: ["6.1"],
        },
      ],
    },
    {
      id: "sec-local-storage",
      heading: "Local Storage Requirements",
      description: "Requirements to maintain copies of data within Indonesian territory",
      paragraphs: [
        {
          id: "p-3",
          text: "A copy of the data managed, processed, and/or stored by the Electronic System Operator must be accessible within the territory of Indonesia.",
          sourceDocumentId: "src-1",
          sourceArticle: "GR 71/2019, Article 15(3)",
          effectiveFrom: "2019-10-10",
          isAmended: false,
          linkedIndicators: ["6.2"],
        },
      ],
    },
    {
      id: "sec-infrastructure",
      heading: "Infrastructure Requirements",
      description: "Mandates to establish local data centers and physical infrastructure",
      paragraphs: [
        {
          id: "p-4",
          text: "Electronic System Operators for public service must place their data centers and disaster recovery centers within the territory of the Republic of Indonesia for the purposes of law enforcement, protection, and enforcement of sovereignty over data of Indonesian citizens.",
          sourceDocumentId: "src-1",
          sourceArticle: "GR 71/2019, Article 9(1)",
          effectiveFrom: "2019-10-10",
          isAmended: false,
          linkedIndicators: ["6.3"],
        },
        {
          id: "p-5",
          text: "Private Scope Electronic System Operators that provide services to users in the territory of Indonesia must place their data centers and/or disaster recovery centers within the territory of Indonesia.",
          sourceDocumentId: "src-3",
          sourceArticle: "MCI 5/2020, Article 21(1)",
          effectiveFrom: "2020-11-24",
          isAmended: false,
          linkedIndicators: ["6.3"],
        },
        {
          id: "p-6",
          text: "Private Scope Electronic System Operators must maintain at least one local server within the territory of Indonesia for the purpose of data accessibility and law enforcement cooperation.",
          sourceDocumentId: "src-3",
          sourceArticle: "MCI 5/2020, Article 22(1)",
          effectiveFrom: "2020-11-24",
          isAmended: false,
          linkedIndicators: ["6.3"],
        },
      ],
    },
    {
      id: "sec-conditional-flow",
      heading: "Conditional Flow Regimes",
      description: "Conditions that must be satisfied for cross-border data transfer",
      paragraphs: [
        {
          id: "p-7",
          text: "The transfer of personal data managed by Electronic System Operators in the territory of Indonesia to outside the territory of Indonesia shall be carried out: (a) in coordination with the Minister or the authorized institution; (b) based on the provisions of laws and regulations; and (c) after coordination with the relevant supervisory authority.",
          sourceDocumentId: "src-1",
          sourceArticle: "GR 71/2019, Article 20(1)",
          effectiveFrom: "2019-10-10",
          isAmended: false,
          linkedIndicators: ["6.4"],
        },
        {
          id: "p-8",
          text: "The transfer of Personal Data to outside the territory of the Republic of Indonesia may be carried out if: (a) the country of destination has an equivalent or higher level of Personal Data Protection than that stipulated in this Law; (b) there is adequate and binding Personal Data Protection; or (c) the consent of the Personal Data Subject has been obtained.",
          sourceDocumentId: "src-2",
          sourceArticle: "PDP Law 27/2022, Article 56(1)",
          effectiveFrom: "2024-10-17",
          isAmended: false,
          linkedIndicators: ["6.4"],
        },
        {
          id: "p-9",
          text: "In the event that the adequacy requirement cannot be fulfilled, the transfer may be carried out based on: (a) an agreement between the Government of Indonesia and the government of the destination country; or (b) a binding corporate agreement.",
          sourceDocumentId: "src-2",
          sourceArticle: "PDP Law 27/2022, Article 56(2)",
          effectiveFrom: "2024-10-17",
          isAmended: false,
          linkedIndicators: ["6.4"],
        },
      ],
    },
    {
      id: "sec-binding-commitments",
      heading: "Binding International Commitments on Data Transfer",
      description: "International agreements with enforceable data flow provisions",
      paragraphs: [
        {
          id: "p-10",
          text: "A Party shall not prevent cross-border transfer of information by electronic means where such activity is for the conduct of the business of a covered person.",
          sourceDocumentId: "src-5",
          sourceArticle: "RCEP, Article 12.15(2)",
          effectiveFrom: "2023-01-02",
          isAmended: false,
          linkedIndicators: ["6.5"],
        },
        {
          id: "p-11",
          text: "Nothing in this Article shall prevent a Party from adopting or maintaining measures inconsistent with paragraph 2 to achieve a legitimate public policy objective, provided that the measure is not applied in a manner which would constitute arbitrary or unjustifiable discrimination and does not impose restrictions greater than required to achieve the objective.",
          sourceDocumentId: "src-5",
          sourceArticle: "RCEP, Article 12.15(3)",
          effectiveFrom: "2023-01-02",
          isAmended: false,
          linkedIndicators: [],
        },
      ],
    },
    {
      id: "sec-data-protection-framework",
      heading: "Comprehensive Data Protection Framework",
      description: "Existence and scope of horizontal data protection legislation",
      paragraphs: [
        {
          id: "p-12",
          text: "Indonesia enacted Law No. 27 of 2022 on Personal Data Protection, a comprehensive horizontal framework applying across all sectors. The law provides rights of access, rectification, erasure, and data portability to data subjects, and establishes obligations for data controllers and processors.",
          sourceDocumentId: "src-2",
          sourceArticle: "PDP Law 27/2022, General",
          effectiveFrom: "2024-10-17",
          isAmended: false,
          linkedIndicators: ["7.1"],
        },
      ],
    },
    {
      id: "sec-cybersecurity",
      heading: "Cybersecurity Legal Framework",
      description: "Dedicated or non-dedicated cybersecurity legislation",
      paragraphs: [
        {
          id: "p-13",
          text: "The Government shall protect the public interest from any kind of disturbance as a result of misuse of Electronic Information and Electronic Transactions that disturb public order.",
          sourceDocumentId: "src-4",
          sourceArticle: "ITE Law 1/2024, Article 40(1)",
          effectiveFrom: "2024-01-02",
          isAmended: false,
          linkedIndicators: ["7.2"],
        },
        {
          id: "p-14",
          text: "The Government may terminate access and/or order Electronic System Operators to terminate access to Electronic Information and/or Electronic Documents that have unlawful content.",
          sourceDocumentId: "src-4",
          sourceArticle: "ITE Law 1/2024, Article 40(2)",
          effectiveFrom: "2024-01-02",
          isAmended: false,
          linkedIndicators: ["7.2"],
        },
      ],
    },
    {
      id: "sec-data-retention",
      heading: "Data Retention Requirements",
      description: "Minimum periods for which data must be retained",
      paragraphs: [
        {
          id: "p-15",
          text: "Electronic System Operators must retain electronic transaction data for a minimum period of 5 (five) years from the date of the transaction.",
          sourceDocumentId: "src-1",
          sourceArticle: "GR 71/2019, Article 16(1)",
          effectiveFrom: "2019-10-10",
          isAmended: false,
          linkedIndicators: ["7.3"],
        },
      ],
    },
    {
      id: "sec-dpo-dpia",
      heading: "DPO & DPIA Requirements",
      description: "Obligations to appoint Data Protection Officers and conduct impact assessments",
      paragraphs: [
        {
          id: "p-16",
          text: "The Personal Data Controller and the Personal Data Processor must appoint a Data Protection Officer.",
          sourceDocumentId: "src-2",
          sourceArticle: "PDP Law 27/2022, Article 53(1)",
          effectiveFrom: "2024-10-17",
          isAmended: false,
          linkedIndicators: ["7.4"],
        },
        {
          id: "p-17",
          text: "The Personal Data Controller must conduct a Data Protection Impact Assessment in the event that the processing of Personal Data has a high risk to the Personal Data Subject.",
          sourceDocumentId: "src-2",
          sourceArticle: "PDP Law 27/2022, Article 54",
          effectiveFrom: "2024-10-17",
          isAmended: false,
          linkedIndicators: ["7.4"],
        },
        {
          id: "p-18",
          text: "Electronic System Operators that process data of children must conduct a Data Protection Impact Assessment prior to commencing data processing activities involving child users.",
          sourceDocumentId: "src-6",
          sourceArticle: "GR 17/2025, Article 5(1)",
          effectiveFrom: "2025-03-10",
          isAmended: false,
          linkedIndicators: ["7.4"],
        },
        {
          id: "p-19",
          text: "Electronic System Operators must obtain verifiable parental consent before collecting, processing, or storing personal data of children under the age of 17.",
          sourceDocumentId: "src-6",
          sourceArticle: "GR 17/2025, Article 5(2)",
          effectiveFrom: "2025-03-10",
          isAmended: false,
          linkedIndicators: ["7.4"],
        },
      ],
    },
    {
      id: "sec-gov-access",
      heading: "Government Access to Personal Data",
      description: "Provisions allowing government access without independent judicial oversight",
      paragraphs: [
        {
          id: "p-20",
          text: "Electronic System Operators that operate in the territory of Indonesia must provide access to Electronic Systems and Electronic Data for the purposes of supervision and law enforcement.",
          sourceDocumentId: "src-1",
          sourceArticle: "GR 71/2019, Article 15(1)",
          effectiveFrom: "2019-10-10",
          isAmended: false,
          linkedIndicators: ["7.5"],
        },
        {
          id: "p-21",
          text: "The retained data must be made available upon request by authorized law enforcement agencies in accordance with applicable laws and regulations.",
          sourceDocumentId: "src-1",
          sourceArticle: "GR 71/2019, Article 16(2)",
          effectiveFrom: "2019-10-10",
          isAmended: false,
          linkedIndicators: ["7.5"],
        },
        {
          id: "p-22",
          text: "The provisions on interception shall not apply to interception or wiretapping carried out in the framework of law enforcement at the request of the police, prosecutor's office, or other institutions whose authority is stipulated by law.",
          sourceDocumentId: "src-4",
          sourceArticle: "ITE Law 1/2024, Article 31(2)",
          effectiveFrom: "2024-01-02",
          isAmended: false,
          linkedIndicators: ["7.5"],
        },
      ],
    },
  ],
};


// ============ COUNTRY & PILLAR SCORING DATA ============

export const indonesiaData: CountryData = {
  id: "IDN",
  name: "Indonesia",
  flag: "🇮🇩",
  overallScore: 0.57,
  asiaPacificAvgDiff: 56,
  subregionalAvgDiff: 40,
  pillars: [
    {
      id: "pillar-6", number: 6, name: "Cross-border Data Policies", weightedScore: 0.67,
      indicators: [
        { id: "6.1", pillarId: "pillar-6", name: "Ban & Local Processing Requirements", weight: 38, score: 1.0,
          evidence: [
            { paragraphId: "p-1", sourceDocumentId: "src-1", documentTitle: "GR 71/2019", article: "Article 9(2)", excerpt: "...must conduct data processing within the territory of the Republic of Indonesia.", confidence: 0.97 },
            { paragraphId: "p-2", sourceDocumentId: "src-3", documentTitle: "MCI 5/2020", article: "Article 21(2)(b)", excerpt: "...must ensure the ability to conduct data processing within the territory of Indonesia.", confidence: 0.91 },
          ],
          scoringRule: "Score is 1 when a local processing requirement covers personal data or applies horizontally across sectors.",
          matchedCriteria: ["Applies to personal data", "Applies horizontally (not sector-specific)"],
          scoredBy: "Dr. Natnicha Sutthivana", scoredDate: "2025-03-15", lastVerified: "2026-01-10",
        },
        { id: "6.2", pillarId: "pillar-6", name: "Local Storage Requirements", weight: 12, score: 0.5,
          evidence: [
            { paragraphId: "p-3", sourceDocumentId: "src-1", documentTitle: "GR 71/2019", article: "Article 15(3)", excerpt: "A copy of the data...must be accessible within the territory of Indonesia.", confidence: 0.97 },
          ],
          scoringRule: "Score is 0.5 when a local storage requirement applies to non-personal data or a specific set of data.",
          matchedCriteria: ["Applies to electronic system data (specific set)"],
          scoredBy: "Dr. Natnicha Sutthivana", scoredDate: "2025-03-15", lastVerified: "2026-01-10",
        },
        { id: "6.3", pillarId: "pillar-6", name: "Infrastructure Requirements", weight: 31, score: 1.0,
          evidence: [
            { paragraphId: "p-4", sourceDocumentId: "src-1", documentTitle: "GR 71/2019", article: "Article 9(1)", excerpt: "...must place their data centers and disaster recovery centers within the territory...", confidence: 0.97 },
            { paragraphId: "p-5", sourceDocumentId: "src-3", documentTitle: "MCI 5/2020", article: "Article 21(1)", excerpt: "Private Scope ESOs...must place their data centers within the territory of Indonesia.", confidence: 0.91 },
          ],
          scoringRule: "Score is 1 when there is at least one infrastructure requirement.",
          matchedCriteria: ["Mandates local data centers", "Applies to both public and private operators"],
          scoredBy: "Dr. Natnicha Sutthivana", scoredDate: "2025-03-15", lastVerified: "2026-01-10",
        },
        { id: "6.4", pillarId: "pillar-6", name: "Conditional Flow Regimes", weight: 12, score: 1.0,
          evidence: [
            { paragraphId: "p-8", sourceDocumentId: "src-2", documentTitle: "PDP Law 27/2022", article: "Article 56(1)", excerpt: "Transfer may be carried out if destination country has equivalent or higher level of protection...", confidence: 0.95 },
            { paragraphId: "p-7", sourceDocumentId: "src-1", documentTitle: "GR 71/2019", article: "Article 20(1)", excerpt: "Transfer shall be carried out in coordination with the Minister...", confidence: 0.97 },
          ],
          scoringRule: "Score is 1 if the regime covers personal data.",
          matchedCriteria: ["Covers personal data transfers", "Requires adequacy assessment", "Requires government coordination"],
          scoredBy: "Dr. Natnicha Sutthivana", scoredDate: "2025-03-15", lastVerified: "2026-01-10",
        },
        { id: "6.5", pillarId: "pillar-6", name: "Not in Binding Commitments", weight: 8, score: 0.0,
          evidence: [
            { paragraphId: "p-10", sourceDocumentId: "src-5", documentTitle: "RCEP", article: "Article 12.15(2)", excerpt: "A Party shall not prevent cross-border transfer of information by electronic means...", confidence: 0.99 },
          ],
          scoringRule: "Score is 0 if an economy signs at least one binding agreement on data flows.",
          matchedCriteria: ["Indonesia is party to RCEP (binding commitment)"],
          scoredBy: "Dr. Natnicha Sutthivana", scoredDate: "2025-03-15", lastVerified: "2026-01-10",
        },
      ],
    },
    {
      id: "pillar-7", number: 7, name: "Domestic Data Protection & Privacy", weightedScore: 0.53,
      indicators: [
        { id: "7.1", pillarId: "pillar-7", name: "Lack of Data Protection Framework", weight: 31, score: 0.0,
          evidence: [
            { paragraphId: "p-12", sourceDocumentId: "src-2", documentTitle: "PDP Law 27/2022", article: "General", excerpt: "Comprehensive horizontal framework applying across all sectors.", confidence: 0.99 },
          ],
          scoringRule: "Score is 0 if there is a comprehensive data protection legal framework.",
          matchedCriteria: ["Comprehensive law exists (Law 27/2022)", "Applies horizontally"],
          scoredBy: "Juntong Hou", scoredDate: "2025-04-02", lastVerified: "2026-01-10",
        },
        { id: "7.2", pillarId: "pillar-7", name: "Lack of Cybersecurity Framework", weight: 31, score: 0.5,
          evidence: [
            { paragraphId: "p-13", sourceDocumentId: "src-4", documentTitle: "ITE Law 1/2024", article: "Article 40(1)", excerpt: "Government shall protect the public interest from misuse of Electronic Information...", confidence: 0.93 },
          ],
          scoringRule: "Score is 0.5 for non-dedicated or sectoral cybersecurity framework.",
          matchedCriteria: ["Non-dedicated framework (ITE Law)", "No standalone cybersecurity act"],
          scoredBy: "Juntong Hou", scoredDate: "2025-04-02", lastVerified: "2026-01-10",
        },
        { id: "7.3", pillarId: "pillar-7", name: "Minimum Data Retention Period", weight: 16, score: 1.0,
          evidence: [
            { paragraphId: "p-15", sourceDocumentId: "src-1", documentTitle: "GR 71/2019", article: "Article 16(1)", excerpt: "Must retain electronic transaction data for minimum 5 years.", confidence: 0.94 },
          ],
          scoringRule: "Score is 1 when minimum period of data retention is mandated.",
          matchedCriteria: ["5-year minimum retention period", "Applies to electronic transaction data"],
          scoredBy: "Juntong Hou", scoredDate: "2025-04-02", lastVerified: "2026-01-10",
        },
        { id: "7.4", pillarId: "pillar-7", name: "DPO/DPIA Requirements", weight: 6, score: 1.0,
          evidence: [
            { paragraphId: "p-16", sourceDocumentId: "src-2", documentTitle: "PDP Law 27/2022", article: "Article 53(1)", excerpt: "Must appoint a Data Protection Officer.", confidence: 0.95 },
            { paragraphId: "p-17", sourceDocumentId: "src-2", documentTitle: "PDP Law 27/2022", article: "Article 54", excerpt: "Must conduct DPIA when processing has high risk.", confidence: 0.95 },
          ],
          scoringRule: "Score is 1 if DPO or both DPO and DPIA required horizontally.",
          matchedCriteria: ["DPO required (Art 53)", "DPIA required (Art 54)", "Applies horizontally"],
          scoredBy: "Juntong Hou", scoredDate: "2025-04-02", lastVerified: "2026-01-10",
        },
        { id: "7.5", pillarId: "pillar-7", name: "Government Access to Personal Data", weight: 16, score: 1.0,
          evidence: [
            { paragraphId: "p-20", sourceDocumentId: "src-1", documentTitle: "GR 71/2019", article: "Article 15(1)", excerpt: "Must provide access to Electronic Systems for supervision and law enforcement.", confidence: 0.94 },
            { paragraphId: "p-22", sourceDocumentId: "src-4", documentTitle: "ITE Law 1/2024", article: "Article 31(2)", excerpt: "Interception at request of police or other institutions whose authority is stipulated by law.", confidence: 0.93 },
          ],
          scoringRule: "Score is 1 if Government can access personal data without independent judicial authorization.",
          matchedCriteria: ["No explicit judicial warrant requirement", "Broad institutional authority"],
          scoredBy: "Juntong Hou", scoredDate: "2025-04-02", lastVerified: "2026-01-10",
        },
      ],
    },
  ],
};

export const regulationAlerts: RegulationAlert[] = [
  {
    id: "alert-1", title: "GR No. 17/2025 on Child Protection in Electronic Systems",
    titleOriginal: "PP No. 17/2025 tentang Pelindungan Anak dalam PSE",
    country: "Indonesia", publishedDate: "2025-03-10", language: "Indonesian", status: "new",
    impactedIndicators: [
      { pillarId: "pillar-7", pillarName: "Domestic Data Protection & Privacy", indicatorId: "7.4", indicatorName: "DPO/DPIA Requirements", currentScore: 1.0, expectedChange: "no_change", reason: "Reinforces existing DPIA requirements for child data. Score already at maximum." },
    ],
  },
  {
    id: "alert-2", title: "Draft Regulation on Cross-Border Data Transfer Adequacy",
    titleOriginal: "Rancangan Peraturan Penilaian Kecukupan Transfer Data Lintas Batas",
    country: "Indonesia", publishedDate: "2025-05-01", language: "Indonesian", status: "reviewing",
    impactedIndicators: [
      { pillarId: "pillar-6", pillarName: "Cross-border Data Policies", indicatorId: "6.4", indicatorName: "Conditional Flow Regimes", currentScore: 1.0, expectedChange: "no_change", reason: "Formalizes adequacy assessment already in PDP Law Art. 56." },
      { pillarId: "pillar-6", pillarName: "Cross-border Data Policies", indicatorId: "6.1", indicatorName: "Ban & Local Processing", currentScore: 1.0, expectedChange: "verify", reason: "May introduce new processing conditions. Needs review." },
    ],
  },
  {
    id: "alert-3", title: "POJK No. 27/2024 on Digital Financial Assets",
    country: "Indonesia", publishedDate: "2024-11-15", language: "Indonesian", status: "reviewed",
    impactedIndicators: [
      { pillarId: "pillar-7", pillarName: "Domestic Data Protection & Privacy", indicatorId: "7.2", indicatorName: "Cybersecurity Framework", currentScore: 0.5, expectedChange: "no_change", reason: "Reinforces cybersecurity for digital finance. Not a dedicated comprehensive law." },
    ],
  },
];
