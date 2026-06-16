// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — 6-Stage Pipeline
// State machine orchestrating all pipeline stages with gates.
// ============================================================

const Pipeline = {
  _running: false,
  _aborted: false,

  // ── Public: Run Full Pipeline ──────────────────────────────
  async run(clientUrl, clientName = '', industry = 'default') {
    if (this._running) {
      Toast.show('Pipeline already running. Abort first.', 'warning');
      return;
    }
    this._running = true;
    this._aborted = false;

    // Reset manifest for fresh run
    BrandManifest.init();
    BrandManifest.patch('client', { url: clientUrl, name: clientName, industry, domain: this._extractDomain(clientUrl) });

    PipelineUI.open();
    Toast.show('⚡ Autonomous pipeline initiated', 'accent');

    try {
      await this.runStage(1);
      if (this._aborted) return;
      await this.runStage(2);
      if (this._aborted) return;

      // ── GATE: Stage 3 blocked until Stage 2 complete ──────
      if (!BrandManifest.isStage2Complete()) {
        BrandManifest.setStageStatus(3, 'error', 'Blocked — Stage 02 Competitor Matrix incomplete');
        Toast.show('⛔ Stage 03 blocked — Competitor Matrix not populated', 'error');
        this._running = false;
        return;
      }

      await this.runStage(3);
      if (this._aborted) return;
      await this.runStage(4);
      if (this._aborted) return;
      await this.runStage(5);
      if (this._aborted) return;
      await this.runStage(6);

      Toast.show('✅ Pipeline complete — All 6 stages finished', 'success');
    } catch (err) {
      Toast.show(`Pipeline error: ${err.message}`, 'error');
      console.error('[Pipeline] Fatal error:', err);
    } finally {
      this._running = false;
    }
  },

  // ── Public: Run Individual Stage ──────────────────────────
  async runStage(n) {
    const stages = {
      1: () => this._stage01_scrape(),
      2: () => this._stage02_matrix(),
      3: () => this._stage03_build(),
      4: () => this._stage04_visuals(),
      5: () => this._stage05_critique(),
      6: () => this._stage06_delivery()
    };
    if (!stages[n]) throw new Error(`Invalid stage: ${n}`);

    BrandManifest.setStageStatus(n, 'running');
    PipelineUI.setStageStatus(n, 'running');
    Toast.show(`▶ Stage 0${n} running...`, 'info');

    try {
      await stages[n]();
      BrandManifest.setStageStatus(n, 'complete');
      PipelineUI.setStageStatus(n, 'complete');
      Toast.show(`✓ Stage 0${n} complete`, 'success');
    } catch (err) {
      BrandManifest.setStageStatus(n, 'error', err.message);
      PipelineUI.setStageStatus(n, 'error');
      Toast.show(`✗ Stage 0${n} failed: ${err.message}`, 'error');
      throw err;
    }
  },

  // ── Abort ──────────────────────────────────────────────────
  abort() {
    this._aborted = true;
    this._running = false;
    Toast.show('Pipeline aborted', 'warning');
    BrandManifest.patch('pipeline_status', {
      ...BrandManifest.get().pipeline_status,
      aborted: true
    });
  },

  // ══ STAGE 01: Brand Scrape ════════════════════════════════
  async _stage01_scrape() {
    const manifest = BrandManifest.get();
    const { url, industry } = manifest.client;

    PipelineUI.log(1, 'Initiating Brand Bible extraction...');

    // 1a. Extract industry from domain keywords
    const domain = manifest.client.domain || '';
    const detectedIndustry = this._detectIndustry(domain, industry);
    BrandManifest.patch('client', { ...manifest.client, industry: detectedIndustry });

    // 1b. Attempt real color extraction via CORS proxy
    let colors = null;
    if (url) {
      colors = await this._fetchBrandColors(url, detectedIndustry);
    }

    if (!colors) {
      // Fallback to industry matrix
      colors = IndustryFallbacks[detectedIndustry] || IndustryFallbacks.default || {
        primary: '#8b5cf6', secondary: '#f43f5e', accent: '#06b6d4', bg: '#06050b'
      };
      PipelineUI.log(1, `No live colors extracted — deployed ${detectedIndustry} industry fallback matrix`);
    } else {
      PipelineUI.log(1, `Brand colors extracted: ${JSON.stringify(colors)}`);
    }

    // 1c. Extract value propositions from industry
    const valueProps = this._getIndustryValueProps(detectedIndustry);

    BrandManifest.patch('colors', colors);
    BrandManifest.patch('value_propositions', valueProps);
    BrandManifest.patch('typography', {
      heading: AppState.fontFamily || 'Outfit',
      body: AppState.fontFamily || 'Outfit'
    });

    // Apply colors to canvas immediately
    Object.assign(AppState, {
      themePrimary: colors.primary,
      themeSecondary: colors.secondary,
      themeAccent: colors.accent,
      themeBg: colors.bg
    });
    updateFormControlsFromState();
    updateIframeStyles();

    PipelineUI.log(1, `✓ Brand Bible populated for industry: ${detectedIndustry}`);
  },

  // ══ STAGE 02: Competitor Matrix ═══════════════════════════
  async _stage02_matrix() {
    const manifest = BrandManifest.get();
    PipelineUI.log(2, 'Querying AI for competitor analysis...');

    // Check AI availability
    const health = await AiEngine.checkHealth();
    PipelineUI.log(2, health.online
      ? `Ollama online — models: ${health.models.slice(0, 3).join(', ')}`
      : 'Ollama offline — using intelligent fallback matrix');

    let matrix;
    if (health.online) {
      PipelineUI.log(2, 'Sending prompt to Qwen 2.5 Coder...');
      matrix = await AiEngine.buildCompetitorMatrix(manifest);
    } else {
      // Offline fallback — built-in competitor data by industry
      matrix = this._getOfflineCompetitorMatrix(manifest.client.industry);
    }

    BrandManifest.patch('competitor_matrix', matrix.competitors);
    BrandManifest.patch('ownable_angle', matrix.ownable_angle);
    BrandManifest.patch('design_signature', matrix.recommended_design_signature || 'Premium Brutalist');

    // Update UI competitor display
    PipelineUI.renderCompetitorMatrix(matrix);
    PipelineUI.log(2, `✓ ${matrix.competitors.length} competitors analyzed. Ownable angle: "${matrix.ownable_angle}"`);
  },

  // ══ STAGE 03: Culture-First Build ════════════════════════
  async _stage03_build() {
    // Gate is checked in run() before calling — redundant safety check
    if (!BrandManifest.isStage2Complete()) {
      throw new Error('Stage 02 competitor matrix not complete');
    }

    const manifest = BrandManifest.get();
    PipelineUI.log(3, 'Assembling layout from Component_Library using Brand Bible...');

    // Load the appropriate template preset based on detected industry
    const presetMap = {
      medical: 'medical', construction: 'construction',
      legal: 'legal', fitness: 'fitness',
      default: 'saas', general: 'saas'
    };
    const presetId = presetMap[manifest.client.industry] || 'saas';
    loadTemplatePreset(presetId);

    BrandManifest.patch('sections_layout', AppState.activeSections.map(s => s.componentId));
    PipelineUI.log(3, `✓ Layout assembled: ${AppState.activeSections.length} sections using "${presetId}" preset`);
  },

  // ══ STAGE 04: Visual Signature ════════════════════════════
  async _stage04_visuals() {
    const manifest = BrandManifest.get();
    PipelineUI.log(4, `Applying Design Signature: "${manifest.design_signature}"`);

    const health = await AiEngine.checkHealth();
    let designRec = manifest.design_signature;

    if (health.online) {
      PipelineUI.log(4, 'Getting AI design signature recommendation...');
      const rec = await AiEngine.recommendDesignSignature(manifest, (chunk) => {
        PipelineUI.logStream(4, chunk);
      });
      if (rec) designRec = rec;
      BrandManifest.patch('design_signature', designRec.substring(0, 50));
    }

    // Inject motion library into canvas
    const iframe = document.getElementById('preview-iframe');
    if (iframe && iframe.contentDocument) {
      MotionLib.applyToCanvas(iframe.contentDocument);
      PipelineUI.log(4, '✓ Motion library injected into canvas');
    }

    // Apply glow pulses to primary CTA elements in canvas
    if (iframe && iframe.contentDocument) {
      iframe.contentDocument.querySelectorAll('.hero-btn-primary, .popular-btn, .contact-submit-btn').forEach(el => {
        el.style.animation = 'motion-glow-pulse 2.5s ease-in-out infinite';
      });
    }

    PipelineUI.log(4, `✓ Visual signature applied: ${manifest.design_signature}`);
  },

  // ══ STAGE 05: Critique Loop ═══════════════════════════════
  async _stage05_critique() {
    PipelineUI.log(5, 'Running self-audit against DNA-Only Language...');

    const { html, css } = Exporter.compileWorkspace(AppState);

    // Run CritiqueEngine static checks
    const staticReport = CritiqueEngine.runStaticAudit(html, css);
    PipelineUI.log(5, `Static audit: ${staticReport.issues.length} issues found`);

    staticReport.issues.forEach(issue => {
      BrandManifest.logCritique({ type: 'static', ...issue });
    });

    // Run AI critique if Ollama online
    const health = await AiEngine.checkHealth();
    if (health.online) {
      PipelineUI.log(5, 'Sending compiled code to AI critic...');
      const aiReport = await AiEngine.critiqueCode(html, css, (chunk) => {
        PipelineUI.logStream(5, chunk);
      });

      BrandManifest.logCritique({ type: 'ai', report: aiReport });

      // Log engine updates
      (aiReport.engine_update_recommendations || []).forEach(rec => {
        BrandManifest.logEngineUpdate({ source: 'Stage05_AI', recommendation: rec });
      });

      PipelineUI.renderCritiqueReport(aiReport);
      PipelineUI.log(5, `✓ AI audit score: ${aiReport.score}/100. ${(aiReport.critical_issues || []).length} critical issues.`);
    } else {
      PipelineUI.log(5, `✓ Static audit complete (AI offline). Score: ${staticReport.score}/100`);
    }
  },

  // ══ STAGE 06: Delivery ════════════════════════════════════
  async _stage06_delivery() {
    PipelineUI.log(6, 'Generating delivery artifacts...');

    const manifest = BrandManifest.get();
    const health = await AiEngine.checkHealth();

    // Concurrent: build B2B pitch + maintenance monitor
    const [pitch, monitor] = await Promise.all([
      health.online
        ? AiEngine.generatePitch(manifest)
        : B2bPitch.generateOfflinePitch(manifest),
      Promise.resolve(B2bPitch.generateMaintenanceMonitor(manifest))
    ]);

    // Store artifacts in manifest
    BrandManifest.patch('delivery_artifacts', {
      b2b_pitch: pitch,
      maintenance_monitor: monitor,
      generated_at: new Date().toISOString()
    });

    // Render in UI
    PipelineUI.renderDelivery(pitch, monitor, manifest);

    PipelineUI.log(6, '✓ B2B pitch generated');
    PipelineUI.log(6, '✓ Flow B maintenance monitor generated');
    PipelineUI.log(6, '✓ All delivery artifacts ready for download');
  },

  // ── Helpers ───────────────────────────────────────────────
  _extractDomain(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url.includes('://') ? url : 'https://' + url);
      return parsed.hostname.replace('www.', '');
    } catch (e) { return url; }
  },

  _detectIndustry(domain, fallback = 'default') {
    const d = domain.toLowerCase();
    if (/clinic|dental|health|med|doctor|hospital|pharma/.test(d)) return 'medical';
    if (/construct|roof|build|contrac|general/.test(d)) return 'construction';
    if (/law|legal|attorney|partner|counsel|tax/.test(d)) return 'legal';
    if (/fit|gym|crossfit|sport|yoga|train|muscle/.test(d)) return 'fitness';
    if (/saas|app|software|tech|cloud|api/.test(d)) return 'saas';
    return fallback !== 'default' ? fallback : 'default';
  },

  async _fetchBrandColors(url, industry) {
    // Try CORS proxy to actually fetch brand colors
    const proxies = [
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    for (const proxy of proxies) {
      try {
        const res = await fetch(proxy, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) continue;
        const html = await res.text();
        return this._parseColors(html);
      } catch (e) {
        continue;
      }
    }
    return null;
  },

  _parseColors(html) {
    const hexPattern = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b/g;
    const neutralFilter = new Set([
      '#ffffff','#000000','#0a0a0a','#171717','#f3f4f6','#e5e7eb',
      '#f5f5f5','#eeeeee','#111111','#1a1a1a','#333333','#666666',
      '#999999','#cccccc','#dddddd','#f8f8f8','#fafafa','#e0e0e0'
    ]);

    const freq = {};
    let m;
    while ((m = hexPattern.exec(html)) !== null) {
      let hex = m[0].toLowerCase();
      if (hex.length === 4) hex = '#' + [...hex.slice(1)].map(c => c+c).join('');
      if (!neutralFilter.has(hex)) {
        freq[hex] = (freq[hex] || 0) + 1;
      }
    }
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([c]) => c);
    if (sorted.length < 2) return null;
    return {
      primary: sorted[0],
      secondary: sorted[2] || sorted[0],
      accent: sorted[1],
      bg: '#06050b'
    };
  },

  _getIndustryValueProps(industry) {
    const props = {
      medical: ['Patient-first care', 'HIPAA compliance', 'Modern diagnostic technology', '24/7 availability'],
      construction: ['Licensed & insured', 'On-time delivery', 'Quality materials', 'Free estimates'],
      legal: ['Experienced counsel', 'Confidential consultations', 'No-fee initial review', 'Proven track record'],
      fitness: ['Expert coaching', 'State-of-the-art equipment', 'Flexible memberships', 'Community-driven'],
      default: ['Premium quality', 'Fast delivery', 'Expert support', 'Proven results']
    };
    return props[industry] || props.default;
  },

  _getOfflineCompetitorMatrix(industry) {
    const matrices = {
      medical: {
        competitors: [
          { name: 'ZocDoc', website: 'zocdoc.com', positioning: 'Largest online doctor booking marketplace', strengths: ['Brand recognition', 'Network size'], weaknesses: ['Impersonal feel', 'Generic design'], design_style: 'clinical minimal' },
          { name: 'Teladoc', website: 'teladoc.com', positioning: 'Telehealth leader for virtual consultations', strengths: ['Convenience', 'Insurance integration'], weaknesses: ['Cold UI', 'High churn'], design_style: 'corporate blue' },
          { name: 'Headspace Health', website: 'headspace.com', positioning: 'Mental wellness through mindfulness', strengths: ['Brand warmth', 'App quality'], weaknesses: ['Narrow focus', 'Subscription fatigue'], design_style: 'organic calm' }
        ],
        ownable_angle: 'Hyper-local, community-first clinic with warm human design vs. corporate cold telehealth giants',
        recommended_design_signature: 'Organic Minimal'
      },
      default: {
        competitors: [
          { name: 'Wix', website: 'wix.com', positioning: 'DIY website builder for everyone', strengths: ['Ease of use', 'Templates'], weaknesses: ['Generic output', 'Poor performance'], design_style: 'bright generic' },
          { name: 'Squarespace', website: 'squarespace.com', positioning: 'Design-forward website creation', strengths: ['Beautiful templates', 'Polish'], weaknesses: ['Limited customization', 'Expensive'], design_style: 'editorial minimal' },
          { name: 'Webflow', website: 'webflow.com', positioning: 'No-code for professional designers', strengths: ['Power & control', 'CMS'], weaknesses: ['Steep learning curve', 'Cost'], design_style: 'dark tech premium' }
        ],
        ownable_angle: 'AI-driven, autonomously generated sites with brand DNA extraction — zero manual design work vs. DIY tools that require design skill',
        recommended_design_signature: 'Premium Brutalist'
      }
    };
    return matrices[industry] || matrices.default;
  }
};
