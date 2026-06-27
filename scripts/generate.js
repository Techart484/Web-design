#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Sharpened Generator (v2.2)
 * Modular component assembly system.
 */

const fs   = require('fs');
const path = require('path');

const ROOT = process.cwd();

// Load Environment Variables
const businessName  = (process.env.BUSINESS_NAME || 'Default Professional').trim();
const usp           = (process.env.USP           || 'Next-Generation Digital Excellence').trim();
const contactEmail  = (process.env.CONTACT_EMAIL  || 'info@domain.com').trim();
const formspreeHash = (process.env.FORMSPREE_HASH || '').trim();

// Load Brand Data
let brandData = {
  primary: '#8b5cf6',
  secondary: '#f43f5e',
  accent: '#06b6d4',
  bg: '#06050b',
  brand_entities: { features: [] }
};
const brandJsonPath = path.join(ROOT, 'brand_colors.json');

if (fs.existsSync(brandJsonPath)) {
  try {
    brandData = { ...brandData, ...JSON.parse(fs.readFileSync(brandJsonPath, 'utf8')) };
  } catch (err) { console.warn('[!] Failed to parse brand_colors.json'); }
}

const brandColors = {
  primary: brandData.primary,
  secondary: brandData.secondary,
  accent: brandData.accent,
  bg: brandData.bg
};

// Helper: Load Component
function loadComponent(type, name = 'default') {
  const p = path.join(ROOT, 'templates', 'components', type, `${name}.html`);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : `<!-- Component ${type}/${name} missing -->`;
}

// Load Master Template
const templatePath = path.join(ROOT, 'templates', 'master-landing-page', 'index.html');
if (!fs.existsSync(templatePath)) {
  console.error('[ERROR] Master template missing.');
  process.exit(1);
}

let html = fs.readFileSync(templatePath, 'utf8');

// Helper: Summarize feature
function summarizeFeature(text) {
  const words = text.split(/\s+/);
  if (words.length <= 10) return text;
  return words.slice(0, 10).join(' ') + '...';
}

// Build Dynamic Features Component
function buildFeaturesComponent(features) {
  if (!features || features.length === 0) {
    return loadComponent('features'); // Fallback to default
  }

  const cards = features.slice(0, 6).map((feature, idx) => `
    <div class="p-8 border-premium bg-black/40">
        <div class="w-12 h-12 mb-6 border border-white/10 flex items-center justify-center text-[var(--accent)] font-bold">${String(idx + 1).padStart(2, '0')}</div>
        <h3 class="text-xl font-bold mb-4 uppercase">${summarizeFeature(feature)}</h3>
        <p class="text-sm text-white/50 leading-relaxed">${feature}</p>
    </div>
  `).join('');

  return `
<section id="services" class="py-24 bg-white/[0.02] border-y border-white/5">
    <div class="px-6 max-w-7xl mx-auto">
        <h2 class="text-3xl font-bold uppercase tracking-tight mb-16">Core Solutions</h2>
        <div class="grid md:grid-cols-3 gap-8">
            ${cards}
        </div>
    </div>
</section>
  `;
}

// Build Page from Components
const components = {
  '{{NAV}}': loadComponent('nav'),
  '{{HERO}}': loadComponent('hero'),
  '{{FEATURES}}': buildFeaturesComponent(brandData.brand_entities?.features),
  '{{FOOTER}}': loadComponent('footer')
};

Object.entries(components).forEach(([token, content]) => {
  html = html.split(token).join(content);
});

// Replace Global Placeholders
const substitutions = {
  '{{BUSINESS_NAME}}': businessName,
  '{{USP}}': usp,
  '{{BUSINESS_DOMAIN}}': contactEmail.split('@')[1] || 'domain.com',
  '{{CONTACT_EMAIL}}': contactEmail,
  '{{PRIMARY_COLOR}}': brandColors.primary,
  '{{ACCENT_COLOR}}': brandColors.accent,
  '{{SECONDARY_COLOR}}': brandColors.secondary,
  '{{BG_COLOR}}': brandColors.bg,
  '{{YEAR}}': new Date().getFullYear()
};

Object.entries(substitutions).forEach(([token, value]) => {
  html = html.split(token).join(value);
});

// Form Action
const formAction = formspreeHash
  ? (formspreeHash.startsWith('http') ? formspreeHash : `https://formspree.io/f/${formspreeHash}`)
  : `mailto:${contactEmail}`;

html = html.replace(/action="mailto:{{CONTACT_EMAIL}}"/g, `action="${formAction}"`);

// Write Output
const distDir = path.join(ROOT, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

fs.writeFileSync(path.join(distDir, 'index.html'), html);

// Generate Build Manifest
const manifest = {
  timestamp: new Date().toISOString(),
  engine_version: "2.2.0",
  business_name: businessName,
  contact: contactEmail,
  brand: brandColors,
  artifacts: ["index.html"]
};
fs.writeFileSync(path.join(distDir, 'build-manifest.json'), JSON.stringify(manifest, null, 2));

console.log('[✓] Sharpened site assembled in /dist');
