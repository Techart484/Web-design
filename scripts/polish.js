#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Stage 4: Visual & Integrity Polish (v3.0)
 *
 * Safe, production-oriented refinements on the generated page:
 *   - Content integrity: fail if unresolved {{tokens}} or placeholder copy leak
 *   - Security: upgrade external http:// links to https://
 *   - Adds a build marker (idempotent)
 * No layout-breaking overrides and no external runtime dependencies.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const indexPath = path.join(ROOT, 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[ERROR] Production build missing. Run Stage 3 (generate) first.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

let bible = { niche: 'unknown', brand_entities: {} };
const biblePath = path.join(ROOT, 'brand_colors.json');
if (fs.existsSync(biblePath)) {
  try { bible = JSON.parse(fs.readFileSync(biblePath, 'utf8')); } catch (_) { /* ignore */ }
}
const entities = bible.brand_entities || {};

// 1. Content integrity
const issues = [];
if (/\{\{[A-Z_]+\}\}/.test(html)) issues.push('Unresolved template tokens detected');
if (/Default Professional|Next-Generation Digital Excellence|Lorem ipsum/i.test(html)) {
  issues.push('Placeholder copy detected');
}
if (!/<meta name="viewport"/i.test(html)) issues.push('Missing viewport meta');

if (issues.length) {
  console.error('FAILED: Content integrity — ' + issues.join('; '));
  process.exit(1);
}

// 2. Security: force https on external anchors
html = html.replace(/(<a\s[^>]*href=")http:\/\//gi, '$1https://');

// 3. Idempotent build marker
if (!html.includes('ENGINE_POLISH')) {
  html = html.replace('</body>', `<!-- [ENGINE_POLISH_V3] ${new Date().toISOString()} -->\n</body>`);
}

fs.writeFileSync(indexPath, html);

console.log(`
--------------------------------------------------
CONFIRMATION_LOG
Niche: ${bible.niche_label || bible.niche}
Brand Name: ${entities.name || '(env-provided)'}
Service Signals: ${(entities.services || []).length}
Accent: ${(bible.palette || {}).accent || '(niche default)'}
--------------------------------------------------`);
console.log('[\u2713] Visual & integrity polish applied.');
console.log(JSON.stringify({
  status: 'polished',
  timestamp: new Date().toISOString(),
  applied_rules: ['integrity_validation', 'secure_links', 'build_marker']
}));
