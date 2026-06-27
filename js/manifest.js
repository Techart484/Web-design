// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — Brand Bible Manifest
// Manages the shared pipeline state JSON across all 6 stages.
// ============================================================

const BrandManifest = {
  // Default empty manifest structure (the "Brand Bible")
  _schema: {
    client: {
      url: '',
      name: '',
      industry: 'default',
      domain: ''
    },
    job_uuid: '',
    colors: {
      primary: '#8b5cf6',
      secondary: '#f43f5e',
      accent: '#06b6d4',
      bg: '#06050b'
    },
    typography: {
      heading: 'Outfit',
      body: 'Outfit'
    },
    voice_tone: '',
    value_propositions: [],
    ownable_angle: '',
    competitor_matrix: [],
    design_signature: 'Premium Brutalist',
    sections_layout: [],
    critique_log: [],
    engine_updates: [],
    pipeline_status: {
      current_stage: 0,
      stages: [
        { id: 1, name: 'Brand Scrape',        status: 'pending', ts: null },
        { id: 2, name: 'Competitor Matrix',    status: 'pending', ts: null },
        { id: 3, name: 'Culture-First Build',  status: 'pending', ts: null },
        { id: 4, name: 'Visual Signature',     status: 'pending', ts: null },
        { id: 5, name: 'Critique Loop',        status: 'pending', ts: null },
        { id: 6, name: 'Delivery',             status: 'pending', ts: null }
      ]
    }
  },

  // Active manifest instance (cloned from schema on init)
  _data: null,

  /** Initialize or reset the manifest */
  init() {
    this._data = JSON.parse(JSON.stringify(this._schema));
    this._persist();
    return this._data;
  },

  /** Get current manifest data */
  get() {
    if (!this._data) this.load();
    return this._data;
  },

  /** Patch a top-level key with partial data */
  patch(key, value) {
    if (!this._data) this.load();
    if (typeof value === 'object' && !Array.isArray(value) && this._data[key] && typeof this._data[key] === 'object') {
      this._data[key] = { ...this._data[key], ...value };
    } else {
      this._data[key] = value;
    }
    this._persist();
    window.dispatchEvent(new CustomEvent('manifest:updated', { detail: { key, value } }));
  },

  /** Update a pipeline stage status */
  setStageStatus(stageId, status, details = null) {
    if (!this._data) this.load();
    const stage = this._data.pipeline_status.stages.find(s => s.id === stageId);
    if (stage) {
      stage.status = status; // 'pending' | 'running' | 'complete' | 'error'
      stage.ts = new Date().toISOString();
      if (details) stage.details = details;
      this._data.pipeline_status.current_stage = stageId;
    }
    this._persist();
    window.dispatchEvent(new CustomEvent('pipeline:stage-update', {
      detail: { stageId, status, details }
    }));
  },

  /** Append a critique log entry */
  logCritique(entry) {
    if (!this._data) this.load();
    this._data.critique_log.push({
      ts: new Date().toISOString(),
      ...entry
    });
    this._persist();
  },

  /** Append an engine update entry */
  logEngineUpdate(entry) {
    if (!this._data) this.load();
    this._data.engine_updates.push({
      ts: new Date().toISOString(),
      ...entry
    });
    this._persist();
  },

  /** Validate that Stage 02 has populated competitor_matrix before allowing Stage 03 */
  isStage2Complete() {
    const d = this.get();
    const stage2 = d.pipeline_status.stages.find(s => s.id === 2);
    return stage2 && stage2.status === 'complete' && d.competitor_matrix.length >= 1;
  },

  /** Validate full manifest has required fields */
  validate() {
    const d = this.get();
    const errors = [];
    if (!d.colors.primary) errors.push('colors.primary is empty');
    if (!d.pipeline_status) errors.push('pipeline_status is missing');
    return { valid: errors.length === 0, errors };
  },

  /** Serialize to JSON string */
  toJSON() {
    return JSON.stringify(this._data, null, 2);
  },

  /** Persist to localStorage */
  _persist() {
    try {
      localStorage.setItem('engine_manifest', JSON.stringify(this._data));
    } catch (e) { /* storage full — non-fatal */ }
  },

  /** Load from localStorage or reset */
  load() {
    try {
      const stored = localStorage.getItem('engine_manifest');
      if (stored) {
        this._data = JSON.parse(stored);
        // Migrate: ensure all schema keys exist on old data
        this._data = this._deepMerge(JSON.parse(JSON.stringify(this._schema)), this._data);
      } else {
        this.init();
      }
    } catch (e) {
      this.init();
    }
    return this._data;
  },

  /** Deep merge (schema defaults + stored data) */
  _deepMerge(base, override) {
    const out = { ...base };
    for (const key of Object.keys(override)) {
      if (typeof override[key] === 'object' && override[key] !== null && !Array.isArray(override[key]) && typeof base[key] === 'object') {
        out[key] = this._deepMerge(base[key], override[key]);
      } else {
        out[key] = override[key];
      }
    }
    return out;
  }
};

// Auto-load on script init
BrandManifest.load();
