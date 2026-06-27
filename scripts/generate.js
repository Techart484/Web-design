#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Multi-Page Site Generator (v4.0)
 */

const fs   = require('fs');
const path = require('path');

const ROOT = process.cwd();
const ENGINE_ROOT = path.resolve(__dirname, '..');

const nichesConfig = JSON.parse(
  fs.readFileSync(path.join(ENGINE_ROOT, 'config', 'niches.json'), 'utf8')
);
const NICHES = nichesConfig.niches;
const DEFAULT_NICHE = nichesConfig._meta.default_niche;

let brandData = {};
const brandJsonPath = path.join(ROOT, 'brand_colors.json');
if (fs.existsSync(brandJsonPath)) {
  try {
    brandData = JSON.parse(fs.readFileSync(brandJsonPath, 'utf8'));
  } catch (err) {
    console.warn('[!] Failed to parse brand_colors.json — using niche defaults.');
  }
}

function resolveNicheKey(data) {
  const candidate = (data.niche || data.detected_industry || DEFAULT_NICHE).toLowerCase();
  return NICHES[candidate] ? candidate : DEFAULT_NICHE;
}
const nicheKey = resolveNicheKey(brandData);
const niche = NICHES[nicheKey];

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

const businessName = (process.env.BUSINESS_NAME || entities.name || niche.label).trim();
const usp = (process.env.USP || entities.usp || niche.hero.subheadline).trim();
const contactEmail = (process.env.CONTACT_EMAIL || 'hello@domain.com').trim();
const formspreeHash = (process.env.FORMSPREE_HASH || '').trim();

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

// ── Content Builders ───────────────────────────────────────

function buildHero() {
  const stat = niche.trust_stats[0] || { value: '', label: '' };
  const heroImage = (entities.images && entities.images.length > 0) ? entities.images[0] : 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop';
  return `
<section class="hero" style="background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('${heroImage}'); background-size: cover; background-position: center;">
  <div class="container hero-grid">
    <div>
      <span class="eyebrow">${esc(niche.hero.eyebrow)}</span>
      <h1>${esc(businessName)}</h1>
      <p class="lede">${esc(usp)}</p>
      <div class="hero-actions">
        <a href="contact.html" class="btn btn-primary">${esc(niche.hero.primary_cta)}</a>
        <a href="services.html" class="btn btn-ghost">${esc(niche.hero.secondary_cta)}</a>
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
<section class="trust">
  <div class="container trust-grid">${stats}
  </div>
</section>`;
}

function buildServicesSection(limit = 0) {
  let cardsData = buildServices();
  if (limit > 0) cardsData = cardsData.slice(0, limit);

  const cards = cardsData.map((c, i) => `
      <div class="card">
        <div class="idx">${String(i + 1).padStart(2, '0')}</div>
        <h3>${esc(c.title)}</h3>
        <p>${esc(c.desc)}</p>
      </div>`).join('');
  return `
<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">${esc(niche.label)}</span>
      <h2>${esc(niche.section_titles.services)}</h2>
    </div>
    <div class="cards">${cards}
    </div>
  </div>
</section>`;
}

function buildAboutContent() {
  const aboutImage = (entities.images && entities.images.length > 1) ? entities.images[1] : 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2070&auto=format&fit=crop';
  return `
<section class="section">
  <div class="container">
     <img src="${aboutImage}" alt="About ${businessName}" class="about-img">
  </div>
</section>
<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">About Us</span>
      <h2>Our Commitment to Excellence</h2>
    </div>
    <div class="content-text">
        <p class="lede">${esc(niche.voice_tone)}</p>
        <p>${esc(usp)}</p>
    </div>
  </div>
</section>`;
}

function buildContactSection() {
    const formAction = formspreeHash
      ? (formspreeHash.startsWith('http') ? formspreeHash : `https://formspree.io/f/${formspreeHash}`)
      : `mailto:${contactEmail}`;

    return `
<section class="section">
  <div class="container">
    <div class="cta-inner">
      <div>
        <span class="eyebrow">Get In Touch</span>
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

// ── Multi-Page Assembly ────────────────────────────────────

const baseTemplatePath = path.join(ENGINE_ROOT, 'templates', 'master-site', 'base.html');
const baseTemplate = fs.readFileSync(baseTemplatePath, 'utf8');

const pages = [
    { id: 'index', title: 'Home', description: usp, content: buildHero() + buildTrust() + buildServicesSection(3) },
    { id: 'services', title: niche.section_titles.services, description: `Our professional ${niche.label} services.`, content: buildServicesSection() + buildInteractiveWidget() },
    { id: 'about', title: 'About Us', description: `Learn more about ${businessName}.`, content: buildAboutContent() + buildTrust() },
    { id: 'contact', title: 'Contact Us', description: `Contact ${businessName} for ${niche.label} needs.`, content: buildContactSection() }
];

function buildInteractiveWidget() {
    if (nicheKey === 'medical' || nicheKey === 'legal') {
        return `
<section class="section">
    <div class="container">
        <div class="booking-widget" style="border: 1px solid var(--line); padding: 40px; border-radius: var(--radius); text-align: center; background: var(--surface);">
            <h3>Schedule Your Consultation</h3>
            <p>Our digital coordinator is available to help you find the best time.</p>
            <button class="btn btn-primary" onclick="alert('Booking calendar would mount here.')">Open Schedule</button>
        </div>
    </div>
</section>`;
    }
    if (nicheKey === 'food-restaurant') {
        return `
<section class="section">
    <div class="container">
        <div class="reservation-widget" style="border: 1px solid var(--line); padding: 40px; border-radius: var(--radius); text-align: center; background: var(--surface);">
            <h3>Book a Table</h3>
            <p>Reserve your sensory dining experience online.</p>
            <button class="btn btn-primary" onclick="alert('Table reservation system would mount here.')">Find a Table</button>
        </div>
    </div>
</section>`;
    }
    return '';
}

// Add niche-specific pages
if (nicheKey === 'food-restaurant') {
    pages.push({ id: 'menu', title: 'Our Menu', description: 'Explore our delicious offerings.', content: buildMenuContent() });
}

function buildMenuContent() {
    const sections = [
        { name: 'Starters', items: ['Seasonal Soup', 'Artisan Bread', 'Garden Salad'] },
        { name: 'Mains', items: ['Grilled Sea Bass', 'Herb-Crusted Lamb', 'Wild Mushroom Risotto'] },
        { name: 'Desserts', items: ['Dark Chocolate Fondant', 'Lemon Tart', 'Selection of Cheeses'] }
    ];

    const html = sections.map(s => `
        <div class="menu-section">
            <h3>${esc(s.name)}</h3>
            <ul class="menu-list">
                ${s.items.map(i => `<li>${esc(i)}</li>`).join('')}
            </ul>
        </div>
    `).join('');

    return `
<section class="section">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow">The Menu</span>
      <h2>Our Seasonal Offerings</h2>
    </div>
    <div class="menu-grid">
        ${html}
    </div>
  </div>
</section>`;
}

function assemblePage(page) {
    let html = baseTemplate;

    const components = {
        '{{NAV}}': loadComponent('nav'),
        '{{FOOTER}}': loadComponent('footer'),
        '{{CONTENT}}': page.content
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
        '{{YEAR}}': new Date().getFullYear(),
        '{{PAGE_TITLE}}': page.title,
        '{{PAGE_DESCRIPTION}}': page.description,
        '{{PAGE_ID}}': page.id,
        '{{NICHE_SPECIFIC_NAV}}': (nicheKey === 'food-restaurant') ? '<a href="menu.html">Menu</a>' : ''
    };

    Object.entries(substitutions).forEach(([token, value]) => {
        html = html.split(token).join(value);
    });

    return html;
}

const distDir = path.join(ROOT, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

pages.forEach(page => {
    const html = assemblePage(page);
    fs.writeFileSync(path.join(distDir, `${page.id}.html`), html);
});

const cssSrc = path.join(ENGINE_ROOT, 'templates', 'master-site', 'site.css');
fs.copyFileSync(cssSrc, path.join(distDir, 'styles.css'));

const manifest = {
  timestamp: new Date().toISOString(),
  engine_version: '4.0.0',
  niche: nicheKey,
  niche_label: niche.label,
  business_name: businessName,
  contact: contactEmail,
  palette,
  fonts: niche.fonts,
  artifacts: pages.map(p => `${p.id}.html`).concat(['styles.css'])
};
fs.writeFileSync(path.join(distDir, 'build-manifest.json'), JSON.stringify(manifest, null, 2));

console.log(`[✓] Multi-page ${niche.label} site assembled in /dist (niche=${nicheKey}, pages=${pages.length})`);
