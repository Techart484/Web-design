# Autonomous Web Designer Engine // B2B Control Center

The **Autonomous Web Designer Engine** is a high-performance, full-stack pipeline designed to transform a target URL into a production-grade, niche-optimized landing page with a **Premium Brutalist** design signature.

Built for B2B scale, it automates the entire journey from brand extraction to Vercel deployment and client pitch generation.

## 🚀 The 6-Stage Autonomous Pipeline

1.  **Stage 01: Full-Site Crawl & Brand Bible**
    - Extracts brand colors, voice, culture, and core offerings using Python-based vision/text analysis.
2.  **Stage 02: Competitor Matrix & Positioning**
    - Identifies industry rivals and crafts a "distinctly superior" ownable angle.
3.  **Stage 03: Offerings & Culture-First Build**
    - Compiles a dynamic design system with culture-infused architecture.
4.  **Stage 04: Visual & Experience Uniqueness**
    - Injects custom motion, hairlines, and mono-meta typography.
5.  **Stage 05: Self-Fixing Critique Loop**
    - AI-driven refinement cycles to ensure alignment with the Brand Bible.
6.  **Stage 06: Final Validation & Delivery**
    - Generates a full delivery bundle (site + pitch doc) and prepares for Vercel Hobby/Pro deployment.

## 🛠️ Tech Stack

-   **Backend:** Node.js (Express), Python (Brand Extraction)
-   **Frontend:** Vanilla JS, Tailwind CSS 4.0 (Premium Brutalist Design System)
-   **AI Engine:** Integrated with Ollama (Qwen 2.5 Coder + DeepSeek Coder V2) & Gemini/Firecrawl.
-   **Automation:** Playwright for UI verification, JSZip for asset bundling.

## 📦 Getting Started

### Prerequisites
- Node.js >= 18
- Python 3.10+
- [Ollama](https://ollama.ai/) installed and running.

### Installation
1.  **Clone the Repository**
2.  **Install Dependencies**
    ```bash
    npm install
    ```
3.  **Setup AI Models**
    ```bash
    # Windows
    .\scripts\setup-ollama.ps1
    # Manual
    ollama pull qwen2.5-coder:7b
    ollama pull deepseek-v2:16b
    ```

### Running the Engine
1.  **Start the Backend Server**
    ```bash
    npm start
    ```
2.  **Open the Control Center**
    Navigate to `http://localhost:8000` in your browser.
3.  **Execute**
    Enter a target URL and hit `▷ EXECUTE PIPELINE`.

## 💎 Design Signature: Premium Brutalist
- **Typography:** JetBrains Mono & Inter.
- **Visuals:** High-contrast dark theme, gold accents (#D4AF37), hairline borders, and terminal-style logs.
- **UX:** Scroll-jack motion and real-time pipeline streaming.

## 💰 Business Logic
- **Dynamic Pricing:** Automatically calculates upfront modernization costs ($1200-$1800) and monthly maintenance based on client niche and complexity.
- **B2B Delivery:** Generates professional Markdown pitches and maintenance monitoring documents for immediate client handoff.

---
*Built for the next generation of autonomous web production.*
