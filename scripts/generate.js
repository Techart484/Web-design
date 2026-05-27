#!/usr/bin/env node
/**
 * Web Design Automation Factory - Token-Driven Generator
 * Consumes comprehensive metadata from Stage 1 analyzer and generates dynamic production HTML.
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments and environment variables
const metadataFile = process.env.METADATA_FILE || 'metadata.json';
const outputFile = process.env.OUTPUT_FILE || path.join(process.cwd(), 'dist', 'index.html');
const businessName = process.env.BUSINESS_NAME || '';
const contactEmail = process.env.CONTACT_EMAIL || '';

console.log('[*] Token-Driven Generation Started');

// 1. Load comprehensive metadata from Stage 1 analyzer
let metadata = {
  metadata: { category: 'default', detection_confidence: 0.0 },
  brand: { business_name: 'Our Services', email: 'info@domain.com' },
  colors: { primary: '#8b5cf6', accent: '#06b6d4', secondary: '#f43f5e', bg: '#06050b' },
  typography: { font_families: ['Inter', 'Playfair Display'] },
  imagery: {},
  content: { features: [] },
  tech_stack: {}
};

const metadataPath = path.join(process.cwd(), metadataFile);
if (fs.existsSync(metadataPath)) {
  try {
    const rawData = fs.readFileSync(metadataPath, 'utf8');
    metadata = JSON.parse(rawData);
    console.log(`[✓] Loaded metadata from: ${metadataPath}`);
    console.log(`    - Category: ${metadata.metadata?.category || 'unknown'}`);
    console.log(`    - Business: ${metadata.brand?.business_name || 'Not detected'}`);
    console.log(`    - Colors extracted: ${Object.keys(metadata.colors).length} color properties`);
  } catch (err) {
    console.log(`[!] Failed to parse metadata: ${err.message}. Using defaults.`);
  }
} else {
  console.log(`[!] metadata.json not found. Using default values.`);
  // Also try legacy brand_colors.json for backward compatibility
  const brandJsonPath = path.join(process.cwd(), 'brand_colors.json');
  if (fs.existsSync(brandJsonPath)) {
    try {
      const legacyData = JSON.parse(fs.readFileSync(brandJsonPath, 'utf8'));
      metadata.colors = legacyData;
      console.log(`[✓] Loaded legacy brand_colors.json`);
    } catch (err) {
      console.log(`[!] Failed to parse brand_colors.json`);
    }
  }
}

// 2. Resolve token values from multiple sources (priority order)
const tokens = {};

// Priority 1: Source metadata brand info
if (metadata.brand) {
  tokens.BUSINESS_NAME = metadata.brand.business_name || 'Our Services';
  tokens.CONTACT_EMAIL = metadata.brand.email || 'info@domain.com';
  tokens.CONTACT_PHONE = metadata.brand.phone || '';
  tokens.CONTACT_ADDRESS = metadata.brand.address || '';
  tokens.HERO_CTA = metadata.brand.cta_text || 'Get Started';
}

// Priority 2: Override with environment variables
if (businessName.trim()) tokens.BUSINESS_NAME = businessName.trim();
if (contactEmail.trim()) tokens.CONTACT_EMAIL = contactEmail.trim();

// Priority 3: Content extraction
if (metadata.content) {
  tokens.HERO_HEADLINE = metadata.content.hero_headline || tokens.BUSINESS_NAME;
  tokens.HERO_SUBHEADLINE = metadata.content.hero_subheadline || '';

  if (metadata.content.features && metadata.content.features.length > 0) {
    metadata.content.features.forEach((feature, idx) => {
      tokens[`FEATURE_${idx + 1}_TITLE`] = feature.title || '';
      tokens[`FEATURE_${idx + 1}_DESC`] = feature.description || '';
    });
  }
}

// Priority 4: Colors
tokens.PRIMARY_COLOR = metadata.colors.primary || '#8b5cf6';
tokens.ACCENT_COLOR = metadata.colors.accent || '#06b6d4';
tokens.SECONDARY_COLOR = metadata.colors.secondary || '#f43f5e';
tokens.BG_COLOR = metadata.colors.bg || '#06050b';

// Priority 5: Imagery
if (metadata.imagery) {
  tokens.HERO_IMAGE = metadata.imagery.hero_image_url || '';
}

// Priority 6: Typography
if (metadata.typography && metadata.typography.font_families && metadata.typography.font_families.length > 0) {
  tokens.FONT_FAMILY = metadata.typography.font_families[0];
}

// Derive domain for backward compatibility
const cleanDomain = (tokens.BUSINESS_NAME || 'domain').toLowerCase().replace(/[^a-z0-9]/g, '');
tokens.BUSINESS_DOMAIN = `${cleanDomain}.com`;

console.log('[✓] Token resolution complete:');
console.log(`    - Business Name: ${tokens.BUSINESS_NAME}`);
console.log(`    - Email: ${tokens.CONTACT_EMAIL}`);
console.log(`    - Primary Color: ${tokens.PRIMARY_COLOR}`);
console.log(`    - Category: ${metadata.metadata?.category || 'default'}`);

// 3. Read template
const templatePath = path.join(process.cwd(), 'templates', 'master-landing-page', 'index.html');
if (!fs.existsSync(templatePath)) {
  console.error(`[ERROR] Template not found at: ${templatePath}`);
  process.exit(1);
}

let htmlContent = fs.readFileSync(templatePath, 'utf8');

// 4. Build CSS with injected color variables
const cssVariables = `
:root {
  --primary: ${tokens.PRIMARY_COLOR};
  --accent: ${tokens.ACCENT_COLOR};
  --secondary: ${tokens.SECONDARY_COLOR};
  --background: ${tokens.BG_COLOR};
  --font-family: ${tokens.FONT_FAMILY || "'Inter', sans-serif"};
}
`;

// 5. Replace all tokens in HTML
let finalHtml = htmlContent;
for (const [key, value] of Object.entries(tokens)) {
  if (value && typeof value === 'string') {
    const regex = new RegExp(`{{${key}}}`, 'g');
    finalHtml = finalHtml.replace(regex, value);
  }
}

// 6. Ensure dist folder exists
const distDir = path.dirname(outputFile);
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 7. Write finalized HTML
try {
  fs.writeFileSync(outputFile, finalHtml, 'utf8');
  console.log(`[✓] Dynamic production HTML generated successfully`);
  console.log(`    - Output: ${outputFile}`);
  console.log(`    - Category: ${metadata.metadata?.category || 'default'}`);
  console.log(`    - Tokens resolved: ${Object.keys(tokens).length}`);
} catch (err) {
  console.error(`[ERROR] Failed to write output: ${err.message}`);
  process.exit(1);
}

