// Web Design Automation Factory — Unified State & UI Orchestrator (FIXED + EXTENDED)
// v2.0 — Bug fixes, Style Words wiring, Toast system, Pipeline integration

// Global application state
const AppState = {
  seoTitle: 'Aura Design Automation Factory',
  seoDescription: 'High-fidelity, responsive single-page visual layout builder and design system compiler.',
  seoKeywords: 'web design, automation, low-code, design system, html export',
  seoLanguage: 'en',
  contactEmail: 'contact@domain.com',
  clientUrl: '',
  selectedPresetId: 'saas',
  themePrimary: '#8b5cf6',
  themeSecondary: '#f43f5e',
  themeAccent: '#06b6d4',
  themeBg: '#06050b',
  containerWidth: 1200,
  borderRadius: 12,
  fontFamily: 'Outfit',
  activeSections: []
};

// Fallback matrices for industries
const IndustryFallbacks = {
  construction: { primary: '#1E3A8A', accent: '#F97316', secondary: '#1e293b', bg: '#030712' },
  medical:      { primary: '#0D9488', accent: '#38BDF8', secondary: '#0f172a', bg: '#040b0e' },
  legal:        { primary: '#1E293B', accent: '#D97706', secondary: '#475569', bg: '#070a13' },
  fitness:      { primary: '#0f0f10', accent: '#DC2626', secondary: '#1c1917', bg: '#080808' },
  default:      { primary: '#8b5cf6', accent: '#06b6d4', secondary: '#f43f5e', bg: '#06050b' }
};

document.addEventListener('DOMContentLoaded', () => {
  initDashboardUI();
  loadTemplatePreset('saas');
  MotionLib.init();
  PipelineUI._container = document.getElementById('toast-container');
});

// ── Initialize Dashboard ──────────────────────────────────────
function initDashboardUI() {
  // 1. Sidebar Tab Controls
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetPanel = btn.getAttribute('data-tab');
      document.querySelectorAll('.panel-section').forEach(p => p.classList.remove('active'));
      const panel = document.getElementById(`panel-${targetPanel}`);
      if (panel) panel.classList.add('active');
    });
  });

  // 2. Real-Time Input Sync (FIX #1: removed redundant if/else)
  setupStateInputListener('seo-title', 'seoTitle');
  setupStateInputListener('seo-desc', 'seoDescription');
  setupStateInputListener('seo-keys', 'seoKeywords');
  setupStateInputListener('seo-lang', 'seoLanguage');
  setupStateInputListener('contact-email', 'contactEmail');
  setupStateInputListener('container-width', 'containerWidth', parseInt, true);
  setupStateInputListener('border-radius', 'borderRadius', parseInt, true);

  // Color pickers
  setupColorPicker('color-primary', 'themePrimary');
  setupColorPicker('color-secondary', 'themeSecondary');
  setupColorPicker('color-accent', 'themeAccent');
  setupColorPicker('color-bg', 'themeBg');

  // Font Family
  const fontSelect = document.getElementById('font-family');
  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      AppState.fontFamily = e.target.value;
      updateIframeStyles();
      updateCodeViewers();
    });
  }

  // 3. Preset Selector
  const presetSelect = document.getElementById('preset-selector');
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => loadTemplatePreset(e.target.value));
  }

  // 4. Dual Tab Switch (URL / Style Words)
  const dualTabs = document.querySelectorAll('.dual-tab');
  dualTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dualTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const pane = tab.getAttribute('data-input');
      document.querySelectorAll('.dual-input-pane').forEach(p => p.classList.remove('active'));
      const targetPane = document.getElementById(`dual-pane-${pane}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // 5. Brand Scan Button (FIX #2: no more alert())
  const scanBtn = document.getElementById('brand-scan-btn');
  const urlInput = document.getElementById('client-url');
  if (scanBtn && urlInput) {
    scanBtn.addEventListener('click', () => {
      const urlVal = urlInput.value.trim();
      if (!urlVal) {
        Toast.show('Please enter a valid client URL first', 'warning');
        return;
      }
      simulateBrandScan(urlVal);
    });
  }

  // 6. Style Words Apply Button (FIX: was completely unwired)
  const styleWordsBtn = document.getElementById('style-words-apply-btn');
  const styleWordsClear = document.getElementById('style-words-clear-btn');
  const styleWordsInput = document.getElementById('style-words');

  if (styleWordsBtn) {
    styleWordsBtn.addEventListener('click', async () => {
      const words = styleWordsInput ? styleWordsInput.value.trim() : '';
      if (!words) { Toast.show('Enter style descriptor words first', 'warning'); return; }
      await applyStyleWords(words);
    });
  }
  if (styleWordsClear) {
    styleWordsClear.addEventListener('click', () => {
      if (styleWordsInput) styleWordsInput.value = '';
      const tagsDisplay = document.getElementById('style-tags-display');
      if (tagsDisplay) tagsDisplay.style.display = 'none';
    });
  }

  // 7. Component Add Buttons
  const addButtons = document.querySelectorAll('.component-add-btn');
  addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const compId = btn.getAttribute('data-component');
      addCanvasSection(compId);
    });
  });
  document.querySelectorAll('.component-card').forEach(card => {
    card.addEventListener('click', () => {
      const btn = card.querySelector('.component-add-btn');
      if (btn) addCanvasSection(btn.getAttribute('data-component'));
    });
  });

  // 8. Device Viewport Toggles
  const deviceBtns = document.querySelectorAll('.device-btn');
  const viewportWrapper = document.getElementById('viewport-wrapper');
  deviceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      deviceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const device = btn.getAttribute('data-device');
      if (viewportWrapper) viewportWrapper.className = `preview-wrapper ${device}`;
    });
  });

  // 9. Clear Canvas
  const clearBtn = document.getElementById('clear-canvas-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!AppState.activeSections.length) { Toast.show('Canvas is already empty', 'info'); return; }
      // Custom confirm (no browser alert)
      showConfirm('Clear all layout sections from the canvas?', () => {
        AppState.activeSections = [];
        renderCanvas();
        updateLayoutList();
        Toast.show('Canvas cleared', 'info');
      });
    });
  }

  // 10. ZIP Download
  const downloadBtn = document.getElementById('download-zip-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => Exporter.downloadProductionZip(AppState));
  }

  // 11. Code Drawer Toggle
  const toggleCodeBtn = document.getElementById('toggle-code-drawer');
  const codeDrawer = document.getElementById('code-drawer');
  if (toggleCodeBtn && codeDrawer) {
    toggleCodeBtn.addEventListener('click', () => {
      const isOpen = codeDrawer.classList.toggle('open');
      toggleCodeBtn.textContent = isOpen ? '✕ Collapse Workspace Code' : '🖨️ View Compiled Code';
      if (isOpen) updateCodeViewers();
    });
  }

  // 12. Code Tabs
  const codeTabs = document.querySelectorAll('.code-tab');
  codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      codeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const format = tab.getAttribute('data-format');
      document.querySelectorAll('.code-container').forEach(c => c.style.display = 'none');
      const target = document.getElementById(`code-viewer-${format}`);
      if (target) target.style.display = 'block';
    });
  });

  // 13. Copy Code
  const copyBtn = document.getElementById('copy-code-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const activeTab = document.querySelector('.code-tab.active');
      const format = activeTab ? activeTab.getAttribute('data-format') : 'html';
      const codeNode = document.getElementById(`code-viewer-${format}`);
      if (codeNode) {
        navigator.clipboard.writeText(codeNode.textContent)
          .then(() => {
            const orig = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓ Copied!';
            setTimeout(() => copyBtn.innerHTML = orig, 2000);
          })
          .catch(() => Toast.show('Clipboard copy failed — try selecting text manually', 'error'));
      }
    });
  }

  // 14. Pipeline Tab Controls
  initPipelinePanel();

  // 15. Ollama status check
  checkOllamaStatus();
}

// ── Pipeline Panel Initializer ────────────────────────────────
function initPipelinePanel() {
  const runBtn = document.getElementById('pipeline-run-btn');
  const abortBtn = document.getElementById('pipeline-abort-btn');
  const urlInput = document.getElementById('pipeline-client-url');
  const nameInput = document.getElementById('pipeline-client-name');
  const industrySelect = document.getElementById('pipeline-industry');

  if (runBtn) {
    runBtn.addEventListener('click', () => {
      const url = urlInput ? urlInput.value.trim() : '';
      const name = nameInput ? nameInput.value.trim() : '';
      const industry = industrySelect ? industrySelect.value : 'default';
      if (!url) { Toast.show('Enter a client URL to start the pipeline', 'warning'); return; }
      Pipeline.run(url, name, industry);
    });
  }
  if (abortBtn) {
    abortBtn.addEventListener('click', () => Pipeline.abort());
  }

  // Stage jump buttons
  [1, 2, 3, 4, 5, 6].forEach(n => {
    const btn = document.getElementById(`stage-run-${n}`);
    if (btn) btn.addEventListener('click', () => Pipeline.runStage(n));
  });
}

// ── Ollama Status Check ───────────────────────────────────────
async function checkOllamaStatus() {
  const indicator = document.getElementById('ollama-status');
  if (!indicator) return;
  indicator.textContent = '⟳ Checking...';
  try {
    const health = await AiEngine.checkHealth();
    if (health.online) {
      indicator.textContent = `✓ Ollama Online — ${health.models.length} model(s)`;
      indicator.className = 'ollama-status online';
      const details = document.getElementById('ollama-models');
      if (details) details.textContent = health.models.slice(0, 5).join(', ') || 'No models pulled';
    } else {
      indicator.textContent = '✗ Ollama Offline';
      indicator.className = 'ollama-status offline';
    }
  } catch (e) {
    indicator.textContent = '✗ Ollama Offline';
    indicator.className = 'ollama-status offline';
  }
}

// ── Style Words → Theme (FIX: was entirely unwired) ───────────
async function applyStyleWords(words) {
  const btn = document.getElementById('style-words-apply-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⟳ Mapping...'; }

  // Update tags display
  const tagsDisplay = document.getElementById('style-tags-display');
  const tagsList = document.getElementById('style-tags-list');
  if (tagsDisplay && tagsList) {
    tagsDisplay.style.display = 'flex';
    tagsList.innerHTML = words.split(',').map(w => `<span class="style-tag">${w.trim()}</span>`).join('');
  }

  let theme = null;

  // Try AI first
  const health = await AiEngine.checkHealth().catch(() => ({ online: false }));
  if (health.online) {
    Toast.show('🎨 Sending style words to AI...', 'info', 2000);
    theme = await AiEngine.styleWordsToTheme(words).catch(() => null);
  }

  // Fallback: local keyword mapping
  if (!theme) {
    theme = mapStyleWordsToTheme(words);
  }

  if (theme) {
    AppState.themePrimary   = theme.primary   || AppState.themePrimary;
    AppState.themeSecondary = theme.secondary  || AppState.themeSecondary;
    AppState.themeAccent    = theme.accent     || AppState.themeAccent;
    AppState.themeBg        = theme.bg         || AppState.themeBg;
    if (theme.font) AppState.fontFamily = theme.font;
    if (theme.border_radius) AppState.borderRadius = parseInt(theme.border_radius);

    updateFormControlsFromState();
    updateIframeStyles();
    updateCodeViewers();
    Toast.show(`✓ Style words applied: ${words.substring(0, 40)}`, 'success');
  } else {
    Toast.show('Could not map style words — try more specific terms', 'warning');
  }

  if (btn) { btn.disabled = false; btn.textContent = 'Apply Style Words'; }
}

// Local keyword→palette fallback for style words
function mapStyleWordsToTheme(words) {
  const w = words.toLowerCase();
  if (/teal|medical|clean|health/.test(w)) return IndustryFallbacks.medical;
  if (/blue|corporate|trust|law/.test(w)) return IndustryFallbacks.legal;
  if (/red|aggressive|fitness|gym/.test(w)) return IndustryFallbacks.fitness;
  if (/orange|construct|build/.test(w)) return IndustryFallbacks.construction;
  if (/purple|violet|saas|tech/.test(w)) return { primary: '#8b5cf6', secondary: '#f43f5e', accent: '#06b6d4', bg: '#06050b' };
  if (/rose|pink|fashion|beauty/.test(w)) return { primary: '#ec4899', secondary: '#8b5cf6', accent: '#f59e0b', bg: '#09050c' };
  if (/green|eco|nature|sustain/.test(w)) return { primary: '#10b981', secondary: '#0d9488', accent: '#84cc16', bg: '#030a06' };
  if (/gold|luxury|premium|elite/.test(w)) return { primary: '#d4a017', secondary: '#92400e', accent: '#fbbf24', bg: '#0a0800' };
  return null;
}

// ── Helpers: Data Sync ────────────────────────────────────────
function setupStateInputListener(elemId, stateKey, parser = null, isStyleTrigger = false) {
  const elem = document.getElementById(elemId);
  if (!elem) return;
  // FIX #1: Unified initialization (removed redundant if/else)
  elem.value = AppState[stateKey];
  elem.addEventListener('input', (e) => {
    let val = e.target.value;
    if (parser) val = parser(val);
    AppState[stateKey] = val;
    if (isStyleTrigger) updateIframeStyles();
    updateCodeViewers();
  });
}

function setupColorPicker(colorId, stateKey) {
  const wrapper = document.getElementById(`${colorId}-wrapper`);
  if (!wrapper) return;
  const picker = wrapper.querySelector('.color-picker');
  const hexText = wrapper.querySelector('.color-hex-text');
  if (picker && hexText) {
    picker.value = AppState[stateKey];
    hexText.textContent = AppState[stateKey];
    picker.addEventListener('input', (e) => {
      const val = e.target.value;
      AppState[stateKey] = val;
      hexText.textContent = val;
      updateIframeStyles();
      updateCodeViewers();
    });
    hexText.addEventListener('click', () => {
      const newHex = prompt(`Modify HEX for ${stateKey.replace('theme', '')}:`, AppState[stateKey]);
      if (newHex && /^#[A-Fa-f0-9]{6}$/.test(newHex)) {
        AppState[stateKey] = newHex;
        picker.value = newHex;
        hexText.textContent = newHex;
        updateIframeStyles();
        updateCodeViewers();
      }
    });
  }
}

function loadTemplatePreset(presetId) {
  const template = WebTemplates[presetId];
  if (!template) return;
  AppState.selectedPresetId = presetId;
  if (template.industry && IndustryFallbacks[template.industry]) {
    const fb = IndustryFallbacks[template.industry];
    AppState.themePrimary = fb.primary;
    AppState.themeAccent = fb.accent;
    AppState.themeSecondary = fb.secondary;
    AppState.themeBg = fb.bg;
  } else {
    AppState.themePrimary = template.theme.primary;
    AppState.themeAccent = template.theme.accent;
    AppState.themeSecondary = template.theme.secondary;
    AppState.themeBg = template.theme.bg;
  }
  AppState.containerWidth = parseInt(template.theme.container);
  AppState.borderRadius = parseInt(template.theme.radius);
  AppState.fontFamily = template.theme.font;
  updateFormControlsFromState();
  AppState.activeSections = template.sections.map(sectionId => ({
    id: generateUUID(),
    componentId: sectionId
  }));
  renderCanvas();
  updateLayoutList();
}

function updateFormControlsFromState() {
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const syncColor = (colorId, val) => {
    const wrapper = document.getElementById(`${colorId}-wrapper`);
    if (wrapper) {
      const picker = wrapper.querySelector('.color-picker');
      const hexText = wrapper.querySelector('.color-hex-text');
      if (picker) picker.value = val;
      if (hexText) hexText.textContent = val;
    }
  };
  setVal('container-width', AppState.containerWidth);
  setVal('border-radius', AppState.borderRadius);
  setVal('font-family', AppState.fontFamily);
  syncColor('color-primary', AppState.themePrimary);
  syncColor('color-secondary', AppState.themeSecondary);
  syncColor('color-accent', AppState.themeAccent);
  syncColor('color-bg', AppState.themeBg);
}

// FIX #15: Brand scan now calls loadTemplatePreset to also update sections
function simulateBrandScan(url) {
  const scanBtn = document.getElementById('brand-scan-btn');
  const origText = scanBtn ? scanBtn.textContent : '';
  if (scanBtn) { scanBtn.disabled = true; scanBtn.textContent = '⚡ Parsing Brand Vectors...'; }

  let domain = 'factory';
  try {
    const parsed = new URL(url.includes('://') ? url : 'http://' + url);
    domain = parsed.hostname.replace('www.', '');
  } catch (e) {}

  setTimeout(() => {
    let generatedTheme;
    let presetId;

    if (/clinic|dental|health|med/.test(domain)) {
      generatedTheme = IndustryFallbacks.medical; presetId = 'medical';
    } else if (/construct|roof|build/.test(domain)) {
      generatedTheme = IndustryFallbacks.construction; presetId = 'construction';
    } else if (/law|legal|partner|tax/.test(domain)) {
      generatedTheme = IndustryFallbacks.legal; presetId = 'legal';
    } else if (/fit|gym|crossfit|sport/.test(domain)) {
      generatedTheme = IndustryFallbacks.fitness; presetId = 'fitness';
    } else {
      generatedTheme = { primary: '#7c3aed', secondary: '#db2777', accent: '#0284c7', bg: '#0b0f19' };
      presetId = 'saas';
    }

    // FIX #15: Also reload the template sections (not just colors)
    AppState.themePrimary = generatedTheme.primary;
    AppState.themeAccent = generatedTheme.accent;
    AppState.themeSecondary = generatedTheme.secondary;
    AppState.themeBg = generatedTheme.bg;

    const presetSelect = document.getElementById('preset-selector');
    if (presetSelect) presetSelect.value = presetId;
    loadTemplatePreset(presetId);

    updateFormControlsFromState();
    updateIframeStyles();
    updateCodeViewers();

    if (scanBtn) { scanBtn.disabled = false; scanBtn.textContent = '✓ Scan Done!'; }
    setTimeout(() => { if (scanBtn) scanBtn.textContent = origText; }, 2500);

    // FIX #2: Toast instead of alert
    Toast.show(`✓ Brand scan for "${domain}" complete — ${presetId} preset applied`, 'success');
  }, 1800);
}

// ── Canvas ────────────────────────────────────────────────────
function addCanvasSection(compId) {
  AppState.activeSections.push({ id: generateUUID(), componentId: compId });
  renderCanvas();
  updateLayoutList();
}

function removeCanvasSection(id) {
  AppState.activeSections = AppState.activeSections.filter(s => s.id !== id);
  renderCanvas();
  updateLayoutList();
}

function moveSection(id, direction) {
  const index = AppState.activeSections.findIndex(s => s.id === id);
  if (index === -1) return;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= AppState.activeSections.length) return;
  const temp = AppState.activeSections[index];
  AppState.activeSections[index] = AppState.activeSections[targetIndex];
  AppState.activeSections[targetIndex] = temp;
  renderCanvas();
  updateLayoutList();
}

function cloneSection(id) {
  const index = AppState.activeSections.findIndex(s => s.id === id);
  if (index === -1) return;
  const clone = { id: generateUUID(), componentId: AppState.activeSections[index].componentId };
  AppState.activeSections.splice(index + 1, 0, clone);
  renderCanvas();
  updateLayoutList();
}

// ── Canvas Render (FIX #6: iframe race condition fixed) ───────
function renderCanvas() {
  const iframe = document.getElementById('preview-iframe');
  const emptyState = document.getElementById('canvas-empty-state');
  if (!iframe) return;

  if (AppState.activeSections.length === 0) {
    iframe.style.display = 'none';
    if (emptyState) emptyState.style.display = 'flex';
    return;
  }

  iframe.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';

  const currentStructureSig = AppState.activeSections.map(s => s.componentId).join(',');
  const loadedSig = iframe.getAttribute('data-structure-sig');

  if (currentStructureSig !== loadedSig) {
    // FIX #6: Only call updateIframeStyles() INSIDE onload, not before
    iframe.setAttribute('data-structure-sig', currentStructureSig);

    iframe.onload = () => {
      updateIframeStyles();
      // Inject motion library into iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDoc) MotionLib.applyToCanvas(iframeDoc);
    };

    const compiled = Exporter.compileWorkspace(AppState);
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(compiled.html);
    iframeDoc.close();
  } else {
    // Structure unchanged — safe to update styles directly
    updateIframeStyles();
  }

  updateCodeViewers();
}

// FIX #6: updateIframeStyles doesn't need to call renderCanvas — just updates CSS vars
function updateIframeStyles() {
  const iframe = document.getElementById('preview-iframe');
  if (!iframe) return;
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  if (!iframeDoc || !iframeDoc.documentElement) return;
  const root = iframeDoc.documentElement;
  root.style.setProperty('--color-primary', AppState.themePrimary);
  root.style.setProperty('--color-primary-glow', Exporter.hexToRgba(AppState.themePrimary, 0.25));
  root.style.setProperty('--color-secondary', AppState.themeSecondary);
  root.style.setProperty('--color-secondary-glow', Exporter.hexToRgba(AppState.themeSecondary, 0.25));
  root.style.setProperty('--color-accent', AppState.themeAccent);
  root.style.setProperty('--color-accent-glow', Exporter.hexToRgba(AppState.themeAccent, 0.25));
  root.style.setProperty('--color-bg', AppState.themeBg);
  root.style.setProperty('--container-width', AppState.containerWidth + 'px');
  root.style.setProperty('--border-radius', AppState.borderRadius + 'px');
  root.style.setProperty('--font-family', `'${AppState.fontFamily}', sans-serif`);
  const body = iframeDoc.body;
  if (body) body.style.backgroundColor = AppState.themeBg;
}

function updateLayoutList() {
  const container = document.getElementById('layout-items-list');
  if (!container) return;
  container.innerHTML = '';

  AppState.activeSections.forEach((section, index) => {
    const comp = WebComponents[section.componentId];
    if (!comp) return;
    const isFirst = index === 0;
    const isLast = index === AppState.activeSections.length - 1;
    const item = document.createElement('div');
    item.className = 'layout-item';
    item.innerHTML = `
      <div class="layout-item-details">
        <span class="layout-item-title">${comp.name}</span>
        <span class="layout-item-id">${section.id.substring(0, 8)} (${comp.category})</span>
      </div>
      <div class="layout-item-controls">
        <button class="layout-control-btn" onclick="moveSection('${section.id}', -1)" ${isFirst ? 'disabled' : ''} title="Move Up">▲</button>
        <button class="layout-control-btn" onclick="moveSection('${section.id}', 1)" ${isLast ? 'disabled' : ''} title="Move Down">▼</button>
        <button class="layout-control-btn" onclick="cloneSection('${section.id}')" title="Clone Section">❐</button>
        <button class="layout-control-btn delete" onclick="removeCanvasSection('${section.id}')" title="Delete Section">✕</button>
      </div>
    `;
    container.appendChild(item);
  });

  window.moveSection = moveSection;
  window.cloneSection = cloneSection;
  window.removeCanvasSection = removeCanvasSection;
}

function updateCodeViewers() {
  const codeDrawer = document.getElementById('code-drawer');
  if (!codeDrawer || !codeDrawer.classList.contains('open')) return;
  const { html, css } = Exporter.compileWorkspace(AppState);
  const htmlNode = document.getElementById('code-viewer-html');
  const cssNode = document.getElementById('code-viewer-css');
  if (htmlNode) htmlNode.textContent = html;
  if (cssNode) cssNode.textContent = css;
}

// ── Custom Confirm Dialog (replaces window.confirm) ───────────
function showConfirm(message, onConfirm) {
  const existing = document.getElementById('custom-confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'custom-confirm-modal';
  modal.className = 'confirm-modal-overlay';
  modal.innerHTML = `
    <div class="confirm-modal">
      <p class="confirm-message">${message}</p>
      <div class="confirm-actions">
        <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
        <button class="btn btn-primary" id="confirm-ok">Confirm</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  requestAnimationFrame(() => modal.classList.add('confirm-visible'));

  const close = () => { modal.classList.remove('confirm-visible'); setTimeout(() => modal.remove(), 250); };
  modal.querySelector('#confirm-ok').addEventListener('click', () => { close(); onConfirm(); });
  modal.querySelector('#confirm-cancel').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
}

// FIX #7: Correct UUIDv4 generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
