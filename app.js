const demoSources = [
  {
    id: 'source-a', filename: 'Customer research', category: 'customer', collectedAt: 'Nov 12, 2026',
    chunks: [
      { id: 'A-1', text: 'In a fictional set of 12 customer conversations, 8 participants expressed interest in AI Analytics, but only 3 described a near-term use case they would actively deploy.' },
      { id: 'A-2', text: 'The sample did not include enterprise customers with more than 1,000 employees, so their demand is unknown.' },
    ],
  },
  {
    id: 'source-b', filename: 'Engineering readiness', category: 'engineering', collectedAt: 'Nov 15, 2026',
    chunks: [
      { id: 'B-1', text: 'Engineering estimates a limited pilot can be enabled for up to 10 accounts using feature flags.' },
      { id: 'B-2', text: 'General availability requires additional performance testing and rollback automation. Estimated effort is three engineering weeks; this estimate has not yet been validated.' },
    ],
  },
  {
    id: 'source-c', filename: 'Incident history', category: 'incidents', collectedAt: 'Nov 18, 2026',
    chunks: [
      { id: 'C-1', text: 'A recent analytics workload test produced timeout errors at high concurrency; root cause analysis remains open.' },
      { id: 'C-2', text: 'The incident owner recommends no broad launch until load tests and rollback procedures pass.' },
    ],
  },
  {
    id: 'source-d', filename: 'Product metrics', category: 'metrics', collectedAt: 'Nov 19, 2026',
    chunks: [
      { id: 'D-1', text: 'Feature activation in the fictional internal beta was 22% across 50 invited accounts. This is an early signal rather than evidence of general market demand.' },
      { id: 'D-2', text: 'No retention or willingness-to-pay results are available.' },
    ],
  },
];

const optionDetails = {
  full_launch: { label: 'Full launch', eyebrow: 'BROAD AVAILABILITY', style: 'full' },
  limited_pilot: { label: 'Limited pilot', eyebrow: 'CONTROLLED RELEASE', style: 'pilot' },
  delay: { label: 'Delay', eyebrow: 'WAIT & DE-RISK', style: 'delay' },
};

const connectors = [
  {
    id: 'slack', name: 'Slack', mark: 'S', tone: 'slack', group: 'TEAM SIGNALS',
    description: 'Bring customer feedback and team discussion into the brief.',
    filename: 'Slack feedback · demo sample', category: 'customer',
    chunks: [
      { id: 'slack-1', text: 'Fictional Slack demo message: Three design partners asked whether AI Analytics can explain a sudden change in weekly active usage.' },
      { id: 'slack-2', text: 'Fictional Slack demo message: Support has not seen a consistent request for automated recommendations yet.' },
    ],
  },
  {
    id: 'notion', name: 'Notion', mark: 'N', tone: 'notion', group: 'PRODUCT DOCS',
    description: 'Pull in PRDs, product principles, and decision notes.',
    filename: 'Notion product brief · demo sample', category: 'uploaded',
    chunks: [
      { id: 'notion-1', text: 'Fictional Notion demo brief: The initial AI Analytics release should help product teams investigate usage changes, not automatically prescribe roadmap actions.' },
      { id: 'notion-2', text: 'Fictional Notion demo assumption: A useful first release must explain which metric changed and link to the underlying data.' },
    ],
  },
  {
    id: 'jira', name: 'Jira', mark: 'J', tone: 'jira', group: 'DELIVERY',
    description: 'Review delivery progress, blockers, and open risks.',
    filename: 'Jira delivery status · demo sample', category: 'engineering',
    chunks: [
      { id: 'jira-1', text: 'Fictional Jira demo issue: Performance testing for high-concurrency analytics requests is still in progress.' },
      { id: 'jira-2', text: 'Fictional Jira demo issue: Rollback automation is an open task and has no confirmed completion date.' },
    ],
  },
  {
    id: 'linear', name: 'Linear', mark: 'L', tone: 'linear', group: 'ROADMAP',
    description: 'Connect roadmap issues and ownership to the decision.',
    filename: 'Linear roadmap · demo sample', category: 'engineering',
    chunks: [
      { id: 'linear-1', text: 'Fictional Linear demo issue: Pilot account controls are scoped; an engineering owner still needs to be assigned.' },
      { id: 'linear-2', text: 'Fictional Linear demo issue: The team plans to review pilot feedback before committing to general availability.' },
    ],
  },
  {
    id: 'mixpanel', name: 'Mixpanel', mark: 'M', tone: 'mixpanel', group: 'PRODUCT ANALYTICS',
    description: 'Add activation and usage signals to the evidence set.',
    filename: 'Mixpanel funnel · demo sample', category: 'metrics',
    chunks: [
      { id: 'mixpanel-1', text: 'Fictional Mixpanel demo metric: 22% of invited internal beta accounts activated AI Analytics. This is an early signal, not proof of retention or market demand.' },
      { id: 'mixpanel-2', text: 'Fictional Mixpanel demo gap: No 30-day retention or paid conversion result is available for this feature.' },
    ],
  },
  {
    id: 'drive', name: 'Google Drive', mark: 'D', tone: 'drive', group: 'RESEARCH FILES',
    description: 'Bring research summaries and planning docs together.',
    filename: 'Drive research notes · demo sample', category: 'customer',
    chunks: [
      { id: 'drive-1', text: 'Fictional Drive demo research note: Several interviewees liked the idea of AI Analytics, but only a few described a workflow they would change this quarter.' },
      { id: 'drive-2', text: 'Fictional Drive demo limitation: The interview sample did not include large enterprise customers.' },
    ],
  },
];

const state = {
  sources: load('decisionkit.sources', demoSources),
  analysis: load('decisionkit.analysis', null),
  selectedOption: load('decisionkit.selectedOption', null),
  challenge: null,
  approved: load('decisionkit.approved', null),
  connectedIntegrations: load('decisionkit.integrations', []),
  briefExpanded: false,
};

const sourceGrid = document.querySelector('#source-grid');
const connectorGrid = document.querySelector('#connector-grid');
const briefContent = document.querySelector('#brief-content');
const analysisStatus = document.querySelector('#analysis-status');
const analyzeButton = document.querySelector('#analyze-button');
const toast = document.querySelector('#toast');

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast('Could not save this item in the browser. Check available storage.');
  }
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove('show'), 3200);
}

function sourceIcon(category) {
  return ({ customer: '◎', engineering: '⌘', incidents: '⚑', metrics: '▥', uploaded: '▤' })[category] || '▤';
}

function renderSources() {
  sourceGrid.innerHTML = state.sources.map((source, index) => `
    <article class="source-card">
      <div class="source-top"><span class="source-icon ${escapeHtml(source.category)}">${sourceIcon(source.category)}</span>
        ${source.category === 'uploaded' || source.id.startsWith('connector-') ? `<button class="source-remove" data-remove="${index}" aria-label="Remove ${escapeHtml(source.filename)}">×</button>` : '<span></span>'}
      </div>
      <h3 title="${escapeHtml(source.filename)}">${escapeHtml(source.filename)}</h3>
      <p>${escapeHtml(source.collectedAt || `${source.chunks.length} text section${source.chunks.length === 1 ? '' : 's'}`)}</p>
      <span class="source-chip">${escapeHtml(source.category)}</span>
    </article>`).join('');
  document.querySelector('#source-count').textContent = state.sources.length;
  document.querySelector('#evidence-total').textContent = `${state.sources.length} source${state.sources.length === 1 ? '' : 's'} loaded`;
  sourceGrid.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      state.sources.splice(Number(button.dataset.remove), 1);
      state.analysis = null;
      state.selectedOption = null;
      state.challenge = null;
      state.approved = null;
      state.briefExpanded = false;
      save('decisionkit.sources', state.sources);
      save('decisionkit.analysis', null);
      save('decisionkit.selectedOption', null);
      save('decisionkit.approved', null);
      renderSources();
      renderBrief();
      setStatus('Evidence changed. Build a fresh brief to review the updated source set.');
    });
  });
}

function renderConnectors() {
  connectorGrid.innerHTML = connectors.map((connector) => {
    const connected = state.connectedIntegrations.includes(connector.id);
    const imported = state.sources.some((source) => source.id === `connector-${connector.id}`);
    return `<article class="connector-card">
      <div class="connector-card-top">
        <span class="integration-mark ${connector.tone}">${connector.mark}</span>
        <span class="connector-group">${connector.group}</span>
        <span class="connector-status ${connected ? 'connected' : ''}"><i></i>${connected ? 'DEMO CONNECTED' : 'NOT CONNECTED'}</span>
      </div>
      <h3>${connector.name}</h3>
      <p>${connector.description}</p>
      <div class="connector-actions">
        <button type="button" class="connector-connect ${connected ? 'is-connected' : ''}" data-connect="${connector.id}">
          ${connected ? 'Disconnect demo' : 'Connect demo'}
        </button>
        <button type="button" class="connector-import" data-import="${connector.id}" ${connected && !imported ? '' : 'disabled'}>
          ${imported ? 'Sample imported ✓' : 'Import sample'}
        </button>
      </div>
    </article>`;
  }).join('');

  connectorGrid.querySelectorAll('[data-connect]').forEach((button) => {
    button.addEventListener('click', () => toggleConnector(button.dataset.connect));
  });
  connectorGrid.querySelectorAll('[data-import]').forEach((button) => {
    button.addEventListener('click', () => importConnectorSample(button.dataset.import));
  });
}

function toggleConnector(id) {
  if (state.connectedIntegrations.includes(id)) {
    state.connectedIntegrations = state.connectedIntegrations.filter((item) => item !== id);
    showToast('Demo connector disconnected. No external account was changed.');
  } else {
    state.connectedIntegrations.push(id);
    showToast('Demo connector enabled. No external service was contacted.');
  }
  save('decisionkit.integrations', state.connectedIntegrations);
  renderConnectors();
}

function importConnectorSample(id) {
  if (!state.connectedIntegrations.includes(id)) {
    showToast('Connect the demo integration before importing its sample.');
    return;
  }
  const connector = connectors.find((item) => item.id === id);
  if (!connector || state.sources.some((source) => source.id === `connector-${id}`)) {
    showToast('This connector’s sample is already in the evidence library.');
    return;
  }
  state.sources.push({
    id: `connector-${connector.id}`,
    filename: connector.filename,
    category: connector.category,
    collectedAt: 'Fictional demo data',
    chunks: structuredClone(connector.chunks),
  });
  state.analysis = null;
  state.selectedOption = null;
  state.challenge = null;
  state.approved = null;
  state.briefExpanded = false;
  for (const [key, value] of Object.entries({
    sources: state.sources,
    analysis: null,
    selectedOption: null,
    approved: null,
  })) save(`decisionkit.${key}`, value);
  renderSources();
  renderConnectors();
  renderBrief();
  setStatus('New sample context added. Build a fresh brief to include it.');
  document.querySelector('#evidence-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
  showToast(`${connector.name} sample context added to your evidence.`);
}

function citationText(ref) {
  const source = state.sources.find((item) => item.id === ref.sourceId);
  return source ? `${source.filename} · ${ref.chunkId}` : `Unknown source · ${ref.chunkId}`;
}

function renderBrief() {
  if (!state.analysis) {
    briefContent.classList.add('hidden');
    return;
  }
  const analysis = state.analysis;
  const label = analysis.mode === 'ai' ? 'AI ANALYSIS' : 'DEMO MODE · FICTIONAL DATA';
  const claimsHtml = (analysis.claims || []).map((claim) => `
    <article class="claim-card">
      <div class="claim-title"><span class="stance-dot ${escapeHtml(claim.stance)}"></span><span>${escapeHtml(claim.text)}</span></div>
      <div class="citation-list">${(claim.sourceRefs || []).map((ref) => `      <button type="button" class="citation-chip" title="${escapeHtml(ref.quote)}" data-source="${escapeHtml(ref.sourceId)}" data-quote="${escapeHtml(ref.quote)}">${escapeHtml(citationText(ref))}</button>`).join('')}</div>
      ${(claim.limitations || []).map((text) => `<p class="claim-limit">Note: ${escapeHtml(text)}</p>`).join('')}
    </article>`).join('');
  const canDecide = analysis.readiness !== 'insufficient_evidence';
  const optionsHtml = (analysis.options || []).map((option) => {
    const detail = optionDetails[option.option];
    if (!detail) return '';
    const recommendation = analysis.recommendedOption === option.option;
    const firstRisk = option.risks?.[0] || 'No material risks listed.';
    const firstBenefit = option.benefits?.[0] || '';
    return `<button type="button" class="option-card ${recommendation ? 'recommended' : ''} ${state.selectedOption === option.option ? 'selected' : ''}" data-option="${option.option}" ${canDecide ? '' : 'disabled'}>
      <span class="option-head"><strong>${escapeHtml(detail.label)}</strong>${recommendation ? '<span class="recommend-tag">CONDITIONAL PATH</span>' : ''}</span>
      <p>${escapeHtml(firstBenefit)}</p><p class="option-risk">${escapeHtml(firstRisk)}</p>
    </button>`;
  }).join('');
  briefContent.innerHTML = `
    <button type="button" class="brief-toggle" aria-expanded="${state.briefExpanded}">
      <span><strong>Decision brief</strong><small>${escapeHtml((analysis.readiness || 'conditional').replaceAll('_', ' '))} · ${analysis.claims?.length || 0} evidence-backed claims</small></span>
      <span class="brief-toggle-action">${state.briefExpanded ? 'Hide brief' : 'Show brief'} <i>${state.briefExpanded ? '⌃' : '⌄'}</i></span>
    </button>
    <div class="brief-details ${state.briefExpanded ? '' : 'hidden'}">
    <div class="brief-header"><div><h3>Your decision brief <span class="source-chip">${label}</span></h3><p>${escapeHtml(analysis.rationale || '')}</p></div><span class="readiness ${escapeHtml(analysis.readiness)}">${escapeHtml((analysis.readiness || 'conditional').replaceAll('_', ' '))}</span></div>
    <div class="brief-grid">
      <div><div class="claims-list">${claimsHtml || '<p>No verifiable claims were returned.</p>'}</div></div>
      <div class="brief-side">
        <aside class="side-insight"><h4>What we still need</h4><ul>${(analysis.missingEvidence || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>No explicit evidence gaps were listed.</li>'}</ul></aside>
        <aside class="side-insight conflict-box"><h4>Where signals diverge</h4><ul>${(analysis.contradictions || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>No contradiction was identified in the available sources.</li>'}</ul></aside>
      </div>
    </div>
    <div class="option-heading"><h3>${canDecide ? 'Choose a path' : 'Options need more evidence'}</h3><span>${canDecide ? 'The brief suggests. You decide.' : 'No recommendation until the evidence is sufficient.'}</span></div>
    <div class="option-grid">${optionsHtml}</div>
    <div class="challenge-row"><button type="button" id="challenge-button" class="challenge-button" ${canDecide ? '' : 'disabled'}>✳ &nbsp;Challenge my decision</button><span class="challenge-hint">Stress-test your selected option against counter-evidence.</span></div>
    ${state.challenge ? renderChallenge(state.challenge) : ''}
    <div class="approval-panel">
      <div class="approval-copy"><h4>Make it official.</h4><p>Save your choice and turn the next steps into a plan.</p></div>
      <div class="approval-fields"><input id="owner-name" class="owner-input" value="${escapeHtml(state.approved?.owner || '')}" placeholder="Decision owner" aria-label="Decision owner" ${canDecide ? '' : 'disabled'}><button type="button" id="approve-button" class="approve-button" ${state.approved || !canDecide ? 'disabled' : ''}>${state.approved ? '✓ Decision saved' : 'Approve decision'}</button></div>
    </div>
    ${state.approved ? `<div class="approval-saved"><strong>Approved by ${escapeHtml(state.approved.owner || 'Decision owner')}</strong> · ${escapeHtml(new Date(state.approved.approvedAt).toLocaleString())} · Saved locally on this device.
      <ul class="task-list">${state.approved.tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join('')}</ul></div>` : ''}
    </div>`;

  briefContent.classList.remove('hidden');
  briefContent.querySelector('.brief-toggle').addEventListener('click', () => {
    state.briefExpanded = !state.briefExpanded;
    renderBrief();
  });
  briefContent.querySelectorAll('[data-option]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedOption = button.dataset.option;
      state.challenge = null;
      save('decisionkit.selectedOption', state.selectedOption);
      renderBrief();
    });
  });
  briefContent.querySelectorAll('[data-source]').forEach((button) => {
    button.addEventListener('click', () => {
      showToast(`${citationText({ sourceId: button.dataset.source, chunkId: button.textContent.split('·').pop().trim() })}: “${button.dataset.quote}”`);
    });
  });
  briefContent.querySelector('#challenge-button').addEventListener('click', challengeDecision);
  briefContent.querySelector('#approve-button').addEventListener('click', approveDecision);
}

function renderChallenge(challenge) {
  const references = (challenge.counterEvidence || []).map((item) => `
    <li>${escapeHtml(item.text)} ${(item.sourceRefs || []).map((ref) => `<span class="citation-chip" title="${escapeHtml(ref.quote)}">${escapeHtml(citationText(ref))}</span>`).join(' ')}</li>`).join('');
  const heading = challenge.mode === 'ai' ? 'AI COUNTER-CASE' : 'SOURCE-BASED COUNTER-CASE · DEMO';
  return `<div class="challenge-result"><h4>${heading}</h4><p>${escapeHtml(challenge.assessment || '')}</p>
    ${references ? `<ul>${references}</ul>` : '<p>No counter-evidence was identified in these sources.</p>'}
    ${(challenge.safeguards || []).length ? `<p><strong>Safeguards to consider</strong></p><ul>${challenge.safeguards.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}</div>`;
}

async function postJson(path, payload) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'The request could not be completed.');
  return data;
}

function setStatus(message, kind = '') {
  analysisStatus.className = `analysis-status ${kind}`;
  analysisStatus.innerHTML = `<span class="status-dot"></span><span>${escapeHtml(message)}</span>`;
}

async function buildBrief() {
  const question = document.querySelector('#decision-question').value.trim();
  if (!question) {
    showToast('Add the decision question before building your brief.');
    document.querySelector('#decision-question').focus();
    return;
  }
  if (!state.sources.length) {
    showToast('Add at least one source or restore the sample evidence.');
    return;
  }
  state.challenge = null;
  analyzeButton.disabled = true;
  analyzeButton.querySelector('span:nth-child(2)').textContent = 'Building your brief…';
  setStatus('Reviewing the evidence and checking source references…', 'loading');
  try {
    state.analysis = await postJson('/api/analyze', { question, sources: state.sources });
    state.selectedOption = state.analysis.recommendedOption || null;
    state.briefExpanded = true;
    state.approved = null;
    save('decisionkit.analysis', state.analysis);
    save('decisionkit.selectedOption', state.selectedOption);
    save('decisionkit.approved', null);
    renderBrief();
    setStatus(state.analysis.readiness === 'insufficient_evidence'
      ? 'Insufficient evidence for a recommendation in demo mode. Add the bundled sample pack or configure live AI analysis.'
      : state.analysis.mode === 'ai'
        ? 'AI analysis complete. Citations link to source sections.'
        : 'Demo analysis complete. Showing a curated path grounded in the fictional sample sources.',
    state.analysis.readiness === 'insufficient_evidence' ? '' : 'success');
  } catch (error) {
    setStatus(error.message, 'error');
    showToast(error.message);
  } finally {
    analyzeButton.disabled = false;
    analyzeButton.querySelector('span:nth-child(2)').textContent = 'Build my decision brief';
  }
}

async function challengeDecision() {
  if (!state.selectedOption) {
    showToast('Choose one of the options to challenge.');
    return;
  }
  const button = briefContent.querySelector('#challenge-button');
  button.disabled = true;
  button.textContent = 'Checking counter-evidence…';
  try {
    const result = await postJson('/api/challenge', {
      selectedOption: state.selectedOption,
      rationale: state.analysis.rationale,
      sources: state.sources,
    });
    state.challenge = result;
    renderBrief();
  } catch (error) {
    showToast(error.message);
    button.disabled = false;
    button.textContent = '✳  Challenge my decision';
  }
}

function approveDecision() {
  if (!state.selectedOption) {
    showToast('Choose an option before approving the decision.');
    return;
  }
  const owner = briefContent.querySelector('#owner-name').value.trim();
  if (!owner) {
    showToast('Add a decision owner before approval.');
    briefContent.querySelector('#owner-name').focus();
    return;
  }
  const optionName = optionDetails[state.selectedOption].label;
  state.approved = {
    id: crypto.randomUUID(),
    owner,
    option: state.selectedOption,
    rationale: state.analysis.rationale,
    approvedAt: new Date().toISOString(),
    tasks: state.selectedOption === 'limited_pilot'
      ? ['Select up to 10 pilot accounts and confirm eligibility.', 'Run load tests; document rollback and stop criteria.', 'Monitor the pilot and schedule a review before any broad launch.']
      : state.selectedOption === 'full_launch'
        ? ['Complete performance testing before general availability.', 'Validate rollback automation and monitor launch health.', 'Review customer usage and reliability signals after release.']
        : ['Close the timeout root-cause analysis.', 'Complete performance testing and rollback automation.', 'Reassess customer demand and launch readiness at the next review.'],
    optionName,
  };
  save('decisionkit.approved', state.approved);
  renderBrief();
  showToast('Decision approved and saved on this device.');
}

async function addFiles(files) {
  for (const file of files) {
    if (file.size > 200_000) {
      showToast(`${file.name} is too large. Keep files under 200 KB for this prototype.`);
      continue;
    }
    try {
      const text = await file.text();
      if (!text.trim()) {
        showToast(`${file.name} is empty, so it was not added.`);
        continue;
      }
      const paragraphs = text.split(/\n{2,}/).map((chunk) => chunk.trim()).filter(Boolean);
      state.sources.push({
        id: `upload-${crypto.randomUUID()}`,
        filename: file.name,
        category: 'uploaded',
        collectedAt: new Date(file.lastModified || Date.now()).toLocaleDateString(),
        chunks: paragraphs.map((chunk, index) => ({ id: `${file.name}-${index + 1}`, text: chunk })),
      });
    } catch {
      showToast(`Could not read ${file.name}. Try a text, Markdown, CSV, or JSON file.`);
    }
  }
  state.analysis = null;
  state.approved = null;
  state.challenge = null;
  save('decisionkit.sources', state.sources);
  save('decisionkit.analysis', null);
  save('decisionkit.approved', null);
  renderSources();
  renderBrief();
}

function resetDemo() {
  state.sources = structuredClone(demoSources);
  state.analysis = null;
  state.selectedOption = null;
  state.challenge = null;
  state.approved = null;
  state.connectedIntegrations = [];
  state.briefExpanded = false;
  document.querySelector('#decision-question').value = 'Should we launch AI Analytics next month?';
  for (const key of ['sources', 'analysis', 'selectedOption', 'approved', 'integrations']) {
    save(`decisionkit.${key}`, state[key]);
  }
  renderSources();
  renderConnectors();
  renderBrief();
  setStatus('Add or review your evidence, then build your brief.');
  showToast('Demo workspace reset.');
}

function renderRestored() {
  renderSources();
  renderConnectors();
  renderBrief();
  if (state.analysis) {
    setStatus(state.analysis.mode === 'ai'
      ? 'Restored saved AI analysis from this device.'
      : 'Restored demo analysis from this device.', 'success');
  }
}

analyzeButton.addEventListener('click', buildBrief);
document.querySelector('#file-upload').addEventListener('change', (event) => {
  addFiles([...event.target.files]);
  event.target.value = '';
});
document.querySelector('#sample-button').addEventListener('click', () => {
  state.sources = structuredClone(demoSources);
  state.analysis = null;
  state.approved = null;
  state.selectedOption = null;
  state.challenge = null;
  state.connectedIntegrations = [];
  state.briefExpanded = false;
  save('decisionkit.sources', state.sources);
  save('decisionkit.analysis', null);
  save('decisionkit.approved', null);
  save('decisionkit.selectedOption', null);
  save('decisionkit.integrations', []);
  renderSources();
  renderConnectors();
  renderBrief();
  showToast('Fictional demo evidence loaded.');
});
document.querySelector('#reset-demo').addEventListener('click', resetDemo);
document.querySelector('#evidence-nav').addEventListener('click', () => document.querySelector('#evidence-section').scrollIntoView({ behavior: 'smooth' }));
document.querySelector('#connectors-nav').addEventListener('click', () => document.querySelector('#connectors-section').scrollIntoView({ behavior: 'smooth' }));
document.querySelector('#activity-nav').addEventListener('click', () => {
  if (state.approved) showToast(`Latest decision saved for ${state.approved.owner}.`);
  else showToast('No approved decisions in this demo workspace yet.');
});
renderRestored();
