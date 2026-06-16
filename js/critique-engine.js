// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — Critique Engine (Stage 05)
// Static self-audit against the "DNA-Only Language" protocol.
// Logs Engine_Updates to improve Component_Library.
// ============================================================

const CritiqueEngine = {
  // ── Run Full Static Audit ─────────────────────────────────
  runStaticAudit(html, css) {
    const issues = [];
    const warnings = [];
    let score = 100;

    // 1. Check for hardcoded px values instead of CSS vars
    const hardcodedPx = [...css.matchAll(/(?<!var\([^)]*)\b(\d{2,4})px\b(?!\s*\))/g)]
      .filter(m => !['100px', '0px'].includes(m[0]))
      .slice(0, 10);
    if (hardcodedPx.length > 3) {
      issues.push({
        type: 'hardcoded-values',
        location: 'CSS',
        description: `${hardcodedPx.length} hardcoded px values found that should use CSS custom properties`,
        fix: 'Replace with var(--container-width), var(--border-radius), etc.',
        severity: 'warning'
      });
      score -= 5;
    }

    // 2. Check for missing ARIA labels
    const formInputs = [...html.matchAll(/<input(?![^>]*aria-)[^>]*>/gi)];
    if (formInputs.length > 0) {
      issues.push({
        type: 'accessibility',
        location: 'HTML inputs',
        description: `${formInputs.length} input elements missing aria-label or aria-describedby`,
        fix: 'Add aria-label="Field Name" to all form inputs',
        severity: 'critical'
      });
      score -= 8;
    }

    // 3. Check for duplicate CSS selectors
    const selectorPattern = /^([.#][a-zA-Z][a-zA-Z0-9_-]*)\s*\{/gm;
    const selectors = {};
    let m;
    while ((m = selectorPattern.exec(css)) !== null) {
      const sel = m[1];
      selectors[sel] = (selectors[sel] || 0) + 1;
    }
    const duplicates = Object.entries(selectors).filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      issues.push({
        type: 'duplicate-selectors',
        location: 'CSS',
        description: `${duplicates.length} duplicate CSS selectors: ${duplicates.slice(0, 3).map(([s]) => s).join(', ')}`,
        fix: 'Merge duplicate selectors into single blocks',
        severity: 'warning'
      });
      score -= 3 * duplicates.length;
    }

    // 4. Check for !important overuse
    const importantCount = (css.match(/!important/g) || []).length;
    if (importantCount > 2) {
      warnings.push({
        type: 'important-overuse',
        location: 'CSS',
        description: `${importantCount} !important declarations — indicates specificity issues`
      });
      score -= 5;
    }

    // 5. Check for live URLs (no-hardcoding protocol)
    const liveUrls = [...html.matchAll(/https?:\/\/(?!fonts\.googleapis|cdnjs\.cloudflare)[^\s"'>]+/g)];
    if (liveUrls.length > 0) {
      issues.push({
        type: 'no-hardcoding-violation',
        location: 'HTML',
        description: `${liveUrls.length} live external URLs found — violates No-Hardcoding Protocol`,
        fix: 'Replace with [ASSET_PLACEHOLDER] components',
        severity: 'critical'
      });
      score -= 10;
    }

    // 6. Check for semantic HTML structure
    if (!html.includes('<main') && !html.includes('<article')) {
      warnings.push({
        type: 'semantics',
        location: 'HTML',
        description: 'No <main> or <article> landmark elements — poor semantic structure'
      });
      score -= 3;
    }

    // 7. Check for missing viewport meta
    if (!html.includes('viewport')) {
      issues.push({
        type: 'responsive',
        location: 'HTML head',
        description: 'Missing viewport meta tag — site will not render correctly on mobile',
        fix: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        severity: 'critical'
      });
      score -= 15;
    }

    // 8. Check for stale/redundant font-family declarations
    const fontDecls = (css.match(/font-family\s*:/g) || []).length;
    if (fontDecls > 8) {
      warnings.push({
        type: 'stale-pattern',
        location: 'CSS',
        description: `${fontDecls} repeated font-family declarations — should use CSS var(--font-family) consistently`
      });
      score -= 4;
    }

    // 9. Check for responsive breakpoints
    const hasBreakpoints = css.includes('@media');
    if (!hasBreakpoints) {
      issues.push({
        type: 'responsive',
        location: 'CSS',
        description: 'No @media queries found — site is not responsive',
        fix: 'Add mobile breakpoints for all grid layouts',
        severity: 'critical'
      });
      score -= 20;
    }

    // 10. Check for missing lang attribute
    if (!html.includes('lang=')) {
      warnings.push({
        type: 'accessibility',
        location: 'HTML html tag',
        description: 'Missing lang attribute on <html> element'
      });
      score -= 2;
    }

    score = Math.max(0, Math.min(100, score));

    // Auto-generate engine update recommendations
    const engineUpdates = this._generateEngineUpdates(issues, warnings);

    return { score, issues, warnings, engineUpdates };
  },

  // ── Generate Engine Updates from Audit ────────────────────
  _generateEngineUpdates(issues, warnings) {
    const updates = [];
    const types = [...issues, ...warnings].map(i => i.type);

    if (types.includes('accessibility')) {
      updates.push({
        target: 'Component_Library',
        recommendation: 'All input components should include aria-label by default in their HTML template',
        priority: 'high'
      });
    }
    if (types.includes('stale-pattern')) {
      updates.push({
        target: 'Component_Library',
        recommendation: 'Remove all explicit font-family declarations from component CSS — rely solely on var(--font-family)',
        priority: 'medium'
      });
    }
    if (types.includes('hardcoded-values')) {
      updates.push({
        target: 'Component_Library',
        recommendation: 'Audit all px values in component CSS and replace with appropriate CSS custom property tokens',
        priority: 'medium'
      });
    }
    if (types.includes('no-hardcoding-violation')) {
      updates.push({
        target: 'Motion_Library',
        recommendation: 'Create [ASSET_PLACEHOLDER] component wrapper that enforces no live external URLs in exported code',
        priority: 'critical'
      });
    }

    return updates;
  },

  // ── Format Report as HTML for Display ─────────────────────
  formatReportHTML(report) {
    const scoreColor = report.score >= 80 ? '#10b981' : report.score >= 60 ? '#f59e0b' : '#ef4444';
    const issueHTML = (report.critical_issues || report.issues || []).map(i => `
      <div class="critique-issue">
        <span class="critique-type ${i.severity || 'warning'}">${i.type}</span>
        <span class="critique-loc">${i.location}</span>
        <p>${i.description}</p>
        ${i.fix ? `<code>${i.fix}</code>` : ''}
      </div>
    `).join('');

    return `
      <div class="critique-report">
        <div class="critique-score" style="color: ${scoreColor}">
          <span class="score-number">${report.score}</span>
          <span class="score-label">/100</span>
        </div>
        <p class="critique-summary">${report.summary || 'Audit complete'}</p>
        <div class="critique-issues">${issueHTML}</div>
      </div>
    `;
  }
};
