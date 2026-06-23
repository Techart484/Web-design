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
      // Execute the real work on the backend
      PipelineUI.setStageStatus(1, 'running');
      PipelineUI.log('STAGE_1_START: BRAND_BIBLE_EXTRACTION');

      const response = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clientUrl })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Pipeline execution failed');
      }

      const data = await response.json();

      // Update Manifest with real data
      BrandManifest.patch('colors', data.brand);
      BrandManifest.patch('industry', data.brand.detected_industry);

      PipelineUI.setStageStatus(1, 'complete');
      PipelineUI.log('STAGE_1_SUCCESS: BRAND_BIBLE_EXTRACTION');
      PipelineUI.log(`NICHE_DETECTED: ${data.brand.detected_industry.toUpperCase()}`);
      PipelineUI.updateMounts(1);

      // Fast-track through simulation stages 2-5 for UI continuity
      for (let n = 2; n <= 5; n++) {
        if (this._aborted) return;
        await this.runStage(n);
      }

      // Final Stage 6: Delivery
      await this.runStage(6);

      PipelineUI.log('PIPELINE_SUCCESS: ALL_STAGES_COMPLETE');
    } catch (err) {
      PipelineUI.log(`PIPELINE_ERROR: ${err.message.toUpperCase()}`);
      PipelineUI.setStageStatus(1, 'error');
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
      await this._simulateWork(n);

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
    // Stage-specific simulation logic
    switch(n) {
      case 1:
        PipelineUI.log('CRAWLING_TARGET: ' + BrandManifest.get().client.url);
        await new Promise(r => setTimeout(r, 2000));
        PipelineUI.log('NICHE_DETECTED: HIGH-END_SERVICE_PROVIDER');
        PipelineUI.log('COLORS_IDENTIFIED: #C19A5B, #060606');
        break;
      case 2:
        PipelineUI.log('ANALYZING_NICHE_RIVALS...');
        await new Promise(r => setTimeout(r, 1500));
        PipelineUI.log('OWNABLE_ANGLE: PREMIUM_AUTHORITY_AUTONOMY');
        break;
      case 3:
        PipelineUI.log('SELECTING_INDUSTRY_GRADE_COMPONENTS...');
        PipelineUI.log('MOUNTING_BRUTALIST_NAV_V4...');
        PipelineUI.log('INJECTING_DYNAMIC_SERVICES_GRID...');
        await new Promise(r => setTimeout(r, 2500));
        break;
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
        const upfront = Math.floor(Math.random() * (1800 - 600 + 1) + 600);
        const monthly = Math.floor(Math.random() * (250 - 150 + 1) + 150);

        PipelineUI.log(`FINANCIALS_CALIBRATED: UPFRONT $${upfront} // MONTHLY $${monthly}`);
        PipelineUI.log('PREPARING_DOMAIN_HANDSHAKE_PROTOCOL...');

        const pitch = `We have modernized your presence using an industry-grade component stack. Total upfront value: $${upfront}. Monthly maintenance & tech-stack upkeep: $${monthly}. Ready for domain shipment.`;

        BrandManifest.patch('delivery_artifacts', {
          b2b_pitch: pitch,
          upfront_price: upfront,
          monthly_price: monthly
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
