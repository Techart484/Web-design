#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Luxury Niche Generator (v3.0)
 *
 * Produces a self-contained, production-grade landing page for one of the
 * supported luxury niches (medical, legal, home-services). All content is
 * niche-aware and merged with the extracted Brand Bible — no engine
 * boilerplate ever leaks into the client's page.
 */

const fs   = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ENGINE_ROOT = path.resolve(__dirname, '..');

// ── Load niche design systems ──────────────────────────────
const nichesConfig = JSON.parse(
  fs.readFileSync(path.join(ENGINE_ROOT, 'config', 'niches.json'), 'utf8')
);
const NICHES = nichesConfig.niches;
const DEFAULT_NICHE = nichesConfig._meta.default_niche;

// ── Load Brand Bible (output of Stage 1) ───────────────────
let brandData = {};
const brandJsonPath = path.join(ROOT, 'brand_colors.json');
if (fs.existsSync(brandJsonPath)) {
  try {
    brandData = JSON.parse(fs.readFileSync(brandJsonPath, 'utf8'));
  } catch (err) {
    console.warn('[!] Failed to parse brand_colors.json — using niche defaults.');
  }
}

// ── Resolve niche ──────────────────────────────────────────
function resolveNicheKey(data) {
  const candidate = (data.niche || data.detected_industry || DEFAULT_NICHE).toLowerCase();
  return NICHES[candidate] ? candidate : DEFAULT_NICHE;
}
const nicheKey = resolveNicheKey(brandData);
const niche = NICHES[nicheKey];

// ── Resolve palette (extracted overrides niche defaults) ───
const entities = brandData.brand_entities || {};
const extractedPalette = brandData.palette || {};
const palette = {
  bg:      extractedPalette.bg      || niche.palette.bg,
  surface: extractedPalette.surface || niche.palette.surface,
  primary: extractedPalette.primary || niche.palette.primary,
  accent:  extractedPalette.accent  || niche.palette.accent,
  text:    extractedPalette.text    || niche.palette.text,
  muted:   extractedPalette.muted   || niche.palette.muted,
  line:    extractedPalette.line    || niche.palette.line
};

// ── Resolve copy / identity ────────────────────────────────
const businessName = (process.env.BUSINESS_NAME || entities.name || niche.label).trim();
const usp = (process.env.USP || entities.usp || niche.hero.subheadline).trim();
const contactEmail = (process.env.CONTACT_EMAIL || 'hello@domain.com').trim();
const formspreeHash = (process.env.FORMSPREE_HASH || '').trim();

// ── Helpers ────────────────────────────────────────────────
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function titleCase(text) {
  return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function cleanServiceTitle(raw) {
  let t = String(raw).replace(/\s+/g, ' ').trim();
  // Use the first clause before a separator, capped to a tasteful length.
  t = t.split(/[—–\-:|.]/)[0].trim();
  const words = t.split(' ');
  if (words.length > 6) t = words.slice(0, 6).join(' ');
  return titleCase(t);
}

/**
 * Build niche service cards. Curated niche services guarantee polished copy;
 * real extracted offerings (when present) take over the card titles for
 * relevance to the actual business.
 */
function buildServices() {
  const cards = niche.services.map((s) => ({ title: s.title, desc: s.desc }));

  const realServices = (entities.services || entities.features || [])
    .map((s) => cleanServiceTitle(s))
    .filter((s) => s.length >= 3 && s.length <= 48);

  if (realServices.length >= 3) {
    realServices.slice(0, cards.length).forEach((title, i) => { cards[i].title = title; });
  }

  return cards;
}

function loadComponent(type, name = 'default') {
  const p = path.join(ENGINE_ROOT, 'templates', 'components', type, `${name}.html`);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

// ── Section builders ───────────────────────────────────────
function buildHero() {
  const stat = niche.trust_stats[0] || { value: '', label: '' };
  return `
<section class="hero">
  <div class="container hero-grid">
    <div>
      <span class="eyebrow">${esc(niche.hero.eyebrow)}</span>
      <h1>${esc(businessName)}</h1>
      <p class="lede">${esc(usp)}</p>
      <div class="hero-actions">
        <a href="#contact" class="btn btn-primary">${esc(niche.hero.primary_cta)}</a>
        <a href="#services" class="btn btn-ghost">${esc(niche.hero.secondary_cta)}</a>
      </div>
    </div>
    <div class="hero-visual">
      <div class="hero-badge">
        <div class="k">${esc(stat.label)}</div>
        <div class="v">${esc(stat.value)}</div>
      </div>
    </div>
  </div>
</section>`;
}

function buildTrust() {
  const stats = niche.trust_stats.map((s) => `
      <div class="stat">
        <div class="num">${esc(s.value)}</div>
        <div class="lbl">${esc(s.label)}</div>
      </div>`).join('');
  return `
<section class="trust" id="about">
  <div class="container trust-grid">${stats}
  </div>
</section>`;
}

function buildServicesSection() {
  const cards = buildServices().map((c, i) => `
      <div class="card">
        <div class="idx">${String(i + 1).padStart(2, '0')}</div>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.desc)}</p>
      </div>`).join('');
  return `
<section class="section" id="services">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">${esc(niche.label)}</span>
      <h2>${esc(niche.section_titles.services)}</h2>
      <p>${esc(niche.hero.subheadline)}</p>
    </div>
    <div class="cards">${cards}
    </div>
  </div>
</section>`;
}

function buildCta(formAction) {
  return `
<section class="cta" id="contact">
  <div class="container">
    <div class="cta-inner">
      <div>
        <span class="eyebrow">${esc(niche.hero.eyebrow)}</span>
        <h2>${esc(niche.hero.primary_cta)}</h2>
        <p>Tell us about your needs and we'll respond within one business day.</p>
      </div>
      <form class="form" action="${esc(formAction)}" method="POST">
        <input type="text" name="name" placeholder="Your name" required>
        <input type="email" name="email" placeholder="Email address" required>
        <textarea name="message" rows="4" placeholder="How can we help?"></textarea>
        <button type="submit" class="btn btn-primary">${esc(niche.hero.primary_cta)}</button>
      </form>
    </div>
  </div>
</section>`;
}

// ── Assemble document ──────────────────────────────────────
const templatePath = path.join(ENGINE_ROOT, 'templates', 'master-landing-page', 'index.html');
if (!fs.existsSync(templatePath)) {
  console.error('[ERROR] Master template missing.');
  process.exit(1);
}
let html = fs.readFileSync(templatePath, 'utf8');

const formAction = formspreeHash
  ? (formspreeHash.startsWith('http') ? formspreeHash : `https://formspree.io/f/${formspreeHash}`)
  : `mailto:${contactEmail}`;

const components = {
  '{{NAV}}': loadComponent('nav'),
  '{{HERO}}': buildHero(),
  '{{TRUST}}': buildTrust(),
  '{{SERVICES}}': buildServicesSection(),
  '{{CTA}}': buildCta(formAction),
  '{{FOOTER}}': loadComponent('footer')
};
Object.entries(components).forEach(([token, content]) => {
  html = html.split(token).join(content);
});

const substitutions = {
  '{{BUSINESS_NAME}}': esc(businessName),
  '{{USP}}': esc(usp),
  '{{NICHE_LABEL}}': esc(niche.label),
  '{{NAV_SERVICES}}': esc(niche.section_titles.services),
  '{{HERO_PRIMARY_CTA}}': esc(niche.hero.primary_cta),
  '{{CONTACT_EMAIL}}': esc(contactEmail),
  '{{FONT_URL}}': niche.fonts.google_url,
  '{{FONT_HEADING}}': niche.fonts.heading,
  '{{FONT_BODY}}': niche.fonts.body,
  '{{PRIMARY_COLOR}}': palette.primary,
  '{{ACCENT_COLOR}}': palette.accent,
  '{{BG_COLOR}}': palette.bg,
  '{{SURFACE_COLOR}}': palette.surface,
  '{{TEXT_COLOR}}': palette.text,
  '{{MUTED_COLOR}}': palette.muted,
  '{{LINE_COLOR}}': palette.line,
  '{{YEAR}}': new Date().getFullYear()
};
Object.entries(substitutions).forEach(([token, value]) => {
  html = html.split(token).join(value);
});

// ── Write output (HTML + linked production stylesheet) ─────
const distDir = path.join(ROOT, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

fs.writeFileSync(path.join(distDir, 'index.html'), html);

// Ship the self-contained design system alongside the page.
const cssSrc = path.join(ENGINE_ROOT, 'templates', 'master-landing-page', 'site.css');
fs.copyFileSync(cssSrc, path.join(distDir, 'styles.css'));

const manifest = {
  timestamp: new Date().toISOString(),
  engine_version: '3.0.0',
  niche: nicheKey,
  niche_label: niche.label,
  business_name: businessName,
  contact: contactEmail,
  palette,
  fonts: niche.fonts,
  artifacts: ['index.html', 'styles.css']
};
fs.writeFileSync(path.join(distDir, 'build-manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`[\u2713] Luxury ${niche.label} site assembled in /dist (niche=${nicheKey}, brand="${businessName}")`);
