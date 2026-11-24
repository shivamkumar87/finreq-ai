/**
 * Security, Privacy & Input Guardrail Agent for Financial Services
 * 1. Masks Primary Account Numbers (PAN), IBAN, Government IDs (SSN/Aadhaar/Tax ID),
 *    email, phone, and API secrets before any LLM or agent processes the text.
 * 2. Detects prompt-injection attempts.
 * 3. Validates that input represents a legitimate financial/banking software scenario.
 */

export function maskSensitiveFinancialData(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return { maskedText: '', redactions: [], totalRedacted: 0 };
  }

  let maskedText = rawText;
  const redactions = [];

  const rules = [
    {
      type: 'Primary Account Number (PAN / Card)',
      token: '[REDACTED_PCI_PAN]',
      // 13 to 19 digit card numbers, with optional hyphens or spaces
      regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9]{2})[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11}|60[0-9]{14}|6521[0-9]{12})\b|\b(?:\d{4}[-\s]\d{4}[-\s]\d{4}[-\s]\d{4}|\d{4}[-\s]\d{6}[-\s]\d{4,5})\b/g
    },
    {
      type: 'Bank Account Number / IBAN',
      token: '[REDACTED_BANK_ACCOUNT]',
      regex: /\b[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}\b|\b(?:ACC|ACCT|ACCOUNT)[-:\s#]+[0-9]{8,18}\b/gi
    },
    {
      type: 'Government ID (Aadhaar / SSN / Tax ID)',
      token: '[REDACTED_GOV_ID]',
      regex: /\b(?:\d{4}[\s-]\d{4}[\s-]\d{4}|\d{3}-\d{2}-\d{4}|[A-Z]{5}[0-9]{4}[A-Z])\b/g
    },
    {
      type: 'API Secret / Private Credential',
      token: '[REDACTED_API_SECRET]',
      regex: /\b(?:AKIA[0-9A-Z]{16}|sk_live_[0-9a-zA-Z]{24,}|ghp_[0-9a-zA-Z]{36}|bearer\s+[a-zA-Z0-9._-]{20,})\b/gi
    },
    {
      type: 'Email Address',
      token: '[REDACTED_PII_EMAIL]',
      regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g
    },
    {
      type: 'Phone Number',
      token: '[REDACTED_PII_PHONE]',
      regex: /(?:\+?\d{1,3}[\s-]?)?\b[6-9]\d{9}\b|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/g
    }
  ];

  for (const rule of rules) {
    const matches = maskedText.match(rule.regex);
    if (matches && matches.length > 0) {
      redactions.push({
        type: rule.type,
        count: matches.length,
        maskToken: rule.token
      });
      maskedText = maskedText.replace(rule.regex, rule.token);
    }
  }

  const totalRedacted = redactions.reduce((sum, r) => sum + r.count, 0);
  return { maskedText, redactions, totalRedacted };
}

// Backward-compatible alias for orchestrator
export const maskSensitivePHI = maskSensitiveFinancialData;

export function validateFinancialScenario(scenario) {
  if (!scenario || typeof scenario !== 'string') {
    return {
      isValid: false,
      reason: 'Scenario input is empty. Please describe a financial, banking, or fintech software module.'
    };
  }

  const text = scenario.trim();
  if (text.length < 15) {
    return {
      isValid: false,
      reason: 'Input is too short. Please provide at least a sentence describing the financial system, payment flow, or banking module.'
    };
  }

  const lower = text.toLowerCase();

  // Prompt-injection protection
  const injectionPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /reveal\s+(your\s+)?system\s+prompt/i,
    /disregard\s+(all\s+)?(prior|above|system)\s+(rules|instructions)/i,
    /bypass\s+(security|compliance|guardrails)/i,
    /\bjailbreak\b/i
  ];
  for (const pattern of injectionPatterns) {
    if (pattern.test(lower)) {
      return {
        isValid: false,
        reason: 'Security Guardrail: Prompt-injection pattern detected and blocked before agent execution.'
      };
    }
  }

  // Profanity check
  const inappropriatePattern = /\b(fuck|fucking|shit|bitch|bastard|asshole|cunt)\b/i;
  if (inappropriatePattern.test(lower)) {
    return {
      isValid: false,
      reason: 'Input rejected: Inappropriate language detected. Please enter a valid financial software specification.'
    };
  }

  const words = lower.match(/[a-z0-9_#+-]+/g) || [];
  if (words.length < 4) {
    return {
      isValid: false,
      reason: 'Input is too brief. Please include the financial purpose, actors, or regulatory constraints.'
    };
  }

  // Verify software or financial engineering context
  const validKeywords = new Set([
    'bank', 'banking', 'payment', 'payments', 'gateway', 'switch', 'transaction', 'transactions',
    'ledger', 'settlement', 'clearing', 'account', 'accounts', 'card', 'cards', 'credit', 'debit',
    'loan', 'lending', 'mortgage', 'kyc', 'aml', 'fraud', 'pci', 'dss', 'rbi', 'basel', 'sebi',
    'sox', 'gdpr', 'glba', 'swift', 'iso20022', 'iso', 'ach', 'rtgs', 'neft', 'upi', 'wallet',
    'hsm', 'tokenization', 'authorization', 'authenticator', 'audit', 'treasury', 'liquidity',
    'capital', 'compliance', 'trading', 'brokerage', 'wealth', 'investment', 'portfolio', 'equity',
    'microservices', 'api', 'cloud', 'security', 'privacy', 'database', 'encryption', 'aes',
    'tls', 'reconciliation', 'reporting', 'statutory', 'system', 'software', 'platform', 'app',
    'module', 'engine', 'workflow', 'requirements', 'verification', 'stable', 'evolving', 'risk'
  ]);

  const hasContext = words.some((w) => validKeywords.has(w));
  if (!hasContext) {
    return {
      isValid: false,
      reason: 'Input rejected: Description does not appear to describe a financial, banking, or fintech software system.'
    };
  }

  return { isValid: true };
}

// Backward-compatible alias for orchestrator
export const validateHospitalScenario = validateFinancialScenario;

