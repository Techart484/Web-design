// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — Pipeline UI Controller
// Renders stage status, competitor matrix, critique report,
// and delivery panel inside the dashboard.
// ============================================================

const PipelineUI = {
  _panel: null,
  _logBuffers: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },

  // ── Open Pipeline Panel ───────────────────────────────────
  open() {
    // Switch to pipeline tab
    const pipelineTab = document.querySelector('[data-tab="pipeline"]');
    if (pipelineTab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      pipelineTab.classList.add('active');
      document.querySelectorAll('.panel-section').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById('panel-pipeline');
      if (panel) panel.classList.add('active');
    }
    this._resetDisplay();
  },

  // ── Reset all stage indicators ────────────────────────────
  _resetDisplay() {
    [1, 2, 3, 4, 5, 6].forEach(n => {
      this.setStageStatus(n, 'pending');
      const log = document.getElementById(`stage-log-${n}`);
      if (log) log.textContent = '';
      this._logBuffers[n] = '';
    });
    const matrix = document.getElementById('competitor-matrix-display');
    if (matrix) matrix.innerHTML = '<p class="pipeline-empty">Awaiting Stage 02 completion...</p>';
    const critique = document.getElementById('critique-report-display');
    if (critique) critique.innerHTML = '<p class="pipeline-empty">Awaiting Stage 05 completion...</p>';
    const delivery = document.getElementById('delivery-display');
    if (delivery) delivery.innerHTML = '<p class="pipeline-empty">Awaiting Stage 06 completion...</p>';
  },

  // ── Update Stage Status Indicator ────────────────────────
  setStageStatus(stageId, status) {
    const el = document.getElementById(`stage-indicator-${stageId}`);
    if (!el) return;
    el.className = `stage-indicator stage-${status}`;

    const dot = el.querySelector('.stage-dot');
    const label = el.querySelector('.stage-status-label');
    const statusMap = {
      pending: { dot: '○', text: 'Pending', cls: 'pending' },
      running: { dot: '◉', text: 'Running', cls: 'running' },
      complete: { dot: '✓', text: 'Complete', cls: 'complete' },
      error: { dot: '✗', text: 'Error', cls: 'error' }
    };
    const s = statusMap[status] || statusMap.pending;
    if (dot) dot.textContent = s.dot;
    if (label) label.textContent = s.text;
    el.className = `stage-indicator stage-${s.cls}`;
  },

  // ── Log message to stage panel ────────────────────────────
  log(stageId, message) {
    const el = document.getElementById(`stage-log-${stageId}`);
    if (!el) return;
    const line = `[${new Date().toLocaleTimeString()}] ${message}\n`;
    this._logBuffers[stageId] += line;
    el.textContent = this._logBuffers[stageId];
    el.scrollTop = el.scrollHeight;
  },

  // ── Stream partial AI response to log ────────────────────
  logStream(stageId, chunk) {
    const el = document.getElementById(`stage-log-${stageId}`);
    if (!el) return;
    this._logBuffers[stageId] += chunk;
    el.textContent = this._logBuffers[stageId];
    el.scrollTop = el.scrollHeight;
  },

  // ── Render Competitor Matrix in panel ─────────────────────
  renderCompetitorMatrix(matrix) {
    const el = document.getElementById('competitor-matrix-display');
    if (!el) return;

    const rows = (matrix.competitors || []).map(c => `
      <div class="competitor-row">
        <div class="competitor-name">${c.name} <span class="competitor-site">${c.website}</span></div>
        <div class="competitor-pos">${c.positioning}</div>
        <div class="competitor-meta">
          <span class="comp-style">${c.design_style}</span>
          <span class="comp-weak">⚡ Gap: ${(c.weaknesses || []).join(' · ')}</span>
        </div>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="ownable-angle">
        <span class="ownable-label">OWNABLE ANGLE</span>
        <p>${matrix.ownable_angle}</p>
      </div>
      <div class="competitor-list">${rows}</div>
    `;
  },

  // ── Render Critique Report ────────────────────────────────
  renderCritiqueReport(report) {
    const el = document.getElementById('critique-report-display');
    if (!el) return;
    el.innerHTML = CritiqueEngine.formatReportHTML(report);
  },

  // ── Render Stage 06 Delivery Panel ───────────────────────
  renderDelivery(pitch, monitor, manifest) {
    const el = document.getElementById('delivery-display');
    if (!el) return;

    el.innerHTML = `
      <div class="delivery-ready">
        <div class="delivery-badge">🚀 DELIVERY COMPLETE</div>
        <p class="delivery-desc">All 6 pipeline stages finished. Your production assets are ready.</p>
        <div class="delivery-actions">
          <button class="btn btn-primary" id="dl-full-bundle" onclick="B2bPitch.downloadDeliveryBundle(BrandManifest.get())">
            📦 Download Full Bundle (ZIP)
          </button>
          <button class="btn btn-secondary" id="dl-pitch" onclick="B2bPitch.downloadPitch(BrandManifest.get().delivery_artifacts?.b2b_pitch || '')">
            📄 Download B2B Pitch
          </button>
          <button class="btn btn-secondary" id="dl-monitor" onclick="B2bPitch.downloadPitch(BrandManifest.get().delivery_artifacts?.maintenance_monitor || '', 'maintenance-monitor.md')">
            📋 Download Maintenance Monitor
          </button>
        </div>
        <div class="delivery-pitch-preview">
          <div class="pitch-preview-header">B2B Pitch Preview</div>
          <pre class="pitch-preview-text">${(pitch || '').substring(0, 800)}${pitch && pitch.length > 800 ? '\n...[truncated]' : ''}</pre>
        </div>
      </div>
    `;
  }
};

// ============================================================
// Toast Notification System (replaces all alert() calls)
// ============================================================
const Toast = {
  _container: null,

  _getContainer() {
    if (!this._container) {
      this._container = document.getElementById('toast-container');
    }
    return this._container;
  },

  show(message, type = 'info', duration = 4000) {
    const container = this._getContainer();
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { info: 'ℹ', success: '✓', error: '✗', warning: '⚠', accent: '⚡' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span class="toast-msg">${message}</span>`;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('toast-visible'));
    });

    // Animate out + remove
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      toast.classList.add('toast-hiding');
      setTimeout(() => toast.remove(), 350);
    }, duration);
  }
};
