#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Preview Gating System (v1.0)
 *
 * B2B flow: take a prospective client's CURRENT website URL, run the full
 * extract → analyze → generate → polish → critique pipeline into an isolated
 * per-client directory, then serve the redesigned multi-page site at a unique
 * preview URL that is GATED with:
 *   - a non-intrusive diagonal "PREVIEW" watermark overlay, and
 *   - a sticky payment call-to-action bar that routes to a checkout page
 *     priced from the niche's monetization tier.
 *
 * "Paying" (demo) unlocks a clean, watermark-free version via a per-preview
 * unlock token, simulating the post-checkout handoff. A real processor can be
 * wired in by setting PAYMENT_LINK.
 *
 * This module is dependency-light (Node stdlib only) and is consumed by
 * server.js. Each helper is also independently testable.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFile } = require('child_process');

const ENGINE_ROOT = path.resolve(__dirname, '..');
const PREVIEWS_DIR = path.join(ENGINE_ROOT, 'previews');

const NICHES = JSON.parse(
  fs.readFileSync(path.join(ENGINE_ROOT, 'config', 'niches.json'), 'utf8')
).niches;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function slugFromUrl(url) {
  const host = String(url || 'client')
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/[^a-z0-9.-]/gi, '')
    .replace(/\./g, '-')
    .toLowerCase();
  return host || 'client';
}

/** Promise wrapper around execFile, resolving on output even with stderr. */
function runScript(cmd, args, env) {
  let finalCmd = cmd;
  if (cmd === 'python3' && process.platform === 'win32') finalCmd = 'python';
  return new Promise((resolve, reject) => {
    execFile(finalCmd, args, { cwd: ENGINE_ROOT, env }, (err, stdout, stderr) => {
      if (err && !stdout) reject({ err, stderr, stdout });
      else resolve({ stdout, stderr });
    });
  });
}

function extractJson(stdout) {
  const lines = String(stdout).trim().split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('{') && line.endsWith('}')) {
      try { return JSON.parse(line); } catch (_) { /* keep scanning */ }
    }
  }
  return null;
}

/**
 * Run the full pipeline for a client URL into previews/<id>/ and register it.
 * @returns {Promise<object>} preview metadata
 */
async function generatePreview(opts = {}) {
  const { url = '', industry = '', businessName = '', contactEmail = '', formspreeHash = '' } = opts;

  ensureDir(PREVIEWS_DIR);
  const id = `${slugFromUrl(url)}-${crypto.randomBytes(3).toString('hex')}`;
  const outDir = path.join(PREVIEWS_DIR, id);
  ensureDir(outDir);

  const baseEnv = { ...process.env };
  const logs = [];

  // Stage 1 — Brand extraction (writes brand_colors.json at engine root).
  // Pass the business name so niche detection works even when the target URL
  // is unreachable (no HTML) and the cuisine/industry is only in the name.
  const extractArgs = ['scripts/extract_brand.py', url];
  if (industry) extractArgs.push(industry);
  const extractEnv = { ...baseEnv, BUSINESS_NAME: businessName || '' };
  const { stdout: brandOut } = await runScript('python3', extractArgs, extractEnv);
  logs.push(brandOut.trim());
  const brand = extractJson(brandOut) || {};
  const niche = brand.niche || brand.detected_industry || 'medical';

  // Stage 2 — Competitor analysis (writes competitor_analysis.json)
  try {
    const { stdout: compOut } = await runScript(
      'node', ['scripts/analyze_competitors.js', url, industry || niche], baseEnv
    );
    logs.push(compOut.trim());
  } catch (e) {
    logs.push('[!] Competitor analysis fell back to niche defaults.');
  }

  // Stage 3 — Multi-page generation into the isolated preview directory
  const domain = slugFromUrl(url);
  const genEnv = {
    ...baseEnv,
    OUT_DIR: outDir,
    BUSINESS_NAME: businessName || brand.brand_entities?.name || '',
    USP: brand.brand_entities?.usp || '',
    CONTACT_EMAIL: contactEmail || `hello@${domain.replace(/-/g, '.')}`,
    FORMSPREE_HASH: formspreeHash || ''
  };
  const { stdout: genOut } = await runScript('node', ['scripts/generate.js'], genEnv);
  logs.push(genOut.trim());

  // Stage 4 + 5 — Polish & critique the preview directory
  const stageEnv = { ...baseEnv, OUT_DIR: outDir };
  await runScript('node', ['scripts/polish.js'], stageEnv).catch(() => {});
  let audit = {};
  try {
    const { stdout: critOut } = await runScript('node', ['scripts/critique.js'], stageEnv);
    audit = extractJson(critOut) || {};
  } catch (_) { /* non-fatal */ }

  const buildManifest = readJson(path.join(outDir, 'build-manifest.json')) || {};

  const meta = {
    id,
    url,
    niche,
    niche_label: buildManifest.niche_label || (NICHES[niche] && NICHES[niche].label) || niche,
    business: buildManifest.business_name || businessName || '',
    created: new Date().toISOString(),
    unlock_token: crypto.randomBytes(8).toString('hex'),
    pages: (buildManifest.pages || []).map((p) => p.file),
    audit_score: audit.audit_score != null ? audit.audit_score : null,
    features: buildManifest.features || {}
  };
  writeJson(path.join(outDir, 'preview-meta.json'), meta);

  return { ...meta, logs: logs.join('\n') };
}

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; }
}
function writeJson(p, obj) { fs.writeFileSync(p, JSON.stringify(obj, null, 2)); }

function getPreviewMeta(id) {
  return readJson(path.join(PREVIEWS_DIR, sanitizeId(id), 'preview-meta.json'));
}

function listPreviews() {
  if (!fs.existsSync(PREVIEWS_DIR)) return [];
  return fs.readdirSync(PREVIEWS_DIR)
    .map((id) => getPreviewMeta(id))
    .filter(Boolean)
    .sort((a, b) => String(b.created).localeCompare(String(a.created)));
}

function sanitizeId(id) {
  return String(id).replace(/[^a-z0-9.-]/gi, '');
}

/** Resolve a requested file safely inside a preview directory. */
function resolvePreviewFile(id, relPath) {
  const dir = path.join(PREVIEWS_DIR, sanitizeId(id));
  const clean = path.normalize(relPath || 'index.html').replace(/^(\.\.[/\\])+/, '');
  const full = path.join(dir, clean);
  if (!full.startsWith(dir)) return null; // path traversal guard
  return full;
}

/**
 * Inject the watermark overlay + payment CTA bar into a preview HTML page.
 * Skipped when `unlocked` (post-checkout clean handoff).
 */
function injectGate(html, meta, { unlocked = false } = {}) {
  if (unlocked) return html;

  const tier = (NICHES[meta.niche] && NICHES[meta.niche].pricing) || { upfront: 4800, monthly: 600, plan_name: 'Modernization Plan' };
  const upfront = Number(tier.upfront).toLocaleString();
  const monthly = Number(tier.monthly).toLocaleString();
  const checkoutUrl = `checkout.html`;

  const gate = `
<!-- WEBIFY_PREVIEW_GATE -->
<style>
  .webify-watermark{position:fixed;inset:0;z-index:2147483000;pointer-events:none;
    background-image:repeating-linear-gradient(-45deg,rgba(0,0,0,0) 0,rgba(0,0,0,0) 180px,
      rgba(255,255,255,0.02) 180px,rgba(255,255,255,0.02) 360px);}
  .webify-watermark span{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-24deg);
    font:800 clamp(40px,9vw,120px)/1 system-ui,sans-serif;letter-spacing:.12em;
    color:rgba(255,255,255,0.06);white-space:nowrap;text-transform:uppercase;}
  .webify-gate{position:fixed;left:0;right:0;bottom:0;z-index:2147483600;
    display:flex;gap:18px;align-items:center;justify-content:space-between;flex-wrap:wrap;
    padding:14px clamp(16px,4vw,40px);background:rgba(10,10,12,0.92);
    backdrop-filter:blur(10px);border-top:1px solid rgba(255,255,255,0.12);
    font-family:system-ui,-apple-system,sans-serif;color:#f5f2ea;}
  .webify-gate .wg-copy{font-size:14px;line-height:1.4;max-width:60ch;}
  .webify-gate .wg-copy strong{color:#E0A458;}
  .webify-gate .wg-actions{display:flex;gap:10px;align-items:center;}
  .webify-gate .wg-btn{display:inline-flex;align-items:center;gap:8px;cursor:pointer;
    text-decoration:none;font-weight:700;font-size:14px;padding:11px 20px;border-radius:10px;
    background:#E0A458;color:#1a120b;border:1px solid transparent;white-space:nowrap;}
  .webify-gate .wg-btn.ghost{background:transparent;color:#f5f2ea;border-color:rgba(255,255,255,0.25);}
  .webify-badge{position:fixed;top:14px;right:14px;z-index:2147483600;
    font:700 11px/1 system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;
    padding:8px 12px;border-radius:999px;background:rgba(224,164,88,0.16);color:#E0A458;
    border:1px solid rgba(224,164,88,0.4);}
  body{padding-bottom:84px;}
</style>
<div class="webify-watermark" aria-hidden="true"><span>Preview</span></div>
<div class="webify-badge">Webify Preview</div>
<div class="webify-gate" role="region" aria-label="Preview upgrade">
  <div class="wg-copy">
    This is a free redesign preview of <strong>${escapeHtml(meta.business || meta.url || 'your site')}</strong>,
    rebuilt by Webify. Launch the live, watermark-free site for
    <strong>$${upfront}</strong> upfront + <strong>$${monthly}/mo</strong> upkeep.
  </div>
  <div class="wg-actions">
    <a class="wg-btn ghost" href="index.html">Tour the preview</a>
    <a class="wg-btn" href="${checkoutUrl}">Unlock &amp; Launch →</a>
  </div>
</div>
<!-- /WEBIFY_PREVIEW_GATE -->
`;

  return html.includes('</body>') ? html.replace('</body>', `${gate}\n</body>`) : html + gate;
}

/** Server-rendered checkout page for a preview (demo monetization step). */
function renderCheckout(meta, { paymentLink = '' } = {}) {
  const niche = NICHES[meta.niche] || {};
  const tier = niche.pricing || { upfront: 4800, monthly: 600, plan_name: 'Modernization Plan', deliverables: [] };
  const upfront = Number(tier.upfront).toLocaleString();
  const monthly = Number(tier.monthly).toLocaleString();
  const deliverables = (tier.deliverables || []).map((d) => `<li>${escapeHtml(d)}</li>`).join('');
  // Demo: "completing payment" unlocks the clean site via the unlock token.
  const payHref = paymentLink || `index.html?unlock=${meta.unlock_token}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Unlock ${escapeHtml(meta.business || 'your site')} | Webify</title>
<style>
  :root{--bg:#0b0b0d;--surface:#15151a;--accent:#E0A458;--text:#f5f2ea;--muted:#a7a192;--line:rgba(255,255,255,.1);}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);
    font-family:system-ui,-apple-system,sans-serif;line-height:1.6;}
  .wrap{max-width:720px;margin:0 auto;padding:64px 24px;}
  .eyebrow{display:inline-block;font-size:12px;letter-spacing:.18em;text-transform:uppercase;
    color:var(--accent);border:1px solid var(--line);border-radius:999px;padding:6px 14px;margin-bottom:20px;}
  h1{font-size:clamp(28px,5vw,44px);margin:0 0 14px;}
  p.sub{color:var(--muted);margin:0 0 32px;}
  .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:32px;}
  .price{display:flex;gap:28px;flex-wrap:wrap;align-items:baseline;margin-bottom:18px;}
  .price .big{font-size:40px;font-weight:800;}
  .price .mo{font-size:20px;font-weight:700;color:var(--accent);}
  .price small{color:var(--muted);font-weight:500;font-size:14px;}
  ul{margin:0 0 28px;padding-left:20px;color:var(--muted);}
  li{margin-bottom:8px;}
  .btn{display:inline-flex;align-items:center;gap:8px;text-decoration:none;font-weight:700;
    padding:15px 28px;border-radius:12px;background:var(--accent);color:#1a120b;}
  .ghost{display:inline-block;margin-top:14px;color:var(--muted);text-decoration:none;font-size:14px;}
  .ghost:hover{color:var(--text);}
  .note{margin-top:22px;font-size:12.5px;color:var(--muted);}
</style>
</head>
<body>
  <div class="wrap">
    <span class="eyebrow">${escapeHtml(tier.plan_name || 'Modernization Plan')}</span>
    <h1>Launch ${escapeHtml(meta.business || 'your new site')}</h1>
    <p class="sub">Your watermark-free, fully-owned ${escapeHtml(meta.niche_label || meta.niche)} site — live on your domain, maintained by Webify.</p>
    <div class="card">
      <div class="price">
        <div><div class="big">$${upfront}</div><small>one-time rebuild</small></div>
        <div><div class="mo">$${monthly}/mo</div><small>tech-stack upkeep</small></div>
      </div>
      <ul>${deliverables}</ul>
      <a class="btn" href="${payHref}">Complete Payment &amp; Unlock →</a>
      <div><a class="ghost" href="index.html">← Back to gated preview</a></div>
      <p class="note">Demo checkout — completing payment removes the watermark on this preview. Set PAYMENT_LINK to route to a live processor (Stripe, etc.).</p>
    </div>
  </div>
</body>
</html>`;
}

/** Inject a <base> tag so relative links resolve under /preview/<id>/. */
function withBase(html, base) {
  if (/<base\s/i.test(html)) return html;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>\n<base href="${base}">`);
  }
  return `<base href="${base}">\n` + html;
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = {
  PREVIEWS_DIR,
  generatePreview,
  getPreviewMeta,
  listPreviews,
  resolvePreviewFile,
  injectGate,
  renderCheckout,
  withBase,
  sanitizeId
};
