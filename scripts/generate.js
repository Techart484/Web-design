#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Niche-Aware Multi-Page Site Generator (v4.0)
 *
 * Produces a self-contained, production-grade MULTI-PAGE website for one of the
 * supported luxury niches (medical, legal, home-services, food). The engine
 * assembles a full site structure:
 *
 *   index.html     — Home (hero, trust, services + why-us teasers, CTA)
 *   services.html  — Services (or full Menu for the food niche)
 *   about.html     — About / story + trust signals
 *   why-us.html    — Competitor-informed differentiation (Stage 02 output)
 *   contact.html   — Contact form (or reservation UI for the food niche)
 *
 * All content is niche-aware and merged with the extracted Brand Bible
 * (Stage 01) and the Competitor Matrix (Stage 02). No engine boilerplate ever
 * leaks into the client's page.
 *
 * Output directory defaults to ./dist but can be overridden with OUT_DIR (used
 * by the preview-gating server to render isolated, per-client previews).
 */

const fs   = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ENGINE_ROOT = path.resolve(__dirname, '..');
const OUT_DIR = process.env.OUT_DIR
  ? path.resolve(ROOT, process.env.OUT_DIR)
  : path.join(ROOT, 'dist');

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

// ── Load Competitor Matrix (output of Stage 2, optional) ───
let competitorData = null;
const competitorPath = path.join(ROOT, 'competitor_analysis.json');
if (fs.existsSync(competitorPath)) {
  try {
    competitorData = JSON.parse(fs.readFileSync(competitorPath, 'utf8'));
  } catch (err) {
    console.warn('[!] Failed to parse competitor_analysis.json — using niche defaults.');
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

// ── Resolve competitor-informed positioning ───────────────
const positioning = {
  competitor_matrix: (competitorData && competitorData.competitor_matrix) || niche.competitors,
  value_propositions: (competitorData && competitorData.value_propositions) || niche.value_propositions,
  ownable_angle: (competitorData && competitorData.ownable_angle) || niche.ownable_angle
};

// ── Helpers ────────────────────────────────────────────────
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function titleCase(text) {
  return text.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function cleanServiceTitle(raw) {
  let t = String(raw).replace(/\s+/g, ' ').trim();
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

const formAction = formspreeHash
  ? (formspreeHash.startsWith('http') ? formspreeHash : `https://formspree.io/f/${formspreeHash}`)
  : `mailto:${contactEmail}`;

// ── Site map (drives the cross-page navigation) ────────────
const servicesNavLabel = niche.menu_label || 'Services';
const PAGES = [
  { id: 'home',     file: 'index.html',    nav: 'Home',            title: businessName },
  { id: 'services', file: 'services.html', nav: servicesNavLabel,  title: `${niche.section_titles.services} | ${businessName}` },
  { id: 'about',    file: 'about.html',    nav: 'About',           title: `About | ${businessName}` },
  { id: 'why-us',   file: 'why-us.html',   nav: 'Why Us',          title: `Why Us | ${businessName}` },
  { id: 'contact',  file: 'contact.html',  nav: 'Contact',         title: `${niche.hero.primary_cta} | ${businessName}` }
];

const fileFor = (id) => (PAGES.find((p) => p.id === id) || {}).file || 'index.html';

// ── Shared chrome ──────────────────────────────────────────
function buildNav(activeId) {
  const links = PAGES.map((p) =>
    `<a href="${p.file}" class="${p.id === activeId ? 'is-active' : ''}">${esc(p.nav)}</a>`
  ).join('\n        ');
  return `<header class="nav">
    <a class="nav-brand" href="index.html">${esc(businessName)}</a>
    <nav class="nav-links">
        ${links}
    </nav>
    <a href="${fileFor('contact')}" class="btn btn-primary">${esc(niche.hero.primary_cta)}</a>
</header>`;
}

function buildFooter() {
  const footLinks = PAGES.map((p) => `<a href="${p.file}">${esc(p.nav)}</a>`).join(' · ');
  return `<footer class="footer">
    <div class="container footer-inner">
        <div class="footer-brand">
          <div class="brand">${esc(businessName)}</div>
          <small>${esc(niche.label)}</small>
        </div>
        <nav class="footer-links">${footLinks}</nav>
        <small><a href="mailto:${esc(contactEmail)}">${esc(contactEmail)}</a></small>
        <small>&copy; ${new Date().getFullYear()} ${esc(businessName)}</small>
    </div>
</footer>`;
}

// ── Section builders ───────────────────────────────────────
function sectionHead(eyebrow, heading, sub) {
  return `<div class="section-head">
      <span class="eyebrow">${esc(eyebrow)}</span>
      <h2>${esc(heading)}</h2>
      ${sub ? `<p>${esc(sub)}</p>` : ''}
    </div>`;
}

function buildHero() {
  const stat = niche.trust_stats[0] || { value: '', label: '' };
  return `<section class="hero">
  <div class="container hero-grid">
    <div>
      <span class="eyebrow">${esc(niche.hero.eyebrow)}</span>
      <h1>${esc(businessName)}</h1>
      <p class="lede">${esc(usp)}</p>
      <div class="hero-actions">
        <a href="${fileFor('contact')}" class="btn btn-primary">${esc(niche.hero.primary_cta)}</a>
        <a href="${fileFor('services')}" class="btn btn-ghost">${esc(niche.hero.secondary_cta)}</a>
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
  return `<section class="trust">
  <div class="container trust-grid">${stats}
  </div>
</section>`;
}

function serviceCardsHtml(cards) {
  return cards.map((c, i) => `
      <div class="card">
        <div class="idx">${String(i + 1).padStart(2, '0')}</div>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.desc)}</p>
      </div>`).join('');
}

/** Home page: services teaser linking to the full services/menu page. */
function buildServicesTeaser() {
  const cards = serviceCardsHtml(buildServices().slice(0, 3));
  return `<section class="section">
  <div class="container">
    ${sectionHead(niche.label, niche.section_titles.services, niche.hero.subheadline)}
    <div class="cards">${cards}
    </div>
    <div class="section-cta">
      <a href="${fileFor('services')}" class="btn btn-ghost">${esc(niche.hero.secondary_cta)} →</a>
    </div>
  </div>
</section>`;
}

/** Home page: why-us teaser built from the competitor-informed positioning. */
function buildWhyUsTeaser() {
  const props = (positioning.value_propositions || []).slice(0, 3).map((v) => `
      <li><span class="tick">✓</span><span>${esc(v)}</span></li>`).join('');
  return `<section class="section section-alt">
  <div class="container whyus-teaser">
    <div>
      ${sectionHead('Why Us', niche.section_titles.trust, positioning.ownable_angle)}
      <a href="${fileFor('why-us')}" class="btn btn-ghost">See how we compare →</a>
    </div>
    <ul class="value-list">${props}
    </ul>
  </div>
</section>`;
}

function buildCtaBand() {
  return `<section class="cta">
  <div class="container">
    <div class="cta-inner cta-band">
      <div>
        <span class="eyebrow">${esc(niche.hero.eyebrow)}</span>
        <h2>${esc(niche.hero.primary_cta)}</h2>
        <p>${esc(positioning.ownable_angle)}</p>
      </div>
      <a href="${fileFor('contact')}" class="btn btn-primary">${esc(niche.hero.primary_cta)}</a>
    </div>
  </div>
</section>`;
}

// ── Food: menu rendering ───────────────────────────────────
function buildMenu() {
  if (!Array.isArray(niche.menu) || !niche.menu.length) return '';
  const sections = niche.menu.map((cat) => {
    const items = (cat.items || []).map((it) => `
        <li class="menu-item">
          <div class="menu-item-head">
            <span class="menu-item-name">${esc(it.name)}</span>
            <span class="menu-item-dots"></span>
            <span class="menu-item-price">${esc(it.price)}</span>
          </div>
          ${it.desc ? `<p class="menu-item-desc">${esc(it.desc)}</p>` : ''}
        </li>`).join('');
    return `
      <div class="menu-category">
        <h3 class="menu-category-title">${esc(cat.category)}</h3>
        <ul class="menu-list">${items}
        </ul>
      </div>`;
  }).join('');
  return `<div class="menu">${sections}
    </div>`;
}

// ── Page bodies ────────────────────────────────────────────
function bodyHome() {
  return [
    buildHero(),
    buildTrust(),
    buildServicesTeaser(),
    buildWhyUsTeaser(),
    buildCtaBand()
  ].join('\n');
}

function bodyServices() {
  const isFood = !!(niche.menu && niche.menu.length);
  const cards = serviceCardsHtml(buildServices());
  const menuBlock = isFood ? `
  <div class="container">
    ${sectionHead(niche.label, niche.section_titles.services, isFood ? 'A seasonal menu, updated as the market changes.' : '')}
    ${buildMenu()}
  </div>` : '';

  const experienceHead = isFood ? 'The Experience' : niche.section_titles.services;
  const experienceEyebrow = isFood ? 'Beyond the plate' : niche.label;

  return `<section class="page-head">
  <div class="container">
    <span class="eyebrow">${esc(servicesNavLabel)}</span>
    <h1>${esc(niche.section_titles.services)}</h1>
    <p class="lede">${esc(usp)}</p>
  </div>
</section>
${menuBlock ? `<section class="section">${menuBlock}</section>` : ''}
<section class="section ${isFood ? 'section-alt' : ''}">
  <div class="container">
    ${sectionHead(experienceEyebrow, experienceHead, '')}
    <div class="cards">${cards}
    </div>
  </div>
</section>
${buildCtaBand()}`;
}

function bodyAbout() {
  const stats = niche.trust_stats.map((s) => `
      <div class="stat">
        <div class="num">${esc(s.value)}</div>
        <div class="lbl">${esc(s.label)}</div>
      </div>`).join('');

  const values = (positioning.value_propositions || []).map((v, i) => `
      <div class="card">
        <div class="idx">${String(i + 1).padStart(2, '0')}</div>
        <p>${esc(v)}</p>
      </div>`).join('');

  return `<section class="page-head">
  <div class="container">
    <span class="eyebrow">About</span>
    <h1>About ${esc(businessName)}</h1>
    <p class="lede">${esc(usp)}</p>
  </div>
</section>
<section class="section">
  <div class="container about-grid">
    <div class="about-copy">
      <h2>${esc(niche.section_titles.trust)}</h2>
      <p>${esc(niche.voice_tone)}</p>
      <p>${esc(positioning.ownable_angle)}</p>
    </div>
    <div class="trust-grid about-stats">${stats}
    </div>
  </div>
</section>
<section class="section section-alt">
  <div class="container">
    ${sectionHead('Our Approach', 'What We Stand For', '')}
    <div class="cards">${values}
    </div>
  </div>
</section>
${buildCtaBand()}`;
}

function bodyWhyUs() {
  const props = (positioning.value_propositions || []).map((v, i) => `
      <div class="card">
        <div class="idx">${String(i + 1).padStart(2, '0')}</div>
        <p>${esc(v)}</p>
      </div>`).join('');

  const rows = (positioning.competitor_matrix || []).map((c) => `
        <div class="compare-row">
          <div class="compare-them">
            <span class="compare-label">${esc(c.name)}</span>
            <ul>${(c.weaknesses || []).map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
          </div>
          <div class="compare-us">
            <span class="compare-label">${esc(businessName)}</span>
            <p>${esc(positioning.ownable_angle)}</p>
          </div>
        </div>`).join('');

  return `<section class="page-head">
  <div class="container">
    <span class="eyebrow">Why Us</span>
    <h1>${esc(niche.section_titles.trust)}</h1>
    <p class="lede">${esc(positioning.ownable_angle)}</p>
  </div>
</section>
<section class="section">
  <div class="container">
    ${sectionHead('The Difference', 'What Sets Us Apart', '')}
    <div class="cards">${props}
    </div>
  </div>
</section>
<section class="section section-alt">
  <div class="container">
    ${sectionHead('Competitor Analysis', 'Where Others Fall Short', 'Benchmarked against direct competitors in your market.')}
    <div class="compare">${rows}
    </div>
  </div>
</section>
${buildCtaBand()}`;
}

function buildReservationForm() {
  const r = niche.reservation || {};
  const sizes = (r.party_sizes || ['1 guest', '2 guests', '3 guests', '4 guests', '5 guests', '6 guests'])
    .map((s) => `<option>${esc(s)}</option>`).join('');
  return `<form class="form reservation-form" action="${esc(formAction)}" method="POST">
        <div class="form-row">
          <input type="text" name="name" placeholder="Name on reservation" required>
          <input type="tel" name="phone" placeholder="Phone number" required>
        </div>
        <div class="form-row">
          <input type="date" name="date" aria-label="Reservation date" required>
          <input type="time" name="time" aria-label="Reservation time" required>
        </div>
        <div class="form-row">
          <select name="party_size" aria-label="Party size">${sizes}</select>
          <input type="email" name="email" placeholder="Email address" required>
        </div>
        <textarea name="notes" rows="3" placeholder="Allergies, occasion, seating requests…"></textarea>
        <button type="submit" class="btn btn-primary">${esc(r.cta || niche.hero.primary_cta)}</button>
      </form>`;
}

function buildContactForm() {
  return `<form class="form" action="${esc(formAction)}" method="POST">
        <input type="text" name="name" placeholder="Your name" required>
        <input type="email" name="email" placeholder="Email address" required>
        <textarea name="message" rows="4" placeholder="How can we help?"></textarea>
        <button type="submit" class="btn btn-primary">${esc(niche.hero.primary_cta)}</button>
      </form>`;
}

function bodyContact() {
  const r = niche.reservation || {};
  const isReservation = !!r.enabled;
  const heading = isReservation ? (r.heading || niche.hero.primary_cta) : niche.hero.primary_cta;
  const sub = isReservation
    ? (r.subheading || '')
    : "Tell us about your needs and we'll respond within one business day.";
  const note = isReservation && r.services_note
    ? `<p class="contact-note">${esc(r.services_note)}</p>` : '';

  return `<section class="page-head">
  <div class="container">
    <span class="eyebrow">${esc(niche.hero.eyebrow)}</span>
    <h1>${esc(heading)}</h1>
    <p class="lede">${esc(sub)}</p>
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="contact-grid">
      <div class="contact-info">
        <h2>${esc(businessName)}</h2>
        <p>${esc(usp)}</p>
        ${note}
        <p class="contact-email"><a href="mailto:${esc(contactEmail)}">${esc(contactEmail)}</a></p>
      </div>
      <div class="contact-form-wrap">
        ${isReservation ? buildReservationForm() : buildContactForm()}
      </div>
    </div>
  </div>
</section>`;
}

const PAGE_BODIES = {
  'home': bodyHome,
  'services': bodyServices,
  'about': bodyAbout,
  'why-us': bodyWhyUs,
  'contact': bodyContact
};

// ── Assemble documents ─────────────────────────────────────
const templatePath = path.join(ENGINE_ROOT, 'templates', 'master-landing-page', 'index.html');
if (!fs.existsSync(templatePath)) {
  console.error('[ERROR] Master template missing.');
  process.exit(1);
}
const template = fs.readFileSync(templatePath, 'utf8');

const baseSubstitutions = {
  '{{BUSINESS_NAME}}': esc(businessName),
  '{{USP}}': esc(usp),
  '{{NICHE_LABEL}}': esc(niche.label),
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

function renderPage(page) {
  let html = template;
  const main = PAGE_BODIES[page.id]();
  const fills = {
    '{{NAV}}': buildNav(page.id),
    '{{MAIN}}': main,
    '{{FOOTER}}': buildFooter(),
    '{{PAGE_TITLE}}': `${page.title} | ${niche.label}`
  };
  Object.entries(fills).forEach(([token, content]) => {
    html = html.split(token).join(content);
  });
  Object.entries(baseSubstitutions).forEach(([token, value]) => {
    html = html.split(token).join(value);
  });
  return html;
}

// ── Write output (HTML pages + linked production stylesheet) ─
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

PAGES.forEach((page) => {
  fs.writeFileSync(path.join(OUT_DIR, page.file), renderPage(page));
});

// Ship the self-contained design system alongside the pages.
const cssSrc = path.join(ENGINE_ROOT, 'templates', 'master-landing-page', 'site.css');
fs.copyFileSync(cssSrc, path.join(OUT_DIR, 'styles.css'));

const manifest = {
  timestamp: new Date().toISOString(),
  engine_version: '4.0.0',
  niche: nicheKey,
  niche_label: niche.label,
  business_name: businessName,
  contact: contactEmail,
  palette,
  fonts: niche.fonts,
  pages: PAGES.map((p) => ({ id: p.id, file: p.file, nav: p.nav })),
  features: {
    multi_page: true,
    menu: !!(niche.menu && niche.menu.length),
    reservation: !!(niche.reservation && niche.reservation.enabled),
    competitor_informed: !!competitorData
  },
  positioning,
  artifacts: PAGES.map((p) => p.file).concat(['styles.css'])
};
fs.writeFileSync(path.join(OUT_DIR, 'build-manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`[\u2713] Luxury ${niche.label} multi-page site assembled in ${path.relative(ROOT, OUT_DIR) || '.'} ` +
  `(niche=${nicheKey}, pages=${PAGES.length}, brand="${businessName}", ` +
  `menu=${manifest.features.menu}, reservation=${manifest.features.reservation})`);
