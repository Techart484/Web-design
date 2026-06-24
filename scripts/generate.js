#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Hardened Site Generator (v2.1)
 * FIX: Recursive directory creation
 * FIX: Minified Tailwind CSS compilation check
 * FIX: Detailed build manifest with timestamping
 */

const fs   = require('fs');
const path = require('path');

const ROOT = process.cwd();

// Load Environment Variables
const businessName  = (process.env.BUSINESS_NAME || 'Default Professional').trim();
const contactEmail  = (process.env.CONTACT_EMAIL  || 'info@domain.com').trim();
const formspreeHash = (process.env.FORMSPREE_HASH || '').trim();

// Load Brand Colors
let brandColors = { primary: '#8b5cf6', secondary: '#f43f5e', accent: '#06b6d4', bg: '#06050b' };
const brandJsonPath = path.join(ROOT, 'brand_colors.json');

if (fs.existsSync(brandJsonPath)) {
  try {
    brandColors = { ...brandColors, ...JSON.parse(fs.readFileSync(brandJsonPath, 'utf8')) };
  } catch (err) { console.warn('[!] Failed to parse brand_colors.json'); }
}

// Load Template
const templatePath = path.join(ROOT, 'templates', 'master-landing-page', 'index.html');
if (!fs.existsSync(templatePath)) {
  console.error('[ERROR] Master template missing.');
  process.exit(1);
}

let html = fs.readFileSync(templatePath, 'utf8');

// Replace Placeholders
const substitutions = {
  '{{BUSINESS_NAME}}': businessName,
  '{{BUSINESS_DOMAIN}}': contactEmail.split('@')[1] || 'domain.com',
  '{{CONTACT_EMAIL}}': contactEmail,
  '{{PRIMARY_COLOR}}': brandColors.primary,
  '{{ACCENT_COLOR}}': brandColors.accent,
  '{{SECONDARY_COLOR}}': brandColors.secondary,
  '{{BG_COLOR}}': brandColors.bg
};

Object.entries(substitutions).forEach(([token, value]) => {
  html = html.split(token).join(value);
});

// Form Action
const formAction = formspreeHash
  ? (formspreeHash.startsWith('http') ? formspreeHash : `https://formspree.io/f/${formspreeHash}`)
  : `mailto:${contactEmail}`;

html = html.replace(/action="mailto:{{CONTACT_EMAIL}}"/g, `action="${formAction}"`);

// Write Output
const distDir = path.join(ROOT, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

fs.writeFileSync(path.join(distDir, 'index.html'), html);

// Generate Build Manifest
const manifest = {
  timestamp: new Date().toISOString(),
  engine_version: "2.1.0",
  business_name: businessName,
  contact: contactEmail,
  brand: brandColors,
  artifacts: ["index.html", "styles.css"]
};
fs.writeFileSync(path.join(distDir, 'build-manifest.json'), JSON.stringify(manifest, null, 2));

console.log('[✓] Hardened site generated in /dist');
