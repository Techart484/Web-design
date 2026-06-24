#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Competitor Analysis Script
 * Performs niche research using Ollama (Qwen 2.5 Coder)
 * v2.1 — Machine-readable output (JSON to stdout, logs to stderr)
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const targetUrl = process.argv[2] || 'example.com';
const industry = process.argv[3] || 'default';

async function queryOllama(prompt) {
  return new Promise((resolve, reject) => {
    try {
      const child = spawn('ollama', ['run', 'qwen2.5-coder:7b', prompt]);
      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('error', (err) => {
        process.stderr.write(`[!] Ollama execution error: ${err.message}\n`);
        resolve(null);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          process.stderr.write(`[!] Ollama failed with code ${code}.\n`);
          resolve(null);
        }
      });
    } catch (e) {
      process.stderr.write(`[!] Failed to spawn Ollama: ${e.message}\n`);
      resolve(null);
    }
  });
}

async function analyze() {
  process.stderr.write(`[*] Initiating Competitor Matrix Analysis for: ${targetUrl}\n`);
  process.stderr.write(`[*] Industry Context: ${industry}\n`);

  const prompt = `Analyze the business niche for ${targetUrl} in the ${industry} industry.
  1. List 3 top competitors.
  2. Identify 3 unique value propositions (UVPs) for a "Premium Brutalist" redesign that would disrupt this niche.
  3. Suggest a "distinctly superior" ownable angle.
  Return the result in JSON format with keys: competitors (array), uvps (array), ownable_angle (string).`;

  let analysis;
  try {
    const response = await queryOllama(prompt);
    if (response) {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      }
    }
  } catch (err) {
    process.stderr.write(`[!] Error during Ollama analysis: ${err.message}\n`);
  }

  // Fallback data
  if (!analysis) {
    process.stderr.write('[!] Using industry-standard fallback for positioning.\n');
    analysis = {
      competitors: [
        `${industry}-market-leader.com`,
        `top-${industry}-services.net`,
        `local-${industry}-expert.io`
      ],
      uvps: [
        "High-performance hairline architecture for instant credibility.",
        "Monochrome-first hierarchy focusing on direct conversion.",
        "Zero-bloat engineering for sub-500ms load times."
      ],
      ownable_angle: `The most technically advanced ${industry} partner in the digital space.`
    };
  }

  const outputPath = path.join(ROOT, 'competitor_analysis.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  process.stderr.write(`[✓] Competitor Matrix Analysis complete. Saved to: ${outputPath}\n`);

  // Final result to stdout
  process.stdout.write(JSON.stringify(analysis));
}

analyze();
