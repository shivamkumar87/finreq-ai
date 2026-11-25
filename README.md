# FinReq AI — Financial Requirements Engineering & SDLC Selection Platform

An Agentic AI platform tailored for the **Financial Services, Banking & FinTech sector** that automates software requirements elicitation, statutory compliance analysis, quality auditing, and hybrid Software Development Life Cycle (SDLC) selection.

## Overview
Gathering software requirements in banking and financial institutions is complex because financial transactions involve strict data protection constraints (PCI-DSS 4.0, RBI CSF), multi-jurisdiction compliance (GDPR, SOX 404, Basel III), diverse stakeholders (CISO, Head of Compliance, Enterprise Architect, CRO, Product Lead, Auditor), and zero-tolerance failure consequences. FinReq AI coordinates specialized agents to transform unstructured financial scenarios or stakeholder documents into IEEE 830–aligned specifications and a justified, project-specific SDLC workflow.

## Core Capabilities
- **PCI / PII Privacy Guardrail:** Automatically detects and redacts sensitive cardholder data (PAN, CVV), bank accounts/IBANs, government IDs (Aadhaar, SSN), emails, phone numbers, and cloud API keys before inference, and blocks prompt-injection attempts.
- **Financial Regulatory RAG:** Retrieves versioned, jurisdiction-tagged clauses from a financial regulatory knowledge base (**PCI-DSS v4.0, RBI Cyber Security Framework & DLG 2023, GDPR Data Sovereignty, Basel III/IV BCBS 239, SOX 404, ISO 20022 Interbank Clearing, SEBI/SEC Algo Risk, ISO/IEC 25010**) to ground requirements with citations and confidence scores.
- **Hybrid Requirements Extraction & Quality Audit (Agent 1):** Supports optional live `gemini-2.5-flash` LLM inference (via user-provided API key) alongside a local RAG-grounded engine. Produces Functional Requirements (FR), Non-Functional Requirements (NFR), ambiguity checks, stakeholder conflict detection, a Financial Risk Register, and an IEEE 830 Requirements Traceability Matrix (RTM).
- **Adaptive Clarification Interviews:** Identifies unstated financial constraints (peak TPS/concurrency, regulatory jurisdiction, disaster recovery RTO/RPO, payment clearing rails, release governance) and dynamically updates requirements and SDLC scores when answered.
- **Hybrid MCDA SDLC Selection (Agent 2):** Evaluates 8 quantitative financial project factors using Multi-Criteria Decision Analysis (MCDA) and 6 deterministic rules to rank 6 SDLC models (*Waterfall, V-Model, Spiral, Agile, DevSecOps, Agile–DevSecOps Hybrid*), with live interactive factor sliders and 5-phase financial workflows.
- **Human-in-the-Loop (HITL) Governance & SRS Export:** Supports per-requirement approval/flagging, reviewer SDLC sign-off, a live agent audit trail, and one-click export to an IEEE 830 Markdown SRS.
- **Accessible Zero-Blue Emerald Design:** Built specifically with an Emerald Jade & Charcoal Onyx palette, meeting high-contrast accessibility standards without blue tones.

## Tech Stack
- **Frontend:** React 19, Vite, Lucide Icons, Custom CSS (Emerald & Charcoal Onyx theme)
- **Agent & Decision Layer:** Modular ES6 JavaScript (Orchestrator, Privacy Guard, Local RAG Retriever, Requirement Agent, Clarification Agent, MCDA SDLC Agent)
- **Optional LLM Integration:** Google Gemini API (`gemini-2.5-flash`)
- **Testing:** Node.js built-in test assertions (`node:assert/strict`)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Open the local URL shown in the terminal (typically `http://localhost:5173/`).

### Run Automated Verification Tests
```bash
node test_agents.mjs
```

### Optional: Enable Live Gemini LLM Mode
By default, the application runs using the built-in Local Financial RAG Engine with no external API key required. To enable live LLM-powered extraction, click **Optional Gemini API Key** in the top bar and paste a valid Gemini API key (held in browser session memory only).

## Project Structure
```text
├── index.html
├── ARCHITECTURE.md
├── README.md
├── test_agents.mjs
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── agents/
    │   ├── orchestrator.js        # Central multi-agent pipeline & audit logger
    │   ├── privacyGuard.js        # PCI/PII masking & prompt-injection guardrail
    │   ├── knowledgeBase.js       # Versioned financial standards & RAG retriever
    │   ├── requirementAgent.js    # Agent 1: FR/NFR extraction, quality & conflict audit
    │   ├── clarificationAgent.js  # Adaptive financial interview gap analysis
    │   ├── sdlcAgent.js           # Agent 2: 8-factor MCDA & 6-model SDLC engine
    │   └── presets.js             # Financial case studies & SDLC rule profiles
    └── utils/
        └── srsExporter.js         # IEEE 830 Markdown SRS & audit trail exporter
```

## Documentation
See [ARCHITECTURE.md](ARCHITECTURE.md) for the detailed pipeline architecture and module responsibilities.

