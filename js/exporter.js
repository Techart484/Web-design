// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — Workspace Exporter
// Produces a self-contained {html, css} snapshot from the current
// workspace state. Works in the browser (window.Exporter) and in
// Node (module.exports) so it can be required by tooling/lint.
// ============================================================

(function (root, factory) {
  const mod = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = mod;            // Node / lint
  } else {
    root.Exporter = mod.Exporter;    // Browser global
  }
})(typeof self !== 'undefined' ? self : this, function () {

  const Exporter = {
    /**
     * Compile a standalone landing page from the workspace state.
     * @param {object} state - AppState-like object (theme + identity)
     * @returns {{html: string, css: string}}
     */
    compileWorkspace(state = {}) {
      const s = {
        businessName: state.businessName || state.clientUrl || 'Your Business',
        usp: state.usp || 'A modern, premium web presence built to convert.',
        primary: state.themePrimary || '#27406E',
        accent: state.themeAccent || '#C8A24B',
        bg: state.themeBg || '#0B0C10',
        text: state.themeText || '#F5F2EA',
        font: state.fontFamily || 'Inter'
      };

      const css = Exporter.baseCss();
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(s.businessName)}</title>
  <meta name="description" content="${escapeHtml(s.usp)}">
  <link rel="stylesheet" href="css/styles.css">
  <style>
    :root {
      --bg:${s.bg}; --primary:${s.primary}; --accent:${s.accent};
      --text:${s.text}; --font:'${s.font}', system-ui, sans-serif;
    }
  </style>
</head>
<body>
  <header class="x-nav"><strong>${escapeHtml(s.businessName)}</strong>
    <a class="x-btn" href="#contact">Get in touch</a>
  </header>
  <main class="x-hero">
    <h1>${escapeHtml(s.businessName)}</h1>
    <p>${escapeHtml(s.usp)}</p>
    <a class="x-btn" href="#contact">Book a consultation</a>
  </main>
  <footer class="x-footer">&copy; ${new Date().getFullYear()} ${escapeHtml(s.businessName)}</footer>
</body>
</html>`;

      return { html, css };
    },

    baseCss() {
      return `*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font);line-height:1.6}
.x-nav{display:flex;justify-content:space-between;align-items:center;padding:20px 28px}
.x-hero{max-width:760px;margin:0 auto;padding:120px 28px;text-align:center}
.x-hero h1{font-size:clamp(40px,6vw,72px);margin:0 0 18px}
.x-btn{display:inline-block;background:var(--accent);color:#0a0a0a;padding:13px 24px;border-radius:12px;font-weight:600;text-decoration:none}
.x-footer{padding:40px 28px;text-align:center;opacity:.6}
@media(max-width:600px){.x-hero{padding:80px 20px}}`;
    }
  };

  // Convenience top-level fields so tooling can `const {html, css} = require(...)`.
  const sample = Exporter.compileWorkspace();

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  return { Exporter, html: sample.html, css: sample.css };
});
