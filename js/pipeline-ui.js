// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — Pipeline UI Controller
// v2.1 — Premium Brutalist Terminal & Stage Orchestration
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

    const flowAStatus = document.querySelector('.delivery-col:nth-child(1) .flow-status');
    if (flowAStatus) {
      flowAStatus.textContent = '// PRICING TIER CALIBRATES AFTER STAGE 4 COMPLETES';
      flowAStatus.style.color = 'var(--text-muted)';
    }

    const flowBStatus = document.querySelector('.delivery-col:nth-child(2) .flow-status');
    if (flowBStatus) {
      flowBStatus.textContent = '// MONITOR ARMS AFTER STAGE 4 COMPLETES';
      flowBStatus.style.color = 'var(--text-muted)';
    }

    const previewMount = document.getElementById('live-preview-mount');
    if (previewMount) {
      previewMount.style.display = 'block';
      previewMount.textContent = '// PREVIEW RENDERS AFTER STAGE 1 (SCRAPE) COMPLETES';
    }
    const iframe = document.getElementById('preview-iframe');
    if (iframe) iframe.style.display = 'none';

    // Remove existing download button if any
    const existingDl = document.getElementById('btn-download-bundle');
    if (existingDl) existingDl.remove();
  },

  /** Update Stage Status Indicator */
  setStageStatus(stageId, status) {
    const el = document.getElementById(`stage-${stageId}`);
    if (!el) return;
    el.setAttribute('data-status', status);
  },

  /** Log message to terminal stream */
  log(message, isSubLog = false) {
    if (!this._terminal) return;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    const prefix = isSubLog ? '  >> ' : `[${timestamp}] `;
    const line = `${prefix}${message}\n`;

    // Clear placeholder on first real log
    if (this._terminal.textContent.includes('awaiting execution')) {
      this._terminal.textContent = '';
      this._logBuffer = '';
    }

    this._logBuffer += line;
    this._terminal.textContent = this._logBuffer;
    this._terminal.scrollTop = this._terminal.scrollHeight;
  },

  /** Enable Download Button */
  enableDownload(url) {
    const deliveryActions = document.querySelector('.delivery-links');
    if (!deliveryActions) return;

    let dlBtn = document.getElementById('btn-download-bundle');
    if (!dlBtn) {
      dlBtn = document.createElement('button');
      dlBtn.id = 'btn-download-bundle';
      dlBtn.className = 'btn-execute';
      dlBtn.style.marginTop = '20px';
      dlBtn.style.width = '100%';
      dlBtn.textContent = '📥 DOWNLOAD DELIVERY BUNDLE (.ZIP)';
      dlBtn.onclick = () => window.location.href = url;
      deliveryActions.appendChild(dlBtn);
    }
  },

  /** Update Vercel/Framer mount points */
  updateMounts(stageId) {
    if (stageId === 3) {
      const v = document.querySelector('#section-vercel .placeholder-area p');
      if (v) v.innerHTML = '<span style="color:#00ff00">✓ ENGINE_PRODUCTION_BUILD_COMPILED</span><br>ARTIFACT: /dist/index.html';

      const pm = document.getElementById('live-preview-mount');
      if (pm) pm.style.display = 'none';
      const iframe = document.getElementById('preview-iframe');
      if (iframe) {
        iframe.style.display = 'block';
        iframe.src = '/dist/index.html';
      }
    }
    if (stageId === 4) {
      const f = document.querySelector('#section-framer .placeholder-area p');
      if (f) f.innerHTML = '<span style="color:#00ff00">✓ FRAMER_VISUAL_CANVAS_SYNCED</span><br>WSS: CONNECTED // SESSION_ID: ' + Math.random().toString(36).substring(7);

      const wssStatus = document.querySelector('#section-framer .status-right');
      if (wssStatus) {
        wssStatus.textContent = '● WSS CONNECTED';
        wssStatus.style.color = '#00ff00';
      }
    }

    // Auto-render financials if stage 6 completes
    if (stageId === 6) {
      const manifest = BrandManifest.get();
      const industry = manifest.industry || 'default';
      let baseUpfront = 1200;
      let baseMonthly = 200;

      if (industry === 'medical' || industry === 'legal') {
        baseUpfront = 1800;
        baseMonthly = 250;
      } else if (industry === 'saas') {
        baseUpfront = 1500;
        baseMonthly = 180;
      }

      const upfront = Math.floor(baseUpfront * (0.8 + Math.random() * 0.4));
      const monthly = Math.floor(baseMonthly * (0.9 + Math.random() * 0.2));

      const pitch = B2bPitch.generateOfflinePitch(manifest);
      this.renderDelivery(pitch, upfront, monthly);
    }
  },

  /** Update delivery links and financial UI */
  renderDelivery(pitch, upfront, monthly) {
    const links = document.querySelectorAll('.link-url');
    if (links[0]) links[0].textContent = 'HTTPS://ENGINE-PROTOTYPE-921.VERCEL.APP';
    if (links[1]) links[1].textContent = 'HTTPS://FRAMER.COM/PROJECTS/ENGINE-POLISH-V14';
    if (links[2]) links[2].textContent = 'GITHUB.COM/TECHART484/DELIVERY-REPO';

    const pitchStatus = document.querySelector('.pitch-status');
    if (pitchStatus) {
      pitchStatus.textContent = '// PITCH DRAFTED: ' + pitch.substring(0, 60).toUpperCase() + '...';
      pitchStatus.style.color = 'var(--accent-color)';
    }

    // Update Flow Statuses
    const flowAStatus = document.querySelector('.delivery-col:nth-child(1) .flow-status');
    if (flowAStatus) {
      flowAStatus.textContent = `// UPFRONT ASSET VALUED AT $${upfront}`;
      flowAStatus.style.color = '#00ff00';
    }

    const flowBStatus = document.querySelector('.delivery-col:nth-child(2) .flow-status');
    if (flowBStatus) {
      flowBStatus.textContent = `// MAINTENANCE MONITOR ACTIVE: $${monthly}/MO`;
      flowBStatus.style.color = '#00ff00';
    }
  }
};

// ============================================================
// Toast Notification System (B2B Minimalist)
// ============================================================
const Toast = {
  show(message, type = 'info') {
    PipelineUI.log(`SYSTEM_${type.toUpperCase()}: ${message}`);
  }
};
