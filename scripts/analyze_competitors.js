#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Competitor Matrix (v3.0)
 *
 * Produces niche-specific positioning data in the exact shape the pitch
 * generator consumes:
 *   { competitor_matrix: [{name, weaknesses[]}], value_propositions[], ownable_angle }
 *
 * Ollama (Qwen) is used to enrich the analysis when available, but a
 * high-quality niche-specific fallback guarantees useful output offline.
 * Logs go to stderr; the machine-readable JSON goes to stdout.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENGINE_ROOT = path.resolve(__dirname, '..');
const ROOT = process.cwd();

const targetUrl = process.argv[2] || '';
const industryArg = (process.argv[3] || '').toLowerCase();

const nichesConfig = JSON.parse(
  fs.readFileSync(path.join(ENGINE_ROOT, 'config', 'niches.json'), 'utf8')
);
const NICHES = nichesConfig.niches;
const DEFAULT_NICHE = nichesConfig._meta.default_niche;

function resolveNiche() {
  if (NICHES[industryArg]) return industryArg;
  const biblePath = path.join(ROOT, 'brand_colors.json');
  if (fs.existsSync(biblePath)) {
    try {
      const bible = JSON.parse(fs.readFileSync(biblePath, 'utf8'));
      const key = (bible.niche || bible.detected_industry || '').toLowerCase();
      if (NICHES[key]) return key;
    } catch (_) { /* ignore */ }
  }
  return DEFAULT_NICHE;
}

const nicheKey = resolveNiche();
const niche = NICHES[nicheKey];

function nicheFallback() {
  return {
    competitor_matrix: niche.competitors,
    value_propositions: niche.value_propositions,
    ownable_angle: niche.ownable_angle
  };
}

function queryOllama(prompt, timeoutMs = 60000) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn('ollama', ['run', 'qwen2.5-coder:7b', prompt]);
    } catch (e) {
      process.stderr.write(`[!] Ollama unavailable: ${e.message}\n`);
      return resolve(null);
    }
    let out = '';
    const timer = setTimeout(() => { child.kill(); resolve(null); }, timeoutMs);
    child.stdout.on('data', (d) => { out += d.toString(); });
    child.on('error', () => { clearTimeout(timer); resolve(null); });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve(code === 0 ? out.trim() : null);
    });
  });
}

/** Normalize arbitrary AI JSON into our strict shape. */
function normalize(ai) {
  const fallback = nicheFallback();
  if (!ai || typeof ai !== 'object') return fallback;

  let matrix = ai.competitor_matrix || ai.competitors || [];
  matrix = (Array.isArray(matrix) ? matrix : []).map((c) => {
    if (typeof c === 'string') return { name: c, weaknesses: ['generic design'] };
    return {
      name: c.name || 'Competitor',
      weaknesses: Array.isArray(c.weaknesses) ? c.weaknesses : ['generic design']
    };
  });

  return {
    competitor_matrix: matrix.length ? matrix : fallback.competitor_matrix,
    value_propositions: Array.isArray(ai.uvps || ai.value_propositions)
      ? (ai.uvps || ai.value_propositions)
      : fallback.value_propositions,
    ownable_angle: ai.ownable_angle || fallback.ownable_angle
  };
}

async function analyze() {
  process.stderr.write(`[*] Competitor Matrix — niche=${nicheKey} target=${targetUrl || 'n/a'}\n`);

  const prompt = `You are a B2B brand strategist. For a ${niche.label} business${targetUrl ? ` (${targetUrl})` : ''}, return ONLY JSON with keys:
"competitor_matrix": array of 3 objects {"name": string, "weaknesses": array of 3 short strings},
"value_propositions": array of 3 short strings for a luxury redesign,
"ownable_angle": one sentence.`;

  let result;
  try {
    const raw = await queryOllama(prompt);
    if (raw) {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) result = normalize(JSON.parse(match[0]));
    }
  } catch (e) {
    process.stderr.write(`[!] Ollama parse failed: ${e.message}\n`);
  }

  if (!result) {
    process.stderr.write('[!] Using curated niche positioning fallback.\n');
    result = nicheFallback();
  }

  fs.writeFileSync(
    path.join(ROOT, 'competitor_analysis.json'),
    JSON.stringify(result, null, 2)
  );
  process.stderr.write('[\u2713] Competitor Matrix complete.\n');
  process.stdout.write(JSON.stringify(result));
}

analyze();
