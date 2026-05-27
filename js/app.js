const INDUSTRIES = {
  saas: { primary: '#6c5cff', secondary: '#26d0ff', accent: '#ff5f8f', background: '#080710' },
  creative: { primary: '#ff4f7b', secondary: '#8f6bff', accent: '#f7b84b', background: '#090712' },
  construction: { primary: '#2341b2', secondary: '#1f2937', accent: '#ff8a2a', background: '#060912' },
  medical: { primary: '#0ea5a3', secondary: '#0f172a', accent: '#5ed3ff', background: '#071014' },
  legal: { primary: '#24324b', secondary: '#475569', accent: '#e0a23d', background: '#080b14' },
  fitness: { primary: '#141414', secondary: '#27211d', accent: '#ef4444', background: '#090909' }
};

const COMPONENTS = {
  navbar: { name: 'Glass Navbar', desc: 'Sticky navigation with premium call-to-action.' },
  hero: { name: 'Split Hero', desc: 'Bold intro area with live metrics and actions.' },
  features: { name: 'Feature Grid', desc: 'Card-driven benefit matrix with glow states.' },
  stats: { name: 'Metrics Strip', desc: 'Fast-scanning proof and credibility bar.' },
  pricing: { name: 'Pricing Stack', desc: 'Conversion-focused plan cards.' },
  contact: { name: 'Contact Block', desc: 'Form and trust details with email token binding.' },
  footer: { name: 'Footer', desc: 'Multi-column closing area with link groups.' }
};

const SECTION_ORDER = ['navbar', 'hero', 'features', 'stats', 'pricing', 'contact', 'footer'];

const state = {
  businessName: 'Northstar Studio',
  contactEmail: 'hello@northstar.studio',
  industry: 'saas',
  activeSections: ['navbar', 'hero', 'features', 'stats', 'pricing', 'contact', 'footer'],
  device: 'desktop',
  codeTab: 'html',
  sourceMetadata: null,
  sourceLayoutArchetype: null
};

const componentMarkup = {
  navbar: () => `
<nav class="nav-shell">
  <div class="nav-inner">
    <div class="nav-brand">
      <div class="nav-mark"></div>
      <div>
        <div class="nav-title">{{BUSINESS_NAME}}</div>
        <div class="nav-sub">Premium digital systems</div>
      </div>
    </div>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#stats">Results</a>
      <a href="#pricing">Pricing</a>
      <a href="#contact">Contact</a>
    </div>
    <a href="#contact" class="nav-button">Start Project</a>
  </div>
</nav>`,
  hero: () => `
<section class="hero-shell" id="hero">
  <div class="hero-grid">
    <div>
      <div class="eyebrow">Live Builder Preview</div>
      <h1 class="hero-heading">Design and launch a premium web presence for <span>{{BUSINESS_NAME}}</span>.</h1>
      <p class="hero-copy">Update the contact email, swap the industry palette, and rearrange sections without reloading the canvas.</p>
      <div class="hero-actions">
        <a class="hero-primary" href="#contact">Book a call</a>
        <a class="hero-secondary" href="#features">Explore modules</a>
      </div>
    </div>
    <div class="hero-panel">
      <div class="mini-window">
        <div class="mini-bar"><span></span><span></span><span></span></div>
        <div class="mini-content">
          <div class="mini-row"></div>
          <div class="mini-row short"></div>
          <div class="mini-row accent"></div>
          <div class="mini-grid">
            <div></div><div></div><div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`,
  features: () => `
<section class="section-block" id="features">
  <div class="section-head">
    <div class="eyebrow">Capabilities</div>
    <h2>Built for high-trust client presentations.</h2>
  </div>
  <div class="feature-grid">
    <article class="feature-card"><h3>Live tokens</h3><p>Business name and contact variables update directly inside the iframe context.</p></article>
    <article class="feature-card accent"><h3>Color matrices</h3><p>Industry switching injects a full palette into the preview root style variables.</p></article>
    <article class="feature-card"><h3>Section order</h3><p>Add, remove, and reorder layout blocks with an immediate visual refresh.</p></article>
  </div>
</section>`,
  stats: () => `
<section class="section-block stats-block" id="stats">
  <div class="stats-grid">
    <div class="stat-card"><strong>99.9%</strong><span>layout clarity</span></div>
    <div class="stat-card"><strong>0</strong><span>raw text dumps</span></div>
    <div class="stat-card"><strong>Live</strong><span>state driven</span></div>
    <div class="stat-card"><strong>ZIP</strong><span>production export</span></div>
  </div>
</section>`,
  pricing: () => `
<section class="section-block" id="pricing">
  <div class="section-head">
    <div class="eyebrow">Packages</div>
    <h2>Simple plans that feel premium.</h2>
  </div>
  <div class="pricing-grid">
    <article class="price-card"><h3>Starter</h3><div class="price">$0</div><p>Great for quick concepts.</p></article>
    <article class="price-card popular"><h3>Production</h3><div class="price">$49</div><p>Best for client-ready builds.</p></article>
  </div>
</section>`,
  contact: () => `
<section class="section-block contact-shell" id="contact">
  <div class="contact-copy">
    <div class="eyebrow">Contact</div>
    <h2>Send the brief to {{CONTACT_EMAIL}}.</h2>
    <p>Forms in the preview are bound to the current email token and styled to match the selected matrix.</p>
  </div>
  <form class="contact-card">
    <input type="text" placeholder="Your name" />
    <input type="email" placeholder="Email address" />
    <textarea rows="4" placeholder="Project details"></textarea>
    <button type="button">Send Message</button>
  </form>
</section>`,
  footer: () => `
<footer class="footer-shell">
  <div class="footer-brand">{{BUSINESS_NAME}}</div>
  <div class="footer-note">Built for premium presentation and production export.</div>
</footer>`
};

function hexToRgba(hex, alpha) {
  const value = hex.replace('#', '');
  const expanded = value.length === 3 ? value.split('').map(char => char + char).join('') : value;
  const int = Number.parseInt(expanded, 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}

function getTheme() {
  return INDUSTRIES[state.industry];
}

function buildPreviewHtml() {
  const theme = getTheme();
  const sections = state.activeSections.map(key => {
    const component = WebComponents[key];
    if (!component) return '';
    const params = {
      BUSINESS_NAME: state.businessName,
      CONTACT_EMAIL: state.contactEmail,
      HERO_CTA: state.sourceMetadata?.brand?.cta_text || 'Get Started',
      PRIMARY_COLOR: theme.primary,
      ACCENT_COLOR: theme.accent,
      SECONDARY_COLOR: theme.secondary
    };
    const rendered = renderComponent(key, params);
    return rendered.html.trim();
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${buildPreviewCss(theme)}</style>
</head>
<body>
  ${sections}
</body>
</html>`;
}

function buildPreviewCss(theme) {
  const componentCss = state.activeSections.map(key => {
    const component = WebComponents[key];
    return component?.css || '';
  }).join('\n');

  return `
    :root {
      --primary: ${theme.primary};
      --secondary: ${theme.secondary};
      --accent: ${theme.accent};
      --background: ${theme.background};
      --color-primary: ${theme.primary};
      --color-accent: ${theme.accent};
      --color-bg: ${theme.background};
      --color-text-muted: #9ca3af;
      --color-primary-glow: rgba(139, 92, 246, 0.3);
      --color-accent-glow: rgba(6, 182, 212, 0.2);
      --nav-bg: rgba(14, 12, 21, 0.7);
      --nav-border: rgba(255, 255, 255, 0.05);
      --font-family: 'Outfit', sans-serif;
      --container-width: 1200px;
      --border-radius: 8px;
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      font-family: var(--font-family);
      color: #f7f9ff;
      background: linear-gradient(180deg, #0a0b13, var(--background));
      min-height: 100vh;
    }
    a { color: inherit; text-decoration: none; }
    button { font-family: inherit; }
    input, textarea { font-family: inherit; }
    ${componentCss}
  `;
}

function generatePreviewMarkup() {
  let html = buildPreviewHtml();
  html = html.replaceAll('{{BUSINESS_NAME}}', escapeHtml(state.businessName));
  html = html.replaceAll('{{CONTACT_EMAIL}}', escapeHtml(state.contactEmail));
  return html;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function applySourceMetadata(metadata) {
  state.sourceMetadata = metadata;

  if (metadata.brand && metadata.brand.business_name) {
    state.businessName = metadata.brand.business_name;
  }
  if (metadata.brand && metadata.brand.email) {
    state.contactEmail = metadata.brand.email;
  }

  if (metadata.metadata && metadata.metadata.category) {
    const categoryToIndustry = {
      'ecommerce': 'creative',
      'portfolio': 'creative',
      'local_business': 'construction',
      'saas': 'saas',
      'blog': 'creative',
      'default': 'saas'
    };
    state.industry = categoryToIndustry[metadata.metadata.category] || 'saas';

    const archetype = determineLayoutArchetype(metadata.metadata.category, metadata);
    state.sourceLayoutArchetype = archetype;

    if (confirm('Apply extracted layout archetype to active sections?')) {
      state.activeSections = archetype.sections;
    }
  }

  refreshAll();
  showMetadataImportResult(metadata);
}

function showMetadataImportResult(metadata) {
  const resultDiv = document.getElementById('metadata-import-result');
  if (!resultDiv) return;

  const category = metadata.metadata?.category || 'unknown';
  const confidence = (metadata.metadata?.detection_confidence || 0).toFixed(2);
  const businessName = metadata.brand?.business_name || 'Not detected';

  resultDiv.innerHTML = `
    <div style="padding: 12px; background: rgba(107, 92, 255, 0.1); border: 1px solid rgba(107, 92, 255, 0.3); border-radius: 8px; font-size: 12px;">
      <div><strong>✓ Metadata Loaded</strong></div>
      <div>Category: ${category} (confidence: ${confidence})</div>
      <div>Business: ${businessName}</div>
      <div style="margin-top: 8px; color: rgba(235, 240, 255, 0.6);">Fields extracted: Business name, email, colors, typography, content</div>
    </div>
  `;
}

function handleMetadataFileUpload(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const metadata = JSON.parse(e.target.result);
      applySourceMetadata(metadata);
    } catch (err) {
      alert('Error parsing metadata.json: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function renderPreview() {
  const iframe = document.getElementById('preview-iframe');
  const emptyState = document.getElementById('empty-state');
  if (!iframe) return;
  const hasSections = state.activeSections.length > 0;
  emptyState.style.display = hasSections ? 'none' : 'grid';
  iframe.style.display = hasSections ? 'block' : 'none';
  if (!hasSections) return;
  iframe.srcdoc = generatePreviewMarkup();
  syncPreviewChrome();
}

function syncPreviewChrome() {
  const frame = document.getElementById('viewport-frame');
  const iframe = document.getElementById('preview-iframe');
  const doc = iframe.contentDocument;
  if (!doc || !doc.documentElement) return;
  const theme = getTheme();
  doc.documentElement.style.setProperty('--primary', theme.primary);
  doc.documentElement.style.setProperty('--secondary', theme.secondary);
  doc.documentElement.style.setProperty('--accent', theme.accent);
  doc.documentElement.style.setProperty('--background', theme.background);
  doc.documentElement.style.setProperty('--primary-glow', hexToRgba(theme.primary, 0.3));
  doc.documentElement.style.setProperty('--accent-glow', hexToRgba(theme.accent, 0.2));
  iframe.contentDocument.body.style.background = theme.background;
  frame.classList.remove('desktop', 'tablet', 'mobile');
  frame.classList.add(state.device);
}

function renderLibrary() {
  const root = document.getElementById('component-library');
  root.innerHTML = SECTION_ORDER.map(key => `
    <div class="component-card">
      <div>
        <div class="component-title">${COMPONENTS[key].name}</div>
        <div class="component-desc">${COMPONENTS[key].desc}</div>
      </div>
      <button class="component-add" data-add="${key}" type="button">+</button>
    </div>
  `).join('');
  root.querySelectorAll('[data-add]').forEach(button => {
    button.addEventListener('click', () => addSection(button.dataset.add));
  });
}

function renderLayoutList() {
  const root = document.getElementById('layout-list');
  root.innerHTML = state.activeSections.map((key, index) => `
    <div class="layout-item">
      <div class="layout-item-top">
        <div>
          <div class="layout-name">${COMPONENTS[key].name}</div>
          <div class="layout-meta">#${String(index + 1).padStart(2, '0')} · ${key}</div>
        </div>
      </div>
      <div class="layout-controls">
        <button type="button" data-move="-1" data-index="${index}" ${index === 0 ? 'disabled' : ''}>Up</button>
        <button type="button" data-move="1" data-index="${index}" ${index === state.activeSections.length - 1 ? 'disabled' : ''}>Down</button>
        <button type="button" data-clone="${index}">Clone</button>
        <button type="button" data-remove="${index}">Remove</button>
      </div>
    </div>
  `).join('');
  root.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
    state.activeSections.splice(Number(btn.dataset.remove), 1);
    refreshAll();
  }));
  root.querySelectorAll('[data-move]').forEach(btn => btn.addEventListener('click', () => {
    moveSection(Number(btn.dataset.index), Number(btn.dataset.move));
  }));
  root.querySelectorAll('[data-clone]').forEach(btn => btn.addEventListener('click', () => {
    const index = Number(btn.dataset.clone);
    state.activeSections.splice(index + 1, 0, state.activeSections[index]);
    refreshAll();
  }));
}

function addSection(key) {
  state.activeSections.push(key);
  refreshAll();
}

function moveSection(index, delta) {
  const target = index + delta;
  if (target < 0 || target >= state.activeSections.length) return;
  [state.activeSections[index], state.activeSections[target]] = [state.activeSections[target], state.activeSections[index]];
  refreshAll();
}

function refreshCodeDrawer() {
  const html = generatePreviewMarkup();
  const css = buildPreviewCss(getTheme());
  document.getElementById('code-html').textContent = html;
  document.getElementById('code-css').textContent = css;
}

function refreshAll() {
  syncInputs();
  renderPreview();
  renderLayoutList();
  refreshCodeDrawer();
}

function syncInputs() {
  document.getElementById('business-name').value = state.businessName;
  document.getElementById('contact-email').value = state.contactEmail;
  document.getElementById('industry-select').value = state.industry;
}

function bindControls() {
  document.getElementById('business-name').addEventListener('input', e => {
    state.businessName = e.target.value.trim() || 'Northstar Studio';
    updatePreviewTokens();
  });
  document.getElementById('contact-email').addEventListener('input', e => {
    state.contactEmail = e.target.value.trim() || 'hello@northstar.studio';
    updatePreviewTokens();
  });
  document.getElementById('industry-select').addEventListener('change', e => {
    state.industry = e.target.value;
    updatePreviewTokens(true);
  });

  const metadataFileInput = document.getElementById('metadata-file-input');
  if (metadataFileInput) {
    metadataFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleMetadataFileUpload(e.target.files[0]);
      }
    });
  }

  document.querySelectorAll('.device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.device-btn').forEach(node => node.classList.remove('active'));
      btn.classList.add('active');
      state.device = btn.dataset.device;
      syncPreviewChrome();
    });
  });

  document.getElementById('clear-canvas-btn').addEventListener('click', () => {
    state.activeSections = [];
    refreshAll();
  });

  const drawer = document.getElementById('code-drawer');
  document.getElementById('toggle-code-drawer').addEventListener('click', () => {
    drawer.classList.toggle('open');
    drawer.setAttribute('aria-hidden', String(!drawer.classList.contains('open')));
    refreshCodeDrawer();
  });

  document.querySelectorAll('.code-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.code-tab').forEach(node => node.classList.remove('active'));
      document.querySelectorAll('.code-view').forEach(node => node.classList.remove('active'));
      tab.classList.add('active');
      state.codeTab = tab.dataset.target;
      document.getElementById(`code-${state.codeTab}`).classList.add('active');
    });
  });

  document.getElementById('copy-code-btn').addEventListener('click', async () => {
    const text = state.codeTab === 'css' ? buildPreviewCss(getTheme()) : generatePreviewMarkup();
    await navigator.clipboard.writeText(text);
  });

  document.getElementById('download-zip-btn').addEventListener('click', downloadZip);
}

function updatePreviewTokens(rebuildMarkup = false) {
  const iframe = document.getElementById('preview-iframe');
  if (!iframe || !iframe.contentDocument) {
    refreshAll();
    return;
  }
  const doc = iframe.contentDocument;
  const theme = getTheme();
  doc.documentElement.style.setProperty('--primary', theme.primary);
  doc.documentElement.style.setProperty('--secondary', theme.secondary);
  doc.documentElement.style.setProperty('--accent', theme.accent);
  doc.documentElement.style.setProperty('--background', theme.background);
  doc.documentElement.style.setProperty('--color-primary', theme.primary);
  doc.documentElement.style.setProperty('--color-accent', theme.accent);
  doc.documentElement.style.setProperty('--color-bg', theme.background);
  if (doc.body) doc.body.style.background = `linear-gradient(180deg, #0a0b13, ${theme.background})`;

  if (rebuildMarkup) {
    iframe.srcdoc = generatePreviewMarkup();
  } else {
    const body = doc.body;
    if (!body) return;
    const sections = state.activeSections.map(key => {
      const params = {
        BUSINESS_NAME: state.businessName,
        CONTACT_EMAIL: state.contactEmail,
        HERO_CTA: state.sourceMetadata?.brand?.cta_text || 'Get Started',
        PRIMARY_COLOR: theme.primary,
        ACCENT_COLOR: theme.accent,
        SECONDARY_COLOR: theme.secondary
      };
      const rendered = renderComponent(key, params);
      return rendered.html.trim();
    }).join('\n');
    body.innerHTML = sections;
  }
  refreshCodeDrawer();
}

async function downloadZip() {
  Exporter.downloadProductionZip(state);
}

function init() {
  renderLibrary();
  bindControls();
  syncInputs();
  refreshAll();
  const iframe = document.getElementById('preview-iframe');
  iframe.addEventListener('load', syncPreviewChrome);
}

document.addEventListener('DOMContentLoaded', init);
