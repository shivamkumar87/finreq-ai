import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  Sliders,
  ChevronDown,
  ChevronUp,
  Award,
  Upload,
  Key,
  Activity,
  MessageSquare,
  FileText,
  RefreshCw,
  CheckCircle,
  Flag,
  Loader2,
  BookOpen,
  GitBranch,
  ClipboardCheck,
  RotateCcw,
  Layers
} from 'lucide-react';
import { AgentOrchestrator } from './agents/orchestrator.js';
import { SdlcAgent } from './agents/sdlcAgent.js';
import { FINANCIAL_PRESETS, FINANCIAL_SDLC_EXAMPLES } from './agents/presets.js';
import { STAKEHOLDER_ROLES } from './agents/knowledgeBase.js';
import { generateSRSMarkdown } from './utils/srsExporter.js';

const orchestrator = new AgentOrchestrator();
const liveSdlcAgent = new SdlcAgent();

const FACTOR_LABELS = [
  { key: 'requirementStability', label: 'Requirement Stability' },
  { key: 'changeFrequency', label: 'Change Frequency' },
  { key: 'regulatoryCriticality', label: 'Regulatory Criticality' },
  { key: 'securityRisk', label: 'Security & PCI/PII Risk' },
  { key: 'technicalUncertainty', label: 'Technical Uncertainty' },
  { key: 'failureConsequence', label: 'Financial Failure Impact' },
  { key: 'continuousDeploymentNeed', label: 'Continuous Deployment' },
  { key: 'formalVerificationNeed', label: 'Formal Verification & Audit' }
];

function RequirementCard({ item, kind, status, isExpanded, onToggleExpand, onDecision }) {
  const cardClass = status === 'Approved'
    ? 'approved'
    : status === 'Flagged for Revision'
      ? 'flagged'
      : '';

  const hasExtraDetails = Boolean(
    item.userStory ||
    item.businessJustification ||
    item.applicableRegulations?.length ||
    (item.acceptanceCriteria?.length || 0) > 2
  );

  return (
    <div className={`req-card ${cardClass}`}>
      <div className="req-top">
        <span className="req-id">{item.id}</span>
        <div className="badge-row" style={{ marginTop: 0 }}>
          <span className="mini-badge">{kind === 'fr' ? item.priority : item.category}</span>
          {item.riskLevel && <span className="mini-badge">{item.riskLevel} Risk</span>}
          <span className="mini-badge good">
            {Math.round((item.confidence || (kind === 'fr' ? 0.92 : 0.94)) * 100)}% conf
          </span>
        </div>
      </div>

      <div className="req-title">{item.title}</div>
      <p className="req-desc">{item.statement}</p>

      {item.targetMetrics && (
        <div style={{ marginTop: '0.45rem', fontSize: '0.78rem', color: 'var(--accent-light)' }}>
          <strong>Target SLA:</strong> {item.targetMetrics}
        </div>
      )}

      <div className="badge-row">
        {(item.citations || []).map((c) => (
          <span key={c} className="mini-badge cite">{c}</span>
        ))}
        {(item.multiLabels || []).map((lbl) => (
          <span key={lbl} className="mini-badge">{lbl}</span>
        ))}
      </div>

      {item.acceptanceCriteria?.length > 0 && (
        <div className="req-ac">
          <strong>Acceptance Criteria:</strong>
          <ul>
            {(isExpanded ? item.acceptanceCriteria : item.acceptanceCriteria.slice(0, 2)).map((ac, i) => (
              <li key={i}>{ac}</li>
            ))}
          </ul>
        </div>
      )}

      {isExpanded && (
        <div className="detail-block">
          {item.sourceStakeholder && (
            <div><strong>Source Stakeholder:</strong> {item.sourceStakeholder}</div>
          )}
          {item.userStory && (
            <div><strong>User Story:</strong> <em>{item.userStory}</em></div>
          )}
          {item.businessJustification && (
            <div><strong>Business Justification:</strong> {item.businessJustification}</div>
          )}
          {item.applicableRegulations?.length > 0 && (
            <div><strong>Applicable Regulations:</strong> {item.applicableRegulations.join(', ')}</div>
          )}
        </div>
      )}

      <div className="hitl-bar">
        <div className="config-group">
          <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)' }}>
            Status: <strong>{status || 'Pending Review'}</strong>
          </span>
          {hasExtraDetails && (
            <button type="button" className="inline-link-btn" onClick={onToggleExpand}>
              {isExpanded ? <><ChevronUp size={13} /> Less</> : <><ChevronDown size={13} /> Details</>}
            </button>
          )}
        </div>

        <div className="config-group">
          <button
            type="button"
            className={`hitl-btn approve ${status === 'Approved' ? 'active' : ''}`}
            onClick={() => onDecision(item.id, 'Approved')}
          >
            <CheckCircle size={12} /> Approve
          </button>
          <button
            type="button"
            className={`hitl-btn flag ${status === 'Flagged for Revision' ? 'active' : ''}`}
            onClick={() => onDecision(item.id, 'Flagged for Revision')}
          >
            <Flag size={12} /> Flag
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const initialPreset = FINANCIAL_PRESETS[0];

  const [scenarioInput, setScenarioInput] = useState(initialPreset.scenarioDescription);
  const [scenarioTitle, setScenarioTitle] = useState(initialPreset.title);
  const [activePresetKey, setActivePresetKey] = useState(initialPreset.id);
  const [stakeholderRole, setStakeholderRole] = useState(initialPreset.defaultRole || 'ciso');
  const [apiKey, setApiKey] = useState('');
  const [showApiConfig, setShowApiConfig] = useState(false);
  const [uploadedDocName, setUploadedDocName] = useState('');

  const [presetTab, setPresetTab] = useState('financial');
  const [agent1Tab, setAgent1Tab] = useState('reqs');
  const [reqFilter, setReqFilter] = useState('all');
  const [expandedReqIds, setExpandedReqIds] = useState({});
  const [expandedModelId, setExpandedModelId] = useState(null);
  const [expandedPhaseNumbers, setExpandedPhaseNumbers] = useState({});

  const [pipelineResult, setPipelineResult] = useState(null);
  const [baselineFactors, setBaselineFactors] = useState(null);
  const [isManuallyTuned, setIsManuallyTuned] = useState(false);

  const [clarificationAnswers, setClarificationAnswers] = useState({});
  const [approvalMap, setApprovalMap] = useState({});
  const [reviewerName, setReviewerName] = useState('A. Mehta (CISO / Risk Lead)');
  const [sdlcSignOff, setSdlcSignOff] = useState(null);

  const [auditFilter, setAuditFilter] = useState('all');
  const [auditCollapsed, setAuditCollapsed] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const privacyRef = useRef(null);
  const clarifRef = useRef(null);
  const agent1Ref = useRef(null);
  const agent2Ref = useRef(null);

  const executePipeline = async ({
    text = scenarioInput,
    title = scenarioTitle,
    role = stakeholderRole,
    answers = clarificationAnswers,
    factors = {},
    docName = uploadedDocName
  } = {}) => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await orchestrator.runPipeline(text, {
        stakeholderRole: role,
        clarificationAnswers: answers,
        customFactors: factors,
        apiKey,
        uploadedDocName: docName
      });
      setPipelineResult(result);
      setBaselineFactors(result.sdlcResult?.evaluatedFactors || null);
      setIsManuallyTuned(false);
      setScenarioTitle(title);
      setApprovalMap({});
      setExpandedReqIds({});
      setExpandedPhaseNumbers({});
      setReqFilter('all');
      setSdlcSignOff(null);
    } catch (err) {
      setErrorMessage(err.message || 'Unable to process this financial scenario.');
      setPipelineResult((prev) => (err.logs ? { ...(prev || {}), logs: err.logs, failed: true } : null));
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    executePipeline({
      text: initialPreset.scenarioDescription,
      title: initialPreset.title,
      role: initialPreset.defaultRole,
      factors: initialPreset.defaultFactors
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectFinancialPreset = (preset) => {
    setScenarioInput(preset.scenarioDescription);
    setStakeholderRole(preset.defaultRole || 'ciso');
    setActivePresetKey(preset.id);
    setClarificationAnswers({});
    setUploadedDocName('');
    executePipeline({
      text: preset.scenarioDescription,
      title: preset.title,
      role: preset.defaultRole || 'ciso',
      answers: {},
      factors: preset.defaultFactors
    });
  };

  const handleSelectRuleExample = (spec, idx) => {
    setScenarioInput(spec.scenario);
    setActivePresetKey(`rule-${idx}`);
    setClarificationAnswers({});
    setUploadedDocName('');
    executePipeline({
      text: spec.scenario,
      title: spec.title,
      role: stakeholderRole,
      answers: {},
      factors: {}
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result || '').trim();
      if (content) {
        const merged = `${scenarioInput.trim()}\n\n[Uploaded Document: ${file.name}]\n${content.slice(0, 3000)}`;
        setScenarioInput(merged);
        setUploadedDocName(file.name);
        setActivePresetKey('');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSliderChange = (factorKey, newValue) => {
    if (!pipelineResult?.requirementResult || !pipelineResult?.sdlcResult) return;
    const updatedFactors = {
      ...pipelineResult.sdlcResult.evaluatedFactors,
      [factorKey]: Number(newValue),
      _fromSlider: true
    };
    const updatedSdlc = liveSdlcAgent.evaluateSDLC(
      pipelineResult.requirementResult,
      updatedFactors,
      clarificationAnswers
    );
    setPipelineResult((prev) => ({
      ...prev,
      sdlcResult: updatedSdlc
    }));
    setIsManuallyTuned(true);
    setSdlcSignOff(null);
  };

  const handleResetSliders = () => {
    if (!pipelineResult?.requirementResult || !baselineFactors) return;
    const restoredSdlc = liveSdlcAgent.evaluateSDLC(
      pipelineResult.requirementResult,
      baselineFactors,
      clarificationAnswers
    );
    setPipelineResult((prev) => ({
      ...prev,
      sdlcResult: restoredSdlc
    }));
    setIsManuallyTuned(false);
    setSdlcSignOff(null);
  };

  const handleRequirementDecision = (reqId, status) => {
    setApprovalMap((prev) => ({ ...prev, [reqId]: status }));
    setPipelineResult((prev) => {
      if (!prev) return prev;
      const newLog = {
        id: `hitl-${Date.now()}-${reqId}`,
        timestamp: new Date().toLocaleTimeString(),
        agent: 'Human-in-the-Loop Gate',
        phase: 'Requirement Review',
        message: `${reviewerName || 'Reviewer'} marked ${reqId} as "${status}".`,
        status: status === 'Flagged for Revision' ? 'warn' : 'ok'
      };
      return { ...prev, logs: [...(prev.logs || []), newLog] };
    });
  };

  const handleApproveRemaining = () => {
    const reqs = pipelineResult?.requirementResult;
    if (!reqs) return;
    const allReqs = [...reqs.functionalRequirements, ...reqs.nonFunctionalRequirements];
    const pendingIds = allReqs.filter((r) => !approvalMap[r.id]).map((r) => r.id);
    if (pendingIds.length === 0) return;

    setApprovalMap((prev) => {
      const next = { ...prev };
      pendingIds.forEach((id) => {
        next[id] = 'Approved';
      });
      return next;
    });

    setPipelineResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        logs: [
          ...(prev.logs || []),
          {
            id: `hitl-batch-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            agent: 'Human-in-the-Loop Gate',
            phase: 'Batch Approval',
            message: `${reviewerName || 'Reviewer'} approved ${pendingIds.length} remaining requirement(s): ${pendingIds.join(', ')}.`,
            status: 'ok'
          }
        ]
      };
    });
  };

  const handleSdlcSignOff = (status) => {
    const roleLabel = STAKEHOLDER_ROLES.find((r) => r.id === stakeholderRole)?.label || stakeholderRole;
    const record = {
      status,
      reviewer: reviewerName.trim() || 'Authorized Financial Reviewer',
      role: roleLabel,
      timestamp: new Date().toLocaleTimeString()
    };
    setSdlcSignOff(record);
    setPipelineResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        logs: [
          ...(prev.logs || []),
          {
            id: `sdlc-hitl-${Date.now()}`,
            timestamp: record.timestamp,
            agent: 'Human-in-the-Loop Gate',
            phase: 'SDLC Sign-Off',
            message: `${record.reviewer} (${record.role}) marked SDLC "${prev.sdlcResult.recommendedModel}" as ${status}.`,
            status: status === 'Approved' ? 'ok' : 'warn'
          }
        ]
      };
    });
  };

  const buildCurrentMarkdown = () =>
    generateSRSMarkdown({
      title: scenarioTitle,
      scenarioText: pipelineResult.privacyResult?.maskedText || scenarioInput,
      privacyResult: pipelineResult.privacyResult,
      requirementResult: pipelineResult.requirementResult,
      sdlcResult: pipelineResult.sdlcResult,
      approvalMap,
      sdlcSignOff,
      auditLogs: pipelineResult.logs || []
    });

  const handleExportSRS = () => {
    if (!pipelineResult?.requirementResult || !pipelineResult?.sdlcResult) return;
    const md = buildCurrentMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Financial_SRS_SDLC_${scenarioTitle.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    if (!pipelineResult?.requirementResult || !pipelineResult?.sdlcResult) return;
    navigator.clipboard.writeText(buildCurrentMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToRef = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const reqData = pipelineResult?.requirementResult;
  const sdlcData = pipelineResult?.sdlcResult;
  const clarifications = pipelineResult?.clarifications || [];
  const privacyResult = pipelineResult?.privacyResult;
  const logs = pipelineResult?.logs || [];

  const frList = reqData?.functionalRequirements || [];
  const nfrList = reqData?.nonFunctionalRequirements || [];
  const totalReqs = frList.length + nfrList.length;

  const approvedCount = Object.values(approvalMap).filter((v) => v === 'Approved').length;
  const flaggedCount = Object.values(approvalMap).filter((v) => v === 'Flagged for Revision').length;
  const pendingCount = Math.max(0, totalReqs - approvedCount - flaggedCount);

  const answeredClarifCount = clarifications.filter((q) => Boolean(clarificationAnswers[q.id])).length;

  const matchesReqFilter = (id) => {
    const status = approvalMap[id];
    if (reqFilter === 'approved') return status === 'Approved';
    if (reqFilter === 'flagged') return status === 'Flagged for Revision';
    if (reqFilter === 'pending') return !status;
    return true;
  };

  const filteredFRs = frList.filter((r) => matchesReqFilter(r.id));
  const filteredNFRs = nfrList.filter((r) => matchesReqFilter(r.id));

  const visibleLogs = auditFilter === 'issues'
    ? logs.filter((l) => l.status === 'warn' || l.status === 'error')
    : logs;

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <div className="header-badge">
          <Layers size={14} /> FinReq AI / Financial RE &amp; SDLC Platform
        </div>
        <h1>Financial Requirements Engineering &amp; SDLC Architect</h1>
        <p>
          Multi-stage analysis for <strong>Financial Services &amp; Banking Systems</strong>: PCI/PII redaction, regulatory mapping (PCI-DSS 4.0, RBI CSF, Basel III, SOX 404, ISO 20022), gap clarification, MCDA SDLC selection, and review sign-off.
        </p>
      </header>

      <section className="config-strip">
        <div className="config-group">
          <span className="config-label">
            <Shield size={14} /> Stakeholder Role:
          </span>
          <select
            className="role-select"
            value={stakeholderRole}
            onChange={(e) => setStakeholderRole(e.target.value)}
          >
            {STAKEHOLDER_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="config-group">
          <span className={`mode-pill ${apiKey.trim().length > 10 ? 'live' : ''}`}>
            {apiKey.trim().length > 10 ? 'Live Gemini LLM + RAG Ready' : 'Local Financial RAG Engine'}
          </span>
          <button
            type="button"
            className="sample-pill-btn"
            onClick={() => setShowApiConfig((v) => !v)}
          >
            <Key size={13} /> {showApiConfig ? 'Hide LLM Key' : 'Optional Gemini API Key'}
          </button>
          {showApiConfig && (
            <input
              type="password"
              className="api-input"
              placeholder="Paste Gemini API Key (optional)..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          )}
        </div>
      </section>

      <section className="input-card">
        <div className="preset-tabs-header">
          <div className="tab-group">
            <button
              type="button"
              className={`preset-tab-btn ${presetTab === 'financial' ? 'active' : ''}`}
              onClick={() => setPresetTab('financial')}
            >
              Financial Case Studies ({FINANCIAL_PRESETS.length})
            </button>
            <button
              type="button"
              className={`preset-tab-btn ${presetTab === 'rules' ? 'active' : ''}`}
              onClick={() => setPresetTab('rules')}
            >
              SDLC Rule Profiles ({FINANCIAL_SDLC_EXAMPLES.length})
            </button>
          </div>

          <div className="config-group">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="sample-pill-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} /> {uploadedDocName ? `Attached: ${uploadedDocName}` : 'Upload Transcript / Policy (.txt, .md)'}
            </button>
          </div>
        </div>

        <div className="sample-pills">
          {presetTab === 'financial'
            ? FINANCIAL_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={`sample-pill-btn ${activePresetKey === preset.id ? 'active' : ''}`}
                  onClick={() => handleSelectFinancialPreset(preset)}
                  title={preset.category}
                >
                  {preset.title.split('&')[0].trim()}
                </button>
              ))
            : FINANCIAL_SDLC_EXAMPLES.map((spec, idx) => (
                <button
                  type="button"
                  key={idx}
                  className={`sample-pill-btn spec-rule-pill ${activePresetKey === `rule-${idx}` ? 'active' : ''}`}
                  onClick={() => handleSelectRuleExample(spec, idx)}
                  title={spec.title}
                >
                  {spec.label}
                </button>
              ))}
        </div>

        <textarea
          className="scenario-textarea"
          value={scenarioInput}
          onChange={(e) => {
            setScenarioInput(e.target.value);
            if (activePresetKey) setActivePresetKey('');
          }}
          placeholder="Describe your financial module, clearing rail, core banking workflow, or paste policy notes (include a sample PAN 4111-2222-3333-4444 or account number to test automatic PCI/PII masking)..."
        />

        <div className="action-bar">
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {scenarioInput.trim().length} characters | PCI/PII masked prior to inference
          </span>

          <div className="config-group">
            {reqData && sdlcData && !pipelineResult?.failed && (
              <>
                <button type="button" className="sample-pill-btn" onClick={handleExportSRS}>
                  <Download size={14} /> Export IEEE 830 SRS (.md)
                </button>
                <button type="button" className="sample-pill-btn" onClick={handleCopySummary}>
                  {copied ? <Check size={14} color="var(--accent)" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy SRS'}
                </button>
              </>
            )}

            <button
              type="button"
              className="submit-btn"
              disabled={isProcessing || !scenarioInput.trim()}
              onClick={() => executePipeline({ text: scenarioInput, title: scenarioTitle || 'Custom Financial Scenario' })}
            >
              {isProcessing ? (
                <><Loader2 size={15} className="spin" /> Running Pipeline...</>
              ) : (
                <>Run Analysis <ArrowRight size={15} /></>
              )}
            </button>
          </div>
        </div>
      </section>

      {reqData && sdlcData && !pipelineResult?.failed && (
        <nav className="pipeline-bar" aria-label="Pipeline stage summary">
          <button
            type="button"
            className={`pipeline-step ${privacyResult?.totalRedacted > 0 ? 'warn' : ''}`}
            onClick={() => scrollToRef(privacyRef)}
          >
            <Shield size={15} className="pipeline-step-icon" />
            <div style={{ minWidth: 0 }}>
              <div className="pipeline-step-title">1. Privacy Guard</div>
              <div className="pipeline-step-metric">
                {privacyResult?.totalRedacted > 0
                  ? `${privacyResult.totalRedacted} token(s) masked`
                  : '0 raw IDs exposed'}
              </div>
            </div>
          </button>

          <button
            type="button"
            className="pipeline-step"
            onClick={() => {
              setAgent1Tab('rtm');
              scrollToRef(agent1Ref);
            }}
          >
            <BookOpen size={15} className="pipeline-step-icon" />
            <div style={{ minWidth: 0 }}>
              <div className="pipeline-step-title">2. Regulatory RAG</div>
              <div className="pipeline-step-metric">{reqData.retrievedKnowledge.length} clauses matched</div>
            </div>
          </button>

          <button
            type="button"
            className="pipeline-step"
            onClick={() => {
              setAgent1Tab('reqs');
              scrollToRef(agent1Ref);
            }}
          >
            <ClipboardCheck size={15} className="pipeline-step-icon" />
            <div style={{ minWidth: 0 }}>
              <div className="pipeline-step-title">3. Requirements</div>
              <div className="pipeline-step-metric">
                {totalReqs} reqs | Quality {reqData.qualityReport.overallScore}/100
              </div>
            </div>
          </button>

          <button
            type="button"
            className="pipeline-step"
            onClick={() => scrollToRef(clarifRef)}
          >
            <MessageSquare size={15} className="pipeline-step-icon" />
            <div style={{ minWidth: 0 }}>
              <div className="pipeline-step-title">4. Clarification</div>
              <div className="pipeline-step-metric">
                {answeredClarifCount}/{clarifications.length} answered
              </div>
            </div>
          </button>

          <button
            type="button"
            className="pipeline-step"
            onClick={() => scrollToRef(agent2Ref)}
          >
            <GitBranch size={15} className="pipeline-step-icon" />
            <div style={{ minWidth: 0 }}>
              <div className="pipeline-step-title">5. SDLC Architect</div>
              <div className="pipeline-step-metric">
                {sdlcData.recommendedModel} ({sdlcData.suitabilityScore})
              </div>
            </div>
          </button>
        </nav>
      )}

      <div ref={privacyRef}>
        {privacyResult && privacyResult.totalRedacted > 0 && (
          <div className="info-banner privacy">
            <Shield size={20} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>PCI/PII Privacy Guardrail Active:</strong> Redacted{' '}
              <strong>{privacyResult.totalRedacted} sensitive financial/PII item(s)</strong> (
              {privacyResult.redactions.map((r) => `${r.count} ${r.type}`).join(', ')}) before running requirements analysis.
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="info-banner error">
          <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Guardrail Rejection:</strong> {errorMessage}
          </div>
        </div>
      )}

      {reqData && clarifications.length > 0 && !pipelineResult?.failed && (
        <section className="clarif-card" ref={clarifRef}>
          <div className="clarif-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.96rem' }}>
                <MessageSquare size={16} color="var(--accent-light)" />
                Adaptive Clarification ({answeredClarifCount}/{clarifications.length} Answered)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Select unstated financial constraints and re-run to refine NFR SLAs and SDLC factor weights.
              </div>
            </div>
            <div className="config-group">
              {answeredClarifCount > 0 && (
                <button
                  type="button"
                  className="sample-pill-btn"
                  onClick={() => {
                    setClarificationAnswers({});
                    executePipeline({ answers: {} });
                  }}
                  disabled={isProcessing}
                >
                  <RotateCcw size={13} /> Clear
                </button>
              )}
              <button
                type="button"
                className="sample-pill-btn"
                style={{ borderColor: 'rgba(16, 185, 129, 0.5)', color: 'var(--accent-light)' }}
                onClick={() => executePipeline({ answers: clarificationAnswers })}
                disabled={isProcessing}
              >
                <RefreshCw size={13} /> Apply &amp; Re-Analyze
              </button>
            </div>
          </div>

          <div className="clarif-grid">
            {clarifications.map((q) => (
              <div key={q.id} className={`clarif-item ${clarificationAnswers[q.id] ? 'answered' : ''}`}>
                <div className="clarif-topic">{q.topic}</div>
                <div className="clarif-q">{q.question}</div>
                <select
                  className="clarif-select"
                  value={clarificationAnswers[q.id] || ''}
                  onChange={(e) =>
                    setClarificationAnswers((prev) => ({
                      ...prev,
                      [q.id]: e.target.value
                    }))
                  }
                >
                  <option value="">-- Select financial constraint (optional) --</option>
                  {q.options.map((opt, idx) => (
                    <option key={idx} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {reqData && sdlcData && !pipelineResult?.failed && (
        <main className="agents-grid">
          <article className="agent-panel agent-1" ref={agent1Ref}>
            <header className="agent-panel-header">
              <span className="agent-meta-tag">Agent 1: Requirements &amp; Compliance Engineer</span>
              <h2 className="agent-panel-title">Requirements, Quality Audit &amp; RAG Grounding</h2>
              <div className="badge-row">
                <span className="mini-badge">{reqData.domain}</span>
                <span className="mini-badge good">Quality: {reqData.qualityReport.overallScore}/100</span>
                <span className="mini-badge">Avg Confidence: {Math.round(reqData.metrics.averageConfidence * 100)}%</span>
                <span className="mini-badge">Approved: {approvedCount}/{totalReqs}</span>
              </div>
            </header>

            <div className="subtabs">
              <button
                type="button"
                className={`subtab-btn ${agent1Tab === 'reqs' ? 'active' : ''}`}
                onClick={() => setAgent1Tab('reqs')}
              >
                FR &amp; NFR ({totalReqs})
              </button>
              <button
                type="button"
                className={`subtab-btn ${agent1Tab === 'quality' ? 'active' : ''}`}
                onClick={() => setAgent1Tab('quality')}
              >
                Ambiguities &amp; Conflicts ({reqData.qualityReport.ambiguities.length + reqData.qualityReport.conflicts.length})
              </button>
              <button
                type="button"
                className={`subtab-btn ${agent1Tab === 'rtm' ? 'active' : ''}`}
                onClick={() => setAgent1Tab('rtm')}
              >
                RAG Sources &amp; RTM ({reqData.retrievedKnowledge.length})
              </button>
            </div>

            {agent1Tab === 'reqs' && (
              <>
                <div className="filter-bar">
                  <div className="filter-pills">
                    {[
                      { id: 'all', label: `All (${totalReqs})` },
                      { id: 'pending', label: `Pending (${pendingCount})` },
                      { id: 'approved', label: `Approved (${approvedCount})` },
                      { id: 'flagged', label: `Flagged (${flaggedCount})` }
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        className={`filter-pill ${reqFilter === f.id ? 'active' : ''}`}
                        onClick={() => setReqFilter(f.id)}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {pendingCount > 0 && (
                    <button type="button" className="inline-link-btn" onClick={handleApproveRemaining}>
                      <CheckCircle size={13} /> Approve Remaining ({pendingCount})
                    </button>
                  )}
                </div>

                <div className="section-heading">
                  <span>Functional Requirements ({filteredFRs.length})</span>
                  <span>Human-in-the-Loop Controls</span>
                </div>
                {filteredFRs.length === 0 ? (
                  <div className="req-card">
                    <p className="req-desc">No functional requirements match the selected filter.</p>
                  </div>
                ) : (
                  <div className="req-list">
                    {filteredFRs.map((fr) => (
                      <RequirementCard
                        key={fr.id}
                        item={fr}
                        kind="fr"
                        status={approvalMap[fr.id]}
                        isExpanded={Boolean(expandedReqIds[fr.id])}
                        onToggleExpand={() =>
                          setExpandedReqIds((prev) => ({ ...prev, [fr.id]: !prev[fr.id] }))
                        }
                        onDecision={handleRequirementDecision}
                      />
                    ))}
                  </div>
                )}

                <div className="section-heading" style={{ marginTop: '1.35rem' }}>
                  <span>Non-Functional Requirements ({filteredNFRs.length})</span>
                  <span>Quantified Financial SLAs</span>
                </div>
                {filteredNFRs.length === 0 ? (
                  <div className="req-card">
                    <p className="req-desc">No non-functional requirements match the selected filter.</p>
                  </div>
                ) : (
                  <div className="req-list">
                    {filteredNFRs.map((nfr) => (
                      <RequirementCard
                        key={nfr.id}
                        item={nfr}
                        kind="nfr"
                        status={approvalMap[nfr.id]}
                        isExpanded={Boolean(expandedReqIds[nfr.id])}
                        onToggleExpand={() =>
                          setExpandedReqIds((prev) => ({ ...prev, [nfr.id]: !prev[nfr.id] }))
                        }
                        onDecision={handleRequirementDecision}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {agent1Tab === 'quality' && (
              <div>
                <div className="section-heading">
                  <span>Vague / Ambiguous Terms ({reqData.qualityReport.ambiguities.length})</span>
                  <span>{reqData.qualityReport.testabilityRating}</span>
                </div>
                {reqData.qualityReport.ambiguities.length === 0 ? (
                  <div className="req-card">
                    <p className="req-desc">No unquantified vague terms detected. Requirements meet IEEE 830 testability criteria.</p>
                  </div>
                ) : (
                  <div className="req-list">
                    {reqData.qualityReport.ambiguities.map((a, idx) => (
                      <div key={idx} className="req-card flagged">
                        <div className="req-title">Ambiguous Term: &ldquo;{a.term}&rdquo;</div>
                        <p className="req-desc">{a.finding}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--accent-light)', marginTop: '0.35rem' }}>
                          <strong>Fix:</strong> {a.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="section-heading" style={{ marginTop: '1.25rem' }}>
                  <span>Stakeholder &amp; Requirement Conflicts ({reqData.qualityReport.conflicts.length})</span>
                </div>
                {reqData.qualityReport.conflicts.length === 0 ? (
                  <div className="req-card">
                    <p className="req-desc">No conflicting stakeholder constraints detected in this scenario.</p>
                  </div>
                ) : (
                  <div className="req-list">
                    {reqData.qualityReport.conflicts.map((c) => (
                      <div key={c.id} className="req-card flagged">
                        <div className="req-id">{c.id}</div>
                        <div className="req-title">{c.title}</div>
                        <p className="req-desc">{c.description}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--accent-light)', marginTop: '0.35rem' }}>
                          <strong>Suggested Resolution:</strong> {c.resolution}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="section-heading" style={{ marginTop: '1.25rem' }}>
                  <span>Financial Risk Register ({reqData.riskRegister.length})</span>
                </div>
                <div className="req-list">
                  {reqData.riskRegister.map((r) => (
                    <div key={r.id} className="req-card">
                      <div className="req-top">
                        <span className="req-id">{r.id} | {r.category}</span>
                        <span className="mini-badge">{r.severity}</span>
                      </div>
                      <p className="req-desc">{r.risk}</p>
                      <p style={{ fontSize: '0.79rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                        <strong>Mitigation:</strong> {r.mitigation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {agent1Tab === 'rtm' && (
              <div>
                <div className="section-heading">
                  <span>Retrieved Financial Regulatory Clauses (RAG)</span>
                </div>
                <div className="req-list">
                  {reqData.retrievedKnowledge.map((kb) => (
                    <div key={kb.id} className="req-card">
                      <div className="req-top">
                        <span className="mini-badge cite">{kb.citation}</span>
                        <span className="mini-badge good">{Math.round(kb.confidence * 100)}% match</span>
                      </div>
                      <div className="req-title">{kb.title}</div>
                      <p className="req-desc">{kb.requirement}</p>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                        Jurisdiction: {kb.jurisdiction} | Effective: {kb.effectiveDate}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="section-heading" style={{ marginTop: '1.25rem' }}>
                  <span>IEEE 830 Requirements Traceability Matrix (RTM)</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="compact-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Requirement</th>
                        <th>Citations</th>
                        <th>Verification Gate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reqData.traceabilityMatrix.map((row) => (
                        <tr key={row.requirementId}>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-light)' }}>{row.requirementId}</td>
                          <td>{row.title}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{row.citations}</td>
                          <td>{row.verificationStage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </article>

          <article className="agent-panel agent-2" ref={agent2Ref}>
            <header className="agent-panel-header">
              <span className="agent-meta-tag">Agent 2: SDLC Architect (MCDA)</span>
              <h2 className="agent-panel-title">SDLC Selection, Factor Tuning &amp; Workflow</h2>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                Evaluates 8 quantitative financial factors using weighted MCDA scoring and 6 deterministic governance rules.
              </p>
            </header>

            <div className="sdlc-highlight">
              <div className="req-top">
                <span style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent-light)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Award size={14} /> Primary Recommendation
                </span>
                <span className="mini-badge good">{sdlcData.suitabilityScore} Suitability</span>
              </div>
              <div className="sdlc-name">{sdlcData.recommendedModel}</div>
              {sdlcData.primaryModel?.triggeredRule && (
                <div className="rule-tag">Rule Matched: {sdlcData.primaryModel.triggeredRule}</div>
              )}
              <p className="req-desc" style={{ marginTop: '0.45rem' }}>{sdlcData.justification}</p>

              <div className="signoff-box">
                <input
                  type="text"
                  className="role-select"
                  style={{ width: 175 }}
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Reviewer Name"
                />
                <button
                  type="button"
                  className={`hitl-btn approve ${sdlcSignOff?.status === 'Approved' ? 'active' : ''}`}
                  onClick={() => handleSdlcSignOff('Approved')}
                >
                  <CheckCircle size={13} /> Approve SDLC
                </button>
                <button
                  type="button"
                  className={`hitl-btn flag ${sdlcSignOff?.status === 'Revision Requested' ? 'active' : ''}`}
                  onClick={() => handleSdlcSignOff('Revision Requested')}
                >
                  <Flag size={13} /> Request Revision
                </button>
                {sdlcSignOff && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--accent-light)' }}>
                    Recorded: {sdlcSignOff.status} ({sdlcSignOff.timestamp})
                  </span>
                )}
              </div>
            </div>

            <div className="section-heading">
              <span>Ranked SDLC Models (6 Evaluated)</span>
              <span>Click any model for trade-offs</span>
            </div>
            <div>
              {sdlcData.rankedRecommendations.map((model) => {
                const isOpen = expandedModelId === model.id;
                return (
                  <div key={model.id} className={`mcda-card ${model.rank === 1 ? 'primary' : ''}`}>
                    <div
                      className="mcda-row"
                      onClick={() => setExpandedModelId(isOpen ? null : model.id)}
                    >
                      <div className="rank-num">#{model.rank}</div>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.9rem' }}>{model.name}</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{model.matchLevel}</span>
                        </div>
                        <div className="score-bar-track">
                          <div className="score-bar-fill" style={{ width: model.suitabilityScore }} />
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {model.suitabilityScore}
                        {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mcda-details">
                        <p className="req-desc">{model.rationale}</p>
                        <div className="pros-cons">
                          <div>
                            <strong style={{ color: 'var(--accent-light)' }}>Strengths:</strong>
                            <ul style={{ marginLeft: '1rem', marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                              {model.pros.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          </div>
                          <div>
                            <strong style={{ color: 'var(--danger)' }}>Constraints:</strong>
                            <ul style={{ marginLeft: '1rem', marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                              {model.cons.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="section-heading" style={{ marginTop: '1.15rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Sliders size={13} /> Interactive Decision Factors (Drag to Re-Rank Live)
              </span>
              {isManuallyTuned && (
                <button type="button" className="inline-link-btn" onClick={handleResetSliders}>
                  <RotateCcw size={12} /> Reset Sliders
                </button>
              )}
            </div>
            <div className="sliders-grid">
              {FACTOR_LABELS.map(({ key, label }) => (
                <div key={key} className="slider-tile">
                  <div className="slider-top">
                    <span>{label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-light)' }}>
                      {sdlcData.evaluatedFactors[key]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="slider-input"
                    value={sdlcData.evaluatedFactors[key]}
                    onChange={(e) => handleSliderChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div className="section-heading" style={{ marginTop: '1.25rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <FileText size={13} /> 5-Phase Financial Workflow (Click phase to expand)
              </span>
              <span>{sdlcData.recommendedModel}</span>
            </div>
            <div>
              {sdlcData.projectWorkflow.map((phase) => {
                const isOpen = Boolean(expandedPhaseNumbers[phase.phaseNumber]);
                return (
                  <div
                    key={phase.phaseNumber}
                    className="phase-card"
                    onClick={(e) => {
                      if (e.target.closest('.phase-details')) return;
                      setExpandedPhaseNumbers((prev) => ({
                        ...prev,
                        [phase.phaseNumber]: !prev[phase.phaseNumber]
                      }));
                    }}
                  >
                    <div className="phase-head">
                      <strong>Phase {phase.phaseNumber}: {phase.phaseName}</strong>
                      <div className="config-group">
                        <span className="mini-badge">{phase.durationEstimate}</span>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{phase.objective}</p>
                    <div style={{ fontSize: '0.76rem', color: '#cbd5e1' }}>
                      <strong>Roles:</strong> {phase.responsibleRoles.join(', ')}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--accent-light)', marginTop: '0.2rem' }}>
                      <strong>Compliance Gate:</strong> {phase.complianceCheckpoints}
                    </div>

                    {isOpen && (
                      <div className="phase-details">
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>Key Activities:</strong>
                          <ul>
                            {phase.activities.map((act, i) => <li key={i}>{act}</li>)}
                          </ul>
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>Deliverables:</strong> {phase.deliverables.join('; ')}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>Security Controls:</strong> {phase.securityControls.join('; ')}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>Gate Criteria:</strong> {phase.entryCriteria} -&gt; {phase.exitCriteria}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        </main>
      )}

      {logs.length > 0 && (
        <section className="audit-card">
          <div className="audit-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem' }}>
              <Activity size={16} color="var(--accent)" />
              Execution &amp; Review Audit Trail ({logs.length} Events)
            </div>
            <div className="config-group">
              <div className="filter-pills">
                <button
                  type="button"
                  className={`filter-pill ${auditFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setAuditFilter('all')}
                >
                  All ({logs.length})
                </button>
                <button
                  type="button"
                  className={`filter-pill ${auditFilter === 'issues' ? 'active' : ''}`}
                  onClick={() => setAuditFilter('issues')}
                >
                  Warnings / Errors ({logs.filter((l) => l.status === 'warn' || l.status === 'error').length})
                </button>
              </div>
              <button
                type="button"
                className="sample-pill-btn"
                onClick={() => setAuditCollapsed((v) => !v)}
              >
                {auditCollapsed ? <><ChevronDown size={13} /> Expand</> : <><ChevronUp size={13} /> Collapse</>}
              </button>
            </div>
          </div>

          {!auditCollapsed && (
            <div className="audit-list">
              {visibleLogs.length === 0 ? (
                <div className="audit-row">No warning or error events recorded.</div>
              ) : (
                visibleLogs.map((log) => (
                  <div key={log.id} className={`audit-row ${log.status === 'warn' ? 'warn' : log.status === 'error' ? 'error' : ''}`}>
                    <span className="audit-time">{log.timestamp}</span>
                    <div>
                      <strong>[{log.agent} / {log.phase}]</strong> {log.message}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
