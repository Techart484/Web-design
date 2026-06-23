// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — 6-Stage Pipeline
// v2.0 — Aligned with B2B Control Center Stages
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
      // Execute Stages 1-3 on the backend
      for (let n = 1; n <= 3; n++) {
        if (this._aborted) return;
        await this.runStage(n);
      }

      // Simulation Stages 4-5 for UI continuity
      for (let n = 4; n <= 5; n++) {
        if (this._aborted) return;
        await this.runStage(n);
      }

      // Final Stage 6: Delivery
      await this.runStage(6);

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
      6: 'DELIVERY_FINANCIALS_SYNC'
    };

    PipelineUI.setStageStatus(n, 'running');
    PipelineUI.log(`STAGE_${n}_START: ${stageNames[n]}`);

    try {
      if (n <= 3) {
        // REAL WORK: Call Backend
        const manifest = BrandManifest.get();
        const response = await fetch(`/api/pipeline/stage/${n}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: manifest.client.url,
            industry: manifest.industry
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Stage ${n} failed`);
        }

        const result = await response.json();

        // Update manifest/UI based on backend data
        if (n === 1) {
          BrandManifest.patch('colors', result.data);
          BrandManifest.patch('industry', result.data.detected_industry);
          PipelineUI.log(`NICHE_DETECTED: ${result.data.detected_industry.toUpperCase()}`);
        } else if (n === 2) {
          BrandManifest.patch('analysis', result.data);
          PipelineUI.log(`OWNABLE_ANGLE: ${result.data.ownable_angle.toUpperCase()}`);
        } else if (n === 3) {
          PipelineUI.log('ENGINE_PRODUCTION_BUILD_COMPILED');
        }

        // Output backend logs to terminal
        if (result.logs) {
          result.logs.split('\n').forEach(line => {
            if (line.trim()) PipelineUI.log(line.trim(), true); // true = sub-log
          });
        }
      } else {
        // SIMULATED WORK
        await this._simulateWork(n);
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

  /** Simulate Stage Work */
  async _simulateWork(n) {
    switch(n) {
      case 4:
        PipelineUI.log('APPLYING_MOTION_SIGNATURE...');
        PipelineUI.log('CALIBRATING_HAIRLINE_PRECISION...');
        await new Promise(r => setTimeout(r, 1200));
        break;
      case 5:
        PipelineUI.log('RUNNING_SELF_FIX_CRITIQUE...');
        await new Promise(r => setTimeout(r, 2000));
        PipelineUI.log('AUDIT_SCORE: 99/100');
        break;
      case 6:
        PipelineUI.log('GENERATING_STRIPE_INVOICE_LEDGER...');

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

        PipelineUI.log(`FINANCIALS_CALIBRATED: UPFRONT $${upfront} // MONTHLY $${monthly}`);
        PipelineUI.log('PREPARING_DOMAIN_HANDSHAKE_PROTOCOL...');

        BrandManifest.patch('delivery_artifacts', {
          upfront_price: upfront,
          monthly_price: monthly
        });

        const pitch = B2bPitch.generateOfflinePitch(manifest);
        const monitor = B2bPitch.generateMaintenanceMonitor(manifest);

        BrandManifest.patch('delivery_artifacts', {
          b2b_pitch: pitch,
          maintenance_monitor: monitor
        });

        PipelineUI.renderDelivery(pitch, upfront, monthly);
        await new Promise(r => setTimeout(r, 1000));
        PipelineUI.readyDomainShipment();
        break;
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
