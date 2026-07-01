// Web Design Automation Factory - Industry Templates Preset Configurations
// Defines default structural matrices and theme presets.

const WebTemplates = {
  saas: {
    id: 'saas',
    name: 'SaaS Engine Launch',
    industry: 'general',
    description: 'Sleek, metric-focused conversion landing page optimized for high-growth tech platforms.',
    sections: ['navbar', 'hero', 'features', 'stats', 'pricing', 'footer'],
    theme: {
      primary: '#8b5cf6',   // Neon Purple
      secondary: '#f43f5e', // Hot Pink
      accent: '#06b6d4',    // Bright Cyan
      bg: '#06050b',        // Near-black purple
      container: '1200px',
      radius: '12px',
      font: 'Outfit'
    }
  },

  creative: {
    id: 'creative',
    name: 'Creative Agency Portal',
    industry: 'general',
    description: 'High-fidelity layout emphasizing stunning typography and dark-mode glass showcase cards.',
    sections: ['navbar', 'hero', 'features', 'pricing', 'contact', 'footer'],
    theme: {
      primary: '#f43f5e',   // Energetic Rose
      secondary: '#8b5cf6', // Indigo
      accent: '#f59e0b',    // Warm Amber
      bg: '#050508',        // Minimalist charcoal
      container: '1100px',
      radius: '8px',
      font: 'Outfit'
    }
  },

  construction: {
    id: 'construction',
    name: 'Industrial Construction / Roofing',
    industry: 'construction',
    description: 'Robust, highly legible service matrix with aggressive contrasting colors.',
    sections: ['navbar', 'hero', 'features', 'stats', 'contact', 'footer'],
    theme: {
      primary: '#1e3a8a',   // deep blue
      secondary: '#1e293b', // dark slate
      accent: '#f97316',    // safety orange
      bg: '#030712',        // slate black
      container: '1200px',
      radius: '6px',
      font: 'Plus Jakarta Sans'
    }
  },

  medical: {
    id: 'medical',
    name: 'Medical & Dental Clinic',
    industry: 'medical',
    description: 'Clean, professional health services uplink with soothing primary and accent anchors.',
    sections: ['navbar', 'hero', 'features', 'contact', 'footer'],
    theme: {
      primary: '#0d9488',   // teal
      secondary: '#0f172a', // dark slate
      accent: '#38bdf8',    // sky blue
      bg: '#040b0e',        // cyan black
      container: '1140px',
      radius: '16px',
      font: 'Plus Jakarta Sans'
    }
  },

  legal: {
    id: 'legal',
    name: 'Legal & Professional Practice',
    industry: 'legal',
    description: 'Sophisticated dark slate design with amber accents and detailed client testimonial blocks.',
    sections: ['navbar', 'hero', 'features', 'stats', 'contact', 'footer'],
    theme: {
      primary: '#1e293b',   // slate
      secondary: '#475569', // lighter slate
      accent: '#d97706',    // amber
      bg: '#070a13',        // navy black
      container: '1100px',
      radius: '4px',
      font: 'Outfit'
    }
  },

  fitness: {
    id: 'fitness',
    name: 'Elite Fitness & Gym Club',
    industry: 'fitness',
    description: 'High-contrast energetic structure featuring charcoal panels and aggressive performance indicators.',
    sections: ['navbar', 'hero', 'features', 'pricing', 'contact', 'footer'],
    theme: {
      primary: '#0f0f10',   // charcoal dark
      secondary: '#1c1917', // stone dark
      accent: '#dc2626',    // aggressive red
      bg: '#080808',        // pure dark
      container: '1280px',
      radius: '10px',
      font: 'Outfit'
    }
  }
};
