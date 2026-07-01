// Web Design Automation Factory - Component Registry
// Contains pre-built, premium responsive web components with scoped styles.

const WebComponents = {
  navbar: {
    id: 'navbar',
    name: 'Glassmorphic Navbar',
    category: 'Navigation',
    description: 'Ultra-modern navigation bar with fluid styling controls and active button.',
    html: `
<nav id="section-navbar" class="navbar-wrapper">
  <div class="nav-container">
    <div class="nav-brand">
      <div class="brand-glow"></div>
      <span class="brand-text">AURA.DESIGN</span>
    </div>
    <div class="nav-links">
      <a href="#features" class="nav-link">Features</a>
      <a href="#stats" class="nav-link">Performance</a>
      <a href="#pricing" class="nav-link">Pricing</a>
      <a href="#contact" class="nav-link">Get Started</a>
    </div>
    <div class="nav-actions">
      <a href="#contact" class="nav-cta">Launch Factory</a>
    </div>
    <button class="mobile-toggle" aria-label="Toggle Menu">
      <span></span>
      <span></span>
      <span></span>
    </button>
  </div>
</nav>
    `,
    css: `
/* Navbar Scoped Styles */
.navbar-wrapper {
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 1000;
  background: var(--nav-bg, rgba(14, 12, 21, 0.7));
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--nav-border, rgba(255, 255, 255, 0.05));
  font-family: var(--font-family, 'Outfit', sans-serif);
  transition: all 0.3s ease;
}

.nav-container {
  max-width: var(--container-width, 1200px);
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.brand-glow {
  position: absolute;
  width: 32px;
  height: 32px;
  background: var(--color-primary, #8b5cf6);
  filter: blur(15px);
  opacity: 0.5;
  border-radius: 50%;
}

.brand-text {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #ffffff, rgba(255,255,255,0.7));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-link {
  color: var(--color-text-muted, #9ca3af);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.25s ease;
}

.nav-link:hover {
  color: var(--color-primary, #8b5cf6);
}

.nav-cta {
  background: linear-gradient(135deg, var(--color-primary, #8b5cf6), var(--color-accent, #06b6d4));
  color: #ffffff;
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: var(--border-radius, 8px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
  transition: all 0.25s ease;
}

.nav-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.mobile-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
}

.mobile-toggle span {
  width: 24px;
  height: 2px;
  background-color: #ffffff;
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .nav-links, .nav-actions {
    display: none;
  }
  .mobile-toggle {
    display: flex;
  }
}
    `
  },

  hero: {
    id: 'hero',
    name: 'Sleek Split Hero',
    category: 'Header',
    description: 'Split section with gradient headline, social proof links, and background mesh glow.',
    html: `
<section id="section-hero" class="hero-wrapper">
  <div class="hero-glow-1"></div>
  <div class="hero-glow-2"></div>
  <div class="hero-container">
    <div class="hero-content">
      <div class="hero-tag">NEXT GENERATION AUTOMATION</div>
      <h1 class="hero-title">Automate Your Web Design <span class="gradient-text">Factory System</span></h1>
      <p class="hero-subtitle">Orchestrate beautiful responsive layouts, manage complex design systems, and export production-ready distributions with native, lightweight precision.</p>
      <div class="hero-actions">
        <a href="#contact" class="hero-btn-primary">Initiate Project</a>
        <a href="#features" class="hero-btn-secondary">Explore Mechanics</a>
      </div>
      <div class="hero-badges">
        <span class="badge-text">✓ No Server Overhead</span>
        <span class="badge-text">✓ Pure Vanilla Performance</span>
      </div>
    </div>
    <div class="hero-visual">
      <div class="mockup-frame">
        <div class="mockup-header">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <div class="mockup-tab">main.css</div>
        </div>
        <div class="mockup-code">
          <pre><code><span class="keyword">:root</span> {
  --primary: <span class="string">#8b5cf6</span>;
  --accent: <span class="string">#06b6d4</span>;
  --radius: <span class="number">12px</span>;
}

<span class="comment">/* Compiled and exported */</span>
<span class="keyword">.automation-engine</span> {
  <span class="property">display</span>: flex;
  <span class="property">backdrop-filter</span>: blur(16px);
  <span class="property">animation</span>: glow 2s infinite;
}</code></pre>
        </div>
      </div>
    </div>
  </div>
</section>
    `,
    css: `
/* Hero Scoped Styles */
.hero-wrapper {
  padding: 100px 24px;
  background-color: var(--color-bg, #06050b);
  position: relative;
  overflow: hidden;
  font-family: var(--font-family, 'Outfit', sans-serif);
}

.hero-glow-1 {
  position: absolute;
  top: -10%;
  left: 20%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--color-primary-glow, rgba(139, 92, 246, 0.15)) 0%, rgba(0, 0, 0, 0) 70%);
  filter: blur(40px);
  pointer-events: none;
}

.hero-glow-2 {
  position: absolute;
  bottom: 0;
  right: 10%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--color-accent-glow, rgba(6, 182, 212, 0.1)) 0%, rgba(0, 0, 0, 0) 70%);
  filter: blur(45px);
  pointer-events: none;
}

.hero-container {
  max-width: var(--container-width, 1200px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 48px;
  align-items: center;
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 2;
}

.hero-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-accent, #06b6d4);
  background: var(--color-accent-glow, rgba(6, 182, 212, 0.15));
  border: 1px solid rgba(6, 182, 212, 0.2);
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

.hero-title {
  font-size: 48px;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -1px;
  color: #ffffff;
  margin-bottom: 20px;
}

.gradient-text {
  background: linear-gradient(135deg, var(--color-primary, #8b5cf6), var(--color-accent, #06b6d4));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 17px;
  line-height: 1.6;
  color: var(--color-text-muted, #9ca3af);
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 40px;
}

.hero-btn-primary {
  background: var(--color-primary, #8b5cf6);
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 28px;
  border-radius: var(--border-radius, 8px);
  box-shadow: 0 4px 15px var(--color-primary-glow, rgba(139, 92, 246, 0.3));
  transition: all 0.25s ease;
}

.hero-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--color-primary-glow, rgba(139, 92, 246, 0.45));
}

.hero-btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  text-decoration: none;
  font-weight: 600;
  font-size: 15px;
  padding: 12px 28px;
  border-radius: var(--border-radius, 8px);
  transition: all 0.25s ease;
}

.hero-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
}

.hero-badges {
  display: flex;
  gap: 20px;
}

.badge-text {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted, #9ca3af);
}

.hero-visual {
  display: flex;
  justify-content: center;
  z-index: 2;
}

.mockup-frame {
  width: 100%;
  background: rgba(14, 12, 21, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 12px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.mockup-header {
  height: 40px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 6px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot.red { background: #ff5f56; }
.dot.yellow { background: #ffbd2e; }
.dot.green { background: #27c93f; }

.mockup-tab {
  margin-left: 20px;
  font-size: 11px;
  font-family: monospace;
  color: var(--color-text-muted, #9ca3af);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 4px 4px 0 0;
}

.mockup-code {
  padding: 24px;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
}

.keyword { color: #f43f5e; }
.string { color: #10b981; }
.number { color: #f59e0b; }
.property { color: #06b6d4; }
.comment { color: #6b7280; }

@media (max-width: 968px) {
  .hero-container {
    grid-template-columns: 1fr;
    gap: 32px;
    text-align: center;
  }
  .hero-content {
    align-items: center;
  }
  .hero-actions, .hero-badges {
    justify-content: center;
  }
}
    `
  },

  features: {
    id: 'features',
    name: 'Neon Features Grid',
    category: 'Features',
    description: 'Glowing grid cards with hover-scaling SVG icon shapes and detail headers.',
    html: `
<section id="section-features" class="features-wrapper">
  <div class="features-container">
    <div class="section-header">
      <span class="section-tag">ENGINE SPECS</span>
      <h2 class="section-title">Engineered For Visual Domination</h2>
      <p class="section-subtitle">A high-fidelity layout factory that provides instantaneous responsiveness and frictionless configuration.</p>
    </div>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <h3 class="feature-name">Isolated Styles</h3>
        <p class="feature-desc">Utilizes an isolated viewport engine preventing style bleed, maintaining a pixel-perfect design sandbox.</p>
      </div>
      <div class="feature-card highlighted">
        <div class="feature-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
        </div>
        <h3 class="feature-name">Theme Matrices</h3>
        <p class="feature-desc">Dynamically switches styling matrices with custom fallback defaults corresponding to different industries.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <h3 class="feature-name">Native Exporter</h3>
        <p class="feature-desc">Packages production distribution files locally using a high-velocity client-side Blob zip cycle.</p>
      </div>
    </div>
  </div>
</section>
    `,
    css: `
/* Features Scoped Styles */
.features-wrapper {
  padding: 80px 24px;
  background-color: var(--color-bg, #06050b);
  font-family: var(--font-family, 'Outfit', sans-serif);
}

.features-container {
  max-width: var(--container-width, 1200px);
  margin: 0 auto;
}

.section-header {
  text-align: center;
  max-width: 600px;
  margin: 0 auto 50px auto;
}

.section-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--color-primary, #8b5cf6);
  letter-spacing: 1px;
  display: inline-block;
  margin-bottom: 12px;
}

.section-title {
  font-size: 32px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 16px;
  letter-spacing: -0.5px;
}

.section-subtitle {
  font-size: 14px;
  color: var(--color-text-muted, #9ca3af);
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius, 12px);
  padding: 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: relative;
}

.feature-card:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--color-primary, #8b5cf6);
  box-shadow: 0 10px 30px rgba(139, 92, 246, 0.15);
}

.feature-card.highlighted {
  border-color: rgba(6, 182, 212, 0.3);
}

.feature-card.highlighted:hover {
  border-color: var(--color-accent, #06b6d4);
  box-shadow: 0 10px 30px rgba(6, 182, 212, 0.15);
}

.feature-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary, #8b5cf6);
  margin-bottom: 24px;
  transition: all 0.3s ease;
}

.feature-card:hover .feature-icon {
  color: #ffffff;
  background: var(--color-primary, #8b5cf6);
  transform: scale(1.05);
}

.feature-card.highlighted:hover .feature-icon {
  background: var(--color-accent, #06b6d4);
}

.feature-name {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
}

.feature-desc {
  font-size: 13.5px;
  color: var(--color-text-muted, #9ca3af);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}
    `
  },

  stats: {
    id: 'stats',
    name: 'Metric Milestones',
    category: 'Features',
    description: 'Sleek count layout to showcase system performance metrics.',
    html: `
<section id="section-stats" class="stats-wrapper">
  <div class="stats-container">
    <div class="stat-box">
      <div class="stat-number">99.9%</div>
      <div class="stat-label">Virtual Runtime Uptime</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">250ms</div>
      <div class="stat-label">Dynamic Render Cycle</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">0ms</div>
      <div class="stat-label">External Latency</div>
    </div>
    <div class="stat-box">
      <div class="stat-number">10k+</div>
      <div class="stat-label">Architectural Models</div>
    </div>
  </div>
</section>
    `,
    css: `
/* Stats Scoped Styles */
.stats-wrapper {
  padding: 60px 24px;
  background-color: var(--color-bg, #06050b);
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  font-family: var(--font-family, 'Outfit', sans-serif);
}

.stats-container {
  max-width: var(--container-width, 1200px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  text-align: center;
}

.stat-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-number {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -1px;
  background: linear-gradient(135deg, #ffffff, var(--color-accent, #06b6d4));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-muted, #9ca3af);
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .stats-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }
}
    `
  },

  pricing: {
    id: 'pricing',
    name: 'Sleek Pricing Columns',
    category: 'Conversion',
    description: 'High-converting plan options with highlighted states and CTA blocks.',
    html: `
<section id="section-pricing" class="pricing-wrapper">
  <div class="pricing-container">
    <div class="section-header">
      <span class="section-tag">ACCELERATION PLANS</span>
      <h2 class="section-title">Transparent Scaling Matrix</h2>
      <p class="section-subtitle">Secure the proper horsepower for your design automation production cycles.</p>
    </div>
    <div class="pricing-grid">
      <div class="price-card">
        <div class="price-header">
          <h3 class="plan-name">Sandbox</h3>
          <div class="plan-desc">For individual prototyping</div>
          <div class="price-value">$0 <span class="price-term">/ forever</span></div>
        </div>
        <ul class="plan-features">
          <li>✓ Visual Layout Canvas</li>
          <li>✓ Core 5 Section Templates</li>
          <li>✓ Standalone HTML Export</li>
          <li class="disabled">✗ Dynamic Brand Scraper</li>
          <li class="disabled">✗ Unlimited ZIP Packages</li>
        </ul>
        <a href="#contact" class="price-btn">Begin Prototyping</a>
      </div>
      <div class="price-card popular">
        <div class="popular-ribbon">POPULAR ENGINE</div>
        <div class="price-header">
          <h3 class="plan-name">Enterprise Factory</h3>
          <div class="plan-desc">For production design automation</div>
          <div class="price-value">$49 <span class="price-term">/ month</span></div>
        </div>
        <ul class="plan-features">
          <li>✓ Visual Layout Canvas</li>
          <li>✓ Access All Section Templates</li>
          <li>✓ Dynamic Brand Color Scraper</li>
          <li>✓ Single-Click Client ZIP Exporter</li>
          <li>✓ Formspree Token Automation</li>
          <li>✓ VIP Infrastructure Support</li>
        </ul>
        <a href="#contact" class="price-btn popular-btn">Acquire License</a>
      </div>
    </div>
  </div>
</section>
    `,
    css: `
/* Pricing Scoped Styles */
.pricing-wrapper {
  padding: 80px 24px;
  background-color: var(--color-bg, #06050b);
  font-family: var(--font-family, 'Outfit', sans-serif);
}

.pricing-container {
  max-width: var(--container-width, 1200px);
  margin: 0 auto;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
  max-width: 800px;
  margin: 0 auto;
}

.price-card {
  background: rgba(255, 255, 255, 0.01);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: var(--border-radius, 12px);
  padding: 40px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all 0.3s ease;
}

.price-card:hover {
  transform: translateY(-4px);
  border-color: rgba(255, 255, 255, 0.08);
}

.price-card.popular {
  background: rgba(139, 92, 246, 0.02);
  border-color: var(--color-primary-glow, rgba(139, 92, 246, 0.3));
  box-shadow: 0 15px 30px rgba(139, 92, 246, 0.08);
}

.price-card.popular:hover {
  border-color: var(--color-primary, #8b5cf6);
  box-shadow: 0 15px 35px rgba(139, 92, 246, 0.15);
}

.popular-ribbon {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 9px;
  font-weight: 700;
  color: #ffffff;
  background: var(--color-primary, #8b5cf6);
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

.price-header {
  margin-bottom: 30px;
}

.plan-name {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 6px;
}

.plan-desc {
  font-size: 13px;
  color: var(--color-text-muted, #9ca3af);
  margin-bottom: 20px;
}

.price-value {
  font-size: 38px;
  font-weight: 800;
  color: #ffffff;
}

.price-term {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted, #9ca3af);
}

.plan-features {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 36px;
  flex: 1;
}

.plan-features li {
  font-size: 13.5px;
  color: var(--color-text, #ffffff);
}

.plan-features li.disabled {
  color: rgba(255, 255, 255, 0.2);
}

.price-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  padding: 12px;
  border-radius: var(--border-radius, 8px);
  text-align: center;
  transition: all 0.25s ease;
}

.price-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.popular-btn {
  background: var(--color-primary, #8b5cf6);
  border: none;
  box-shadow: 0 4px 12px var(--color-primary-glow, rgba(139, 92, 246, 0.3));
}

.popular-btn:hover {
  background: #7c3aed;
  box-shadow: 0 6px 16px var(--color-primary-glow, rgba(139, 92, 246, 0.45));
}

@media (max-width: 768px) {
  .pricing-grid {
    grid-template-columns: 1fr;
  }
}
    `
  },

  contact: {
    id: 'contact',
    name: 'Frictionless Contact Form',
    category: 'Conversion',
    description: 'Split information layout featuring active Formspree-wrapped input nodes.',
    html: `
<section id="section-contact" class="contact-wrapper">
  <div class="contact-container">
    <div class="contact-grid">
      <div class="contact-info">
        <span class="section-tag">COMMUNICATION TERMINAL</span>
        <h2 class="contact-title">Initiate Contact Matrix</h2>
        <p class="contact-desc">Transmit variables into our data buffer. Our active responder units will process your connection sequence.</p>
        
        <div class="info-blocks">
          <div class="info-block">
            <div class="info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 9.92z"/></svg>
            </div>
            <div>
              <div class="info-label">Direct Communication</div>
              <div class="info-val">+1 (800) 555-0199</div>
            </div>
          </div>
          <div class="info-block">
            <div class="info-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div>
              <div class="info-label">Email Uplink</div>
              <div class="info-val">uplink@aura.design</div>
            </div>
          </div>
        </div>
      </div>
      <div class="contact-card">
        <!-- Frictionless Form Action Targeting Standardized Placeholders -->
        <form id="contact-form" action="https://formspree.io/f/{{CONTACT_EMAIL}}" method="POST" class="contact-form">
          <div class="form-row">
            <div class="form-input-wrapper">
              <label for="contact-name" class="client-label">Full Name</label>
              <input type="text" id="contact-name" name="name" required placeholder="Alexander Vance" class="client-input">
            </div>
          </div>
          <div class="form-row">
            <div class="form-input-wrapper">
              <label for="contact-email" class="client-label">Email Address</label>
              <input type="email" id="contact-email" name="email" required placeholder="alexander@domain.com" class="client-input">
            </div>
          </div>
          <div class="form-row">
            <div class="form-input-wrapper">
              <label for="contact-message" class="client-label">Detailed Transmission</label>
              <textarea id="contact-message" name="message" required rows="4" placeholder="Brief outline of your design scaling parameters..." class="client-textarea"></textarea>
            </div>
          </div>
          <button type="submit" id="contact-submit" class="contact-submit-btn">Transmit Variable Packet</button>
        </form>
      </div>
    </div>
  </div>
</section>
    `,
    css: `
/* Contact Scoped Styles */
.contact-wrapper {
  padding: 80px 24px;
  background-color: var(--color-bg, #06050b);
  font-family: var(--font-family, 'Outfit', sans-serif);
}

.contact-container {
  max-width: var(--container-width, 1200px);
  margin: 0 auto;
}

.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 60px;
  align-items: center;
}

.contact-info {
  display: flex;
  flex-direction: column;
}

.contact-title {
  font-size: 32px;
  font-weight: 800;
  color: #ffffff;
  margin-top: 8px;
  margin-bottom: 16px;
  letter-spacing: -0.5px;
}

.contact-desc {
  font-size: 14.5px;
  color: var(--color-text-muted, #9ca3af);
  line-height: 1.6;
  margin-bottom: 36px;
}

.info-blocks {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-block {
  display: flex;
  align-items: center;
  gap: 16px;
}

.info-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary, #8b5cf6);
}

.info-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted, #9ca3af);
  text-transform: uppercase;
}

.info-val {
  font-size: 14.5px;
  font-weight: 600;
  color: #ffffff;
}

.contact-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius, 12px);
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.client-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted, #9ca3af);
}

.client-input, .client-textarea {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  color: #ffffff;
  padding: 12px 14px;
  font-family: var(--font-family, 'Outfit', sans-serif);
  font-size: 14px;
  outline: none;
  transition: all 0.25s ease;
}

.client-input:focus, .client-textarea:focus {
  border-color: var(--color-primary, #8b5cf6);
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 0 8px var(--color-primary-glow, rgba(139, 92, 246, 0.15));
}

.contact-submit-btn {
  background: linear-gradient(135deg, var(--color-primary, #8b5cf6), var(--color-accent, #06b6d4));
  color: #ffffff;
  border: none;
  font-weight: 600;
  font-size: 14.5px;
  padding: 14px;
  border-radius: var(--border-radius, 8px);
  cursor: pointer;
  box-shadow: 0 4px 15px var(--color-primary-glow, rgba(139, 92, 246, 0.3));
  transition: all 0.25s ease;
}

.contact-submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--color-primary-glow, rgba(139, 92, 246, 0.45));
}

@media (max-width: 768px) {
  .contact-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}
    `
  },

  footer: {
    id: 'footer',
    name: 'Clean Multi-Column Footer',
    category: 'Navigation',
    description: 'Structured bottom segment with social anchors, links, and license notes.',
    html: `
<footer id="section-footer" class="footer-wrapper">
  <div class="footer-container">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="footer-logo">AURA.DESIGN</span>
        <p class="footer-tagline">Automating the visual architectures of the high-velocity web.</p>
      </div>
      <div class="footer-links-grid">
        <div class="footer-column">
          <h4>Mechanics</h4>
          <a href="#features">Components</a>
          <a href="#stats">Performance</a>
          <a href="#pricing">Price Matrix</a>
        </div>
        <div class="footer-column">
          <h4>Social Buffer</h4>
          <a href="#">Github</a>
          <a href="#">Twitter</a>
          <a href="#">LinkedIn</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <span class="footer-copy">© 2026 AURA.DESIGN. Open Source under MIT.</span>
      <span class="footer-badge">VERIFIED BUILD</span>
    </div>
  </div>
</footer>
    `,
    css: `
/* Footer Scoped Styles */
.footer-wrapper {
  padding: 60px 24px 30px 24px;
  background-color: #030206;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  font-family: var(--font-family, 'Outfit', sans-serif);
}

.footer-container {
  max-width: var(--container-width, 1200px);
  margin: 0 auto;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  margin-bottom: 40px;
}

.footer-brand {
  max-width: 320px;
}

.footer-logo {
  font-size: 18px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.5px;
  display: block;
  margin-bottom: 12px;
}

.footer-tagline {
  font-size: 13px;
  color: var(--color-text-muted, #9ca3af);
  line-height: 1.6;
}

.footer-links-grid {
  display: flex;
  gap: 60px;
}

.footer-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-column h4 {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: #ffffff;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.footer-column a {
  font-size: 13px;
  color: var(--color-text-muted, #9ca3af);
  text-decoration: none;
  transition: all 0.25s ease;
}

.footer-column a:hover {
  color: var(--color-primary, #8b5cf6);
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-copy {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
}

.footer-badge {
  font-size: 9px;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
}

@media (max-width: 600px) {
  .footer-top {
    flex-direction: column;
    gap: 30px;
  }
  .footer-links-grid {
    gap: 40px;
  }
}
    `
  }
};
