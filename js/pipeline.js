// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — 6-Stage Pipeline
// v2.1 — Hardened Backend Integration & Delivery Actions
// ============================================================

const Pipeline = {
  _running: false,
  _aborted: false,

  /** Run Full Pipeline (Real Backend Mode) */
  async run(clientUrl) {
    if (this._running) return;
    this._running = true;
    this._aborted = false;

    PipelineUI.open();
    PipelineUI.log('INITIATING_AUTONOMOUS_PIPELINE...');
    PipelineUI.log('CONNECTING_TO_PRODUCTION_ENGINE_BACKEND...');

    BrandManifest.init();
    BrandManifest.patch('client', { url: clientUrl, domain: this._extractDomain(clientUrl) });

    try {
      // Execute all 6 Stages on the backend
      for (let n = 1; n <= 6; n++) {
        if (this._aborted) return;
        await this.runStage(n);
      }

      PipelineUI.log('PIPELINE_SUCCESS: ALL_STAGES_COMPLETE');
    } catch (err) {
      PipelineUI.log(`PIPELINE_ERROR: ${err.message.toUpperCase()}`);
      // The individual stage method handles UI status updates
    } finally {
      this._running = false;
    }
  },

  /** Run Individual Stage */
  async runStage(n) {
    const stageNames = {
      1: 'BRAND_BIBLE_EXTRACTION',
      2: 'NICHE_COMPETITOR_ANALYSIS',
      3: 'INDUSTRY_STACK_CODEGEN',
      4: 'PREMIUM_BRUTALIST_POLISH',
      5: 'SELF_FIXING_CRITIQUE',
      6: 'DELIVERY_BUNDLE_GEN'
    };

    PipelineUI.setStageStatus(n, 'running');
    PipelineUI.log(`STAGE_${n}_START: ${stageNames[n]}`);

    try {
      // REAL WORK: Call Backend
      const manifest = BrandManifest.get();
      const secrets = {
        firecrawl_key: document.getElementById('firecrawl-key')?.value || '',
        gemini_key: document.getElementById('gemini-key')?.value || '',
        github_token: document.getElementById('github-token')?.value || '',
        github_repo: document.getElementById('github-repo')?.value || ''
      };

      const response = await fetch(`/api/pipeline/stage/${n}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: manifest.client.url,
          industry: (manifest.client && manifest.client.industry) || 'default',
          job_uuid: manifest.job_uuid || '',
          ...secrets
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Stage ${n} failed`);
      }

      const result = await response.json();

      // Update manifest/UI based on backend data
      if (result.job_uuid) {
        BrandManifest.patch('job_uuid', result.job_uuid);
      }

      if (n === 1) {
        const bible = result.data || {};
        if (bible.palette) BrandManifest.patch('colors', bible.palette);
        BrandManifest.patch('client', {
          name: (bible.brand_entities && bible.brand_entities.name) || '',
          industry: bible.niche || bible.detected_industry || 'default'
        });
        const niche = bible.niche || bible.detected_industry || 'default';
        PipelineUI.log(`NICHE_DETECTED: ${String(niche).toUpperCase()}`);
      } else if (n === 2) {
        const a = result.data || {};
        BrandManifest.patch('competitor_matrix', a.competitor_matrix || []);
        BrandManifest.patch('value_propositions', a.value_propositions || []);
        BrandManifest.patch('ownable_angle', a.ownable_angle || '');
        if (a.ownable_angle) PipelineUI.log(`OWNABLE_ANGLE: ${a.ownable_angle.toUpperCase()}`);
      } else if (n === 3) {
        PipelineUI.log('ENGINE_PRODUCTION_BUILD_COMPILED');
        if (result.previewUrl) {
          const iframe = document.getElementById('preview-iframe');
          if (iframe) {
            iframe.src = result.previewUrl;
            iframe.style.display = 'block';
            const mount = document.getElementById('live-preview-mount');
            if (mount) mount.style.display = 'none';
          }
        }
      } else if (n === 4) {
        PipelineUI.log('MOTION_SIGNATURE_CALIBRATED');
      } else if (n === 5) {
        if (result.data && result.data.audit_score) {
          PipelineUI.log(`AUDIT_SCORE: ${result.data.audit_score}/100`);
        } else {
          PipelineUI.log('AUDIT_COMPLETE');
        }
      } else if (n === 6) {
        PipelineUI.log('DELIVERY_BUNDLE_READY_FOR_HANDOFF');
        PipelineUI.enableDownload(result.bundleUrl);
        if (result.github && result.github.success) {
          PipelineUI.log(`GITHUB_LIVE_SYNC: SUCCESS [BRANCH: ${result.github.branch}]`);
          PipelineUI.log(`PR_URL: ${result.github.pr_url}`);
        }
      }

      // Output backend logs to terminal
      if (result.logs) {
        result.logs.split('\n').forEach(line => {
          if (line.trim()) PipelineUI.log(line.trim(), true); // true = sub-log
        });
      }

      PipelineUI.setStageStatus(n, 'complete');
      PipelineUI.log(`STAGE_${n}_SUCCESS: ${stageNames[n]}`);
      PipelineUI.updateMounts(n);
    } catch (err) {
      PipelineUI.setStageStatus(n, 'error');
      PipelineUI.log(`STAGE_${n}_FAIL: ${err.message.toUpperCase()}`);
      throw err;
    }
  },

  _extractDomain(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url.includes('://') ? url : 'https://' + url);
      return parsed.hostname.replace('www.', '');
    } catch (e) { return url; }
  }
};
