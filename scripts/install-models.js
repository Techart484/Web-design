#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Ollama Model Health Check
 * Verifies Ollama is running and required models are available.
 * Run before pipeline to pre-validate AI engine readiness.
 */

const http = require('http');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'localhost';
const OLLAMA_PORT = parseInt(process.env.OLLAMA_PORT || '11434');

const REQUIRED_MODELS = [
  { name: 'qwen2.5-coder', label: 'Qwen 2.5 Coder (Stage 02/04/05)', required: true },
  { name: 'deepseek-coder', label: 'DeepSeek Coder V2 (Stage 06)', required: false }
];

function httpGet(path) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: OLLAMA_HOST, port: OLLAMA_PORT, path }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve({ raw: data }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(4000, () => { req.destroy(); reject(new Error('Connection timeout')); });
  });
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   AURA AI Engine — Ollama Model Health Check         ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\n[*] Checking Ollama at ${OLLAMA_HOST}:${OLLAMA_PORT}...\n`);

  let allOk = true;

  // 1. Check Ollama is running
  let tags;
  try {
    tags = await httpGet('/api/tags');
    console.log('  ✅ Ollama daemon is ONLINE');
  } catch (err) {
    console.error('  ❌ Ollama daemon is OFFLINE');
    console.error(`     Error: ${err.message}`);
    console.error('\n  ► Fix: Run scripts/setup-ollama.ps1 to install and start Ollama\n');
    process.exit(1);
  }

  // 2. List available models
  const available = (tags.models || []).map(m => m.name);
  console.log(`\n  Available models (${available.length}):`);
  available.forEach(m => console.log(`    • ${m}`));

  // 3. Check required models
  console.log('\n  Required model check:');
  for (const req of REQUIRED_MODELS) {
    const found = available.find(m => m.startsWith(req.name));
    if (found) {
      console.log(`  ✅ ${req.label} → ${found}`);
    } else if (req.required) {
      console.error(`  ❌ MISSING: ${req.label}`);
      console.error(`     Fix: ollama pull ${req.name}:7b`);
      allOk = false;
    } else {
      console.warn(`  ⚠  OPTIONAL MISSING: ${req.label}`);
      console.warn(`     Install with: ollama pull ${req.name}-v2:16b`);
    }
  }

  // 4. Quick inference test
  if (available.length > 0) {
    console.log('\n[*] Running quick inference test...');
    try {
      const testModel = available.find(m => m.includes('qwen') || m.includes('deepseek')) || available[0];
      const body = JSON.stringify({
        model: testModel,
        prompt: 'Reply with exactly: ONLINE',
        stream: false,
        options: { num_predict: 5 }
      });

      const response = await new Promise((resolve, reject) => {
        const req = http.request({
          host: OLLAMA_HOST, port: OLLAMA_PORT,
          path: '/api/generate', method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Inference timeout — model may still be loading')); });
        req.write(body);
        req.end();
      });

      if (response.response) {
        console.log(`  ✅ Inference test passed: "${response.response.trim()}" (model: ${testModel})`);
      }
    } catch (err) {
      console.warn(`  ⚠  Inference test failed: ${err.message}`);
      console.warn('     This is non-fatal — model may need warm-up time.');
    }
  }

  // 5. Summary
  console.log('\n' + '─'.repeat(56));
  if (allOk) {
    console.log('  ✅ AI Engine is READY — all required models available');
    console.log('     Run the pipeline from the AURA dashboard → ⚡ AI Pipeline tab');
  } else {
    console.log('  ❌ AI Engine NOT READY — missing required models');
    console.log('\n  Install missing models:');
    console.log('    ollama pull qwen2.5-coder:7b');
    console.log('    ollama pull deepseek-coder-v2:16b');
    console.log('\n  Or run the automated setup:');
    console.log('    powershell -ExecutionPolicy Bypass -File scripts/setup-ollama.ps1');
    process.exit(1);
  }
  console.log('─'.repeat(56) + '\n');
}

main().catch(err => {
  console.error('[FATAL] Health check crashed:', err.message);
  process.exit(1);
});
