/**
 * Financial Services & Banking Case Studies + 6 SDLC Deterministic Rule Scenarios
 */

export const FINANCIAL_PRESETS = [
  {
    id: 'fin_core_banking_gateway',
    title: 'Multi-Channel Core Banking & Real-Time Payment Gateway',
    category: 'Core Banking / Payment Rails',
    defaultRole: 'ciso',
    scenarioDescription: `Develop a mission-critical Multi-Channel Core Banking and Real-Time Payment Gateway processing credit card acquiring, UPI, and ISO 20022 interbank transfers. The system must process transactions with sub-50ms P99 latency, encrypt all cardholder data using AES-256 and FIPS 140-2 Level 3 HSMs per PCI-DSS v4.0, and enforce mandatory two-factor authentication (2FA/SCA). The platform is governed by strict regulations (PCI-DSS 4.0, RBI CSF, GDPR) but must evolve rapidly as new payment rails, merchant APIs, and digital wallet integrations are introduced in continuous sprint cycles. Requires active-active multi-region failover with RPO = 0 and an immutable audit ledger.`,
    tags: ['Core Banking', 'PCI-DSS v4.0', 'ISO 20022', 'RPO = 0 Failover'],
    defaultFactors: {
      requirementStability: 56,
      changeFrequency: 74,
      regulatoryCriticality: 98,
      securityRisk: 96,
      technicalUncertainty: 46,
      failureConsequence: 95,
      continuousDeploymentNeed: 84,
      formalVerificationNeed: 86
    }
  },
  {
    id: 'fin_rtgs_settlement',
    title: 'Central Bank RTGS & High-Assurance Liquidity Engine',
    category: 'Interbank Settlement / High-Assurance',
    defaultRole: 'architect',
    scenarioDescription: `Engineer a Real-Time Gross Settlement (RTGS) and Interbank Liquidity Management Engine for central clearing of high-value interbank wires. The system requires strict verification/validation of every financial transaction against mathematical invariants, formal double-entry bookkeeping guarantees, and exhaustive audit traceability. Mandates 99.999% availability, zero transaction loss (RPO = 0), and formal compliance gates under Basel III and Central Bank statutory directives with bilateral V&V test traceability before any production release.`,
    tags: ['RTGS Settlement', 'Strict V&V', 'Basel III', '99.999% Uptime'],
    defaultFactors: {
      requirementStability: 84,
      changeFrequency: 24,
      regulatoryCriticality: 99,
      securityRisk: 92,
      technicalUncertainty: 42,
      failureConsequence: 99,
      continuousDeploymentNeed: 36,
      formalVerificationNeed: 98
    }
  },
  {
    id: 'fin_algo_trading_ai',
    title: 'High-Frequency Algorithmic Trading & AI Fraud Surveillance',
    category: 'Capital Markets / AI Risk',
    defaultRole: 'cro',
    scenarioDescription: `Build an ultra-low-latency High-Frequency Algorithmic Trading (HFT) and real-time AI Fraud & Market Abuse Surveillance platform. The system ingests streaming multi-exchange order books, evaluates novel deep learning predictive models and reinforcement learning execution algorithms, and enforces sub-millisecond pre-trade risk controls. High uncertainty and technical risk surround model slippage, market regime shifts, and complex hardware acceleration (FPGA/kernel bypass), requiring iterative prototyping cycles, Monte Carlo risk modeling, and continuous clinical Go/No-Go reviews.`,
    tags: ['Algo Trading', 'AI Fraud Detection', 'High Uncertainty', 'Microsecond SLA'],
    defaultFactors: {
      requirementStability: 48,
      changeFrequency: 68,
      regulatoryCriticality: 90,
      securityRisk: 92,
      technicalUncertainty: 92,
      failureConsequence: 88,
      continuousDeploymentNeed: 76,
      formalVerificationNeed: 82
    }
  },
  {
    id: 'fin_wealth_retail_app',
    title: 'Retail Wealth Management & Digital Investment Advisory',
    category: 'WealthTech / Consumer FinTech',
    defaultRole: 'product',
    scenarioDescription: `Create an intuitive Retail Wealth Management, Robo-Advisory, and Mutual Fund Investment mobile application for retail banking customers. The app features frequently changing requirements driven by bi-weekly UX experiments, personalized portfolio rebalancing, community social investing features, and user feedback. It requires automated KYC onboarding, risk-profiling questionnaires, and fast release iterations while protecting investor privacy under GDPR and domestic data protection laws.`,
    tags: ['WealthTech', 'Robo-Advisory', 'Agile UX', 'Retail Banking'],
    defaultFactors: {
      requirementStability: 42,
      changeFrequency: 86,
      regulatoryCriticality: 72,
      securityRisk: 76,
      technicalUncertainty: 36,
      failureConsequence: 65,
      continuousDeploymentNeed: 82,
      formalVerificationNeed: 58
    }
  },
  {
    id: 'fin_cloud_payment_switch',
    title: 'Cloud-Native Payment Switch & Card Tokenization Platform',
    category: 'Payment Infrastructure / Cloud-Native',
    defaultRole: 'ciso',
    scenarioDescription: `Architect a cloud-native microservices Payment Switch and Card Tokenization Engine for merchant payment orchestration. The platform demands continuous secure deployment with automated SAST/DAST security gates embedded in CI/CD pipelines, container vulnerability scanning, zero-downtime canary deployments, and distributed vault tokenization per PCI-DSS v4.0. Supports thousands of e-commerce checkout spikes with automated auto-scaling and zero human intervention during deployments.`,
    tags: ['Payment Switch', 'Tokenization', 'DevSecOps', 'CI/CD SAST/DAST'],
    defaultFactors: {
      requirementStability: 54,
      changeFrequency: 76,
      regulatoryCriticality: 88,
      securityRisk: 94,
      technicalUncertainty: 40,
      failureConsequence: 86,
      continuousDeploymentNeed: 96,
      formalVerificationNeed: 74
    }
  }
];

// Backward-compatible alias for orchestrator
export const HOSPITAL_PRESETS = FINANCIAL_PRESETS;

export const FINANCIAL_SDLC_EXAMPLES = [
  {
    label: 'Waterfall: Statutory Central Bank Reporting',
    title: 'Statutory Central Bank Reporting (Stable + Approvals → Waterfall)',
    scenario: 'A banking statutory regulatory reporting engine with stable requirements and extensive approvals from Chief Risk Officers, legal counsel, and central bank compliance boards before any development begins.'
  },
  {
    label: 'V-Model: Core Banking RTGS Wire Settlement',
    title: 'RTGS High-Value Wire Settlement (Strict V&V → V-Model)',
    scenario: 'A real-time interbank gross settlement and high-value wire transfer software module requiring strict verification/validation, formal double-entry mathematical proofs, and life-critical financial audit gates.'
  },
  {
    label: 'Spiral: AI Market Surveillance R&D',
    title: 'AI Market Manipulation Surveillance R&D (High Uncertainty → Spiral)',
    scenario: 'An experimental capital markets trade surveillance platform using novel AI models for market manipulation detection with high uncertainty and technical risk across heterogeneous trading feeds.'
  },
  {
    label: 'Agile: Retail Banking Mobile Feedback',
    title: 'Retail Banking Mobile Feedback App (Changing Reqs → Agile)',
    scenario: 'A retail banking mobile reward wallet and customer satisfaction app with frequently changing requirements, bi-weekly UX experiments, and evolving customer journey feedback.'
  },
  {
    label: 'DevSecOps: Cloud Payment Microservices',
    title: 'Cloud Payment Microservices (Secure Deploy → DevSecOps)',
    scenario: 'A cloud-native payment gateway microservices platform requiring continuous secure deployment, automated SAST/DAST security gates in CI/CD, and zero-downtime canary rollouts.'
  },
  {
    label: 'Hybrid: Regulated Core Banking & UPI Gateway',
    title: 'Regulated Core Banking & Payment Gateway (High Regulation + Evolving → Hybrid)',
    scenario: 'A multi-channel core banking and instant payment gateway platform subject to high regulation (PCI-DSS 4.0, RBI CSF, GDPR) and evolving requirements as new payment rails and partner APIs roll out.'
  }
];

// Backward-compatible alias for test suites
export const HOSPITAL_SDLC_EXAMPLES = FINANCIAL_SDLC_EXAMPLES;

