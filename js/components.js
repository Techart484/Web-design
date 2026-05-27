// Web Design Automation Factory - Parametrized Component Registry
// All components use {TOKEN} placeholders for dynamic content injection

const WebComponents = {
  navbar: {
    id: 'navbar',
    name: 'Glassmorphic Navbar',
    category: 'Navigation',
    description: 'Ultra-modern navigation bar with fluid styling controls and active button.',
    template: `
<nav id="section-navbar" class="navbar-wrapper">
  <div class="nav-container">
    <div class="nav-brand">
      <div class="brand-glow"></div>
      <span class="brand-text">{BUSINESS_NAME}</span>
    </div>
    <div class="nav-links">
      <a href="#features" class="nav-link">Features</a>
      <a href="#stats" class="nav-link">Services</a>
      <a href="#pricing" class="nav-link">Pricing</a>
      <a href="#contact" class="nav-link">Contact</a>
    </div>
    <div class="nav-actions">
      <a href="#contact" class="nav-cta">{HERO_CTA}</a>
    </div>
    <button class="mobile-toggle" aria-label="Toggle Menu">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>
    `,
    defaultParams: { BUSINESS_NAME: 'Brand', HERO_CTA: 'Get Started' },
    css: `
.navbar-wrapper { position: sticky; top: 0; width: 100%; z-index: 1000; background: var(--nav-bg, rgba(14, 12, 21, 0.7)); backdrop-filter: blur(20px); border-bottom: 1px solid var(--nav-border, rgba(255, 255, 255, 0.05)); font-family: var(--font-family, 'Outfit', sans-serif); transition: all 0.3s ease; }
.nav-container { max-width: var(--container-width, 1200px); margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
.nav-brand { display: flex; align-items: center; gap: 10px; position: relative; }
.brand-glow { position: absolute; width: 32px; height: 32px; background: var(--color-primary, #8b5cf6); filter: blur(15px); opacity: 0.5; border-radius: 50%; }
.brand-text { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(135deg, #ffffff, rgba(255,255,255,0.7)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.nav-links { display: flex; align-items: center; gap: 32px; }
.nav-link { color: var(--color-text-muted, #9ca3af); text-decoration: none; font-size: 14px; font-weight: 500; transition: all 0.25s ease; }
.nav-link:hover { color: var(--color-primary, #8b5cf6); }
.nav-cta { background: linear-gradient(135deg, var(--color-primary, #8b5cf6), var(--color-accent, #06b6d4)); color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 8px 20px; border-radius: var(--border-radius, 8px); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25); transition: all 0.25s ease; }
.nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4); }
.mobile-toggle { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; }
.mobile-toggle span { width: 24px; height: 2px; background-color: #ffffff; transition: all 0.3s ease; }
@media (max-width: 768px) { .nav-links, .nav-actions { display: none; } .mobile-toggle { display: flex; } }
    `
  },

  hero: {
    id: 'hero',
    name: 'Sleek Split Hero',
    category: 'Header',
    description: 'Split section with gradient headline and social proof.',
    template: `
<section id="section-hero" class="hero-wrapper">
  <div class="hero-glow-1"></div>
  <div class="hero-glow-2"></div>
  <div class="hero-container">
    <div class="hero-content">
      <div class="hero-tag">{HERO_TAG}</div>
      <h1 class="hero-title">{HERO_HEADLINE}</h1>
      <p class="hero-subtitle">{HERO_SUBHEADLINE}</p>
      <div class="hero-actions">
        <a href="#contact" class="hero-btn-primary">{HERO_CTA}</a>
        <a href="#features" class="hero-btn-secondary">Learn More</a>
      </div>
      <div class="hero-badges">
        <span class="badge-text">✓ {HERO_BADGE_1}</span>
        <span class="badge-text">✓ {HERO_BADGE_2}</span>
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
        <div class="mockup-code"><pre><code><span class="keyword">:root</span> { --primary: <span class="string">{PRIMARY_COLOR}</span>; --accent: <span class="string">{ACCENT_COLOR}</span>; }</code></pre></div>
      </div>
    </div>
  </div>
</section>
    `,
    defaultParams: {
      HERO_TAG: 'Premium Solution',
      HERO_HEADLINE: 'Welcome to {BUSINESS_NAME}',
      HERO_SUBHEADLINE: 'Discover amazing possibilities',
      HERO_CTA: 'Get Started',
      HERO_BADGE_1: 'Quality Assured',
      HERO_BADGE_2: 'Fast & Reliable',
      PRIMARY_COLOR: '#8b5cf6',
      ACCENT_COLOR: '#06b6d4'
    },
    css: `
.hero-wrapper { padding: 100px 24px; background-color: var(--color-bg, #06050b); position: relative; overflow: hidden; font-family: var(--font-family, 'Outfit', sans-serif); }
.hero-glow-1 { position: absolute; top: -10%; left: 20%; width: 400px; height: 400px; background: radial-gradient(circle, var(--color-primary-glow, rgba(139, 92, 246, 0.15)) 0%, rgba(0, 0, 0, 0) 70%); filter: blur(40px); pointer-events: none; }
.hero-glow-2 { position: absolute; bottom: 0; right: 10%; width: 500px; height: 500px; background: radial-gradient(circle, var(--color-accent-glow, rgba(6, 182, 212, 0.1)) 0%, rgba(0, 0, 0, 0) 70%); filter: blur(45px); pointer-events: none; }
.hero-container { max-width: var(--container-width, 1200px); margin: 0 auto; display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 48px; align-items: center; }
.hero-content { display: flex; flex-direction: column; align-items: flex-start; z-index: 2; }
.hero-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-accent, #06b6d4); background: var(--color-accent-glow, rgba(6, 182, 212, 0.15)); border: 1px solid rgba(6, 182, 212, 0.2); padding: 4px 10px; border-radius: 4px; letter-spacing: 1px; margin-bottom: 20px; }
.hero-title { font-size: 48px; font-weight: 800; line-height: 1.15; letter-spacing: -1px; color: #ffffff; margin-bottom: 20px; }
.gradient-text { background: linear-gradient(135deg, var(--color-primary, #8b5cf6), var(--color-accent, #06b6d4)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { font-size: 17px; line-height: 1.6; color: var(--color-text-muted, #9ca3af); margin-bottom: 32px; }
.hero-actions { display: flex; gap: 16px; margin-bottom: 40px; }
.hero-btn-primary { background: var(--color-primary, #8b5cf6); color: white; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: var(--border-radius, 8px); box-shadow: 0 4px 15px var(--color-primary-glow, rgba(139, 92, 246, 0.3)); transition: all 0.25s ease; }
.hero-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px var(--color-primary-glow, rgba(139, 92, 246, 0.45)); }
.hero-btn-secondary { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 28px; border-radius: var(--border-radius, 8px); transition: all 0.25s ease; }
.hero-btn-secondary:hover { background: rgba(255, 255, 255, 0.08); }
.hero-badges { display: flex; gap: 20px; }
.badge-text { font-size: 13px; font-weight: 500; color: var(--color-text-muted, #9ca3af); }
.hero-visual { display: flex; justify-content: center; z-index: 2; }
.mockup-frame { width: 100%; background: rgba(14, 12, 21, 0.6); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 12px; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6); backdrop-filter: blur(10px); overflow: hidden; }
.mockup-header { height: 40px; background: rgba(255, 255, 255, 0.02); border-bottom: 1px solid rgba(255, 255, 255, 0.05); display: flex; align-items: center; padding: 0 16px; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; }
.dot.red { background: #ff5f56; }
.dot.yellow { background: #ffbd2e; }
.dot.green { background: #27c93f; }
.mockup-tab { margin-left: 20px; font-size: 11px; font-family: monospace; color: var(--color-text-muted, #9ca3af); background: rgba(255, 255, 255, 0.05); padding: 4px 10px; border-radius: 4px 4px 0 0; }
.mockup-code { padding: 24px; font-family: monospace; font-size: 13px; line-height: 1.6; }
.keyword { color: #f43f5e; }
.string { color: #10b981; }
.number { color: #f59e0b; }
.property { color: #06b6d4; }
.comment { color: #6b7280; }
@media (max-width: 968px) { .hero-container { grid-template-columns: 1fr; gap: 32px; text-align: center; } .hero-content { align-items: center; } .hero-actions, .hero-badges { justify-content: center; } }
    `
  },

  features: {
    id: 'features',
    name: 'Neon Features Grid',
    category: 'Features',
    description: 'Glowing grid cards with hover-scaling SVG icon shapes.',
    template: `
<section id="section-features" class="features-wrapper">
  <div class="features-container">
    <div class="section-header">
      <span class="section-tag">{FEATURES_TAG}</span>
      <h2 class="section-title">{FEATURES_TITLE}</h2>
      <p class="section-subtitle">{FEATURES_SUBTITLE}</p>
    </div>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
        <h3 class="feature-name">{FEATURE_1_TITLE}</h3>
        <p class="feature-desc">{FEATURE_1_DESC}</p>
      </div>
      <div class="feature-card highlighted">
        <div class="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div>
        <h3 class="feature-name">{FEATURE_2_TITLE}</h3>
        <p class="feature-desc">{FEATURE_2_DESC}</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>
        <h3 class="feature-name">{FEATURE_3_TITLE}</h3>
        <p class="feature-desc">{FEATURE_3_DESC}</p>
      </div>
    </div>
  </div>
</section>
    `,
    defaultParams: {
      FEATURES_TAG: 'Key Capabilities',
      FEATURES_TITLE: 'Powerful Features',
      FEATURES_SUBTITLE: 'Everything you need to succeed',
      FEATURE_1_TITLE: 'Feature One',
      FEATURE_1_DESC: 'Exceptional quality and reliability',
      FEATURE_2_TITLE: 'Feature Two',
      FEATURE_2_DESC: 'Industry-leading performance',
      FEATURE_3_TITLE: 'Feature Three',
      FEATURE_3_DESC: 'Complete solution package'
    },
    css: `
.features-wrapper { padding: 80px 24px; background-color: var(--color-bg, #06050b); font-family: var(--font-family, 'Outfit', sans-serif); }
.features-container { max-width: var(--container-width, 1200px); margin: 0 auto; }
.section-header { text-align: center; margin-bottom: 60px; }
.section-tag { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-accent, #06b6d4); background: var(--color-accent-glow, rgba(6, 182, 212, 0.15)); border: 1px solid rgba(6, 182, 212, 0.2); padding: 4px 10px; border-radius: 4px; letter-spacing: 1px; display: inline-block; margin-bottom: 12px; }
.section-title { font-size: 42px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
.section-subtitle { font-size: 16px; color: var(--color-text-muted, #9ca3af); max-width: 600px; margin: 0 auto; }
.features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.feature-card { background: rgba(14, 12, 21, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 32px; transition: all 0.3s ease; }
.feature-card:hover { background: rgba(14, 12, 21, 0.6); border-color: rgba(255, 255, 255, 0.15); transform: translateY(-4px); }
.feature-card.highlighted { border: 1px solid var(--color-primary, #8b5cf6); background: rgba(139, 92, 246, 0.05); }
.feature-icon { width: 48px; height: 48px; background: var(--color-accent-glow, rgba(6, 182, 212, 0.1)); border: 1px solid rgba(6, 182, 212, 0.3); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--color-accent, #06b6d4); margin-bottom: 20px; }
.feature-name { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
.feature-desc { font-size: 14px; color: var(--color-text-muted, #9ca3af); line-height: 1.6; }
@media (max-width: 968px) { .features-grid { grid-template-columns: 1fr; } }
    `
  },

  stats: {
    id: 'stats',
    name: 'Metrics Strip',
    category: 'Social Proof',
    description: 'Fast-scanning proof and credibility bar.',
    template: `
<section id="section-stats" class="stats-wrapper">
  <div class="stats-container">
    <div class="stat-card">
      <div class="stat-value">{STAT_1_VALUE}</div>
      <div class="stat-label">{STAT_1_LABEL}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{STAT_2_VALUE}</div>
      <div class="stat-label">{STAT_2_LABEL}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{STAT_3_VALUE}</div>
      <div class="stat-label">{STAT_3_LABEL}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{STAT_4_VALUE}</div>
      <div class="stat-label">{STAT_4_LABEL}</div>
    </div>
  </div>
</section>
    `,
    defaultParams: {
      STAT_1_VALUE: '10K+',
      STAT_1_LABEL: 'Happy Customers',
      STAT_2_VALUE: '99.9%',
      STAT_2_LABEL: 'Uptime',
      STAT_3_VALUE: '24/7',
      STAT_3_LABEL: 'Support',
      STAT_4_VALUE: '50+',
      STAT_4_LABEL: 'Countries'
    },
    css: `
.stats-wrapper { padding: 60px 24px; background-color: var(--color-bg, #06050b); font-family: var(--font-family, 'Outfit', sans-serif); }
.stats-container { max-width: var(--container-width, 1200px); margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
.stat-card { background: rgba(14, 12, 21, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 32px; text-align: center; }
.stat-value { font-size: 36px; font-weight: 800; background: linear-gradient(135deg, var(--color-primary, #8b5cf6), var(--color-accent, #06b6d4)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
.stat-label { font-size: 14px; color: var(--color-text-muted, #9ca3af); }
@media (max-width: 768px) { .stats-container { grid-template-columns: repeat(2, 1fr); } }
    `
  },

  pricing: {
    id: 'pricing',
    name: 'Pricing Stack',
    category: 'Pricing',
    description: 'Conversion-focused plan cards.',
    template: `
<section id="section-pricing" class="pricing-wrapper">
  <div class="pricing-container">
    <div class="pricing-header">
      <h2 class="pricing-title">{PRICING_TITLE}</h2>
      <p class="pricing-subtitle">{PRICING_SUBTITLE}</p>
    </div>
    <div class="pricing-grid">
      <div class="pricing-card">
        <h3 class="plan-name">{PLAN_1_NAME}</h3>
        <div class="plan-price">{PLAN_1_PRICE}</div>
        <p class="plan-desc">{PLAN_1_DESC}</p>
        <button class="plan-btn">{PLAN_CTA}</button>
      </div>
      <div class="pricing-card popular">
        <div class="plan-badge">Popular</div>
        <h3 class="plan-name">{PLAN_2_NAME}</h3>
        <div class="plan-price">{PLAN_2_PRICE}</div>
        <p class="plan-desc">{PLAN_2_DESC}</p>
        <button class="plan-btn primary">{PLAN_CTA}</button>
      </div>
    </div>
  </div>
</section>
    `,
    defaultParams: {
      PRICING_TITLE: 'Simple Pricing',
      PRICING_SUBTITLE: 'Transparent, no hidden fees',
      PLAN_1_NAME: 'Starter',
      PLAN_1_PRICE: 'Free',
      PLAN_1_DESC: 'Perfect for getting started',
      PLAN_2_NAME: 'Professional',
      PLAN_2_PRICE: '$99/mo',
      PLAN_2_DESC: 'For growing teams',
      PLAN_CTA: 'Get Started'
    },
    css: `
.pricing-wrapper { padding: 80px 24px; background-color: var(--color-bg, #06050b); font-family: var(--font-family, 'Outfit', sans-serif); }
.pricing-container { max-width: var(--container-width, 1200px); margin: 0 auto; }
.pricing-header { text-align: center; margin-bottom: 60px; }
.pricing-title { font-size: 42px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
.pricing-subtitle { font-size: 16px; color: var(--color-text-muted, #9ca3af); }
.pricing-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; max-width: 800px; margin: 0 auto; }
.pricing-card { background: rgba(14, 12, 21, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 40px 32px; position: relative; transition: all 0.3s ease; }
.pricing-card.popular { border: 1px solid var(--color-primary, #8b5cf6); background: rgba(139, 92, 246, 0.08); transform: scale(1.05); }
.plan-badge { position: absolute; top: -12px; left: 20px; background: var(--color-primary, #8b5cf6); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
.plan-name { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
.plan-price { font-size: 36px; font-weight: 800; color: var(--color-primary, #8b5cf6); margin-bottom: 12px; }
.plan-desc { font-size: 14px; color: var(--color-text-muted, #9ca3af); margin-bottom: 24px; }
.plan-btn { background: rgba(255, 255, 255, 0.08); color: white; border: 1px solid rgba(255, 255, 255, 0.1); padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; width: 100%; transition: all 0.3s ease; }
.plan-btn.primary { background: var(--color-primary, #8b5cf6); border-color: var(--color-primary, #8b5cf6); }
.plan-btn:hover { background: var(--color-primary, #8b5cf6); border-color: var(--color-primary, #8b5cf6); }
@media (max-width: 768px) { .pricing-grid { grid-template-columns: 1fr; } .pricing-card.popular { transform: scale(1); } }
    `
  },

  contact: {
    id: 'contact',
    name: 'Contact Block',
    category: 'Forms',
    description: 'Form and trust details with email binding.',
    template: `
<section id="section-contact" class="contact-wrapper">
  <div class="contact-container">
    <div class="contact-content">
      <h2 class="contact-title">{CONTACT_TITLE}</h2>
      <p class="contact-subtitle">{CONTACT_SUBTITLE}</p>
      <div class="contact-info">
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">{CONTACT_EMAIL}</div>
        </div>
        {CONTACT_PHONE_DISPLAY}
        {CONTACT_ADDRESS_DISPLAY}
      </div>
    </div>
    <form class="contact-form">
      <input type="text" placeholder="Your Name" required />
      <input type="email" placeholder="Email Address" required />
      <textarea placeholder="Tell us about your project" rows="5" required></textarea>
      <button type="submit" class="form-btn">{CONTACT_BUTTON_TEXT}</button>
    </form>
  </div>
</section>
    `,
    defaultParams: {
      CONTACT_TITLE: 'Get In Touch',
      CONTACT_SUBTITLE: 'We\'d love to hear from you. Send us a message!',
      CONTACT_EMAIL: 'hello@example.com',
      CONTACT_PHONE_DISPLAY: '',
      CONTACT_ADDRESS_DISPLAY: '',
      CONTACT_BUTTON_TEXT: 'Send Message'
    },
    css: `
.contact-wrapper { padding: 80px 24px; background-color: var(--color-bg, #06050b); font-family: var(--font-family, 'Outfit', sans-serif); }
.contact-container { max-width: var(--container-width, 1200px); margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: start; }
.contact-title { font-size: 36px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
.contact-subtitle { font-size: 16px; color: var(--color-text-muted, #9ca3af); margin-bottom: 40px; }
.contact-info { display: flex; flex-direction: column; gap: 24px; }
.info-item { }
.info-label { font-size: 12px; text-transform: uppercase; color: var(--color-accent, #06b6d4); font-weight: 600; letter-spacing: 1px; margin-bottom: 4px; }
.info-value { font-size: 16px; color: #ffffff; }
.contact-form { display: flex; flex-direction: column; gap: 16px; }
.contact-form input, .contact-form textarea { background: rgba(14, 12, 21, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px 16px; color: #ffffff; font-family: inherit; font-size: 14px; transition: all 0.3s ease; }
.contact-form input::placeholder, .contact-form textarea::placeholder { color: var(--color-text-muted, #9ca3af); }
.contact-form input:focus, .contact-form textarea:focus { outline: none; border-color: var(--color-primary, #8b5cf6); background: rgba(14, 12, 21, 0.6); }
.form-btn { background: var(--color-primary, #8b5cf6); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
.form-btn:hover { background: var(--color-accent, #06b6d4); }
@media (max-width: 968px) { .contact-container { grid-template-columns: 1fr; gap: 40px; } }
    `
  },

  footer: {
    id: 'footer',
    name: 'Footer',
    category: 'Footer',
    description: 'Multi-column closing area with link groups.',
    template: `
<footer id="section-footer" class="footer-wrapper">
  <div class="footer-container">
    <div class="footer-brand">
      <div class="footer-brand-name">{BUSINESS_NAME}</div>
      <div class="footer-brand-desc">{FOOTER_DESCRIPTION}</div>
    </div>
    <div class="footer-links">
      <div class="footer-column">
        <div class="footer-column-title">Product</div>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
      </div>
      <div class="footer-column">
        <div class="footer-column-title">Company</div>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
      </div>
      <div class="footer-column">
        <div class="footer-column-title">Follow</div>
        <a href="#">Twitter</a>
        <a href="#">LinkedIn</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <p>&copy; {FOOTER_YEAR} {BUSINESS_NAME}. All rights reserved.</p>
  </div>
</footer>
    `,
    defaultParams: {
      BUSINESS_NAME: 'Brand',
      FOOTER_DESCRIPTION: 'Premium solutions for modern businesses',
      FOOTER_YEAR: new Date().getFullYear()
    },
    css: `
.footer-wrapper { background-color: var(--color-bg, #06050b); border-top: 1px solid rgba(255, 255, 255, 0.05); font-family: var(--font-family, 'Outfit', sans-serif); }
.footer-container { max-width: var(--container-width, 1200px); margin: 0 auto; padding: 60px 24px 40px; display: grid; grid-template-columns: 1fr 2fr; gap: 80px; }
.footer-brand { }
.footer-brand-name { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 8px; }
.footer-brand-desc { font-size: 14px; color: var(--color-text-muted, #9ca3af); max-width: 300px; }
.footer-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
.footer-column-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--color-accent, #06b6d4); letter-spacing: 1px; margin-bottom: 16px; }
.footer-column a { display: block; font-size: 14px; color: var(--color-text-muted, #9ca3af); text-decoration: none; margin-bottom: 12px; transition: color 0.3s ease; }
.footer-column a:hover { color: var(--color-primary, #8b5cf6); }
.footer-bottom { max-width: var(--container-width, 1200px); margin: 0 auto; padding: 20px 24px; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center; font-size: 14px; color: var(--color-text-muted, #9ca3af); }
@media (max-width: 768px) { .footer-container { grid-template-columns: 1fr; gap: 40px; } .footer-links { grid-template-columns: 1fr; } }
    `
  }
};

function renderComponent(componentId, params = {}) {
  const component = WebComponents[componentId];
  if (!component) return { html: '', css: component?.css || '' };

  let html = component.template || '';
  const allParams = { ...component.defaultParams, ...params };

  for (const [key, value] of Object.entries(allParams)) {
    if (value !== null && value !== undefined) {
      const regex = new RegExp(`{${key}}`, 'g');
      html = html.replace(regex, String(value));
    }
  }

  return { html, css: component.css };
}
