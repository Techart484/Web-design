const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const JSZip = require('jszip');

const app = express();
const PORT = 8000;
const ROOT = __dirname;
const JOBS_DIR = path.join(ROOT, 'jobs');

if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });

app.use(cors());
app.use(express.json());

// Security: Only serve allowed directories
app.use('/css', express.static(path.join(ROOT, 'css')));
app.use('/js', express.static(path.join(ROOT, 'js')));
app.use('/dist', express.static(path.join(ROOT, 'dist')));
app.use('/jobs', express.static(JOBS_DIR));
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));

/** Helper: Generate UUID (v4) */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Helper for executing scripts with promise */
function runScript(cmd, args, env = process.env, cwd = ROOT) {
  let finalCmd = cmd;
  if (cmd === 'python3' && process.platform === 'win32') {
    finalCmd = 'python';
  }

  return new Promise((resolve, reject) => {
    execFile(finalCmd, args, { env, cwd }, (err, stdout, stderr) => {
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
  let { job_uuid } = req.body;

  if (!url && stageId === 1) {
    return res.status(400).json({ error: 'URL is required for initial stage' });
  }

  try {
    // Stage 1 generates a new UUID if not provided
    if (stageId === 1 && !job_uuid) {
      job_uuid = generateUUID();
    }

    if (!job_uuid) {
      return res.status(400).json({ error: 'job_uuid is required for subsequent stages' });
    }

    const jobPath = path.join(JOBS_DIR, job_uuid);
    if (!fs.existsSync(jobPath)) {
      if (stageId === 1) {
        fs.mkdirSync(jobPath, { recursive: true });
      } else {
        return res.status(404).json({ error: 'Job directory not found. Start with Stage 1.' });
      }
    }

    // Collect API keys from headers or body
    const apiKeys = {
      FIRECRAWL_API_KEY: req.body.firecrawl_key || process.env.FIRECRAWL_API_KEY || '',
      GEMINI_API_KEY: req.body.gemini_key || process.env.GEMINI_API_KEY || '',
      GITHUB_TOKEN: req.body.github_token || process.env.GITHUB_TOKEN || '',
      GITHUB_REPO: req.body.github_repo || process.env.GITHUB_REPO || ''
    };

    const env = { ...process.env, ...apiKeys };

    switch (stageId) {
      case 1: { // Brand Extraction
        console.log(`[*] Stage 1: Extraction for ${url} (Job: ${job_uuid})`);
        const { stdout } = await runScript('python3', [path.join(ROOT, 'scripts/extract_brand.py'), url], env, jobPath);
        const data = extractJson(stdout);
        if (!data) throw new Error('Failed to extract brand data from script output.');
        return res.json({ success: true, job_uuid, data: data, logs: stdout });
      }

      case 2: { // Competitor Analysis
        console.log(`[*] Stage 2: Competitor Analysis for ${url} (Job: ${job_uuid})`);
        const { stdout } = await runScript('node', [path.join(ROOT, 'scripts/analyze_competitors.js'), url, industry || 'default'], env, jobPath);
        const data = extractJson(stdout);
        if (!data) throw new Error('Failed to extract competitor analysis from script output.');
        return res.json({ success: true, job_uuid, data: data, logs: stdout });
      }

      case 3: { // Site Generation
        console.log(`[*] Stage 3: Site Generation for ${url} (Job: ${job_uuid})`);
        const brandPath = path.join(jobPath, 'brand_colors.json');
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

        const { stdout: genStdout } = await runScript('node', [path.join(ROOT, 'scripts/generate.js')], genEnv, jobPath);

        return res.json({
          success: true,
          job_uuid,
          previewUrl: `/jobs/${job_uuid}/dist/index.html`,
          logs: genStdout
        });
      }

      case 4: { // Visual Polish
        console.log(`[*] Stage 4: Visual Polish (Job: ${job_uuid})`);
        const { stdout } = await runScript('node', [path.join(ROOT, 'scripts/polish.js')], env, jobPath);
        const data = extractJson(stdout);
        if (!data) throw new Error('Failed to extract polish data from script output.');
        return res.json({ success: true, job_uuid, data, logs: stdout });
      }

      case 5: { // Self-Fixing Critique
        console.log(`[*] Stage 5: Critique (Job: ${job_uuid})`);
        const { stdout } = await runScript('node', [path.join(ROOT, 'scripts/critique.js')], env, jobPath);
        const data = extractJson(stdout);
        if (!data) throw new Error('Failed to extract critique data from script output.');
        return res.json({ success: true, job_uuid, data, logs: stdout });
      }

      case 6: { // Final Validation & Delivery Bundle
        console.log(`[*] Stage 6: Packaging Delivery Bundle (Job: ${job_uuid})`);
        const zip = new JSZip();
        const distPath = path.join(jobPath, 'dist');

        if (!fs.existsSync(distPath)) throw new Error('Build artifacts missing. Run Stage 3 first.');

        const files = fs.readdirSync(distPath);
        files.forEach(file => {
          const content = fs.readFileSync(path.join(distPath, file));
          zip.file(file, content);
        });

        const buffer = await zip.generateAsync({ type: 'nodebuffer' });
        const bundlePath = path.join(jobPath, 'delivery_bundle.zip');
        fs.writeFileSync(bundlePath, buffer);

        let githubResult = null;
        if (apiKeys.GITHUB_TOKEN && apiKeys.GITHUB_REPO) {
          console.log(`[*] Live Mode: Pushing to GitHub (Job: ${job_uuid})`);
          try {
            const { stdout: syncStdout } = await runScript('node', [path.join(ROOT, 'scripts/github_sync.js')], env, jobPath);
            githubResult = extractJson(syncStdout);
          } catch (err) {
            console.error('[GitHub Sync Error]', err.message);
          }
        }

        return res.json({
          success: true,
          job_uuid,
          bundleUrl: `/api/download/bundle?job_uuid=${job_uuid}`,
          github: githubResult,
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
  const { job_uuid } = req.query;
  if (!job_uuid) return res.status(400).send('job_uuid is required');

  const bundlePath = path.join(JOBS_DIR, job_uuid, 'delivery_bundle.zip');
  if (fs.existsSync(bundlePath)) {
    res.download(bundlePath, `autonomous_design_${job_uuid}.zip`);
  } else {
    res.status(404).send('Bundle not found');
  }
});

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
