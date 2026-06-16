#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Hardened Variable Generator (v2 FIXED)
 * FIX #8: Form action replacement uses regex (not brittle string match)
 * FIX: Template path resolved relative to __dirname (not CWD)
 * FIX: replaceAll() for all placeholder tokens
 * FIX: Dist folder created with proper recursive flag
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ── 1. Resolve Input Variables from Environment ───────────────────────────────
const rawBusinessName  = process.env.BUSINESS_NAME  || '';
const rawContactEmail  = process.env.CONTACT_EMAIL  || '';
const rawFormspreeHash = process.env.FORMSPREE_HASH || '';

const businessName  = rawBusinessName.trim()  || 'Our Services';
const contactEmail  = rawContactEmail.trim()  || 'info@domain.com';
const formspreeHash = rawFormspreeHash.trim();

const cleanDomain   = businessName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'domain';
const businessDomain = `${cleanDomain}.com`;

console.log('[*] Variable Input Schema:');
console.log(`    Business Name:  "${businessName}"`);
console.log(`    Contact Email:  "${contactEmail}"`);
console.log(`    Formspree Hash: "${formspreeHash || 'None — mailto fallback active'}"`);
console.log(`    Business Domain: "${businessDomain}"`);

// ── 2. Load Brand Colors ──────────────────────────────────────────────────────
let brandColors = {
  primary:   '#8b5cf6',
  secondary: '#f43f5e',
  accent:    '#06b6d4',
  bg:        '#06050b'
};

const brandJsonPath = path.join(ROOT, 'brand_colors.json');
if (fs.existsSync(brandJsonPath)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(brandJsonPath, 'utf8'));
    brandColors = { ...brandColors, ...parsed };
    console.log('[✓] Brand colors loaded:', brandColors);
  } catch (err) {
    console.warn(`[!] Could not parse brand_colors.json: ${err.message}. Using defaults.`);
  }
} else {
  console.log('[!] brand_colors.json not found — using system defaults.');
}

// ── 3. Read Blueprint Template (FIX: __dirname-relative path) ─────────────────
// FIX #16: Use __dirname instead of process.cwd() so path is always correct
const templatePath = path.join(ROOT, 'templates', 'master-landing-page', 'index.html');
if (!fs.existsSync(templatePath)) {
  console.error(`[ERROR] Template not found at: ${templatePath}`);
  console.error('        Ensure the templates/master-landing-page/index.html blueprint exists.');
  process.exit(1);
}

let htmlContent = fs.readFileSync(templatePath, 'utf8');
console.log(`[✓] Blueprint template loaded (${htmlContent.length} bytes)`);

// ── 4. Resolve Form Action ────────────────────────────────────────────────────
let formAction = `mailto:${contactEmail}`;
if (formspreeHash) {
  formAction = formspreeHash.startsWith('http')
    ? formspreeHash
    : `https://formspree.io/f/${formspreeHash}`;
  console.log(`[✓] Formspree action resolved: "${formAction}"`);
} else {
  console.log(`[✓] Mailto fallback active: "${formAction}"`);
}

// ── 5. Replace All Placeholder Tokens (FIX #8: regex-based, FIX: replaceAll) ─
// Count replacements for diagnostics
let replacementLog = [];
const replace = (content, token, value) => {
  const count = (content.match(new RegExp(token.replace(/[{}]/g, '\\$&'), 'g')) || []).length;
  if (count > 0) replacementLog.push(`  ${token} → "${value}" (${count} occurrence${count > 1 ? 's' : ''})`);
  return content.split(token).join(value); // replaceAll equivalent — no regex needed
};

htmlContent = replace(htmlContent, '{{BUSINESS_NAME}}',  businessName);
htmlContent = replace(htmlContent, '{{BUSINESS_DOMAIN}}', businessDomain);
htmlContent = replace(htmlContent, '{{CONTACT_EMAIL}}',  contactEmail);
htmlContent = replace(htmlContent, '{{PRIMARY_COLOR}}',  brandColors.primary);
htmlContent = replace(htmlContent, '{{ACCENT_COLOR}}',   brandColors.accent);
htmlContent = replace(htmlContent, '{{SECONDARY_COLOR}}', brandColors.secondary);
htmlContent = replace(htmlContent, '{{BG_COLOR}}',       brandColors.bg);

// FIX #8: Use regex to match the form action regardless of whitespace variation
// Old (brittle): .replace('action="mailto:{{CONTACT_EMAIL}}"', ...)
// New (hardened): regex match on any form action pattern
htmlContent = htmlContent.replace(
  /action="(?:mailto:[^"]*|https?:\/\/formspree\.io\/f\/[^"]*|{{[^}]+}})"/g,
  `action="${formAction}"`
);

if (replacementLog.length > 0) {
  console.log('[✓] Token substitutions applied:');
  replacementLog.forEach(l => console.log(l));
} else {
  console.warn('[!] No template tokens found — blueprint may already be compiled.');
}

// ── 6. Ensure /dist directory exists ─────────────────────────────────────────
const distDir = path.join(ROOT, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log(`[✓] Created dist directory: ${distDir}`);
}

// ── 7. Write Hardened Distribution File ──────────────────────────────────────
const outputPath = path.join(distDir, 'index.html');
try {
  fs.writeFileSync(outputPath, htmlContent, 'utf8');
  console.log(`[✓] Hardened distribution compiled: ${outputPath} (${htmlContent.length} bytes)`);
} catch (err) {
  console.error(`[ERROR] Failed to write distribution: ${err.message}`);
  process.exit(1);
}

// ── 8. Write brand manifest snapshot ─────────────────────────────────────────
const manifestSnapshot = {
  generated_at: new Date().toISOString(),
  business_name: businessName,
  business_domain: businessDomain,
  contact_email: contactEmail,
  form_action: formAction,
  brand_colors: brandColors
};

try {
  fs.writeFileSync(
    path.join(distDir, 'build-manifest.json'),
    JSON.stringify(manifestSnapshot, null, 2),
    'utf8'
  );
  console.log('[✓] Build manifest snapshot written to dist/build-manifest.json');
} catch (_) { /* non-fatal */ }

console.log('\n[✅] Generation complete. Run `npm run build:css` to compile Tailwind assets.');
