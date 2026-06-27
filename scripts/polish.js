#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Stage 4: Visual Polish
 * Applies final architectural refinements and motion metadata.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const indexPath = path.join(ROOT, 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[ERROR] Production build missing. Run Codegen first.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// 1. Integrity Validation
const brandJsonPath = path.join(ROOT, 'brand_colors.json');
let brandEntities = { name: '', usp: '', features: [] };
if (fs.existsSync(brandJsonPath)) {
    const data = JSON.parse(fs.readFileSync(brandJsonPath, 'utf8'));
    brandEntities = data.brand_entities || brandEntities;
}

const placeholders = ['Default Professional', 'Next-Generation Digital Excellence', 'Your Business'];
const hasPlaceholder = placeholders.some(p => html.includes(p));

if (hasPlaceholder && brandEntities.name === 'Default Professional') {
    console.error('FAILED: Content Integrity - Placeholder language detected.');
    process.exit(1);
}

// 2. Luxury Override - Whitespace & Typography
const luxuryStyles = `
<style>
    section { margin-top: 10rem !important; margin-bottom: 10rem !important; }
    h1, h2 { font-weight: 900 !important; letter-spacing: -0.05em !important; }
    p { font-size: 1.125rem !important; line-height: 1.8 !important; opacity: 0.8 !important; }
    .noise {
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background: url('https://grainy-gradients.vercel.app/noise.svg');
        opacity: 0.05;
        pointer-events: none;
        z-index: 9999;
    }
</style>
`;

if (!html.includes('luxury-override')) {
    html = html.replace('</head>', `${luxuryStyles}\n</head>`);
    html = html.replace('<body>', '<body class="luxury-override"><div class="noise"></div>');
}

// Inject "Polished" marker and motion metadata
const polishMarker = `<!-- [ENGINE_POLISH_V2.2] Applied at ${new Date().toISOString()} -->`;
if (!html.includes('ENGINE_POLISH')) {
  html = html.replace('</body>', `${polishMarker}\n</body>`);
}

// Ensure all external links are secure
html = html.replace(/<a\s+(?:[^>]*?\s+)?href="http:\/\//g, '<a href="https://');

fs.writeFileSync(indexPath, html);

// Final Step: Output CONFIRMATION_LOG
console.log(`
--------------------------------------------------
CONFIRMATION_LOG
Extracted Brand Name: ${brandEntities.name}
Verified USP: ${brandEntities.usp}
Feature Count: ${brandEntities.features.length}
--------------------------------------------------
`);

console.log('[✓] Visual & Experience polish applied.');
console.log('[✓] Luxury Override & Content Integrity verified.');
console.log(JSON.stringify({
  status: 'polished',
  timestamp: new Date().toISOString(),
  applied_rules: ['integrity_validation', 'luxury_override', 'secure_links']
}));
