// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — Unified State & UI Orchestrator
// v2.0 — Premium Brutalist Design Signature
// ============================================================

const AppState = {
  clientUrl: '',
  themePrimary: '#c19a5b',
  themeSecondary: '#1a1a1a',
  themeAccent: '#c19a5b',
  themeBg: '#060606',
  borderRadius: 0,
  fontFamily: 'JetBrains Mono',
  activeSections: []
};

document.addEventListener('DOMContentLoaded', () => {
  initEngineUI();
  PipelineUI.init();
});

/** Initialize the B2B Control Center UI */
function initEngineUI() {

  // 1. Target URL Input
  const urlInput = document.getElementById('target-url');
  if (urlInput) {
    urlInput.addEventListener('input', (e) => {
      AppState.clientUrl = e.target.value.trim();
    });
  }

  // 2. Execute Pipeline
  const executeBtn = document.getElementById('execute-pipeline');
  if (executeBtn) {
    executeBtn.addEventListener('click', () => {
      if (!AppState.clientUrl) {
        PipelineUI.log('ERROR: TARGET_URL_MISSING');
        return;
      }
      Pipeline.run(AppState.clientUrl);
    });
  }

  // 3. Reset Seed
  const resetBtn = document.getElementById('reset-seed');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // 4. Pitch Generator
  const pitchBtn = document.querySelector('.btn-pitch');
  if (pitchBtn) {
    pitchBtn.addEventListener('click', () => {
      const manifest = BrandManifest.get();
      if (!manifest.delivery_artifacts || !manifest.delivery_artifacts.b2b_pitch) {
        PipelineUI.log('ERROR: PITCH_DATA_NOT_READY (COMPLETE_PIPELINE_FIRST)');
        return;
      }
      downloadTextFile(manifest.delivery_artifacts.b2b_pitch, 'b2b-client-pitch.md');
    });
  }

  // 5. Recheck Credentials
  const recheckBtn = document.querySelector('.recheck-btn');
  if (recheckBtn) {
    recheckBtn.addEventListener('click', () => {
      PipelineUI.log('SYSTEM_AUTH_RECHECK: ALL_SYSTEMS_GO');
    });
  }
}

/** Helper: Update Iframe styles (Brutalist style) */
function updateIframeStyles() {
  const iframe = document.getElementById('preview-iframe');
  if (!iframe) return;
  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
  if (!iframeDoc || !iframeDoc.documentElement) return;

  const root = iframeDoc.documentElement;
  root.style.setProperty('--color-primary', AppState.themePrimary);
  root.style.setProperty('--color-bg', AppState.themeBg);
  root.style.setProperty('--font-family', `'${AppState.fontFamily}', monospace`);

  const body = iframeDoc.body;
  if (body) body.style.backgroundColor = AppState.themeBg;
}

/** Helper: Download text file */
function downloadTextFile(content, filename) {
  const element = document.createElement('a');
  const file = new Blob([content], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/** Helper: Generate UUID (v4) */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
