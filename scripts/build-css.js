#!/usr/bin/env node
/**
 * Ships the self-contained luxury design system to dist/styles.css.
 * Replaces the old Tailwind CDN/CLI step — the production page links
 * this real, minified-friendly stylesheet (no external CDN required).
 */
const fs = require('fs');
const path = require('path');

const ENGINE_ROOT = path.resolve(__dirname, '..');
const src = path.join(ENGINE_ROOT, 'templates', 'master-landing-page', 'site.css');
const distDir = path.join(process.cwd(), 'dist');
const dest = path.join(distDir, 'styles.css');

if (!fs.existsSync(src)) {
  console.error('[ERROR] Design system source missing:', src);
  process.exit(1);
}
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

fs.copyFileSync(src, dest);
console.log('[\u2713] Production stylesheet written to dist/styles.css');
