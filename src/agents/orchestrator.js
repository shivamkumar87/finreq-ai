// Coordinates privacy redaction, requirement analysis, and SDLC model selection.

import { maskSensitiveFinancialData, validateFinancialScenario } from './privacyGuard.js';
import { RequirementAgent } from './requirementAgent.js';
import { SdlcAgent } from './sdlcAgent.js';
import { ClarificationAgent } from './clarificationAgent.js';

export class AgentOrchestrator {
  constructor() {
    this.requirementAgent = new RequirementAgent();
    this.sdlcAgent = new SdlcAgent();
    this.clarificationAgent = new ClarificationAgent();
  }

  async runPipeline(rawScenarioText, options = {}) {
    const {
      stakeholderRole = 'ciso',
      clarificationAnswers = {},
      customFactors = {},
      apiKey = '',
      uploadedDocName = ''
    } = options;

    const logs = [];
    const addLog = (agent, phase, message, status = 'ok') => {
      logs.push({
        id: `log-${logs.length + 1}`,
        timestamp: new Date().toLocaleTimeString(),
        agent,
        phase,
        message,
        status
      });
    };

    // Redact sensitive PCI/PII tokens before processing
    const privacyResult = maskSensitiveFinancialData(rawScenarioText);
    if (privacyResult.totalRedacted > 0) {
      const typesSummary = privacyResult.redactions.map((r) => `${r.count}x ${r.type}`).join(', ');
      addLog(
        'Privacy & Security Guard',
        'PCI/PII Redaction',
        `Masked ${privacyResult.totalRedacted} sensitive financial token(s) (${typesSummary}) before agent processing.`,
        'warn'
      );
    } else {
      addLog('Privacy & Security Guard', 'PCI/PII Redaction', 'Scanned input for financial identifiers (PAN card, IBAN, email, phone, Gov ID, API secrets): 0 raw identifiers exposed.');
    }

    // Validate scenario and guard against prompt injection
    const validation = validateFinancialScenario(privacyResult.maskedText);
    if (!validation.isValid) {
      addLog('Coordinator Agent', 'Security & Validation Gate', validation.reason, 'error');
      const err = new Error(validation.reason);
      err.logs = logs;
      throw err;
    }
    addLog(
      'Coordinator Agent',
      'Input Validation',
      `Validated financial specification${uploadedDocName ? ` (+ attached document: ${uploadedDocName})` : ''} for stakeholder role: ${stakeholderRole.toUpperCase()}.`
    );

    // Extract requirements and run quality checks
    const requirementResult = await this.requirementAgent.analyzeScenario(privacyResult.maskedText, {
      stakeholderRole,
      clarificationAnswers,
      apiKey
    });

    addLog(
      'Financial RAG Retriever',
      'Knowledge Grounding',
      `Retrieved ${requirementResult.retrievedKnowledge.length} versioned regulatory clauses (${requirementResult.metrics.regulatoryStandardsMapped.join(', ')}).`
    );

    if (requirementResult.llmWarning) {
      addLog('Requirement Extraction Agent', 'LLM Fallback', requirementResult.llmWarning, 'warn');
    }

    addLog(
      'Requirement Extraction Agent',
      'Extraction & Classification',
      `Generated ${requirementResult.functionalRequirements.length} FRs & ${requirementResult.nonFunctionalRequirements.length} NFRs via ${requirementResult.generationMode} (Avg Confidence: ${Math.round(requirementResult.metrics.averageConfidence * 100)}%).`
    );

    addLog(
      'Quality & Conflict Agent',
      'IEEE 830 Audit',
      `Quality Score: ${requirementResult.qualityReport.overallScore}/100. Found ${requirementResult.qualityReport.ambiguities.length} vague term(s) and ${requirementResult.qualityReport.conflicts.length} potential stakeholder conflict(s).`,
      requirementResult.qualityReport.conflicts.length > 0 ? 'warn' : 'ok'
    );

    // Prepare follow-up clarification prompts
    const clarifications = this.clarificationAgent.generateClarifications(privacyResult.maskedText, stakeholderRole);
    const answeredCount = Object.keys(clarificationAnswers).length;
    addLog(
      'Clarification Interview Agent',
      'Gap Analysis',
      `Prepared ${clarifications.length} financial clarification prompt(s) (${answeredCount} answered by stakeholder).`
    );

    // Evaluate SDLC recommendations
    const sdlcResult = this.sdlcAgent.evaluateSDLC(requirementResult, customFactors, clarificationAnswers);
    addLog(
      'SDLC Selection Agent',
      'MCDA & Rule Engine',
      `Ranked 6 SDLC models across 8 financial factors. Top recommendation: ${sdlcResult.recommendedModel} (${sdlcResult.suitabilityScore}).`
    );

    addLog(
      'Human-in-the-Loop Gate',
      'Awaiting Sign-Off',
      'Pipeline complete. Requirements and SDLC blueprint are ready for CISO, Compliance Officer & Lead Architect review.'
    );

    return {
      privacyResult,
      requirementResult,
      sdlcResult,
      clarifications,
      logs
    };
  }
}

