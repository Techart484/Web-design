const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const JSZip = require('jszip');
const preview = require('./scripts/preview');

const app = express();
const PORT = 8000;
const ROOT = __dirname;

app.use(cors());
app.use(express.json());

// Security: Only serve allowed directories
app.use('/css', express.static(path.join(ROOT, 'css')));
app.use('/js', express.static(path.join(ROOT, 'js')));
app.use('/dist', express.static(path.join(ROOT, 'dist')));
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

/** Helper for executing scripts with promise */
function runScript(cmd, args, env = process.env) {
  let finalCmd = cmd;
  if (cmd === 'python3' && process.platform === 'win32') {
    finalCmd = 'python';
  }

  return new Promise((resolve, reject) => {
    execFile(finalCmd, args, { env }, (err, stdout, stderr) => {
      // We resolve even on stderr as long as there is stdout,
      // but reject on actual execution errors.
      if (err && !stdout) {
        reject({ err, stderr, stdout });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/** Robustly extract JSON from script output */
function extractJson(stdout) {
  const lines = stdout.trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        return JSON.parse(line);
      } catch (e) { /* continue */ }
    }
  }
  return null;
}

/**
 * Centralized Pipeline Controller
 */
app.post('/api/pipeline/stage/:id', async (req, res) => {
  const stageId = parseInt(req.params.id);
  const { url, industry } = req.body;

  if (!url && stageId <= 3) {
    return res.status(400).json({ error: 'URL is required for initial stages' });
  }

  try {
    // Collect API keys from headers or body
    const apiKeys = {
      FIRECRAWL_API_KEY: req.body.firecrawl_key || process.env.FIRECRAWL_API_KEY || '',
      GEMINI_API_KEY: req.body.gemini_key || process.env.GEMINI_API_KEY || '',
      GITHUB_TOKEN: req.body.github_token || process.env.GITHUB_TOKEN || ''
    };

    const env = { ...process.env, ...apiKeys };

    switch (stageId) {
      case 1: { // Brand Extraction
        console.log(`[*] Stage 1: Extraction for ${url}`);
        const { stdout } = await runScript('python3', ['scripts/extract_brand.py', url], env);
        const data = extractJson(stdout);
        if (!data) throw new Error('Failed to extract brand data from script output.');
        return res.json({ success: true, data: data, logs: stdout });
      }

      case 2: { // Competitor Analysis
        console.log(`[*] Stage 2: Competitor Analysis for ${url}`);
        const { stdout } = await runScript('node', ['scripts/analyze_competitors.js', url, industry || 'default'], env);
        const data = extractJson(stdout);
        if (!data) throw new Error('Failed to extract competitor analysis from script output.');
        return res.json({ success: true, data: data, logs: stdout });
      }

      case 3: { // Site Generation
        console.log(`[*] Stage 3: Site Generation for ${url}`);
        const brandPath = path.join(ROOT, 'brand_colors.json');
        if (!fs.existsSync(brandPath)) throw new Error('Brand data missing. Run Stage 1 first.');

        const brandData = JSON.parse(fs.readFileSync(brandPath, 'utf8'));
        const businessName = brandData.brand_entities?.name || brandData.niche_label || 'Your Business';
        const domain = (url || '').replace(/^https?:\/\//, '').split('/')[0] || 'domain.com';
        const genEnv = {
          ...process.env,
          BUSINESS_NAME: businessName,
          USP: brandData.brand_entities?.usp || '',
          CONTACT_EMAIL: req.body.contact_email || ('hello@' + domain),
          FORMSPREE_HASH: req.body.formspree_hash || ''
        };

        // generate.js ships the self-contained production stylesheet itself.
        const { stdout: genStdout } = await runScript('node', ['scripts/generate.js'], genEnv);

        return res.json({ success: true, previewUrl: '/dist/index.html', logs: genStdout });
      }

      case 4: { // Visual Polish
        console.log(`[*] Stage 4: Visual Polish`);
        const { stdout } = await runScript('node', ['scripts/polish.js']);
        const data = extractJson(stdout);
        if (!data) throw new Error('Failed to extract polish data from script output.');
        return res.json({ success: true, data, logs: stdout });
      }

      case 5: { // Self-Fixing Critique
        console.log(`[*] Stage 5: Critique`);
        const { stdout } = await runScript('node', ['scripts/critique.js']);
        const data = extractJson(stdout);
        if (!data) throw new Error('Failed to extract critique data from script output.');
        return res.json({ success: true, data, logs: stdout });
      }

      case 6: { // Final Validation & Delivery Bundle
        console.log(`[*] Stage 6: Packaging Delivery Bundle`);
        const zip = new JSZip();
        const distPath = path.join(ROOT, 'dist');

        if (!fs.existsSync(distPath)) throw new Error('Build artifacts missing. Run Stage 3 first.');

        const files = fs.readdirSync(distPath);
        files.forEach(file => {
          const content = fs.readFileSync(path.join(distPath, file));
          zip.file(file, content);
        });

        const buffer = await zip.generateAsync({ type: 'nodebuffer' });
        const bundlePath = path.join(ROOT, 'delivery_bundle.zip');
        fs.writeFileSync(bundlePath, buffer);

        return res.json({
          success: true,
          bundleUrl: '/api/download/bundle',
          message: 'Delivery bundle generated successfully.'
        });
      }

      default:
        return res.json({ success: true, message: `Stage ${stageId} completed (logic-only).` });
    }
  } catch (error) {
    console.error(`[Stage ${stageId} Error]`, error.stderr || error.message);
    res.status(500).json({
      error: `Stage ${stageId} failed`,
      details: error.stderr || error.message,
      logs: error.stdout || ''
    });
  }
});

/** Download Delivery Bundle */
app.get('/api/download/bundle', (req, res) => {
  const bundlePath = path.join(ROOT, 'delivery_bundle.zip');
  if (fs.existsSync(bundlePath)) {
    res.download(bundlePath, 'autonomous_design_delivery.zip');
  } else {
    res.status(404).send('Bundle not found');
  }
});

/* ============================================================
 * PREVIEW GATING SYSTEM (B2B upsell on a client's existing site)
 * URL -> full pipeline -> gated /preview/:id with watermark + payment CTA
 * ============================================================ */

/** Generate a gated preview from a client's current URL. */
app.post('/api/preview/generate', async (req, res) => {
  const { url, industry, business_name, contact_email, formspree_hash } = req.body;
  if (!url) return res.status(400).json({ error: 'A client URL is required.' });

  try {
    console.log(`[*] Preview: generating redesign for ${url}`);
    const meta = await preview.generatePreview({
      url,
      industry,
      businessName: business_name,
      contactEmail: contact_email,
      formspreeHash: formspree_hash
    });
    return res.json({
      success: true,
      previewId: meta.id,
      previewUrl: `/preview/${meta.id}/`,
      niche: meta.niche,
      niche_label: meta.niche_label,
      business: meta.business,
      auditScore: meta.audit_score,
      pages: meta.pages,
      features: meta.features,
      logs: meta.logs
    });
  } catch (error) {
    console.error('[Preview Error]', error.stderr || error.message);
    return res.status(500).json({ error: 'Preview generation failed', details: error.stderr || error.message, logs: error.stdout || '' });
  }
});

/** List all generated previews (control-center registry). */
app.get('/api/previews', (req, res) => {
  res.json({ success: true, previews: preview.listPreviews() });
});

/** Shared handler: serve a gated preview file (HTML watermarked + CTA; assets). */
function servePreviewFile(req, res) {
  const { id } = req.params;
  const meta = preview.getPreviewMeta(id);
  if (!meta) return res.status(404).send('Preview not found or expired.');

  const file = req.params.file && req.params.file.length ? req.params.file : 'index.html';
  const base = `/preview/${preview.sanitizeId(id)}/`;

  // Server-rendered checkout (demo monetization step)
  if (file === 'checkout.html') {
    const html = preview.renderCheckout(meta, { paymentLink: process.env.PAYMENT_LINK || '' });
    return res.type('html').send(preview.withBase(html, base));
  }

  const full = preview.resolvePreviewFile(id, file);
  if (!full || !fs.existsSync(full)) return res.status(404).send('Preview asset not found.');

  if (full.endsWith('.html')) {
    const cookie = req.headers.cookie || '';
    const cookieUnlocked = cookie.split(';').some((c) => c.trim() === `wf_unlock_${id}=${meta.unlock_token}`);
    const queryUnlocked = String(req.query.unlock || '') === meta.unlock_token;
    const unlocked = queryUnlocked || cookieUnlocked;
    // Persist the unlock across in-site navigation once "paid".
    if (queryUnlocked && !cookieUnlocked) {
      res.setHeader('Set-Cookie', `wf_unlock_${id}=${meta.unlock_token}; Path=${base}; HttpOnly; SameSite=Lax`);
    }
    let html = fs.readFileSync(full, 'utf8');
    html = preview.withBase(html, base);
    return res.type('html').send(preview.injectGate(html, meta, { unlocked }));
  }

  return res.sendFile(full);
}

/** Serve gated preview files. Two routes cover the site root and named files. */
app.get('/preview/:id', servePreviewFile);
app.get('/preview/:id/:file', servePreviewFile);

/** System Health Check */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    scripts: {
      extract: fs.existsSync(path.join(ROOT, 'scripts/extract_brand.py')),
      generate: fs.existsSync(path.join(ROOT, 'scripts/generate.js')),
      analyze: fs.existsSync(path.join(ROOT, 'scripts/analyze_competitors.js'))
    }
  });
});

app.listen(PORT, () => {
  console.log(`[🚀] Autonomous Web Designer Engine Backend live at http://localhost:${PORT}`);
});
