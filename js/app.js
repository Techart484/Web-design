// Web Design Automation Factory - Unified State & UI Orchestrator
// Coordinates settings, visual canvas updates, isolated iframe, and code compilations.

// Global application state
const AppState = {
  // SEO & General Metadata
  seoTitle: 'Aura Design Automation Factory',
  seoDescription: 'High-fidelity, responsive single-page visual layout builder and design system compiler.',
  seoKeywords: 'web design, automation, low-code, design system, html export',
  seoLanguage: 'en',
  contactEmail: 'contact@domain.com',

  // Client URL & Brand Scanner parameters
  clientUrl: '',
  selectedPresetId: 'saas',

  // Global Design Tokens
  themePrimary: '#8b5cf6',
  themeSecondary: '#f43f5e',
  themeAccent: '#06b6d4',
  themeBg: '#06050b',
  containerWidth: 1200,
  borderRadius: 12,
  fontFamily: 'Outfit',

  // Active layout structure matrix (tracks instances of components in the canvas)
  // Format: { id: string, componentId: string }
  activeSections: []
};

// Fallback matrices for industries
const IndustryFallbacks = {
  construction: {
    primary: '#1E3A8A', // Deep Blue
    accent: '#F97316',  // Safety Orange
    secondary: '#1e293b',
    bg: '#030712'
  },
  medical: {
    primary: '#0D9488', // Teal
    accent: '#38BDF8',  // Sky Blue
    secondary: '#0f172a',
    bg: '#040b0e'
  },
  legal: {
    primary: '#1E293B', // Slate
    accent: '#D97706',  // Amber
    secondary: '#475569',
    bg: '#070a13'
  },
  fitness: {
    primary: '#0f0f10', // Charcoal Dark
    accent: '#DC2626',  // Aggressive Red
    secondary: '#1c1917',
    bg: '#080808'
  }
};

document.addEventListener('DOMContentLoaded', () => {
  initDashboardUI();
  loadTemplatePreset('saas');
});

// Initialize dashboard event anchors
function initDashboardUI() {
  // 1. Sidebar Tab Controls
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const targetPanel = btn.getAttribute('data-tab');
      document.querySelectorAll('.panel-section').forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${targetPanel}`).classList.add('active');
    });
  });

  // 2. Real-Time Inputs Sync
  setupStateInputListener('seo-title', 'seoTitle');
  setupStateInputListener('seo-desc', 'seoDescription');
  setupStateInputListener('seo-keys', 'seoKeywords');
  setupStateInputListener('seo-lang', 'seoLanguage');
  setupStateInputListener('contact-email', 'contactEmail');
  setupStateInputListener('container-width', 'containerWidth', parseInt, true);
  setupStateInputListener('border-radius', 'borderRadius', parseInt, true);

  // Custom visual color pickers & manual hex syncer
  setupColorPicker('color-primary', 'themePrimary');
  setupColorPicker('color-secondary', 'themeSecondary');
  setupColorPicker('color-accent', 'themeAccent');
  setupColorPicker('color-bg', 'themeBg');

  // Font Family sync
  const fontSelect = document.getElementById('font-family');
  if (fontSelect) {
    fontSelect.addEventListener('change', (e) => {
      AppState.fontFamily = e.target.value;
      updateIframeStyles();
      updateCodeViewers();
    });
  }

  // 3. Preset Templates Dropdown Selector
  const presetSelect = document.getElementById('preset-selector');
  if (presetSelect) {
    presetSelect.addEventListener('change', (e) => {
      loadTemplatePreset(e.target.value);
    });
  }

  // 4. Double-Sided Input Token Brand Color Scanner trigger
  const scanBtn = document.getElementById('brand-scan-btn');
  const urlInput = document.getElementById('client-url');
  if (scanBtn && urlInput) {
    scanBtn.addEventListener('click', () => {
      const urlVal = urlInput.value.trim();
      if (!urlVal) {
        alert('Please input a valid client URL to execute the brand scanning matrix.');
        return;
      }
      simulateBrandScan(urlVal);
    });
  }

  // 5. Section Adder Triggers (from library grid)
  const addButtons = document.querySelectorAll('.component-add-btn');
  addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const compId = btn.getAttribute('data-component');
      addCanvasSection(compId);
    });
  });

  const cardClickables = document.querySelectorAll('.component-card');
  cardClickables.forEach(card => {
    card.addEventListener('click', () => {
      const btn = card.querySelector('.component-add-btn');
      if (btn) {
        const compId = btn.getAttribute('data-component');
        addCanvasSection(compId);
      }
    });
  });

  // 6. Device Viewport Toggles
  const deviceBtns = document.querySelectorAll('.device-btn');
  const viewportWrapper = document.getElementById('viewport-wrapper');
  deviceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      deviceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const device = btn.getAttribute('data-device');
      viewportWrapper.className = `preview-wrapper ${device}`;
    });
  });

  // 7. Global Header Action Controls
  const clearBtn = document.getElementById('clear-canvas-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all layout sections from the canvas?')) {
        AppState.activeSections = [];
        renderCanvas();
        updateLayoutList();
      }
    });
  }

  // 8. ZIP Download Trigger
  const downloadBtn = document.getElementById('download-zip-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      Exporter.downloadProductionZip(AppState);
    });
  }

  // 9. Code Viewer Drawer Toggler
  const toggleCodeBtn = document.getElementById('toggle-code-drawer');
  const codeDrawer = document.getElementById('code-drawer');
  if (toggleCodeBtn && codeDrawer) {
    toggleCodeBtn.addEventListener('click', () => {
      const isOpen = codeDrawer.classList.toggle('open');
      toggleCodeBtn.textContent = isOpen ? '✕ Collapse Workspace Code' : '🖨️ View Compiled Code';
      if (isOpen) {
        updateCodeViewers();
      }
    });
  }

  // Code Tab switching
  const codeTabs = document.querySelectorAll('.code-tab');
  codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      codeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      const format = tab.getAttribute('data-format');
      document.querySelectorAll('.code-container').forEach(c => c.style.display = 'none');
      document.getElementById(`code-viewer-${format}`).style.display = 'block';
    });
  });

  // Copy code utility
  const copyBtn = document.getElementById('copy-code-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const activeTab = document.querySelector('.code-tab.active');
      const format = activeTab ? activeTab.getAttribute('data-format') : 'html';
      const codeNode = document.getElementById(`code-viewer-${format}`);
      
      if (codeNode) {
        navigator.clipboard.writeText(codeNode.textContent)
          .then(() => {
            const origText = copyBtn.innerHTML;
            copyBtn.innerHTML = '✓ Copied Packet!';
            setTimeout(() => copyBtn.innerHTML = origText, 2000);
          })
          .catch(err => alert('Failed to execute clipboard copy sequence: ' + err));
      }
    });
  }
}

// Helpers: Data Sync Connectors
function setupStateInputListener(elemId, stateKey, parser = null, isStyleTrigger = false) {
  const elem = document.getElementById(elemId);
  if (!elem) return;

  // Sync initial state value to element
  if (elem.type === 'number') {
    elem.value = AppState[stateKey];
  } else {
    elem.value = AppState[stateKey];
  }

  elem.addEventListener('input', (e) => {
    let val = e.target.value;
    if (parser) val = parser(val);
    AppState[stateKey] = val;

    if (isStyleTrigger) {
      updateIframeStyles();
    }
    updateCodeViewers();
  });
}

function setupColorPicker(colorId, stateKey) {
  const wrapper = document.getElementById(`${colorId}-wrapper`);
  if (!wrapper) return;

  const picker = wrapper.querySelector('.color-picker');
  const hexText = wrapper.querySelector('.color-hex-text');
  
  if (picker && hexText) {
    // Sync initial state values
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

// Loads structural presets and theme configurations into memory
function loadTemplatePreset(presetId) {
  const template = WebTemplates[presetId];
  if (!template) return;

  AppState.selectedPresetId = presetId;
  
  // Load standard themes or fallback to specific industry matrix values if relevant
  if (template.industry && IndustryFallbacks[template.industry]) {
    const fallback = IndustryFallbacks[template.industry];
    AppState.themePrimary = fallback.primary;
    AppState.themeAccent = fallback.accent;
    AppState.themeSecondary = fallback.secondary;
    AppState.themeBg = fallback.bg;
  } else {
    AppState.themePrimary = template.theme.primary;
    AppState.themeAccent = template.theme.accent;
    AppState.themeSecondary = template.theme.secondary;
    AppState.themeBg = template.theme.bg;
  }

  AppState.containerWidth = parseInt(template.theme.container);
  AppState.borderRadius = parseInt(template.theme.radius);
  AppState.fontFamily = template.theme.font;

  // Re-sync visual UI inputs
  updateFormControlsFromState();

  // Load layout matrix arrangement
  AppState.activeSections = template.sections.map(sectionId => ({
    id: generateUUID(),
    componentId: sectionId
  }));

  renderCanvas();
  updateLayoutList();
}

function updateFormControlsFromState() {
  const setInputValue = (id, val) => {
    const elem = document.getElementById(id);
    if (elem) elem.value = val;
  };

  const syncColor = (colorId, val) => {
    const wrapper = document.getElementById(`${colorId}-wrapper`);
    if (wrapper) {
      const picker = wrapper.querySelector('.color-picker');
      const hexText = wrapper.querySelector('.color-hex-text');
      if (picker) picker.value = val;
      if (hexText) hexText.textContent = val;
    }
  };

  setInputValue('container-width', AppState.containerWidth);
  setInputValue('border-radius', AppState.borderRadius);
  setInputValue('font-family', AppState.fontFamily);
  
  syncColor('color-primary', AppState.themePrimary);
  syncColor('color-secondary', AppState.themeSecondary);
  syncColor('color-accent', AppState.themeAccent);
  syncColor('color-bg', AppState.themeBg);
}

// Brand scanning simulator using client URLs
function simulateBrandScan(url) {
  const scanBtn = document.getElementById('brand-scan-btn');
  const origText = scanBtn.textContent;
  scanBtn.disabled = true;
  scanBtn.textContent = '⚡ Parsing Brand Vectors...';

  // Extract simulated hostname to use for mock algorithm hashes
  let domain = 'factory';
  try {
    const parsed = new URL(url.includes('://') ? url : 'http://' + url);
    domain = parsed.hostname.replace('www.', '');
  } catch (e) {}

  setTimeout(() => {
    // Determine a fallback industry matching domain patterns, or create high-quality hashes
    let generatedTheme;

    if (domain.includes('clinic') || domain.includes('dental') || domain.includes('health') || domain.includes('med')) {
      generatedTheme = IndustryFallbacks.medical;
      AppState.selectedPresetId = 'medical';
      document.getElementById('preset-selector').value = 'medical';
    } else if (domain.includes('construct') || domain.includes('roof') || domain.includes('build')) {
      generatedTheme = IndustryFallbacks.construction;
      AppState.selectedPresetId = 'construction';
      document.getElementById('preset-selector').value = 'construction';
    } else if (domain.includes('law') || domain.includes('legal') || domain.includes('partner') || domain.includes('tax')) {
      generatedTheme = IndustryFallbacks.legal;
      AppState.selectedPresetId = 'legal';
      document.getElementById('preset-selector').value = 'legal';
    } else if (domain.includes('fit') || domain.includes('gym') || domain.includes('crossfit') || domain.includes('sport')) {
      generatedTheme = IndustryFallbacks.fitness;
      AppState.selectedPresetId = 'fitness';
      document.getElementById('preset-selector').value = 'fitness';
    } else {
      // Standard SaaS default styling mapping
      generatedTheme = {
        primary: '#7c3aed', // Classic Violet
        secondary: '#db2777', // Magenta
        accent: '#0284c7', // Sky Accent
        bg: '#0b0f19'
      };
      AppState.selectedPresetId = 'saas';
      document.getElementById('preset-selector').value = 'saas';
    }

    AppState.themePrimary = generatedTheme.primary;
    AppState.themeAccent = generatedTheme.accent;
    AppState.themeSecondary = generatedTheme.secondary;
    AppState.themeBg = generatedTheme.bg;

    updateFormControlsFromState();
    updateIframeStyles();
    updateCodeViewers();

    scanBtn.disabled = false;
    scanBtn.textContent = '✓ Scan Finished!';
    setTimeout(() => scanBtn.textContent = origText, 2500);

    alert(`Successfully completed client Brand Scan for "${domain}"!\nDominant colors extracted. Applied presets corresponding to category.`);
  }, 1800);
}

// Visual layout matrix builder controls
function addCanvasSection(compId) {
  AppState.activeSections.push({
    id: generateUUID(),
    componentId: compId
  });
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

  // Swap locations in the tracking matrix
  const temp = AppState.activeSections[index];
  AppState.activeSections[index] = AppState.activeSections[targetIndex];
  AppState.activeSections[targetIndex] = temp;

  renderCanvas();
  updateLayoutList();
}

function cloneSection(id) {
  const index = AppState.activeSections.findIndex(s => s.id === id);
  if (index === -1) return;

  const clone = {
    id: generateUUID(),
    componentId: AppState.activeSections[index].componentId
  };

  AppState.activeSections.splice(index + 1, 0, clone);
  renderCanvas();
  updateLayoutList();
}

// --------------------------------------------------------------------------
// Visual Canvas Render Execution Loop (Dynamic Iframe injection)
// --------------------------------------------------------------------------
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

  // Package index.html content natively
  const compiled = Exporter.compileWorkspace(AppState);

  // To prevent the full page flickering that breaks high-fidelity customization flow:
  // We can write the initial structure directly using document.write,
  // but only when we change sections structure. If it is already loaded, 
  // we do NOT reload the document, we just perform state style overrides!
  const currentStructureSignature = AppState.activeSections.map(s => s.componentId).join(',');
  const loadedSignature = iframe.getAttribute('data-structure-sig');

  if (currentStructureSignature !== loadedSignature) {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(compiled.html);
    iframeDoc.close();

    // Inject temporary styles immediately
    iframe.setAttribute('data-structure-sig', currentStructureSignature);
    
    // Wire up events inside the preview canvas if needed (scrolling behaviors)
    iframe.onload = () => {
      updateIframeStyles();
    };
  }

  // Update layout styles via the Bridge to avoid flashes
  updateIframeStyles();
  updateCodeViewers();
}

// Dynamic CSS Bridge directly modifying iframe root elements
function updateIframeStyles() {
  const iframe = document.getElementById('preview-iframe');
  if (!iframe) return;

  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  if (!iframeDoc || !iframeDoc.documentElement) return;

  const root = iframeDoc.documentElement;
  
  // Set properties on root element dynamically without any visual flicker
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
  
  // Force re-scoping and style repaint checks
  const body = iframeDoc.body;
  if (body) {
    body.style.backgroundColor = AppState.themeBg;
  }
}

// Update layouts listing on the right panel
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

  // Make controller methods globally accessible for HTML button anchor actions
  window.moveSection = moveSection;
  window.cloneSection = cloneSection;
  window.removeCanvasSection = removeCanvasSection;
}

// Update syntax elements in code drawers
function updateCodeViewers() {
  const codeDrawer = document.getElementById('code-drawer');
  if (!codeDrawer || !codeDrawer.classList.contains('open')) return;

  const { html, css } = Exporter.compileWorkspace(AppState);

  const htmlNode = document.getElementById('code-viewer-html');
  const cssNode = document.getElementById('code-viewer-css');

  if (htmlNode) htmlNode.textContent = html;
  if (cssNode) cssNode.textContent = css;
}

// Helper: UUID Generator for structural tracking
function generateUUID() {
  return 'sect-xxxx-4xxx-yxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
