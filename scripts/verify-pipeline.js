#!/usr/bin/env node
/**
 * Autonomous Web Designer Engine — Pipeline Verification (all 4 niches)
 *
 * Exercises the full extract → analyze → generate flow for every supported
 * niche and asserts:
 *   1. Niche detection: keyword classifier maps representative copy to the
 *      correct niche (medical, legal, home-services, food).
 *   2. Multi-page output: all five pages (home, services, about, why-us,
 *      contact) are produced with cross-page navigation + active state.
 *   3. Competitor-informed positioning: the Why-Us page renders the comparison
 *      matrix sourced from Stage-02 competitor analysis.
 *   4. Food specialization: menu (items + prices) on services, reservation UI
 *      on contact; other niches render service cards + a standard contact form.
 *
 * Offline-safe: detection is validated against representative HTML (no network),
 * and generation forces the niche via the extractor's industry hint so the run
 * is deterministic in CI. Exits non-zero on the first failed assertion.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const VERIFY_DIR = path.join(ROOT, 'verification');

const SAMPLE_HTML = {
  medical: '<h1>Lakeside Dental Clinic</h1><p>Our dentist offers implants, crowns, orthodontics and cosmetic dentistry for the whole family.</p>',
  legal: '<h1>Hartwell &amp; Cole Attorneys</h1><p>Our law firm handles litigation, corporate counsel and estate planning. Schedule a legal consultation.</p>',
  'home-services': '<h1>Summit Home Services</h1><p>Licensed plumbing, HVAC, roofing and electrical contractors for emergency repair and remodeling.</p>',
  food: '<h1>Maison Laurent</h1><p>A seasonal restaurant and bistro — reserve a table, explore our tasting menu, wine list and private dining.</p>'
};

const NICHES = Object.keys(SAMPLE_HTML);
const PAGES = ['index.html', 'services.html', 'about.html', 'why-us.html', 'contact.html'];

let passed = 0;
let failed = 0;
const results = [];

function check(label, cond) {
  if (cond) { passed++; results.push(`  \u2713 ${label}`); }
  else { failed++; results.push(`  \u2717 ${label}`); }
  return cond;
}

/** Use the real classifier from extract_brand.py against representative HTML. */
function detectNiche(html) {
  const py = [
    'import importlib.util, sys',
    `spec = importlib.util.spec_from_file_location('eb', r'${path.join(ROOT, 'scripts', 'extract_brand.py')}')`,
    'm = importlib.util.module_from_spec(spec)',
    'spec.loader.exec_module(m)',
    'print(m.detect_niche("", sys.stdin.read()))'
  ].join('\n');
  return execFileSync('python3', ['-c', py], { input: html, cwd: ROOT, encoding: 'utf8' }).trim();
}

function buildNiche(niche) {
  const outDir = path.join(VERIFY_DIR, niche);
  fs.rmSync(outDir, { recursive: true, force: true });

  // Stage 1 — forced-niche extraction (deterministic, offline)
  execFileSync('python3', ['scripts/extract_brand.py', '', niche], { cwd: ROOT, stdio: 'pipe' });

  // Stage 2 — synthesize a competitor matrix to prove competitor-informed Why-Us
  const competitor = {
    niche,
    ownable_angle: `VERIFY_ANGLE_${niche.toUpperCase()}`,
    value_propositions: [{ title: 'Verified Edge', body: 'Competitor-informed positioning.' }],
    competitor_matrix: [
      { name: `RivalCo ${niche}`, weaknesses: ['Outdated template', 'No mobile booking'] }
    ]
  };
  fs.writeFileSync(path.join(ROOT, 'competitor_analysis.json'), JSON.stringify(competitor, null, 2));

  // Stage 3 — generate the multi-page site into verification/<niche>
  execFileSync('node', ['scripts/generate.js'], {
    cwd: ROOT,
    stdio: 'pipe',
    env: { ...process.env, OUT_DIR: outDir, BUSINESS_NAME: `Verify ${niche}` }
  });

  return outDir;
}

console.log('================ WEBIFY 4-NICHE PIPELINE VERIFICATION ================\n');

for (const niche of NICHES) {
  results.push(`\n[${niche.toUpperCase()}]`);

  // 1. Niche detection
  let detected = 'error';
  try { detected = detectNiche(SAMPLE_HTML[niche]); } catch (e) { detected = 'error: ' + e.message; }
  check(`detects niche from copy (got "${detected}")`, detected === niche);

  // Build
  let outDir;
  try { outDir = buildNiche(niche); }
  catch (e) { check('pipeline generate succeeded', false); results.push(`     ${e.message}`); continue; }

  // 2. Multi-page output
  const present = PAGES.filter((p) => fs.existsSync(path.join(outDir, p)));
  check(`generates all ${PAGES.length} pages (${present.length})`, present.length === PAGES.length);
  check('ships production stylesheet', fs.existsSync(path.join(outDir, 'styles.css')));

  const read = (f) => fs.readFileSync(path.join(outDir, f), 'utf8');
  const index = fs.existsSync(path.join(outDir, 'index.html')) ? read('index.html') : '';
  const services = fs.existsSync(path.join(outDir, 'services.html')) ? read('services.html') : '';
  const whyus = fs.existsSync(path.join(outDir, 'why-us.html')) ? read('why-us.html') : '';
  const contact = fs.existsSync(path.join(outDir, 'contact.html')) ? read('contact.html') : '';

  // cross-page nav + active state
  check('home nav marks active page', /class="is-active"/.test(index) && /href="services\.html"/.test(index));

  // 3. Competitor-informed Why-Us
  check('why-us renders competitor matrix', /compare-row/.test(whyus) && /RivalCo/.test(whyus));
  check('why-us uses Stage-02 ownable angle', whyus.includes(`VERIFY_ANGLE_${niche.toUpperCase()}`));

  // 4. Niche specialization
  if (niche === 'food') {
    check('food services renders menu items + prices', /menu-item/.test(services) && /menu-item-price/.test(services));
    check('food contact renders reservation UI', /reservation-form/.test(contact) && /name="party_size"/.test(contact));
  } else {
    check('services renders service cards', /class="card"/.test(services) || /card-/.test(services));
    check('contact renders standard contact form', /name="message"/.test(contact) && !/party_size/.test(contact));
  }

  // manifest sanity
  const manifest = JSON.parse(read('build-manifest.json'));
  check('manifest niche matches', manifest.niche === niche);
  check('manifest flags multi_page + competitor_informed', manifest.features.multi_page && manifest.features.competitor_informed);
}

// Cleanup transient root artifacts so repo stays clean
['brand_colors.json', 'competitor_analysis.json'].forEach((f) => {
  try { fs.rmSync(path.join(ROOT, f), { force: true }); } catch (_) {}
});

console.log(results.join('\n'));
console.log(`\n======================================================================`);
console.log(`RESULT: ${passed} passed, ${failed} failed across ${NICHES.length} niches`);
console.log(`======================================================================`);
process.exit(failed === 0 ? 0 : 1);
