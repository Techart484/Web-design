// ============================================================
// AUTONOMOUS WEB DESIGNER ENGINE — Motion Library
// Framer-motion-style vanilla JS micro-animations.
// Injected into Stage 04 (Visual Signature) output.
// ============================================================

const MotionLib = {
  _io: null,  // Shared IntersectionObserver instance
  _observed: new WeakSet(),

  // ── Init: Attach observer + scroll handler ─────────────────
  init() {
    this._io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const anim = el.dataset.motion;
          this._trigger(el, anim);
          this._io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    // Auto-bind all elements with [data-motion] attribute
    this._bindAll();

    // Scroll parallax
    window.addEventListener('scroll', this._onScroll.bind(this), { passive: true });

    // Inject keyframes into document if not already present
    if (!document.getElementById('motion-lib-keyframes')) {
      this._injectKeyframes();
    }
  },

  // ── Bind all [data-motion] elements ───────────────────────
  _bindAll() {
    document.querySelectorAll('[data-motion]').forEach(el => {
      if (this._observed.has(el)) return;
      el.style.opacity = '0';
      this._observed.add(el);
      this._io && this._io.observe(el);
    });
  },

  // ── Trigger Animation ─────────────────────────────────────
  _trigger(el, animType) {
    const delay = parseFloat(el.dataset.motionDelay || '0') * 1000;
    setTimeout(() => {
      el.style.transition = `opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)`;
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.classList.add('motion-triggered');
    }, delay);
  },

  // ── Preset: Fade In Up ────────────────────────────────────
  fadeInUp(el, delay = 0) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.dataset.motion = 'fade-up';
    el.dataset.motionDelay = String(delay);
    if (this._io) {
      this._observed.add(el);
      this._io.observe(el);
    }
    return this;
  },

  // ── Preset: Fade In Left ──────────────────────────────────
  fadeInLeft(el, delay = 0) {
    el.style.opacity = '0';
    el.style.transform = 'translateX(-32px)';
    el.dataset.motion = 'fade-left';
    el.dataset.motionDelay = String(delay);
    if (this._io) {
      this._observed.add(el);
      this._io.observe(el);
    }
    return this;
  },

  // ── Preset: Scale In ─────────────────────────────────────
  scaleIn(el, delay = 0) {
    el.style.opacity = '0';
    el.style.transform = 'scale(0.92)';
    el.dataset.motion = 'scale-in';
    el.dataset.motionDelay = String(delay);
    if (this._io) {
      this._observed.add(el);
      this._io.observe(el);
    }
    return this;
  },

  // ── Preset: Stagger Children ──────────────────────────────
  staggerChildren(parent, selector = '[data-stagger]', baseDelay = 0, step = 0.08) {
    const children = parent.querySelectorAll(selector);
    children.forEach((child, i) => {
      this.fadeInUp(child, baseDelay + i * step);
    });
    return this;
  },

  // ── Preset: Glow Pulse (CSS animation inject) ─────────────
  glowPulse(el, color = null) {
    const c = color || getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#8b5cf6';
    el.style.animation = 'motion-glow-pulse 2.5s ease-in-out infinite';
    el.style.setProperty('--glow-color', c);
    return this;
  },

  // ── Preset: Magnetic Hover ────────────────────────────────
  magneticHover(el, strength = 0.3) {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * strength;
      const dy = (e.clientY - cy) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = 'transform 0.1s ease';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
      el.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    });
    return this;
  },

  // ── Preset: Parallax Scroll ───────────────────────────────
  parallaxScroll(el, factor = 0.15) {
    el.dataset.parallax = String(factor);
    return this;
  },

  _onScroll() {
    const scrollY = window.scrollY;
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const factor = parseFloat(el.dataset.parallax);
      const rect = el.getBoundingClientRect();
      const relY = (scrollY + rect.top) - window.innerHeight / 2;
      el.style.transform = `translateY(${relY * factor}px)`;
    });
  },

  // ── Preset: Typewriter Text ───────────────────────────────
  typewriter(el, speed = 40) {
    const text = el.textContent;
    el.textContent = '';
    el.style.opacity = '1';
    let i = 0;
    const interval = setInterval(() => {
      el.textContent += text[i++];
      if (i >= text.length) clearInterval(interval);
    }, speed);
    return this;
  },

  // ── Preset: Counter Animate ───────────────────────────────
  countUp(el, from = 0, to = null, duration = 1800, suffix = '') {
    const target = to !== null ? to : parseInt(el.textContent.replace(/[^0-9]/g, ''));
    const startTime = performance.now();
    el.style.opacity = '1';
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(from + (target - from) * eased) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return this;
  },

  // ── Apply Motion Library to Active Canvas ─────────────────
  applyToCanvas(iframeDoc) {
    if (!iframeDoc) return;

    // Inject motion keyframes into iframe
    const style = iframeDoc.createElement('style');
    style.id = 'motion-lib-iframe';
    style.textContent = this._getKeyframeCSS();
    iframeDoc.head.appendChild(style);

    // Inject motion observer script into iframe
    const script = iframeDoc.createElement('script');
    script.textContent = `
(function() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const delay = parseFloat(el.dataset.motionDelay || '0') * 1000;
        setTimeout(() => {
          el.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)';
          el.style.opacity = '1';
          el.style.transform = 'none';
        }, delay);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('[data-motion]').forEach(el => {
    el.style.opacity = '0';
    if (el.dataset.motion === 'fade-up') el.style.transform = 'translateY(24px)';
    if (el.dataset.motion === 'fade-left') el.style.transform = 'translateX(-32px)';
    if (el.dataset.motion === 'scale-in') el.style.transform = 'scale(0.92)';
    io.observe(el);
  });
})();
    `;
    iframeDoc.body.appendChild(script);
  },

  // ── Generate Motion-Annotated HTML ───────────────────────
  annotateHTML(html) {
    // Add data-motion attributes to common section patterns
    return html
      .replace(/<(h1|h2)(\s)/g, '<$1 data-motion="fade-up"$2')
      .replace(/class="(hero-tag|section-tag)"/g, 'class="$1" data-motion="fade-left" data-motion-delay="0.05"')
      .replace(/class="(feature-card|price-card|stat-box)"/g, 'class="$1" data-motion="fade-up" data-stagger')
      .replace(/class="(hero-btn-primary|hero-btn-secondary|contact-submit-btn)"/g, 'class="$1" data-motion="scale-in"');
  },

  // ── Keyframe CSS String ───────────────────────────────────
  _getKeyframeCSS() {
    return `
@keyframes motion-glow-pulse {
  0%, 100% { box-shadow: 0 0 12px 0px var(--glow-color, #8b5cf6); }
  50% { box-shadow: 0 0 28px 6px var(--glow-color, #8b5cf6); }
}
@keyframes motion-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
@keyframes motion-shimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes motion-spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.motion-float { animation: motion-float 4s ease-in-out infinite; }
.motion-shimmer {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
  background-size: 200% auto;
  animation: motion-shimmer 2.5s linear infinite;
}
`;
  },

  _injectKeyframes() {
    const style = document.createElement('style');
    style.id = 'motion-lib-keyframes';
    style.textContent = this._getKeyframeCSS();
    document.head.appendChild(style);
  }
};
