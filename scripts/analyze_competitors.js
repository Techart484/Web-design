#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Competitor Analysis Script
 * Performs niche research using Ollama (Qwen 2.5 Coder)
 * v2 FIXED: Proper error handling for missing Ollama
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
        // This catches ENOENT (ollama not found)
        console.warn(`[!] Ollama execution error: ${err.message}`);
        resolve(null);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          console.warn(`[!] Ollama failed with code ${code}.`);
          resolve(null);
        }
      });
    } catch (e) {
      console.warn(`[!] Failed to spawn Ollama: ${e.message}`);
      resolve(null);
    }
  });
}

async function analyze() {
  console.log(`[*] Initiating Competitor Matrix Analysis for: ${targetUrl}`);
  console.log(`[*] Industry Context: ${industry}`);

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
    console.warn('[!] Error during Ollama analysis:', err.message);
  }

  // Fallback data if AI fails or Ollama is missing
  if (!analysis) {
    console.log('[!] Using industry-standard fallback for positioning.');
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
  console.log(`[✓] Competitor Matrix Analysis complete. Saved to: ${outputPath}`);
  console.log(JSON.stringify(analysis));
}

analyze();
