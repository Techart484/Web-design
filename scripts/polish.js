#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Stage 4: Visual & Integrity Polish (v4.0)
 *
 * Safe, production-oriented refinements applied to EVERY generated page in the
 * multi-page site:
 *   - Content integrity: fail if unresolved {{tokens}} or placeholder copy leak
 *   - Security: upgrade external http:// links to https://
 *   - Adds a build marker (idempotent)
 * No layout-breaking overrides and no external runtime dependencies.
 *
 * Honors OUT_DIR (defaults to ./dist) so the preview server can polish
 * isolated per-client previews.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const OUT_DIR = process.env.OUT_DIR ? path.resolve(ROOT, process.env.OUT_DIR) : path.join(ROOT, 'dist');

if (!fs.existsSync(OUT_DIR)) {
  console.error('[ERROR] Production build missing. Run Stage 3 (generate) first.');
  process.exit(1);
}

const pages = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.html'));
if (!pages.length) {
  console.error('[ERROR] No HTML pages found in', OUT_DIR);
  process.exit(1);
}

let bible = { niche: 'unknown', brand_entities: {} };
const biblePath = path.join(ROOT, 'brand_colors.json');
if (fs.existsSync(biblePath)) {
  try { bible = JSON.parse(fs.readFileSync(biblePath, 'utf8')); } catch (_) { /* ignore */ }
}
const entities = bible.brand_entities || {};

const issues = [];
pages.forEach((page) => {
  const p = path.join(OUT_DIR, page);
  let html = fs.readFileSync(p, 'utf8');

  // 1. Content integrity (per page)
  if (/\{\{[A-Z_]+\}\}/.test(html)) issues.push(`${page}: unresolved template tokens`);
  if (/Default Professional|Next-Generation Digital Excellence|Lorem ipsum/i.test(html)) {
    issues.push(`${page}: placeholder copy detected`);
  }
  if (!/<meta name="viewport"/i.test(html)) issues.push(`${page}: missing viewport meta`);

  // 2. Security: force https on external anchors
  html = html.replace(/(<a\s[^>]*href=")http:\/\//gi, '$1https://');

  // 3. Idempotent build marker
  if (!html.includes('ENGINE_POLISH')) {
    html = html.replace('</body>', `<!-- [ENGINE_POLISH_V4] ${new Date().toISOString()} -->\n</body>`);
  }

  fs.writeFileSync(p, html);
});

if (issues.length) {
  console.error('FAILED: Content integrity — ' + issues.join('; '));
  process.exit(1);
}

console.log(`
--------------------------------------------------
CONFIRMATION_LOG
Niche: ${bible.niche_label || bible.niche}
Brand Name: ${entities.name || '(env-provided)'}
Pages Polished: ${pages.length} (${pages.join(', ')})
Service Signals: ${(entities.services || []).length}
Accent: ${(bible.palette || {}).accent || '(niche default)'}
--------------------------------------------------`);
console.log('[\u2713] Visual & integrity polish applied to all pages.');
console.log(JSON.stringify({
  status: 'polished',
  timestamp: new Date().toISOString(),
  pages_polished: pages.length,
  applied_rules: ['integrity_validation', 'secure_links', 'build_marker']
}));
