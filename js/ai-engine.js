// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — AI Engine
// Ollama REST wrapper for Qwen 2.5 Coder + DeepSeek Coder V2.
// Drives pipeline stages: 02 (Matrix), 04 (Visuals), 05 (Critique).
// ============================================================

const AiEngine = {
  OLLAMA_BASE: 'http://localhost:11434',
  MODELS: {
    competitor:  'qwen2.5-coder:7b',   // Stage 02 — Competitor Matrix
    design:      'qwen2.5-coder:7b',   // Stage 04 — Design Signature
    critique:    'qwen2.5-coder:7b',   // Stage 05 — Self-Audit
    pitch:       'deepseek-coder-v2:16b', // Stage 06 — B2B Pitch
    // Fallback smaller models if large ones unavailable
    fallback:    'qwen2.5-coder:3b'
  },

  _activeModel: null,

  // ── Health Check ──────────────────────────────────────────
  async checkHealth() {
    try {
      const res = await fetch(`${this.OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return { online: false, models: [] };
      const data = await res.json();
      const available = (data.models || []).map(m => m.name);
      return { online: true, models: available };
    } catch (e) {
      return { online: false, models: [], error: e.message };
    }
  },

  async resolveModel(preferred) {
    if (this._activeModel) return this._activeModel;
    const health = await this.checkHealth();
    if (!health.online) throw new Error('Ollama is offline. Run scripts/setup-ollama.ps1 first.');

    // Try preferred, then fallback
    const candidates = [preferred, this.MODELS.fallback, ...health.models];
    for (const m of candidates) {
      if (health.models.some(avail => avail.startsWith(m.split(':')[0]))) {
        // Use the exact available name
        const match = health.models.find(avail => avail.startsWith(m.split(':')[0]));
        return match;
      }
    }
    if (health.models.length > 0) return health.models[0];
    throw new Error('No Ollama models available. Run: ollama pull qwen2.5-coder:7b');
  },

  // ── Core Query (streaming + full response) ─────────────────
  async query(modelPref, prompt, { onChunk = null, temperature = 0.4, maxTokens = 4096 } = {}) {
    const model = await this.resolveModel(modelPref);
    const body = JSON.stringify({
      model,
      prompt,
      stream: !!onChunk,
      options: { temperature, num_predict: maxTokens }
    });

    const res = await fetch(`${this.OLLAMA_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });

    if (!res.ok) throw new Error(`Ollama API error: ${res.status}`);

    if (onChunk) {
      // Streaming mode
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value).split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.response) {
              fullText += obj.response;
              onChunk(obj.response, fullText);
            }
          } catch (_) {}
        }
      }
      return fullText;
    } else {
      // Non-streaming mode
      const data = await res.json();
      return data.response || '';
    }
  },

  // ── Stage 02: Competitor Matrix ────────────────────────────
  async buildCompetitorMatrix(manifest) {
    const { client, colors, value_propositions } = manifest;
    const prompt = `You are a senior brand strategist. Analyze the following client and produce a competitor matrix in pure JSON.

Client:
- Industry: ${client.industry}
- Domain: ${client.domain || client.url}
- Value Props: ${value_propositions.join(', ') || 'Not specified'}
- Primary Color: ${colors.primary}

Task: Identify 6-10 real competitors in the ${client.industry} space. For each, provide:
1. name
2. website (real domain)
3. positioning (1 sentence)
4. strengths (array of 2-3)
5. weaknesses (array of 2-3)
6. design_style (e.g. "minimal SaaS", "aggressive fitness", "corporate blue")

Then identify the "ownable_angle" — the specific positioning gap our client can uniquely own that none of the competitors do.

Respond with ONLY valid JSON in this exact structure:
{
  "competitors": [
    {
      "name": "string",
      "website": "string",
      "positioning": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "design_style": "string"
    }
  ],
  "ownable_angle": "string",
  "recommended_design_signature": "string"
}`;

    const raw = await this.query(this.MODELS.competitor, prompt, { temperature: 0.3 });
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn('[AiEngine] Competitor matrix parse failed, returning partial:', e);
      return {
        competitors: [{ name: 'Competitor Analysis Unavailable', website: '#', positioning: raw.substring(0, 120), strengths: [], weaknesses: [], design_style: 'unknown' }],
        ownable_angle: 'AI analysis unavailable — manual input required',
        recommended_design_signature: 'Premium Brutalist'
      };
    }
  },

  // ── Stage 04: Design Signature Recommendation ──────────────
  async recommendDesignSignature(manifest, onChunk = null) {
    const { client, competitor_matrix, ownable_angle, colors } = manifest;
    const competitorStyles = competitor_matrix.map(c => c.design_style).join(', ');
    const prompt = `You are a world-class art director. Based on the client data, recommend a "Design Signature" — a named visual style that differentiates from all competitors.

Client Industry: ${client.industry}
Competitor Design Styles: ${competitorStyles}
Ownable Angle: ${ownable_angle}
Brand Colors: Primary ${colors.primary}, Accent ${colors.accent}

Design Signatures to choose from (or invent a new one):
- "Premium Brutalist" — raw grid, heavy typography, sharp borders, bold color blocks
- "Neon Glassmorphism" — translucent panels, neon glows, dark base, blurred layers
- "Corporate Precision" — clean white space, serif type, subtle shadows, trust-first layout
- "Kinetic Energy" — motion-first, bold diagonals, aggressive contrast, high energy
- "Organic Minimal" — warm neutrals, rounded forms, biophilic accents, breathing layouts

Respond with:
1. The chosen Design Signature name
2. 3-5 sentences explaining why it uniquely differentiates
3. Specific CSS property recommendations (typography scale, spacing, animation style)`;

    return this.query(this.MODELS.design, prompt, { onChunk, temperature: 0.5 });
  },

  // ── Stage 05: Self-Audit / Critique Loop ──────────────────
  async critiqueCode(html, css, onChunk = null) {
    const prompt = `You are an elite front-end code auditor. Review this compiled HTML/CSS and identify ALL quality issues.

HTML (excerpt):
\`\`\`html
${html.substring(0, 3000)}
\`\`\`

CSS (excerpt):
\`\`\`css
${css.substring(0, 3000)}
\`\`\`

Check for:
1. Duplicate CSS selectors or redundant rules
2. Hardcoded pixel values that should use CSS custom properties (--var)
3. Missing or improper ARIA accessibility attributes
4. Non-semantic HTML structure issues
5. Performance issues (overly complex selectors, will-change misuse)
6. "Stale" patterns that should be refactored
7. Missing responsive breakpoints

Respond in JSON format:
{
  "score": 0-100,
  "critical_issues": [{ "type": "string", "location": "string", "description": "string", "fix": "string" }],
  "warnings": [{ "type": "string", "location": "string", "description": "string" }],
  "engine_update_recommendations": ["string"],
  "summary": "string"
}`;

    const raw = await this.query(this.MODELS.critique, prompt, { onChunk, temperature: 0.2 });
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { score: 75, critical_issues: [], warnings: [], engine_update_recommendations: [], summary: raw };
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      return { score: 70, critical_issues: [], warnings: [], engine_update_recommendations: [], summary: raw };
    }
  },

  // ── Stage 06: B2B Pitch Generator ─────────────────────────
  async generatePitch(manifest, onChunk = null) {
    const { client, ownable_angle, competitor_matrix, value_propositions, design_signature } = manifest;
    const prompt = `You are a senior business development strategist. Write a compelling B2B client pitch document.

Client: ${client.name || client.domain}
Industry: ${client.industry}
Ownable Angle: ${ownable_angle}
Design Signature: ${design_signature}
Competitors Analyzed: ${competitor_matrix.length}
Value Propositions: ${value_propositions.join('; ')}

Write a professional B2B pitch in Markdown format with:
1. Executive Summary (2 sentences)
2. Market Opportunity (why now, market size estimate)
3. Competitive Differentiation (referencing the ownable angle)
4. Our Solution (what we deliver, design signature, tech stack)
5. Deliverables & Timeline (3-phase roadmap)
6. Investment & ROI
7. Next Steps / Call to Action

Make it compelling, specific, and data-driven. Do not use generic filler language.`;

    return this.query(this.MODELS.pitch || this.MODELS.competitor, prompt, { onChunk, temperature: 0.6 });
  },

  // ── Style Words → Theme Mapping (Stage 04 assist) ─────────
  async styleWordsToTheme(words, onChunk = null) {
    const prompt = `You are a UI/UX color system expert. Convert these style descriptor words into a precise CSS color theme.

Style Words: "${words}"

Respond ONLY with valid JSON:
{
  "primary": "#hexcolor",
  "secondary": "#hexcolor",
  "accent": "#hexcolor",
  "bg": "#hexcolor",
  "font": "Google Font name",
  "border_radius": "number (0-24)",
  "design_style": "brief descriptor"
}

Rules:
- Colors must be dark-mode appropriate if words include "dark", "night", "slate", "charcoal"
- Use vibrant non-generic colors — no plain #ff0000, #0000ff
- bg must be very dark (lightness < 15%)`;

    const raw = await this.query(this.MODELS.design, prompt, { onChunk, temperature: 0.3 });
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('no JSON');
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      return null;
    }
  }
};
