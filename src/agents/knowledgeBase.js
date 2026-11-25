// Financial regulatory knowledge base entries and search retrieval helpers.

export const STAKEHOLDER_ROLES = [
  {
    id: 'ciso',
    label: 'Chief Information Security Officer (CISO) & Security Lead',
    focus: 'PCI-DSS 4.0 HSM tokenization, zero-trust network boundaries, secrets rotation, and automated SAST/DAST CI/CD gates.'
  },
  {
    id: 'compliance',
    label: 'Head of Compliance & Financial Crime (AML/KYC Officer)',
    focus: 'RBI CSF/DLG compliance, GDPR cross-border data residency, SAR/STR automated filings, and sanctions screening.'
  },
  {
    id: 'architect',
    label: 'Core Banking & Enterprise Solution Architect',
    focus: 'ISO 20022 message orchestration, sub-50ms payment switch latency, active-active zero-loss failover, and legacy mainframe bridges.'
  },
  {
    id: 'cro',
    label: 'Chief Risk Officer & Treasury Risk Manager',
    focus: 'Basel III/IV capital adequacy, liquidity coverage ratio (LCR), counterparty credit limits, and real-time risk data aggregation.'
  },
  {
    id: 'product',
    label: 'Head of Digital Channels & Payments Product Lead',
    focus: 'Omnichannel customer experience, frictionless UPI/instant payment checkout, biometric authentication, and SLA monitoring.'
  },
  {
    id: 'audit',
    label: 'Financial Internal Auditor & Statutory Reporting Lead',
    focus: 'SOX 404 segregation of duties (SoD), immutable audit ledger, general ledger reconciliation, and statutory regulatory filings.'
  }
];

export const FINANCIAL_KNOWLEDGE_BASE = [
  {
    id: 'KB-PCIDSS-01',
    standard: 'PCI-DSS v4.0',
    clause: 'Requirements 3.4, 3.5 & 4.2',
    version: 'v4.0 (2024)',
    jurisdiction: 'Global Payment Card Industry Standard',
    effectiveDate: '2024-03-31',
    category: 'Cardholder Data Security & Encryption',
    title: 'Primary Account Number (PAN) Encryption & Key Management in HSM',
    requirement: 'Primary Account Numbers (PANs) must be rendered unreadable using strong cryptography (AES-256-GCM or format-preserving tokenization) at rest and TLS 1.3 in transit. Cryptographic keys must be stored in FIPS 140-2 Level 3 Hardware Security Modules (HSMs) with automated dual-control rotation. Storage of sensitive authentication data (CAV2/CVC2/CVV2/PIN blocks) after transaction authorization is strictly prohibited.',
    keywords: ['pci', 'card', 'cards', 'pan', 'cvv', 'encryption', 'aes', 'hsm', 'tokenization', 'payment', 'gateway', 'security', 'vault', 'checkout']
  },
  {
    id: 'KB-RBI-CSF-01',
    standard: 'RBI Cyber Security Framework & DLG 2023',
    clause: 'Annex 1 (Cyber Resilience) & DLG Sec. 4-6',
    version: '2023.2',
    jurisdiction: 'India (Reserve Bank of India)',
    effectiveDate: '2023-04-01',
    category: 'Regulatory Banking Compliance & Data Localization',
    title: 'Real-Time Fraud Monitoring, DLA/LSP Governance & Domestic Data Localization',
    requirement: 'Regulated entities must implement real-time transaction monitoring and anomaly detection to identify suspicious velocity patterns before settlement. All digital lending, borrower data, and payment transaction logs must reside exclusively on servers physically located within India. Direct digital disbursement must occur without pass-through pooling accounts of third-party loan service providers (LSPs).',
    keywords: ['rbi', 'fraud', 'lending', 'loan', 'dla', 'lsp', 'india', 'localization', 'settlement', 'monitoring', 'bank', 'banking', 'compliance', 'audit']
  },
  {
    id: 'KB-GDPR-01',
    standard: 'GDPR / Financial Data Privacy Directive',
    clause: 'Articles 17, 25 & 32 (Privacy by Design)',
    version: 'EU 2016/679',
    jurisdiction: 'European Union & Global Financial Cross-Border',
    effectiveDate: '2018-05-25',
    category: 'Data Privacy & Sovereignty',
    title: 'Financial Data Sovereignty, Explicit Consent & Right to Erasure with Statutory Retention Exceptions',
    requirement: 'Customer personal data and credit profiles require granular, verifiable digital consent before cross-border transmission or analytics sharing. Systems must support the Right to Erasure (Article 17) while maintaining deterministic cryptographic retention overrides for statutory anti-money laundering (AML) and tax reporting records mandated by law for 5 to 10 years.',
    keywords: ['gdpr', 'privacy', 'consent', 'sovereignty', 'erasure', 'retention', 'customer', 'data', 'onboarding', 'kyc', 'cross-border']
  },
  {
    id: 'KB-BASEL-01',
    standard: 'Basel III / BCBS 239 Framework',
    clause: 'Principles 2, 3 & 6 (Risk Data Aggregation)',
    version: 'Basel III/IV',
    jurisdiction: 'Bank for International Settlements (BIS) / Global Central Banks',
    effectiveDate: '2023-01-01',
    category: 'Treasury, Capital & Risk Governance',
    title: 'Real-Time Risk Data Aggregation, Liquidity Coverage Ratio (LCR) & Stress Testing',
    requirement: 'Financial institutions must aggregate enterprise-wide credit, counterparty, and market risk exposures with accuracy, completeness, and timeliness. Systems must compute intraday Liquidity Coverage Ratios (LCR >= 100%) and Net Stable Funding Ratios (NSFR), enabling automated stress-testing simulation runs across stress scenarios within 15 minutes of market shocks.',
    keywords: ['basel', 'treasury', 'liquidity', 'lcr', 'risk', 'capital', 'stress', 'counterparty', 'credit', 'exposure', 'bank', 'portfolio']
  },
  {
    id: 'KB-SOX-01',
    standard: 'Sarbanes-Oxley (SOX) Act',
    clause: 'Section 404 (Internal Financial Controls)',
    version: 'Public Law 107-204',
    jurisdiction: 'US Securities & Exchange Commission (SEC)',
    effectiveDate: '2023-01-01',
    category: 'Financial Reporting Integrity & Auditability',
    title: 'Segregation of Duties (SoD), Dual Approval & Immutable General Ledger Audit Trails',
    requirement: 'Enforce strict Segregation of Duties (SoD) ensuring no single individual can author, approve, and execute a financial ledger adjustment or disbursement. All balance sheet changes, journal entries, and reconciliation overrides must generate cryptographically signed, append-only audit entries containing actor identity, timestamp, before/after values, and supervisory sign-off.',
    keywords: ['sox', 'audit', 'ledger', 'reconciliation', 'journal', 'approval', 'segregation', 'sod', 'internal', 'financial', 'reporting', 'accounting']
  },
  {
    id: 'KB-ISO20022-01',
    standard: 'ISO 20022 Financial Services Messaging',
    clause: 'pacs.008 (Payment Clearing) & camt.053 (Cash Management)',
    version: '2023 MX Spec',
    jurisdiction: 'SWIFT & Global Interbank Clearing Networks',
    effectiveDate: '2023-11-20',
    category: 'Interoperability & Clearing Rails',
    title: 'Standardized End-to-End Interbank Clearing & Payment Rail Orchestration',
    requirement: 'Core banking and payment switches must format, validate, and parse XML/JSON financial messages conforming strictly to ISO 20022 syntax (e.g., pacs.008 customer credit transfers, pacs.002 payment status reports, camt.053 bank statements). Message processing must guarantee idempotency and end-to-end UETR tracking across SWIFT, FedNow, and domestic instant payment rails.',
    keywords: ['iso20022', 'iso', 'swift', 'pacs', 'clearing', 'settlement', 'payment', 'switch', 'interbank', 'api', 'interoperability', 'wire']
  },
  {
    id: 'KB-SEBI-01',
    standard: 'SEBI / SEC Algorithmic Trading & System Audit Guidelines',
    clause: 'Cybersecurity & Algo Risk Framework Cir. 2023/88',
    version: '2023.1',
    jurisdiction: 'Securities Regulators (SEBI / SEC / FINRA)',
    effectiveDate: '2023-09-01',
    category: 'Market Infrastructure & Algorithmic Surveillance',
    title: 'High-Frequency Order Rate Limiting, Pre-Trade Risk Controls & Drop-Copy Clock Synchronization',
    requirement: 'Algorithmic trading platforms, brokerage OMS/EMS, and market-making engines must execute deterministic pre-trade risk controls (order value ceiling, price bands, cumulative gross exposure) in under 1 millisecond. Systems must maintain nanosecond-accurate PTP clock synchronization (IEEE 1588) and stream real-time drop-copy audit feeds to independent regulatory surveillance modules.',
    keywords: ['trading', 'algo', 'algorithmic', 'brokerage', 'market', 'exchange', 'sebi', 'sec', 'finra', 'order', 'risk', 'surveillance', 'equity']
  },
  {
    id: 'KB-ISO25010-01',
    standard: 'ISO/IEC 25010 & Core Banking High Availability Standard',
    clause: 'Reliability & Fault Tolerance Clauses 4.2 & 4.3',
    version: '2023 Standard',
    jurisdiction: 'International Software Engineering Baseline',
    effectiveDate: '2023-11-01',
    category: 'System Availability & Performance Engineering',
    title: 'Mission-Critical Banking Availability (99.999%), Sub-50ms Payment Authorization & Active-Active Failover',
    requirement: 'Core banking, transaction processing engines, and payment gateways must deliver >= 99.999% system availability (under 5.26 minutes of unscheduled downtime annually). Systems must enforce active-active multi-region synchronization with RPO = 0 (zero transaction data loss), RTO < 30 seconds, and sub-50ms P99 payment authorization latency at peak concurrency.',
    keywords: ['uptime', 'availability', 'failover', 'latency', 'performance', 'sla', 'rto', 'rpo', 'active-active', 'high-availability', 'throughput', 'tps']
  }
];

// Scores regulatory clauses against query tokens and returns top matching citations
export function retrieveFinancialContext(queryText, clarificationAnswers = {}, topK = 5) {
  const combined = [
    queryText || '',
    ...Object.values(clarificationAnswers || {})
  ].join(' ').toLowerCase();

  const tokens = new Set(combined.match(/[a-z0-9-]+/g) || []);

  const scored = FINANCIAL_KNOWLEDGE_BASE.map((item) => {
    let hits = 0;
    const matchedTerms = [];

    for (const kw of item.keywords) {
      if (tokens.has(kw) || combined.includes(kw)) {
        hits += kw.length > 4 ? 2 : 1;
        matchedTerms.push(kw);
      }
    }

    // Baseline boost for universal PCI-DSS and RBI/GDPR financial rules
    const baseScore = item.id === 'KB-PCIDSS-01' || item.id === 'KB-RBI-CSF-01' ? 2 : 0;
    const rawScore = hits + baseScore;
    const confidence = Math.min(0.98, Number((0.70 + Math.min(rawScore, 15) * 0.02).toFixed(2)));

    return {
      ...item,
      rawScore,
      confidence,
      matchedTerms: [...new Set(matchedTerms)].slice(0, 5),
      citation: `[${item.id} | ${item.standard} ${item.clause} (${item.version})]`
    };
  });

  return scored
    .filter((item) => item.rawScore > 0)
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, topK);
}

