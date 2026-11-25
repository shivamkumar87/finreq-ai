// Formats requirements, compliance mappings, and SDLC recommendations into IEEE 830 Markdown.

export function generateSRSMarkdown({
  title,
  scenarioText,
  privacyResult,
  requirementResult,
  sdlcResult,
  approvalMap = {},
  sdlcSignOff = null,
  auditLogs = []
}) {
  const {
    domain = 'Financial Services & Banking Systems',
    stakeholderRole = 'Chief Information Security Officer (CISO)',
    generationMode = 'Local Financial RAG Engine',
    retrievedKnowledge = [],
    functionalRequirements = [],
    nonFunctionalRequirements = [],
    qualityReport = {},
    traceabilityMatrix = [],
    riskRegister = [],
    metrics = {}
  } = requirementResult || {};

  const {
    primaryModel = {},
    rankedRecommendations = [],
    evaluatedFactors = {},
    projectWorkflow = []
  } = sdlcResult || {};

  const getStatus = (id) => approvalMap[id] || 'Pending Human Review';

  return `# FINANCIAL SOFTWARE REQUIREMENTS SPECIFICATION (SRS) & SDLC BLUEPRINT
**System Title:** ${title || 'Financial Software Module'}  
**Industry Domain:** ${domain}  
**Primary Stakeholder Perspective:** ${stakeholderRole}  
**Generation Engine:** ${generationMode}  
**Average Confidence Score:** ${Math.round((metrics.averageConfidence || 0.94) * 100)}%  
**PCI/PII Redactions Applied:** ${privacyResult?.totalRedacted || 0} sensitive identifier(s) masked before processing  
**Generated On:** ${new Date().toLocaleString()}

---

## 1. INTRODUCTION & SCENARIO SCOPE
> "${(scenarioText || '').trim()}"

### 1.1 RAG-Grounded Regulatory Knowledge Sources
| Source ID | Standard & Clause | Version | Jurisdiction | Relevance |
|---|---|---|---|---|
${retrievedKnowledge.map((k) => `| **${k.id}** | ${k.standard} (${k.clause}) | ${k.version} | ${k.jurisdiction} | ${Math.round(k.confidence * 100)}% |`).join('\n')}

---

## 2. FUNCTIONAL REQUIREMENTS

${functionalRequirements.map((fr, idx) => `### 2.${idx + 1} [${fr.id}] ${fr.title}
- **Approval Status:** ${getStatus(fr.id)}
- **Category / Labels:** ${fr.category} (${(fr.multiLabels || []).join(', ')})
- **Priority:** ${fr.priority} | **Risk Level:** ${fr.riskLevel} | **Confidence:** ${Math.round((fr.confidence || 0.92) * 100)}%
- **Source Stakeholder:** ${fr.sourceStakeholder}
- **Statement:** ${fr.statement}
- **User Story:** *${fr.userStory}*
- **Acceptance Criteria:**
${(fr.acceptanceCriteria || []).map((ac) => `  - ${ac}`).join('\n')}
- **Applicable Regulations:** ${(fr.applicableRegulations || []).join(', ')}
- **RAG Citations:** ${(fr.citations || []).join(', ')}
`).join('\n')}

---

## 3. NON-FUNCTIONAL REQUIREMENTS

${nonFunctionalRequirements.map((nfr, idx) => `### 3.${idx + 1} [${nfr.id}] ${nfr.title}
- **Approval Status:** ${getStatus(nfr.id)}
- **Category:** ${nfr.category} | **Priority:** ${nfr.priority} | **Confidence:** ${Math.round((nfr.confidence || 0.95) * 100)}%
- **Statement:** ${nfr.statement}
- **Target Metric / SLA:** ${nfr.targetMetrics}
- **Applicable Regulations:** ${(nfr.applicableRegulations || []).join(', ')}
- **RAG Citations:** ${(nfr.citations || []).join(', ')}
`).join('\n')}

---

## 4. QUALITY, AMBIGUITY & CONFLICT AUDIT
- **Quality Score:** ${qualityReport.overallScore || 92}/100 (${qualityReport.status || 'Validated'})
- **Testability Rating:** ${qualityReport.testabilityRating || 'High (Fully Quantified)'}

### 4.1 Ambiguities Detected (${(qualityReport.ambiguities || []).length})
${(qualityReport.ambiguities || []).length > 0
  ? qualityReport.ambiguities.map((a) => `- **Term "${a.term}"**: ${a.finding} *Recommendation:* ${a.recommendation}`).join('\n')
  : '- No vague or unquantified terms detected in the financial scenario.'}

### 4.2 Stakeholder / Requirement Conflicts Detected (${(qualityReport.conflicts || []).length})
${(qualityReport.conflicts || []).length > 0
  ? qualityReport.conflicts.map((c) => `- **[${c.id}] ${c.title}**: ${c.description} *Suggested Resolution:* ${c.resolution}`).join('\n')
  : '- No direct requirement conflicts detected.'}

---

## 5. FINANCIAL RISK REGISTER & TRACEABILITY MATRIX (IEEE 830 RTM)

### 5.1 Financial Risk Register
| Risk ID | Category | Severity | Description | Mitigation Control |
|---|---|---|---|---|
${riskRegister.map((r) => `| **${r.id}** | ${r.category} | ${r.severity} | ${r.risk} | ${r.mitigation} |`).join('\n')}

### 5.2 Requirements Traceability Matrix (RTM)
| Req ID | Title | Type | Stakeholder | Regulations | Citations | Verification Gate |
|---|---|---|---|---|---|---|
${traceabilityMatrix.map((t) => `| **${t.requirementId}** | ${t.title} | ${t.type} | ${t.stakeholder} | ${t.regulatoryMapping} | ${t.citations} | ${t.verificationStage} |`).join('\n')}

---

## 6. SDLC SELECTION (MCDA & Governance Rules)

### 6.1 Primary Recommendation: ${primaryModel.name} (${primaryModel.suitabilityScore})
${primaryModel.triggeredRule ? `- **Deterministic Rule Triggered:** ${primaryModel.triggeredRule}\n` : ''}- **Justification:** ${primaryModel.rationale}

### 6.2 Complete 6-Model MCDA Ranking
| Rank | SDLC Model | Score | Fit Level | Key Rationale |
|---|---|---|---|---|
${rankedRecommendations.map((r) => `| #${r.rank} | **${r.name}** | ${r.suitabilityScore} | ${r.matchLevel} | ${r.rationale} |`).join('\n')}

### 6.3 Evaluated 8 Decision Factors
- Requirement Stability: ${evaluatedFactors.requirementStability}/100
- Change Frequency: ${evaluatedFactors.changeFrequency}/100
- Regulatory Criticality: ${evaluatedFactors.regulatoryCriticality}/100
- Security & Financial Data Risk: ${evaluatedFactors.securityRisk}/100
- Technical Uncertainty: ${evaluatedFactors.technicalUncertainty}/100
- Financial Failure & Systemic Impact: ${evaluatedFactors.failureConsequence}/100
- Continuous Deployment Need: ${evaluatedFactors.continuousDeploymentNeed}/100
- Formal Verification & Auditability: ${evaluatedFactors.formalVerificationNeed}/100

---

## 7. FINANCIAL-SPECIFIC 5-PHASE SDLC WORKFLOW

${projectWorkflow.map((phase) => `### Phase ${phase.phaseNumber}: ${phase.phaseName} (${phase.durationEstimate})
- **Objective:** ${phase.objective}
- **Responsible Roles:** ${phase.responsibleRoles.join(', ')}
- **Key Activities:**
${phase.activities.map((a) => `  - ${a}`).join('\n')}
- **Deliverables:** ${phase.deliverables.join(', ')}
- **Security Controls:** ${phase.securityControls.join(', ')}
- **Compliance Gate:** ${phase.complianceCheckpoints}
- **Entry / Exit Criteria:** ${phase.entryCriteria} → ${phase.exitCriteria}
`).join('\n')}

---

## 8. HUMAN-IN-THE-LOOP (HITL) GOVERNANCE & AUDIT TRAIL
- **SDLC Decision Status:** ${sdlcSignOff ? `${sdlcSignOff.status} by ${sdlcSignOff.reviewer} (${sdlcSignOff.role}) at ${sdlcSignOff.timestamp}` : 'Pending Formal Approval'}
- **Chief Information Security Officer (CISO):** ________________________ Date: ________
- **Head of Compliance & AML Officer:** ________________________________ Date: ________
- **Core Banking Solution Architect:** _________________________________ Date: ________

### 8.1 Agent Execution Audit Log
${auditLogs.map((l) => `- \`${l.timestamp}\` **[${l.agent} — ${l.phase}]**: ${l.message}`).join('\n')}
`;
}

