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

/** Run Full Pipeline Endpoint */
app.post('/api/pipeline/run', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  // Simple URL validation/sanitization
  if (!/^https?:\/\/[^\s$.?#].[^\s]*$/gm.test(url)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  console.log(`[*] Initiating real pipeline for: ${url}`);

  // Step 1: Extract Brand (Security: use execFile for argument isolation)
  execFile('python3', ['scripts/extract_brand.py', url], (err, stdout, stderr) => {
    if (err) {
      console.error(`[Extract Error] ${stderr}`);
      return res.status(500).json({ error: 'Brand extraction failed', details: stderr });
    }

    let brandData;
    try {
      // The script prints the JSON to stdout as the last line
      const lines = stdout.trim().split('\n');
      brandData = JSON.parse(lines[lines.length - 1]);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse brand data', details: stdout });
    }

    // Step 2: Generate Site
    const businessName = brandData.detected_industry.toUpperCase() + " PROFESSIONAL";
    const env = {
      ...process.env,
      BUSINESS_NAME: businessName,
      CONTACT_EMAIL: 'uplink@' + (url.replace('https://', '').replace('http://', '').split('/')[0] || 'domain.com'),
      FORMSPREE_HASH: ''
    };

    const generateCmd = `node scripts/generate.js`;
    exec(generateCmd, { env }, (genErr, genStdout, genStderr) => {
      if (genErr) {
        console.error(`[Generate Error] ${genStderr}`);
        return res.status(500).json({ error: 'Site generation failed', details: genStderr });
      }

      // Step 3: Build CSS (Tailwind)
      // Note: In this environment, we might just use the prestored styles.css if tailwind isn't configured for a quick dist build
      const buildCssCmd = `npm run build:css`;
      exec(buildCssCmd, (cssErr, cssStdout, cssStderr) => {
        // We don't fail if CSS build fails (might not have tailwind cli in sandbox), but we log it
        if (cssErr) console.warn(`[CSS Build Warning] ${cssStderr}`);

        res.json({
          success: true,
          brand: brandData,
          previewUrl: '/dist/index.html',
          logs: stdout + genStdout
        });
      });
    });
  });
});

/** System Health Check */
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', scripts: fs.existsSync(path.join(ROOT, 'scripts/extract_brand.py')) });
});

app.listen(PORT, () => {
  console.log(`[🚀] Autonomous Web Designer Engine Backend live at http://localhost:${PORT}`);
});
