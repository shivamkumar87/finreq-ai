# System Architecture — FinReq AI (Financial RE & SDLC Platform)

**Domain:** Banking, FinTech & Capital Markets Software Engineering  
**Standards:** IEEE 830 (SRS), ISO/IEC 25010, PCI-DSS v4.0, RBI Cyber Security Framework & DLG 2023, GDPR / Data Sovereignty, Basel III/IV (BCBS 239), SOX 404, ISO 20022  

## 1. Multi-Agent Pipeline Overview
Every request passes through `AgentOrchestrator.runPipeline()` in `src/agents/orchestrator.js`:

1. **Privacy & Security Guardrail (`src/agents/privacyGuard.js`)**: Masks sensitive PCI/PII tokens (Credit Card PANs, Bank Accounts/IBANs, Emails, Phone numbers, Gov IDs like Aadhaar/SSN, API Secrets) and blocks prompt-injection patterns before any agent or LLM processes the text.
2. **Financial RAG Retriever (`src/agents/knowledgeBase.js`)**: Scores and retrieves versioned regulatory clauses (PCI-DSS 4.0, RBI CSF, GDPR, Basel III, SOX 404, ISO 20022, SEBI Algo Risk, ISO 25010) with jurisdiction metadata, clause IDs, and confidence scores.
3. **Agent 1 — Financial Requirements & Quality Engineer (`src/agents/requirementAgent.js`)**: Extracts structured FRs/NFRs (either via live `gemini-2.5-flash` grounded in RAG context when an API key is supplied, or via the Local Financial RAG Engine), runs IEEE 830 ambiguity and conflict audits, and builds the Risk Register and Traceability Matrix.
4. **Adaptive Clarification Agent (`src/agents/clarificationAgent.js`)**: Identifies missing financial constraints (peak TPS/concurrency, regulatory jurisdiction, disaster recovery RTO/RPO, payment clearing rails, release governance) and feeds stakeholder answers back into Agent 1 and Agent 2.
5. **Agent 2 — Financial SDLC Architect (`src/agents/sdlcAgent.js`)**: Extracts 8 quantitative factors, evaluates 6 candidate SDLC models via weighted MCDA + 6 deterministic rules, supports live slider tuning in `src/App.jsx`, and generates a 5-phase financial SDLC workflow.
6. **Human-in-the-Loop (HITL) Governance & Exporter (`src/App.jsx`, `src/utils/srsExporter.js`)**: Captures per-requirement Approve/Flag decisions, reviewer SDLC sign-off, and timestamped audit logs, exporting everything into an IEEE 830 Markdown SRS.

## 2. File Structure
| Path | Responsibility |
|---|---|
| `src/App.jsx` | Interactive React UI: Stakeholder role selector, file upload, optional Gemini API key, PCI/PII banner, Clarification Q&A, tabbed Agent 1 workspace, interactive MCDA sliders, HITL sign-off, and Audit Trail |
| `src/index.css` | Emerald Jade & Charcoal Onyx design system |
| `src/agents/orchestrator.js` | Central multi-agent coordinator and timestamped audit logger |
| `src/agents/privacyGuard.js` | PCI/PII redaction regex engine + prompt-injection & domain validator |
| `src/agents/knowledgeBase.js` | Versioned financial regulatory clauses + local RAG retriever + stakeholder roles |
| `src/agents/requirementAgent.js` | Live Gemini LLM + Local RAG requirement extraction, ambiguity/conflict audit, Risk Register, and RTM |
| `src/agents/clarificationAgent.js` | Financial-specific adaptive gap analysis and interview prompts |
| `src/agents/sdlcAgent.js` | 8-factor MCDA + 6 deterministic rules + 5-phase financial SDLC workflows |
| `src/agents/presets.js` | 5 Financial case studies + 6 Financial SDLC rule verification scenarios |
| `src/utils/srsExporter.js` | IEEE 830 Financial SRS & Audit Trail Markdown exporter |
| `test_agents.mjs` | Automated Node.js verification test suite |

