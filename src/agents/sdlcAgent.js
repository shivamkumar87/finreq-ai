// SDLC decision engine evaluating MCDA factor scoring and governance workflows.

import { validateFinancialScenario } from './privacyGuard.js';

export const SDLC_MODEL_DEFINITIONS = {
  WATERFALL: 'Waterfall',
  V_MODEL: 'V-Model',
  SPIRAL: 'Spiral Model',
  AGILE: 'Agile (Scrum)',
  DEVSECOPS: 'DevSecOps',
  AGILE_DEVSECOPS_HYBRID: 'Agile–DevSecOps Hybrid'
};

export class SdlcAgent {
  constructor() {
    this.name = 'Financial SDLC Selection Architect';
  }

  evaluateSDLC(requirementData, customFactors = {}, clarificationAnswers = {}) {
    const scenarioText = requirementData?.scenario || '';
    if (scenarioText) {
      const validation = validateFinancialScenario(scenarioText);
      if (!validation.isValid) {
        throw new Error(`SDLC Evaluation rejected: ${validation.reason}`);
      }
    }

    const evaluatedFactors = this._extractFactors(scenarioText, customFactors, clarificationAnswers);
    const rankedRecommendations = this._performMCDA(scenarioText, evaluatedFactors, customFactors);
    const primaryModel = rankedRecommendations[0];
    const projectWorkflow = this._generateFinancialWorkflow(primaryModel.name);

    return {
      recommendedModel: primaryModel.name,
      suitabilityScore: primaryModel.suitabilityScore,
      justification: primaryModel.rationale,
      primaryModel,
      rankedRecommendations,
      evaluatedFactors,
      projectWorkflow
    };
  }

  _extractFactors(scenarioText, customFactors = {}, clarificationAnswers = {}) {
    const fullText = [
      scenarioText || '',
      ...Object.values(clarificationAnswers || {})
    ].join(' ').toLowerCase();

    const clamp = (val) => Math.min(Math.max(Math.round(val), 0), 100);

    let stability = 54;
    let changeFreq = 52;
    let regulatory = 50;
    let secRisk = 55;
    let techUncertainty = 30;
    let failConsequence = 55;
    let contDeploy = 45;
    let formalVerif = 45;

    if (/stable requirements|fixed scope|extensive approvals|frozen|statutory.*reporting|annual validated/.test(fullText)) {
      stability = 92;
      changeFreq = 18;
      formalVerif = Math.max(formalVerif, 80);
    }
    if (/frequently changing|evolving requirements|rapidly changing|bi-weekly sprints|ux experiments|agile|reward wallet/.test(fullText)) {
      changeFreq = 86;
      stability = 26;
    }

    if (/strict verification|verification\/validation|v-model|formal verification|rtgs|wire settlement|high-value|zero transaction loss|mathematical invariant|double-entry/.test(fullText)) {
      formalVerif = 98;
      failConsequence = 99;
      stability = Math.max(stability, 76);
      changeFreq = Math.min(changeFreq, 28);
    }

    if (/high uncertainty|technical risk|experimental|novel ai|research platform|algorithmic trading|hft|reinforcement learning|market abuse/.test(fullText)) {
      techUncertainty = 92;
      failConsequence = Math.max(failConsequence, 86);
    }

    if (/pci-dss|pci|rbi|basel|gdpr|sox|sebi|sec|finra|high regulation|regulated|accreditation|compliance|statutory/.test(fullText)) {
      regulatory = 96;
      formalVerif = Math.max(formalVerif, 82);
    }

    if (/pci|pan|cardholder|hsm|tokenization|aes-256|2fa|mfa|sast|dast|encryption|secret/.test(fullText)) {
      secRisk = 94;
    }

    if (/continuous secure deployment|continuous deployment|ci\/cd|canary|microservices|cloud-native|payment switch/.test(fullText)) {
      contDeploy = 96;
      secRisk = Math.max(secRisk, 88);
    }

    if (/rtgs|zero data loss|rpo = 0|99\.999%|systemic risk|fraud|sub-50ms|settlement/.test(fullText)) {
      failConsequence = Math.max(failConsequence, 95);
    }

    return {
      requirementStability: customFactors.requirementStability !== undefined ? clamp(customFactors.requirementStability) : clamp(stability),
      changeFrequency: customFactors.changeFrequency !== undefined ? clamp(customFactors.changeFrequency) : clamp(changeFreq),
      regulatoryCriticality: customFactors.regulatoryCriticality !== undefined ? clamp(customFactors.regulatoryCriticality) : clamp(regulatory),
      securityRisk: customFactors.securityRisk !== undefined ? clamp(customFactors.securityRisk) : clamp(secRisk),
      technicalUncertainty: customFactors.technicalUncertainty !== undefined ? clamp(customFactors.technicalUncertainty) : clamp(techUncertainty),
      failureConsequence: customFactors.failureConsequence !== undefined ? clamp(customFactors.failureConsequence) : clamp(failConsequence),
      continuousDeploymentNeed: customFactors.continuousDeploymentNeed !== undefined ? clamp(customFactors.continuousDeploymentNeed) : clamp(contDeploy),
      formalVerificationNeed: customFactors.formalVerificationNeed !== undefined ? clamp(customFactors.formalVerificationNeed) : clamp(formalVerif)
    };
  }

  _performMCDA(scenarioText, factors, customFactors = {}) {
    const textLower = (scenarioText || '').toLowerCase();
    const isManualSliderTuning = Object.keys(customFactors || {}).length > 0 && customFactors._fromSlider === true;

    const {
      requirementStability: stab,
      changeFrequency: chg,
      regulatoryCriticality: reg,
      securityRisk: sec,
      technicalUncertainty: unc,
      failureConsequence: fail,
      continuousDeploymentNeed: deploy,
      formalVerificationNeed: verif
    } = factors;

    // Calculate MCDA utility scores
    let waterfallScore = (stab * 0.38) + (verif * 0.22) + ((100 - chg) * 0.25) + ((100 - unc) * 0.15);
    let vModelScore = (verif * 0.38) + (fail * 0.22) + (reg * 0.18) + (stab * 0.12) + ((100 - chg) * 0.10);
    let spiralScore = (unc * 0.44) + (fail * 0.24) + ((100 - stab) * 0.16) + (chg * 0.16);
    let agileScore = (chg * 0.42) + ((100 - stab) * 0.26) + (deploy * 0.20) + ((100 - verif) * 0.12);
    if (reg > 78 || sec > 80) agileScore -= 16;
    let devSecOpsScore = (deploy * 0.38) + (sec * 0.32) + (chg * 0.18) + ((100 - stab) * 0.12);
    let hybridScore = (reg * 0.28) + (sec * 0.24) + (chg * 0.22) + (deploy * 0.14) + (verif * 0.12);

    // Apply rule overrides for specific architectural archetypes
    let triggeredRule = null;

    const isWaterfallRule = (!isManualSliderTuning && textLower.includes('stable requirements') && textLower.includes('approvals')) ||
      (stab >= 82 && chg <= 28 && verif >= 65 && fail < 90);

    const isVModelRule = (!isManualSliderTuning && (textLower.includes('strict verification') || textLower.includes('verification/validation'))) ||
      (verif >= 88 && fail >= 85 && unc < 70 && chg <= 40);

    const isSpiralRule = (!isManualSliderTuning && (textLower.includes('high uncertainty') || textLower.includes('technical risk'))) ||
      (unc >= 78);

    const isHybridRule = (!isManualSliderTuning && (textLower.includes('high regulation') || textLower.includes('regulated')) && (textLower.includes('evolving') || textLower.includes('changing'))) ||
      (reg >= 80 && chg >= 58 && verif >= 70);

    const isDevSecOpsRule = (!isManualSliderTuning && textLower.includes('continuous secure deployment')) ||
      (deploy >= 85 && sec >= 80 && reg < 90 && verif < 85);

    const isAgileRule = (!isManualSliderTuning && textLower.includes('frequently changing') && !textLower.includes('regulation') && !textLower.includes('secure deployment')) ||
      (chg >= 72 && reg < 75 && sec < 78);

    if (isWaterfallRule) {
      triggeredRule = 'Stable requirements + extensive approvals → Waterfall';
      waterfallScore = 96;
      vModelScore = Math.min(vModelScore, 85);
      hybridScore = Math.min(hybridScore, 68);
      agileScore = Math.min(agileScore, 42);
    } else if (isVModelRule) {
      triggeredRule = 'Strict verification/validation → V-Model';
      vModelScore = 96;
      hybridScore = Math.min(hybridScore, 84);
      waterfallScore = Math.min(waterfallScore, 80);
      agileScore = Math.min(agileScore, 40);
    } else if (isSpiralRule) {
      triggeredRule = 'High uncertainty/technical risk → Spiral Model';
      spiralScore = 96;
      hybridScore = Math.min(hybridScore, 78);
      agileScore = Math.min(agileScore, 72);
      waterfallScore = Math.min(waterfallScore, 44);
    } else if (isHybridRule) {
      triggeredRule = 'High regulation + evolving requirements → Agile–DevSecOps Hybrid';
      hybridScore = 96;
      devSecOpsScore = Math.min(devSecOpsScore, 88);
      vModelScore = Math.min(vModelScore, 82);
      agileScore = Math.min(agileScore, 66);
    } else if (isDevSecOpsRule) {
      triggeredRule = 'Continuous secure deployment → DevSecOps';
      devSecOpsScore = 96;
      hybridScore = Math.min(hybridScore, 88);
      agileScore = Math.min(agileScore, 76);
    } else if (isAgileRule) {
      triggeredRule = 'Frequently changing requirements → Agile (Scrum)';
      agileScore = 95;
      devSecOpsScore = Math.min(devSecOpsScore, 82);
      hybridScore = Math.min(hybridScore, 74);
    }

    const models = [
      {
        id: 'agile_devsecops_hybrid',
        name: SDLC_MODEL_DEFINITIONS.AGILE_DEVSECOPS_HYBRID,
        rawScore: Math.round(hybridScore),
        pros: [
          'Unites FinTech sprint velocity with automated PCI-DSS & RBI compliance-as-code gates',
          'Embeds shift-left financial data security scanning (SAST/DAST) in every release cycle',
          'Maintains continuous audit readiness while accommodating evolving payment rail APIs'
        ],
        cons: [
          'Demands close ongoing alignment between FinTech product teams and Risk/Compliance Officers',
          'Higher upfront CI/CD compliance automation tooling investment'
        ],
        rationale: isHybridRule
          ? `Balances high financial regulation (${reg}%) and cardholder security (${sec}%) with rapidly evolving payment requirements (${chg}%), embedding automated compliance-as-code into iterative sprints.`
          : `Scored ${Math.round(hybridScore)}% based on combined regulatory criticality (${reg}%), security posture (${sec}%), and change rate (${chg}%).`
      },
      {
        id: 'v_model',
        name: SDLC_MODEL_DEFINITIONS.V_MODEL,
        rawScore: Math.round(vModelScore),
        pros: [
          'Bilateral 1-to-1 mapping of every financial invariant to formal verification & settlement tests',
          'Ideal for mission-critical RTGS, central clearing rails, and FIPS 140-2 Level 3 HSM firmware',
          'Produces exhaustive, provable traceability documentation for central bank regulatory audits'
        ],
        cons: [
          'Inflexible against late-breaking mid-project commercial banking scope modifications',
          'Working software is delivered to end-users later in the implementation timeline'
        ],
        rationale: isVModelRule
          ? `Strict financial verification/validation (${verif}%) and systemic failure consequence (${fail}%) mandate bilateral V&V traceability before any capital clearing release.`
          : `Scored ${Math.round(vModelScore)}% reflecting formal verification demands (${verif}%) and financial failure impact (${fail}%).`
      },
      {
        id: 'devsecops',
        name: SDLC_MODEL_DEFINITIONS.DEVSECOPS,
        rawScore: Math.round(devSecOpsScore),
        pros: [
          'Automated security gates (SAST, DAST, secrets detection, container scans) integrated into CI/CD',
          'Supports zero-downtime canary deployments for 24/7 cloud payment switches and merchant gateways',
          'Continuous runtime vulnerability scanning and sub-hour security patch rollouts'
        ],
        cons: [
          'Requires mature automated test coverage and dedicated DevSecOps engineering infrastructure',
          'Less suited for frozen, upfront-approved statutory central bank reporting filings'
        ],
        rationale: isDevSecOpsRule
          ? `High continuous deployment requirement (${deploy}%) combined with critical financial data security (${sec}%) dictates automated Security-as-Code CI/CD pipelines.`
          : `Scored ${Math.round(devSecOpsScore)}% based on continuous delivery demand (${deploy}%) and security requirements (${sec}%).`
      },
      {
        id: 'spiral',
        name: SDLC_MODEL_DEFINITIONS.SPIRAL,
        rawScore: Math.round(spiralScore),
        pros: [
          'Explicit quantitative risk analysis and Monte Carlo simulations in every iterative spiral loop',
          'De-risks experimental algorithmic trading models and novel blockchain/DLT financial engines',
          'Supports structured Go/No-Go capital allocation decision checkpoints per cycle'
        ],
        cons: [
          'Substantial project-management and risk-assessment overhead for standardized banking modules',
          'Requires seasoned quantitative risk officers'
        ],
        rationale: isSpiralRule
          ? `Elevated technical uncertainty (${unc}%) and systemic financial exposure (${fail}%) warrant iterative prototyping and risk-mitigation cycles before capital deployment.`
          : `Scored ${Math.round(spiralScore)}% given technical uncertainty (${unc}%) and risk profile (${fail}%).`
      },
      {
        id: 'waterfall',
        name: SDLC_MODEL_DEFINITIONS.WATERFALL,
        rawScore: Math.round(waterfallScore),
        pros: [
          'Predictable fixed-scope stage-gate sign-offs for Chief Risk Officers and statutory audit boards',
          'Clear contractual budgeting and exhaustive upfront financial architecture documentation',
          'Straightforward governance when accounting rules and general ledger formats are frozen'
        ],
        cons: [
          'Prohibitively expensive to alter requirements once development and integration have begun',
          'Late user feedback introduces usability and digital adoption risks'
        ],
        rationale: isWaterfallRule
          ? `Stable financial requirements (${stab}%) and extensive upfront central bank approval gates make sequential Waterfall delivery predictable and auditable.`
          : `Scored ${Math.round(waterfallScore)}% reflecting high requirement stability (${stab}%) vs. low change frequency (${chg}%).`
      },
      {
        id: 'agile',
        name: SDLC_MODEL_DEFINITIONS.AGILE,
        rawScore: Math.round(agileScore),
        pros: [
          'Rapid 2-week sprint increments for retail banking customer portals, reward apps, and wealth calculators',
          'Continuous direct involvement of retail banking users and product managers in sprint reviews',
          'High adaptability to evolving consumer feedback and mobile banking user trends'
        ],
        cons: [
          'Can accumulate compliance and architectural debt in heavily audited, high-regulation core banking',
          'Less rigorous formal verification artifacts unless paired with DevSecOps compliance controls'
        ],
        rationale: isAgileRule
          ? `Frequently evolving customer requirements (${chg}%) and non-critical regulatory overhead favor iterative sprint delivery with continuous feedback.`
          : `Scored ${Math.round(agileScore)}% based on requirement change rate (${chg}%) and low upfront constraints.`
      }
    ];

    // Normalize scores
    const sorted = models.sort((a, b) => b.rawScore - a.rawScore);
    const topScore = sorted[0].rawScore;

    return sorted.map((m, index) => {
      const suitabilityScore = `${Math.min(99, Math.max(35, m.rawScore))}%`;
      const matchLevel = index === 0 ? 'Optimal Choice' : m.rawScore >= topScore - 10 ? 'Viable Candidate' : 'Low Compatibility';
      return {
        ...m,
        rank: index + 1,
        suitabilityScore,
        matchLevel,
        triggeredRule: index === 0 ? triggeredRule : null
      };
    });
  }

  _generateFinancialWorkflow(modelName) {
    const isWaterfall = modelName === SDLC_MODEL_DEFINITIONS.WATERFALL;
    const isVModel = modelName === SDLC_MODEL_DEFINITIONS.V_MODEL;
    const isDevSecOps = modelName === SDLC_MODEL_DEFINITIONS.DEVSECOPS;

    return [
      {
        phaseNumber: 1,
        phaseName: 'Inception, Statutory Scoping & Regulatory Baselines',
        durationEstimate: isWaterfall ? '4–6 Weeks' : '1–2 Weeks',
        objective: 'Establish financial project scope, ground statutory compliance baselines (PCI-DSS 4.0, RBI CSF, Basel III, GDPR), and record stakeholder consensus.',
        responsibleRoles: ['Chief Risk Officer', 'Head of Compliance', 'Solution Architect'],
        activities: [
          'Elicit and classify requirements across IEEE 830 functional, security, and audit dimensions',
          'Conduct regulatory crosswalk against PCI-DSS 4.0, RBI Cyber Security Framework, and SOX 404',
          'Perform initial STRIDE threat modeling on cardholder data flows and transaction routing paths'
        ],
        deliverables: [
          'Approved IEEE 830 Financial SRS Draft',
          'Regulatory Crosswalk & Compliance Matrix',
          'Cryptographic Key Management Plan (HSM FIPS 140-2 Level 3)'
        ],
        securityControls: [
          'PII/PCI sensitive token masking on all specification inputs',
          'Role-based access control (RBAC) governance for requirement sign-offs'
        ],
        complianceCheckpoints: 'Formal Stage-Gate Sign-off by CISO & Head of Compliance',
        entryCriteria: 'Approved project charter and initial financial business problem statement',
        exitCriteria: 'Baselines locked with zero unmitigated High/Critical regulatory compliance gaps'
      },
      {
        phaseNumber: 2,
        phaseName: 'Financial Architecture, Threat Modeling & ISO 20022 Interface Specs',
        durationEstimate: isVModel ? '5–7 Weeks' : '2–3 Weeks',
        objective: 'Architect resilient financial microservices, define ISO 20022 clearing interfaces, and execute STRIDE cybersecurity threat modeling.',
        responsibleRoles: ['Core Banking Architect', 'Security Engineer', 'CISO'],
        activities: [
          'Design active-active multi-region database topology supporting RPO = 0 and sub-50ms authorization',
          'Specify ISO 20022 pacs.008, pacs.002, and camt.053 message validation schemas and idempotency caches',
          'Model financial attack vectors: Card skimming, Man-in-the-Middle wire alteration, and replay attacks'
        ],
        deliverables: [
          'High-Level Financial Architecture & Network Zone Dossier',
          'Open Banking & ISO 20022 OpenAPI Specifications',
          'STRIDE Financial Threat Model & Mitigation Register'
        ],
        securityControls: [
          'Hardware Security Module (HSM) key derivation topology verification',
          'End-to-end mTLS 1.3 protocol and zero-trust service mesh configuration'
        ],
        complianceCheckpoints: 'Architecture Review Board (ARB) & CISO Penetration Testing Pre-Approval',
        entryCriteria: 'Phase 1 baseline sign-off and validated functional requirement inventory',
        exitCriteria: 'All external financial interfaces specified with cryptographic and idempotency contracts'
      },
      {
        phaseNumber: 3,
        phaseName: 'Secure Sprint Implementation, SAST/DAST & Transaction Testing',
        durationEstimate: isDevSecOps ? 'Continuous (2-Week Sprints)' : '6–10 Weeks',
        objective: 'Implement financial business logic, card tokenization vaults, and double-entry general ledger posting with automated CI/CD security gates.',
        responsibleRoles: ['Lead FinTech Engineer', 'DevSecOps Specialist', 'QA Automation Lead'],
        activities: [
          'Develop core payment switch, ledger services, and tokenization microservices using TDD',
          'Automate shift-left security scanning: SAST (SonarQube), DAST (OWASP ZAP), and dependency audits in CI/CD',
          'Execute automated double-entry ledger invariant verification and rounding error regression tests'
        ],
        deliverables: [
          'Tested Financial Microservice Containers & Helm Charts',
          'Automated CI/CD Pipeline with Passing Security Gates',
          'Automated Unit & Integration Test Suite (>= 90% code coverage)'
        ],
        securityControls: [
          'Automated build failure on any detected Critical/High CVE vulnerabilities',
          'Pre-commit git hooks preventing credential and private key leaks'
        ],
        complianceCheckpoints: 'Sprint-level Compliance-as-Code automated verification',
        entryCriteria: 'Approved interface specifications and container base image verification',
        exitCriteria: 'All unit/integration tests passing with zero open Critical/High security findings'
      },
      {
        phaseNumber: 4,
        phaseName: 'Formal Verification, Penetration Testing & Compliance Gates',
        durationEstimate: isVModel ? '4–6 Weeks' : '2 Weeks',
        objective: 'Conduct exhaustive external penetration testing, high-concurrency TPS stress validation, and formal regulatory compliance audits.',
        responsibleRoles: ['External Qualified Security Assessor (QSA)', 'Chief Risk Officer', 'CISO'],
        activities: [
          'Commission external PCI-DSS QSA audit and external black-box/grey-box penetration testing',
          'Perform peak load stress testing sustaining 10,000 TPS and chaos engineering failover tests (RTO < 30s)',
          'Verify complete IEEE 830 Requirements Traceability Matrix linking every FR/NFR to audit evidence'
        ],
        deliverables: [
          'PCI-DSS Report on Compliance (RoC) & Attestation of Compliance (AoC)',
          'High-Throughput Load & Chaos Recovery Test Benchmark Report',
          'Completed IEEE 830 Requirements Traceability Matrix (RTM)'
        ],
        securityControls: [
          'Independent external ASV perimeter vulnerability scan with clean pass',
          'Dual-control maker-checker verification on production configuration parameters'
        ],
        complianceCheckpoints: 'Mandatory CISO, Head of Compliance & Chief Risk Officer Production Gate Sign-Off',
        entryCriteria: 'Code freeze and passing automated CI/CD test suites across all staging environments',
        exitCriteria: 'Formal QSA accreditation and sign-off by all statutory financial governance authorities'
      },
      {
        phaseNumber: 5,
        phaseName: 'Production Deployment, Chained Audit Ledger & Continuous Monitoring',
        durationEstimate: 'Ongoing Operations',
        objective: 'Execute zero-downtime canary deployment, initialize the SHA-256 chained audit ledger, and monitor 24/7 transaction settlement latency.',
        responsibleRoles: ['Site Reliability Engineering (SRE)', 'Financial Operations', 'Internal Auditor'],
        activities: [
          'Roll out zero-downtime canary deployment across active-active cloud availability zones',
          'Activate real-time Prometheus/Grafana settlement latency and transaction anomaly alerting dashboards',
          'Stream append-only, SHA-256 chained audit logs to WORM storage for statutory 10-year retention'
        ],
        deliverables: [
          'Production Deployment Verification Certificate',
          'Real-Time Settlement & Latency Telemetry Dashboard',
          'Immutable Cryptographic Audit Trail Ledger'
        ],
        securityControls: [
          '24/7 SIEM monitoring with automated anomaly blocking and SOC alerting',
          'Automated daily off-site encrypted ledger backup verification'
        ],
        complianceCheckpoints: 'Quarterly Internal Audit & Annual Statutory Regulatory Filing Review',
        entryCriteria: 'Phase 4 regulatory sign-offs and production maintenance window authorization',
        exitCriteria: 'System operating at >= 99.999% availability with zero transaction discrepancies'
      }
    ];
  }
}

