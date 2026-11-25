import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  ChevronDown,
  ChevronUp,
  Upload,
  Key,
  RefreshCw,
  CheckCircle,
  Flag,
  Loader2,
  RotateCcw
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

function RequirementRow({ item, kind, status, isExpanded, onToggleExpand, onDecision }) {
  const rowClass = status === 'Approved'
    ? 'approved'
    : status === 'Flagged for Revision'
      ? 'flagged'
      : '';

  const confPct = Math.round((item.confidence || (kind === 'fr' ? 0.92 : 0.94)) * 100);
  const tagText = kind === 'fr'
    ? `${item.priority}${item.riskLevel ? ` / ${item.riskLevel} Risk` : ''} · ${confPct}%`
    : `${item.category} · ${confPct}%`;

  const hasDetails = Boolean(
    item.userStory ||
    item.businessJustification ||
    item.applicableRegulations?.length ||
    (item.acceptanceCriteria?.length || 0) > 0
  );

  return (
    <div className={`spec-row ${rowClass}`}>
      <div className="spec-row-head">
        <div>
          <span className="spec-id">{item.id}</span>
          <span className="spec-title">{item.title}</span>
        </div>
        <span className="spec-meta">{tagText}</span>
      </div>

      <p className="spec-statement">{item.statement}</p>

      {item.targetMetrics && (
        <div className="spec-sla">Target SLA: {item.targetMetrics}</div>
      )}

      {(item.citations || []).length > 0 && (
        <div className="spec-cites">
          {item.citations.map((c) => (
            <span key={c} className="cite-code">{c}</span>
          ))}
        </div>
      )}

      {isExpanded && (
        <div className="spec-details">
          {item.acceptanceCriteria?.length > 0 && (
            <div>
              <strong>Acceptance Criteria:</strong>
              <ul>
                {item.acceptanceCriteria.map((ac, i) => (
                  <li key={i}>{ac}</li>
                ))}
              </ul>
            </div>
          )}
          {item.sourceStakeholder && (
            <div><strong>Stakeholder:</strong> {item.sourceStakeholder}</div>
          )}
          {item.userStory && (
            <div><strong>User Story:</strong> {item.userStory}</div>
          )}
          {item.businessJustification && (
            <div><strong>Justification:</strong> {item.businessJustification}</div>
          )}
          {item.applicableRegulations?.length > 0 && (
            <div><strong>Regulations:</strong> {item.applicableRegulations.join(', ')}</div>
          )}
        </div>
      )}

      <div className="spec-actions">
        <div className="toolbar-group">
          <span className="meta-note">{status || 'Pending review'}</span>
          {hasDetails && (
            <button type="button" className="text-btn" onClick={onToggleExpand}>
              {isExpanded ? <><ChevronUp size={13} /> Hide details</> : <><ChevronDown size={13} /> Details</>}
            </button>
          )}
        </div>

        <div className="toolbar-group">
          <button
            type="button"
            className={`review-btn approve ${status === 'Approved' ? 'active' : ''}`}
            onClick={() => onDecision(item.id, 'Approved')}
          >
            <CheckCircle size={12} /> Approve
          </button>
          <button
            type="button"
            className={`review-btn flag ${status === 'Flagged for Revision' ? 'active' : ''}`}
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
  const [leftTab, setLeftTab] = useState('reqs');
  const [reqFilter, setReqFilter] = useState('all');
  const [expandedReqIds, setExpandedReqIds] = useState({});
  const [expandedModelId, setExpandedModelId] = useState(null);
  const [expandedPhaseNumbers, setExpandedPhaseNumbers] = useState({});
  const [clarifOpen, setClarifOpen] = useState(false);

  const [pipelineResult, setPipelineResult] = useState(null);
  const [baselineFactors, setBaselineFactors] = useState(null);
  const [isManuallyTuned, setIsManuallyTuned] = useState(false);

  const [clarificationAnswers, setClarificationAnswers] = useState({});
  const [approvalMap, setApprovalMap] = useState({});
  const [reviewerName, setReviewerName] = useState('A. Mehta (CISO / Risk Lead)');
  const [sdlcSignOff, setSdlcSignOff] = useState(null);

  const [auditFilter, setAuditFilter] = useState('all');
  const [auditOpen, setAuditOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

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
        agent: 'Review Gate',
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
            agent: 'Review Gate',
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
            agent: 'Review Gate',
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

  const issueLogsCount = logs.filter((l) => l.status === 'warn' || l.status === 'error').length;
  const visibleLogs = auditFilter === 'issues'
    ? logs.filter((l) => l.status === 'warn' || l.status === 'error')
    : logs;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <svg
            className="brand-logo"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <rect x="0.75" y="0.75" width="30.5" height="30.5" rx="7" fill="#13161b" stroke="#252a33" strokeWidth="1.5" />
            <path d="M16 5L7.5 9.2V16.8C7.5 21.9 11.1 26.5 16 27.8C20.9 26.5 24.5 21.9 24.5 16.8V9.2L16 5Z" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 10.8V21.2" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M12.5 13.8H17.8C18.9 13.8 19.8 14.6 19.8 15.6C19.8 16.6 18.9 17.4 17.8 17.4H14.2C13.1 17.4 12.2 18.2 12.2 19.2C12.2 20.2 13.1 21 14.2 21H19.5" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="brand-text">
            <span className="brand-name">FinReq AI</span>
            <span className="brand-sub">Financial Requirements &amp; SDLC Workbench</span>
          </div>
        </div>

        <div className="toolbar-group">
          <label className="field-label" htmlFor="role-select">Role</label>
          <select
            id="role-select"
            className="select-ctrl"
            value={stakeholderRole}
            onChange={(e) => setStakeholderRole(e.target.value)}
          >
            {STAKEHOLDER_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>

          <span className={`status-tag ${apiKey.trim().length > 10 ? 'live' : ''}`}>
            {apiKey.trim().length > 10 ? 'Gemini 2.5 Flash' : 'Local Engine'}
          </span>

          <button
            type="button"
            className="btn"
            onClick={() => setShowApiConfig((v) => !v)}
          >
            <Key size={13} /> {showApiConfig ? 'Hide Key' : 'API Key'}
          </button>

          {showApiConfig && (
            <input
              type="password"
              className="text-ctrl mono"
              placeholder="Gemini API key (optional)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          )}
        </div>
      </header>

      <section className="input-section">
        <div className="input-top">
          <div className="segmented">
            <button
              type="button"
              className={`seg-btn ${presetTab === 'financial' ? 'active' : ''}`}
              onClick={() => setPresetTab('financial')}
            >
              Case Studies ({FINANCIAL_PRESETS.length})
            </button>
            <button
              type="button"
              className={`seg-btn ${presetTab === 'rules' ? 'active' : ''}`}
              onClick={() => setPresetTab('rules')}
            >
              SDLC Rule Profiles ({FINANCIAL_SDLC_EXAMPLES.length})
            </button>
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} /> {uploadedDocName ? `Attached: ${uploadedDocName}` : 'Attach .txt / .md'}
            </button>
          </div>
        </div>

        <div className="preset-row">
          {presetTab === 'financial'
            ? FINANCIAL_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  className={`btn ${activePresetKey === preset.id ? 'active' : ''}`}
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
                  className={`btn ${activePresetKey === `rule-${idx}` ? 'active' : ''}`}
                  onClick={() => handleSelectRuleExample(spec, idx)}
                  title={spec.title}
                >
                  {spec.label}
                </button>
              ))}
        </div>

        <textarea
          className="scenario-input"
          value={scenarioInput}
          onChange={(e) => {
            setScenarioInput(e.target.value);
            if (activePresetKey) setActivePresetKey('');
          }}
          placeholder="Describe your financial system, clearing rail, or compliance constraints (include a sample card PAN or account number to test automatic PCI/PII redaction)..."
        />

        <div className="input-footer">
          <span className="meta-note">
            {scenarioInput.trim().length} chars · PCI/PII masked prior to inference
          </span>

          <div className="toolbar-group">
            {reqData && sdlcData && !pipelineResult?.failed && (
              <>
                <button type="button" className="btn" onClick={handleExportSRS}>
                  <Download size={13} /> Export SRS (.md)
                </button>
                <button type="button" className="btn" onClick={handleCopySummary}>
                  {copied ? <Check size={13} color="var(--accent)" /> : <Copy size={13} />}
                  {copied ? 'Copied' : 'Copy SRS'}
                </button>
              </>
            )}

            <button
              type="button"
              className="btn btn-primary"
              disabled={isProcessing || !scenarioInput.trim()}
              onClick={() => executePipeline({ text: scenarioInput, title: scenarioTitle || 'Custom Financial Scenario' })}
            >
              {isProcessing ? (
                <><Loader2 size={14} className="spin" /> Analyzing...</>
              ) : (
                <>Analyze <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      </section>

      {privacyResult && privacyResult.totalRedacted > 0 && (
        <div className="notice warn">
          <Shield size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Privacy Guardrail:</strong> Masked {privacyResult.totalRedacted} identifier(s) (
            {privacyResult.redactions.map((r) => `${r.count} ${r.type}`).join(', ')}) prior to analysis.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="notice error">
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Input Rejected:</strong> {errorMessage}
          </div>
        </div>
      )}

      {reqData && clarifications.length > 0 && !pipelineResult?.failed && (
        <section className="clarif-bar">
          <div className="clarif-summary">
            <div className="toolbar-group">
              <strong>Clarification Questions</strong>
              <span className="status-tag">{answeredClarifCount}/{clarifications.length} answered</span>
              <span className="meta-note">Optional constraints to refine NFR SLAs and SDLC scores</span>
            </div>

            <div className="toolbar-group">
              {answeredClarifCount > 0 && (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setClarificationAnswers({});
                      executePipeline({ answers: {} });
                    }}
                    disabled={isProcessing}
                  >
                    <RotateCcw size={12} /> Clear
                  </button>
                  <button
                    type="button"
                    className="btn active"
                    onClick={() => executePipeline({ answers: clarificationAnswers })}
                    disabled={isProcessing}
                  >
                    <RefreshCw size={12} /> Re-Analyze
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn"
                onClick={() => setClarifOpen((v) => !v)}
              >
                {clarifOpen ? <><ChevronUp size={13} /> Hide</> : <><ChevronDown size={13} /> Answer ({clarifications.length})</>}
              </button>
            </div>
          </div>

          {clarifOpen && (
            <div className="clarif-body">
              {clarifications.map((q) => (
                <div key={q.id} className={`clarif-field ${clarificationAnswers[q.id] ? 'answered' : ''}`}>
                  <div className="clarif-topic">{q.topic}</div>
                  <div className="clarif-question">{q.question}</div>
                  <select
                    className="select-ctrl"
                    value={clarificationAnswers[q.id] || ''}
                    onChange={(e) =>
                      setClarificationAnswers((prev) => ({
                        ...prev,
                        [q.id]: e.target.value
                      }))
                    }
                  >
                    <option value="">-- Optional --</option>
                    {q.options.map((opt, idx) => (
                      <option key={idx} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {reqData && sdlcData && !pipelineResult?.failed && (
        <main className="workbench">
          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">Requirements &amp; Compliance</h2>
                <div className="panel-subtitle">{reqData.domain}</div>
              </div>
              <div className="panel-stats">
                <span className="stat-chip ok">Quality {reqData.qualityReport.overallScore}/100</span>
                <span className="stat-chip">Approved {approvedCount}/{totalReqs}</span>
              </div>
            </div>

            <div className="tab-strip">
              <button
                type="button"
                className={`tab-link ${leftTab === 'reqs' ? 'active' : ''}`}
                onClick={() => setLeftTab('reqs')}
              >
                Requirements ({totalReqs})
              </button>
              <button
                type="button"
                className={`tab-link ${leftTab === 'quality' ? 'active' : ''}`}
                onClick={() => setLeftTab('quality')}
              >
                Audit &amp; Risks ({reqData.qualityReport.ambiguities.length + reqData.qualityReport.conflicts.length + reqData.riskRegister.length})
              </button>
              <button
                type="button"
                className={`tab-link ${leftTab === 'rtm' ? 'active' : ''}`}
                onClick={() => setLeftTab('rtm')}
              >
                RAG &amp; RTM ({reqData.retrievedKnowledge.length})
              </button>
            </div>

            <div className="panel-body">
              {leftTab === 'reqs' && (
                <>
                  <div className="filter-bar">
                    <div className="filter-group">
                      {[
                        { id: 'all', label: `All (${totalReqs})` },
                        { id: 'pending', label: `Pending (${pendingCount})` },
                        { id: 'approved', label: `Approved (${approvedCount})` },
                        { id: 'flagged', label: `Flagged (${flaggedCount})` }
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          className={`filter-btn ${reqFilter === f.id ? 'active' : ''}`}
                          onClick={() => setReqFilter(f.id)}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {pendingCount > 0 && (
                      <button type="button" className="text-btn" onClick={handleApproveRemaining}>
                        <CheckCircle size={13} /> Approve remaining ({pendingCount})
                      </button>
                    )}
                  </div>

                  <div className="group-label">
                    <span>Functional ({filteredFRs.length})</span>
                  </div>
                  {filteredFRs.length === 0 ? (
                    <p className="meta-note">No functional requirements match this filter.</p>
                  ) : (
                    <div className="spec-list">
                      {filteredFRs.map((fr) => (
                        <RequirementRow
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

                  <div className="group-label" style={{ marginTop: '1.65rem' }}>
                    <span>Non-Functional ({filteredNFRs.length})</span>
                  </div>
                  {filteredNFRs.length === 0 ? (
                    <p className="meta-note">No non-functional requirements match this filter.</p>
                  ) : (
                    <div className="spec-list">
                      {filteredNFRs.map((nfr) => (
                        <RequirementRow
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

              {leftTab === 'quality' && (
                <>
                  <div className="group-label">
                    <span>Ambiguities ({reqData.qualityReport.ambiguities.length})</span>
                    <span>{reqData.qualityReport.testabilityRating}</span>
                  </div>
                  {reqData.qualityReport.ambiguities.length === 0 ? (
                    <p className="meta-note" style={{ marginBottom: '1.5rem' }}>
                      No unquantified vague terms detected.
                    </p>
                  ) : (
                    <div className="spec-list" style={{ marginBottom: '1.5rem' }}>
                      {reqData.qualityReport.ambiguities.map((a, idx) => (
                        <div key={idx} className="spec-row flagged">
                          <div className="spec-title">Ambiguous term: &ldquo;{a.term}&rdquo;</div>
                          <p className="spec-statement">{a.finding}</p>
                          <div className="spec-sla">Fix: {a.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="group-label">
                    <span>Conflicts ({reqData.qualityReport.conflicts.length})</span>
                  </div>
                  {reqData.qualityReport.conflicts.length === 0 ? (
                    <p className="meta-note" style={{ marginBottom: '1.5rem' }}>
                      No stakeholder conflicts detected.
                    </p>
                  ) : (
                    <div className="spec-list" style={{ marginBottom: '1.5rem' }}>
                      {reqData.qualityReport.conflicts.map((c) => (
                        <div key={c.id} className="spec-row flagged">
                          <div className="spec-row-head">
                            <div>
                              <span className="spec-id">{c.id}</span>
                              <span className="spec-title">{c.title}</span>
                            </div>
                          </div>
                          <p className="spec-statement">{c.description}</p>
                          <div className="spec-sla">Resolution: {c.resolution}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="group-label">
                    <span>Risk Register ({reqData.riskRegister.length})</span>
                  </div>
                  <div className="spec-list">
                    {reqData.riskRegister.map((r) => (
                      <div key={r.id} className="spec-row">
                        <div className="spec-row-head">
                          <div>
                            <span className="spec-id">{r.id}</span>
                            <span className="spec-title">{r.category}</span>
                          </div>
                          <span className="spec-meta">{r.severity}</span>
                        </div>
                        <p className="spec-statement">{r.risk}</p>
                        <div className="meta-note" style={{ marginTop: '0.3rem' }}>
                          Mitigation: {r.mitigation}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {leftTab === 'rtm' && (
                <>
                  <div className="group-label">
                    <span>Retrieved Clauses ({reqData.retrievedKnowledge.length})</span>
                  </div>
                  <div className="spec-list" style={{ marginBottom: '1.6rem' }}>
                    {reqData.retrievedKnowledge.map((kb) => (
                      <div key={kb.id} className="spec-row">
                        <div className="spec-row-head">
                          <div>
                            <span className="spec-id">{kb.id}</span>
                            <span className="spec-title">{kb.standard} ({kb.clause})</span>
                          </div>
                          <span className="spec-meta">{Math.round(kb.confidence * 100)}% match</span>
                        </div>
                        <p className="spec-statement">{kb.requirement}</p>
                        <div className="meta-note" style={{ marginTop: '0.25rem' }}>
                          {kb.jurisdiction} · Effective {kb.effectiveDate}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="group-label">
                    <span>Traceability Matrix</span>
                  </div>
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <table className="data-table">
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
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-text)' }}>{row.requirementId}</td>
                            <td>{row.title}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{row.citations}</td>
                            <td>{row.verificationStage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <div>
                <h2 className="panel-title">SDLC Selection &amp; Workflow</h2>
                <div className="panel-subtitle">Weighted MCDA across 8 factors and 6 rules</div>
              </div>
              <div className="panel-stats">
                <span className="stat-chip ok">{sdlcData.suitabilityScore}</span>
              </div>
            </div>

            <div className="panel-body">
              <div className="sdlc-summary">
                <div className="sdlc-summary-top">
                  <div className="sdlc-model-name">{sdlcData.recommendedModel}</div>
                  <div className="sdlc-score">{sdlcData.suitabilityScore}</div>
                </div>
                {sdlcData.primaryModel?.triggeredRule && (
                  <div className="rule-note">Rule: {sdlcData.primaryModel.triggeredRule}</div>
                )}
                <p className="spec-statement" style={{ marginTop: '0.45rem' }}>{sdlcData.justification}</p>

                <div className="signoff-row">
                  <input
                    type="text"
                    className="select-ctrl"
                    style={{ width: 175 }}
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="Reviewer name"
                  />
                  <button
                    type="button"
                    className={`review-btn approve ${sdlcSignOff?.status === 'Approved' ? 'active' : ''}`}
                    onClick={() => handleSdlcSignOff('Approved')}
                  >
                    <CheckCircle size={12} /> Approve SDLC
                  </button>
                  <button
                    type="button"
                    className={`review-btn flag ${sdlcSignOff?.status === 'Revision Requested' ? 'active' : ''}`}
                    onClick={() => handleSdlcSignOff('Revision Requested')}
                  >
                    <Flag size={12} /> Request Revision
                  </button>
                  {sdlcSignOff && (
                    <span className="meta-note" style={{ color: 'var(--accent-text)' }}>
                      {sdlcSignOff.status} ({sdlcSignOff.timestamp})
                    </span>
                  )}
                </div>
              </div>

              <div className="group-label">
                <span>Model Ranking</span>
                <span>Click to inspect</span>
              </div>
              <div className="rank-list">
                {sdlcData.rankedRecommendations.map((model) => {
                  const isOpen = expandedModelId === model.id;
                  return (
                    <div key={model.id} className={`rank-item ${model.rank === 1 ? 'top' : ''}`}>
                      <button
                        type="button"
                        className="rank-trigger"
                        onClick={() => setExpandedModelId(isOpen ? null : model.id)}
                      >
                        <span className="rank-idx">#{model.rank}</span>
                        <div style={{ flexGrow: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                            <strong style={{ fontSize: '0.84rem' }}>{model.name}</strong>
                            <span className="meta-note">{model.matchLevel}</span>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: model.suitabilityScore }} />
                          </div>
                        </div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                          {model.suitabilityScore}
                        </span>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isOpen && (
                        <div className="rank-detail">
                          <p className="spec-statement">{model.rationale}</p>
                          <div className="tradeoff-grid">
                            <div>
                              <strong style={{ color: 'var(--accent-text)' }}>Strengths</strong>
                              <ul>
                                {model.pros.map((p, i) => <li key={i}>{p}</li>)}
                              </ul>
                            </div>
                            <div>
                              <strong style={{ color: 'var(--danger-text)' }}>Constraints</strong>
                              <ul>
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

              <div className="group-label">
                <span>Decision Factors</span>
                {isManuallyTuned && (
                  <button type="button" className="text-btn" onClick={handleResetSliders}>
                    <RotateCcw size={12} /> Reset
                  </button>
                )}
              </div>
              <div className="sliders-grid">
                {FACTOR_LABELS.map(({ key, label }) => (
                  <div key={key} className="slider-box">
                    <div className="slider-head">
                      <span>{label}</span>
                      <span className="slider-val">{sdlcData.evaluatedFactors[key]}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sdlcData.evaluatedFactors[key]}
                      onChange={(e) => handleSliderChange(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="group-label">
                <span>5-Phase Workflow</span>
                <span>Click phase for deliverables</span>
              </div>
              <div className="phase-timeline">
                {sdlcData.projectWorkflow.map((phase) => {
                  const isOpen = Boolean(expandedPhaseNumbers[phase.phaseNumber]);
                  return (
                    <div
                      key={phase.phaseNumber}
                      className="phase-node"
                      onClick={(e) => {
                        if (e.target.closest('.phase-body')) return;
                        setExpandedPhaseNumbers((prev) => ({
                          ...prev,
                          [phase.phaseNumber]: !prev[phase.phaseNumber]
                        }));
                      }}
                    >
                      <div className="phase-top">
                        <strong>Phase {phase.phaseNumber}: {phase.phaseName}</strong>
                        <span className="spec-meta">{phase.durationEstimate}</span>
                      </div>
                      <p className="meta-note" style={{ marginTop: '0.2rem', color: 'var(--text-secondary)' }}>
                        {phase.objective}
                      </p>
                      <div className="meta-note" style={{ marginTop: '0.25rem' }}>
                        Gate: <span style={{ color: 'var(--accent-text)' }}>{phase.complianceCheckpoints}</span>
                      </div>

                      {isOpen && (
                        <div className="phase-body">
                          <div><strong>Roles:</strong> {phase.responsibleRoles.join(', ')}</div>
                          <div>
                            <strong>Activities:</strong>
                            <ul>
                              {phase.activities.map((act, i) => <li key={i}>{act}</li>)}
                            </ul>
                          </div>
                          <div><strong>Deliverables:</strong> {phase.deliverables.join('; ')}</div>
                          <div><strong>Controls:</strong> {phase.securityControls.join('; ')}</div>
                          <div><strong>Criteria:</strong> {phase.entryCriteria} -&gt; {phase.exitCriteria}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </main>
      )}

      {logs.length > 0 && (
        <section className="audit-box">
          <div className="audit-head">
            <div className="toolbar-group">
              <strong>Audit Log</strong>
              <span className="status-tag">{logs.length} events</span>
              {issueLogsCount > 0 && (
                <span className="status-tag" style={{ color: 'var(--warn-text)' }}>{issueLogsCount} warning(s)</span>
              )}
            </div>

            <div className="toolbar-group">
              {auditOpen && (
                <div className="filter-group">
                  <button
                    type="button"
                    className={`filter-btn ${auditFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setAuditFilter('all')}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-btn ${auditFilter === 'issues' ? 'active' : ''}`}
                    onClick={() => setAuditFilter('issues')}
                  >
                    Warnings ({issueLogsCount})
                  </button>
                </div>
              )}
              <button
                type="button"
                className="btn"
                onClick={() => setAuditOpen((v) => !v)}
              >
                {auditOpen ? <><ChevronUp size={13} /> Hide Log</> : <><ChevronDown size={13} /> Show Log</>}
              </button>
            </div>
          </div>

          {auditOpen && (
            <div className="audit-rows">
              {visibleLogs.length === 0 ? (
                <div className="audit-item">No warning or error events recorded.</div>
              ) : (
                visibleLogs.map((log) => (
                  <div key={log.id} className={`audit-item ${log.status === 'warn' ? 'warn' : log.status === 'error' ? 'error' : ''}`}>
                    <span className="audit-ts">{log.timestamp}</span>
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
