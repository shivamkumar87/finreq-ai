// Generates clarification prompts for missing operational constraints.

export class ClarificationAgent {
  constructor() {
    this.name = 'Adaptive Clarification & Financial Interview Agent';
  }

  generateClarifications(scenarioText, stakeholderRole = 'ciso') {
    const textLower = (scenarioText || '').toLowerCase();
    const questions = [];

    if (!textLower.includes('tps') && !textLower.includes('transactions per second') && !textLower.includes('volume') && !textLower.includes('concurrent')) {
      questions.push({
        id: 'transaction_volume',
        topic: 'Peak Transaction Throughput & Concurrency (TPS)',
        question: 'What is the projected peak transaction volume and authorization concurrency for this financial platform?',
        options: [
          'Tier-1 National Clearing / Card Switch: 10,000+ TPS (Sub-50ms P99 latency, distributed event-sourcing)',
          'Retail Banking / Commercial Gateway: 1,000–5,000 TPS (Sub-200ms authorization latency)',
          'Corporate / Wealth Management Portal: < 500 TPS (High-value batch settlement & report generation)'
        ],
        impact: 'Determines database partitioning, active-active clustering, and throughput load-testing NFRs.'
      });
    }

    if (!textLower.includes('pci') && !textLower.includes('rbi') && !textLower.includes('basel') && !textLower.includes('gdpr') && !textLower.includes('sox')) {
      questions.push({
        id: 'regulatory_regime',
        topic: 'Primary Financial Regulatory Jurisdiction',
        question: 'Which statutory regulatory framework and financial supervision authority governs this deployment?',
        options: [
          'India Banking & Payments: RBI Cyber Security Framework, Digital Lending Guidelines & Data Localization',
          'Global Card Payments: PCI-DSS v4.0 Level 1 (FIPS 140-2 Level 3 HSM, zero CVV storage)',
          'Capital Markets & Treasury: Basel III/IV (BCBS 239) Risk Data Aggregation + SEBI / SEC System Audit'
        ],
        impact: 'Selects mandatory regulatory crosswalk clauses, data residency gates, and penalty risk profiles.'
      });
    }

    if (!textLower.includes('rto') && !textLower.includes('rpo') && !textLower.includes('zero data loss') && !textLower.includes('failover')) {
      questions.push({
        id: 'financial_dr',
        topic: 'Financial Disaster Recovery Tolerance (RTO / RPO)',
        question: 'What is the maximum allowable downtime and transaction loss tolerance during an unexpected hardware/data center failure?',
        options: [
          'Zero-Loss Mission-Critical: RPO = 0 (Synchronous replication), RTO < 30 seconds (Automated multi-region active-active failover)',
          'High-Availability Core Banking: RPO < 1 minute, RTO < 5 minutes (Warm standby with automated replica promotion)',
          'Standard Batch / Advisory: RPO < 1 hour, RTO < 2 hours (Scheduled encrypted backup restores)'
        ],
        impact: 'Directly configures availability NFRs and elevates Failure Consequence weight in SDLC model evaluation.'
      });
    }

    if (!textLower.includes('iso 20022') && !textLower.includes('swift') && !textLower.includes('upi') && !textLower.includes('ach') && !textLower.includes('core banking')) {
      questions.push({
        id: 'interoperability',
        topic: 'Core Banking & Payment Rail Interoperability',
        question: 'What interbank clearing rails or core banking protocols must this module interface with?',
        options: [
          'ISO 20022 (pacs.008/camt.053) & SWIFT MX messaging for real-time interbank settlement and instant payments',
          'RESTful Open Banking APIs + Webhook callbacks for merchant acquiring and fintech partner integration',
          'Proprietary Core Banking Mainframe (AS400/IBM MQ/Fixed-width message parsing) via secure middleware'
        ],
        impact: 'Generates ISO 20022 interface requirements, payload schema validations, and mock clearing test suites.'
      });
    }

    questions.push({
      id: 'release_cadence',
      topic: 'Financial Release Cadence & Audit Gate Governance',
      question: `From the ${stakeholderRole.toUpperCase()} perspective, how frequently will financial product rules or payment logic change?`,
      options: [
        'Continuous / Fast FinTech: Bi-weekly sprints with automated DevSecOps CI/CD security & compliance-as-code testing',
        'Controlled Staged Releases: Monthly/Quarterly releases governed by formal risk committee and UAT sign-off gates',
        'Frozen / Rigorous Statutory Baseline: Bi-annual or annual releases with exhaustive upfront architectural sign-offs'
      ],
      impact: 'Critical decision driver differentiating Agile–DevSecOps Hybrid from V-Model and Waterfall.'
    });

    return questions;
  }
}

