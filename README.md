# Autonomous Web Designer Engine — Luxury Niche Edition

The **Autonomous Web Designer Engine** turns a target URL into a self-contained,
production-grade landing page tailored to one of three high-value service niches,
then packages a B2B pitch and a **monthly tech-stack upkeep** plan for a recurring
retainer.

It is deliberately scoped to the three verticals that depend most on a premium web
presence and ongoing maintenance:

| Niche                      | Audience                        | Upfront | Monthly Upkeep |
| -------------------------- | ------------------------------- | ------- | -------------- |
| **Medical & Dental**       | Clinics, practices, specialists | $4,800  | $600 / mo      |
| **Law Firms**              | Boutique & litigation firms     | $6,500  | $850 / mo      |
| **High-End Home Services** | Custom builders, remodelers     | $5,200  | $550 / mo      |

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
3. **Stage 03 — Niche-Aware Production Build** (`scripts/generate.js`)
   - Assembles a self-contained `dist/index.html` from the niche design system and
     the client's real content. No engine boilerplate, no dev-only CDN.
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

## Autonomous Intake Flow

The engine now features an **autonomous intake system** that uses AI to analyze business "soul" and automatically map to the appropriate niche:

### New API Endpoints

- **`POST /api/autonomous/intake`** — Accepts URL + business description, uses Gemini API to analyze the business and map to a niche with confidence scoring
- **`POST /api/failover/extract`** — Implements Tavily → Jina → Firecrawl failover chain for resilient content extraction
- **`POST /api/autonomous/pipeline`** — Executes complete Intake → Research → Web3Forms flow with Consultant AI as a child module
- **`GET /api/services/validate`** — Validates all autonomous service configurations

### Service Architecture

1. **Gemini Intake Agent** (`src/services/intake_service.js`)
   - Analyzes business "soul" using Gemini API
   - Maps to pre-defined niches (medical, legal, home-services, restaurant)
   - Falls back to keyword-based matching if Gemini unavailable
   - Feeds niche + URL directly into Stage 1 of main pipeline

2. **Tavily Research Service** (`src/services/research_service.js`)
   - Unified orchestrator routing tasks by input depth:
     - `broad` → search for discovery
     - `specific` → crawl/extract for business data
     - `deep` → research for competitor intelligence
   - All four endpoints integrated: search, crawl, extract, research

3. **Jina Reader Service** (`src/services/jina_reader_service.js`)
   - Secondary/fallback scraper for deep content transformation
   - Used when Firecrawl needs structured text enrichment
   - No API key required

4. **Failover Service** (`src/services/failover_service.js`)
   - Automatic failover chain: Tavily → Jina → Firecrawl
   - Resilient scraping with automatic service switching
   - Deep content transformation capabilities

5. **Consultant AI Module** (`src/services/web3forms_service.js`)
   - Fully integrated as child of main pipeline
   - Captures analysis output and submits via Web3Forms
   - Handles form data formatting and submission

### Environment Variables

Required for autonomous features:

```bash
GEMINI_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
WEB3FORMS_ACCESS_KEY=your_web3forms_access_key
```

## Getting Started

### Prerequisites

- Node.js >= 18
- Python 3.10+
- (Optional) [Ollama](https://ollama.ai/) for AI-assisted critique
- API keys for autonomous features (see above)

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
`FORMSPREE_HASH`. Force a niche by passing it as the 2nd arg to
`extract_brand.py` (`medical | legal | home-services`).

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
