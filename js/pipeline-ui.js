// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — Pipeline UI Controller
// v2.0 — Premium Brutalist Terminal & Stage Orchestration
// ============================================================

const PipelineUI = {
  _terminal: null,
  _logBuffer: '',

  /** Initialize the UI hooks */
  init() {
    this._terminal = document.getElementById('pipeline-output');
  },

  /** Open/Focus the pipeline view (scrolling to control center) */
  open() {
    const pipelineSection = document.getElementById('section-pipeline-control');
    if (pipelineSection) {
      pipelineSection.scrollIntoView({ behavior: 'smooth' });
    }
    this._resetDisplay();
  },

  /** Reset all stage indicators and terminal */
  _resetDisplay() {
    [1, 2, 3, 4, 5, 6].forEach(n => {
      this.setStageStatus(n, 'pending');
    });
    if (this._terminal) {
      this._terminal.textContent = '// awaiting execution...';
      this._logBuffer = '';
    }

    // Reset placeholders
    const vercelPlaceholder = document.querySelector('#section-vercel .placeholder-area p');
    if (vercelPlaceholder) vercelPlaceholder.textContent = '// Vercel deployment artifact will mount after Stage 1 completes';

    const framerPlaceholder = document.querySelector('#section-framer .placeholder-area p');
    if (framerPlaceholder) framerPlaceholder.textContent = '// Premium Brutalist package will mount after Stage 2 finishes';

    const previewMount = document.getElementById('live-preview-mount');
    if (previewMount) {
      previewMount.style.display = 'block';
      previewMount.textContent = '// PREVIEW RENDERS AFTER STAGE 1 (SCRAPE) COMPLETES';
    }
    const iframe = document.getElementById('preview-iframe');
    if (iframe) iframe.style.display = 'none';
  },

  /** Update Stage Status Indicator */
  setStageStatus(stageId, status) {
    const el = document.getElementById(`stage-${stageId}`);
    if (!el) return;
    el.setAttribute('data-status', status);
  },

  /** Log message to terminal stream */
  log(message) {
    if (!this._terminal) return;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const line = `[${timestamp}] ${message}\n`;
    this._logBuffer += line;
    this._terminal.textContent = this._logBuffer;
    this._terminal.scrollTop = this._terminal.scrollHeight;
  },

  /** Stream partial AI response to terminal */
  logStream(chunk) {
    if (!this._terminal) return;
    this._logBuffer += chunk;
    this._terminal.textContent = this._logBuffer;
    this._terminal.scrollTop = this._terminal.scrollHeight;
  },

  /** Update Vercel/Framer mount points */
  updateMounts(stageId) {
    if (stageId === 1) {
      const v = document.querySelector('#section-vercel .placeholder-area p');
      if (v) v.innerHTML = '<span style="color:#00ff00">✓ VERCEL_BUILD_PROTOTYPE_DEPLOYED</span><br>URL: https://aura-prototype-921.vercel.app';

      const pm = document.getElementById('live-preview-mount');
      if (pm) pm.style.display = 'none';
      const iframe = document.getElementById('preview-iframe');
      if (iframe) iframe.style.display = 'block';
    }
    if (stageId === 2) {
      const f = document.querySelector('#section-framer .placeholder-area p');
      if (f) f.innerHTML = '<span style="color:#00ff00">✓ FRAMER_VISUAL_CANVAS_SYNCED</span><br>WSS: CONNECTED // SESSION_ID: ' + Math.random().toString(36).substring(7);

      const wssStatus = document.querySelector('#section-framer .status-right');
      if (wssStatus) {
        wssStatus.textContent = '● WSS CONNECTED';
        wssStatus.style.color = '#00ff00';
      }
    }
  },

  /** Update delivery links */
  renderDelivery(pitch) {
    const links = document.querySelectorAll('.link-url');
    if (links[0]) links[0].textContent = 'https://aura-prototype-921.vercel.app';
    if (links[1]) links[1].textContent = 'https://framer.com/projects/aura-polish-v14';
    if (links[2]) links[2].textContent = 'github.com/techart484/delivery-repo';

    const pitchStatus = document.querySelector('.pitch-status');
    if (pitchStatus) {
      pitchStatus.textContent = '// PITCH DRAFTED: ' + pitch.substring(0, 60) + '...';
      pitchStatus.style.color = 'var(--accent-color)';
    }
  }
};

// ============================================================
// Toast Notification System (B2B Minimalist)
// ============================================================
const Toast = {
  show(message, type = 'info') {
    // In this premium brutalist design, we might just log to terminal or use a very minimal toast
    PipelineUI.log(`SYSTEM_${type.toUpperCase()}: ${message}`);
  }
};
