const express = require('express');
const { exec, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const JSZip = require('jszip');

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
        const businessName = brandData.brand_entities?.name || (brandData.detected_industry || 'Niche').toUpperCase() + " PROFESSIONAL";
        const env = {
          ...process.env,
          BUSINESS_NAME: businessName,
          USP: brandData.brand_entities?.usp || '',
          CONTACT_EMAIL: 'uplink@' + (url.replace('https://', '').replace('http://', '').split('/')[0] || 'domain.com'),
          FORMSPREE_HASH: ''
        };

        const { stdout: genStdout } = await runScript('node', ['scripts/generate.js'], env);

        await new Promise((resolve, reject) => {
          exec('npm run build:css', (err, stdout) => {
            if (err) return reject(err);
            resolve(stdout);
          });
        });

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
