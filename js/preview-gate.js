// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — Client Preview Gating (frontend)
// Drives POST /api/preview/generate and renders the gated preview:
// client URL -> full pipeline -> watermarked /preview/:id + payment CTA.
// ============================================================

const PreviewGate = {
  init() {
    this.btn = document.getElementById('gate-generate');
    this.status = document.getElementById('gate-status');
    this.result = document.getElementById('gate-result');
    this.iframe = document.getElementById('gate-iframe');
    if (!this.btn) return;
    this.btn.addEventListener('click', () => this.generate());
  },

  setStatus(msg) { if (this.status) this.status.textContent = `// ${msg}`; },

  async generate() {
    const url = (document.getElementById('gate-url').value || '').trim();
    const industry = document.getElementById('gate-niche').value;
    const businessName = (document.getElementById('gate-business').value || '').trim();

    if (!url) { this.setStatus('A CLIENT URL IS REQUIRED'); return; }

    this.btn.disabled = true;
    this.setStatus('GENERATING REDESIGN — EXTRACT → ANALYZE → BUILD → POLISH → CRITIQUE...');

    try {
      const res = await fetch('/api/preview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, industry, business_name: businessName })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error((data && (data.details || data.error)) || 'Generation failed');

      const chip = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
      chip('gate-chip-niche', `NICHE: ${String(data.niche_label || data.niche).toUpperCase()}`);
      chip('gate-chip-score', `AUDIT: ${data.auditScore != null ? data.auditScore + '/100' : 'N/A'}`);
      chip('gate-chip-pages', `PAGES: ${(data.pages || []).length}`);

      const previewUrl = data.previewUrl;
      document.getElementById('gate-open').href = previewUrl;
      document.getElementById('gate-checkout').href = previewUrl + 'checkout.html';

      this.result.hidden = false;
      this.iframe.src = previewUrl;
      this.setStatus(`GATED PREVIEW LIVE → ${previewUrl} (watermark + payment CTA active)`);
    } catch (err) {
      this.setStatus(`PREVIEW FAILED: ${String(err.message || err).toUpperCase()}`);
    } finally {
      this.btn.disabled = false;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => PreviewGate.init());
