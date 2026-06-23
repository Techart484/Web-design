const express = require('express');
const { exec, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

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
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { env }, (err, stdout, stderr) => {
      if (err) {
        reject({ err, stderr, stdout });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Granular Pipeline Endpoint
 * Supports individual stages for better UI feedback
 */
app.post('/api/pipeline/stage/:id', async (req, res) => {
  const stageId = parseInt(req.params.id);
  const { url, industry } = req.body;

  if (!url) return res.status(400).json({ error: 'URL is required' });

  try {
    switch (stageId) {
      case 1: { // Brand Extraction
        console.log(`[*] Stage 1: Extraction for ${url}`);
        const { stdout } = await runScript('python3', ['scripts/extract_brand.py', url]);
        const lines = stdout.trim().split('\n');
        const brandData = JSON.parse(lines[lines.length - 1]);
        return res.json({ success: true, data: brandData, logs: stdout });
      }

      case 2: { // Competitor Analysis
        console.log(`[*] Stage 2: Competitor Analysis for ${url}`);
        const { stdout } = await runScript('node', ['scripts/analyze_competitors.js', url, industry || 'default']);
        const lines = stdout.trim().split('\n');
        const analysisData = JSON.parse(lines[lines.length - 1]);
        return res.json({ success: true, data: analysisData, logs: stdout });
      }

      case 3: { // Site Generation
        console.log(`[*] Stage 3: Site Generation for ${url}`);
        // Load brand data from previous stage output file
        const brandPath = path.join(ROOT, 'brand_colors.json');
        const brandData = JSON.parse(fs.readFileSync(brandPath, 'utf8'));

        const businessName = (brandData.detected_industry || 'Niche').toUpperCase() + " PROFESSIONAL";
        const env = {
          ...process.env,
          BUSINESS_NAME: businessName,
          CONTACT_EMAIL: 'uplink@' + (url.replace('https://', '').replace('http://', '').split('/')[0] || 'domain.com'),
          FORMSPREE_HASH: ''
        };

        const { stdout: genStdout } = await runScript('node', ['scripts/generate.js'], env);

        // Build CSS
        await new Promise((resolve) => {
          exec('npm run build:css', (err, stdout) => {
            if (err) console.warn('[CSS Build Warning]', err);
            resolve(stdout);
          });
        });

        return res.json({
          success: true,
          previewUrl: '/dist/index.html',
          logs: genStdout
        });
      }

      default:
        // Stages 4-6 are currently simulated in frontend or logic-only
        return res.json({ success: true, message: `Stage ${stageId} processed successfully (logic-only).` });
    }
  } catch (error) {
    console.error(`[Stage ${stageId} Error]`, error.stderr || error.message);
    res.status(500).json({
      error: `Stage ${stageId} failed`,
      details: error.stderr || error.message,
      logs: error.stdout
    });
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
