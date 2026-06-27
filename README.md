# Autonomous Web Designer Engine — Luxury Niche Edition

The **Autonomous Web Designer Engine** turns a target URL into a self-contained,
production-grade **multi-page website** (Home, Services/Menu, About, Why Us, and
Contact) tailored to one of four high-value service niches, then packages a B2B
pitch and a **monthly tech-stack upkeep** plan for a recurring retainer.

It is deliberately scoped to the four verticals that depend most on a premium web
presence and ongoing maintenance:

| Niche | Audience | Upfront | Monthly Upkeep |
|-------|----------|---------|----------------|
| **Medical & Dental** | Clinics, practices, specialists | $4,800 | $600 / mo |
| **Law Firms** | Boutique & litigation firms | $6,500 | $850 / mo |
| **High-End Home Services** | Custom builders, remodelers | $5,200 | $550 / mo |
| **Food & Restaurant** | Restaurants, bistros, fine dining | $4,500 | $500 / mo |

Each niche ships a distinct, curated design system — palette, typography, voice,
trust signals, service copy, competitor positioning, and pricing — defined in
[`config/niches.json`](config/niches.json).

## The 6-Stage Pipeline

1. **Stage 01 — Brand Bible Extraction** (`scripts/extract_brand.py`)
   - Fetches the page **and its linked stylesheets**, ranks brand colors by
     frequency × vividness, validates WCAG contrast against the niche background,
     and classifies the niche with word-boundary keyword matching. Outputs
     `brand_colors.json` (name, USP, services, palette, niche).
2. **Stage 02 — Competitor Matrix** (`scripts/analyze_competitors.js`)
   - Produces a niche-specific competitor matrix (objects with `name` +
     `weaknesses`), value propositions, and an ownable positioning angle.
3. **Stage 03 — Niche-Aware Multi-Page Build** (`scripts/generate.js`)
   - Assembles a self-contained five-page site (`index.html`, `services.html`,
     `about.html`, `why-us.html`, `contact.html`) with shared navigation/footer
     from the niche design system and the client's real content. The **Why Us**
     page is competitor-informed (reads Stage-02 `competitor_analysis.json`). The
     **food** niche renders a structured menu (categories, items, prices) and a
     reservation form in place of the standard contact form. Output directory is
     overridable via `OUT_DIR` for isolated per-client previews.
4. **Stage 04 — Visual Polish** (`scripts/polish.js`)
   - Applies finishing passes and reports polish metrics.
5. **Stage 05 — Critique Loop** (`scripts/critique.js`)
   - Static audit (accessibility, responsiveness, brand alignment). An optional
     Ollama-backed pass runs only when a local model is available.
6. **Stage 06 — Delivery** (`js/b2b-pitch.js`, server `/api/pipeline/stage/6`)
   - Bundles the site, B2B pitch, and maintenance monitor into a ZIP.

The production page links a real, self-contained stylesheet
(`dist/styles.css`, shipped by `scripts/build-css.js` from
`templates/master-landing-page/site.css`) — no Tailwind CDN.

## Tech Stack

- **Backend:** Node.js (Express), Python 3 (brand extraction — stdlib only)
- **Frontend:** Vanilla JS control center + vanilla CSS luxury design system
- **AI (optional):** Ollama for the Stage 05 critique pass; the pipeline runs
  fully offline with curated niche fallbacks when no model/keys are present
- **Automation:** GitHub Actions for the build pipeline and monthly upkeep

## Getting Started

### Prerequisites
- Node.js >= 18
- Python 3.10+
- (Optional) [Ollama](https://ollama.ai/) for AI-assisted critique

### Install & Run
```bash
npm install
npm start            # Control Center at http://localhost:8000
```

### CLI Pipeline
```bash
# Full offline pipeline for a target URL
npm run extract -- https://client-site.com
npm run analyze -- https://client-site.com
npm run build        # generate + ship self-contained styles.css
npm run polish
npm run critique
```
Override copy via env vars: `BUSINESS_NAME`, `USP`, `CONTACT_EMAIL`,
`FORMSPREE_HASH`, `OUT_DIR`. Force a niche by passing it as the 2nd arg to
`extract_brand.py` (`medical | legal | home-services | food`).

### Verify all 4 niches
```bash
npm run verify        # extract -> analyze -> generate for every niche + asserts
```
Validates niche detection, the five-page structure with cross-page nav,
competitor-informed Why-Us, and the food menu + reservation UI.

## Preview Gating (B2B upsell)

The control center's **Client Preview Gating** panel (and `POST
/api/preview/generate`) takes a prospect's current URL, runs the full pipeline
into an isolated `previews/<id>/` directory, and serves the redesigned site at
`/preview/<id>/` with a diagonal **watermark** overlay and a sticky **payment
CTA**. The CTA routes to a niche-priced `checkout.html`; "paying" (demo) sets a
per-preview unlock token that removes the watermark. Wire a real processor by
setting the `PAYMENT_LINK` env var.

## Monthly Tech-Stack Upkeep

The retainer model is automated by
[`.github/workflows/monthly-upkeep.yml`](.github/workflows/monthly-upkeep.yml),
scheduled for the 1st of each month. It re-extracts the client brand bible,
rebuilds the site, runs the critique audit, and reports outdated dependencies and
`npm audit` results. Set the `CLIENT_URL` repository variable (or pass
`client_url` on manual dispatch) to point it at the live client site.

## Design Systems

Every niche defines its own:
- **Palette** — luxury dark theme tuned per vertical (extracted brand color is
  injected as the accent when it passes contrast validation, otherwise the
  curated niche accent is used).
- **Typography** — e.g. Sora/Inter (medical), Cormorant Garamond/Inter (legal),
  Archivo/Inter (home services).
- **Voice, trust stats, services, value props, competitors, and pricing.**

Edit `config/niches.json` to tune any of these — every stage reads from it.
