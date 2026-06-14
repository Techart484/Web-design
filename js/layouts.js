const LAYOUT_ARCHETYPES = {
  'ecommerce': {
    name: 'E-Commerce Store',
    sections: ['navbar', 'hero', 'product-grid', 'testimonials', 'footer'],
    hero_style: 'split-with-products',
    cta_primary: 'Shop Now',
    feature_cards: 'product-highlights'
  },
  'portfolio': {
    name: 'Portfolio & Agency',
    sections: ['navbar', 'hero', 'project-gallery', 'testimonials', 'cta-block', 'footer'],
    hero_style: 'full-width-image',
    cta_primary: 'View Portfolio',
    feature_cards: 'service-offerings'
  },
  'local_business': {
    name: 'Local Business',
    sections: ['navbar', 'hero', 'about', 'services', 'testimonials', 'contact', 'footer'],
    hero_style: 'text-only',
    cta_primary: 'Get Started',
    feature_cards: 'service-cards'
  },
  'saas': {
    name: 'SaaS Platform',
    sections: ['navbar', 'hero', 'features', 'pricing', 'testimonials', 'cta-banner', 'footer'],
    hero_style: 'split-with-graphic',
    cta_primary: 'Start Free Trial',
    feature_cards: 'feature-matrix'
  },
  'blog': {
    name: 'Blog & Content',
    sections: ['navbar', 'hero', 'featured-posts', 'recent-articles', 'newsletter', 'footer'],
    hero_style: 'text-overlay',
    cta_primary: 'Subscribe',
    feature_cards: 'post-cards'
  },
  'default': {
    name: 'General',
    sections: ['navbar', 'hero', 'features', 'stats', 'pricing', 'contact', 'footer'],
    hero_style: 'split-with-graphic',
    cta_primary: 'Get Started',
    feature_cards: 'feature-matrix'
  }
};

function determineLayoutArchetype(category, metadata = {}) {
  const baseArchetype = LAYOUT_ARCHETYPES[category] ? { ...LAYOUT_ARCHETYPES[category] } : { ...LAYOUT_ARCHETYPES['default'] };
  const businessModel = metadata.metadata?.business_model || '';
  const content = metadata.content || {};

  if (category === 'ecommerce') {
    if (businessModel === 'subscription') {
      baseArchetype.sections = ['navbar', 'hero', 'pricing', 'product-grid', 'testimonials', 'footer'];
      baseArchetype.cta_primary = 'Choose Your Plan';
      baseArchetype.feature_cards = 'subscription-plan-grid';
    } else if (businessModel === 'wholesale') {
      baseArchetype.sections = ['navbar', 'hero', 'product-grid', 'collections', 'pricing', 'footer'];
      baseArchetype.cta_primary = 'Browse Wholesale';
      baseArchetype.feature_cards = 'bulk-product-grid';
    } else {
      baseArchetype.sections = ['navbar', 'hero', 'product-grid', 'testimonials', 'footer'];
      baseArchetype.feature_cards = 'product-highlights';
    }
  } else if (category === 'blog' || content.articles) {
    baseArchetype.sections = ['navbar', 'hero', 'featured-posts', 'recent-articles', 'newsletter', 'footer'];
    baseArchetype.feature_cards = 'article-feed';
  }

  return {
    archetype: category,
    name: baseArchetype.name,
    sections: baseArchetype.sections,
    hero_style: baseArchetype.hero_style,
    primary_cta: (metadata.brand && metadata.brand.cta_text) || baseArchetype.cta_primary,
    feature_cards: baseArchetype.feature_cards
  };
}

function applyArchetypeToState(archetype) {
  if (state && typeof state === 'object') {
    state.activeSections = archetype.sections;
    state.sourceLayoutArchetype = archetype;
    return true;
  }
  return false;
}
