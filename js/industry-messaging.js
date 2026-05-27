const INDUSTRY_MESSAGING = {
  'ecommerce': {
    SECTION_TITLE: 'Featured Products',
    FEATURE_1_TITLE: 'Premium Quality',
    FEATURE_1_DESC: 'Handcrafted with attention to detail and sustainable practices.',
    FEATURE_2_TITLE: 'Fast Shipping',
    FEATURE_2_DESC: 'Delivered to your door in 2-3 business days.',
    FEATURE_3_TITLE: 'Easy Returns',
    FEATURE_3_DESC: '30-day returns guarantee with no questions asked.',
    HERO_CTA: 'Shop Now',
    PRICING_TITLE: 'Simple Pricing',
    TESTIMONIAL_1: 'Best quality I\'ve ever purchased. Highly recommend!',
    TESTIMONIAL_1_AUTHOR: 'Sarah M.'
  },
  'portfolio': {
    SECTION_TITLE: 'Our Work',
    FEATURE_1_TITLE: 'Creative Excellence',
    FEATURE_1_DESC: 'Bringing your vision to life with innovative design solutions.',
    FEATURE_2_TITLE: 'Strategic Approach',
    FEATURE_2_DESC: 'Data-driven design that delivers measurable results.',
    FEATURE_3_TITLE: 'Full Service',
    FEATURE_3_DESC: 'From concept to launch, we handle every detail.',
    HERO_CTA: 'View Portfolio',
    PRICING_TITLE: 'Project Packages',
    TESTIMONIAL_1: 'Exceptional work and attention to detail. Truly transformed our brand.',
    TESTIMONIAL_1_AUTHOR: 'Alex K., Design Director'
  },
  'local_business': {
    SECTION_TITLE: 'Our Services',
    FEATURE_1_TITLE: 'Expert Team',
    FEATURE_1_DESC: 'Serving our community with excellence for over 10 years.',
    FEATURE_2_TITLE: 'Personalized Service',
    FEATURE_2_DESC: 'Each customer gets dedicated attention and care.',
    FEATURE_3_TITLE: 'Trusted Locally',
    FEATURE_3_DESC: 'Community-approved and rated by local customers.',
    HERO_CTA: 'Get Started',
    PRICING_TITLE: 'Affordable Options',
    TESTIMONIAL_1: 'Best service in town. Friendly staff and great results!',
    TESTIMONIAL_1_AUTHOR: 'John D.'
  },
  'saas': {
    SECTION_TITLE: 'Key Features',
    FEATURE_1_TITLE: 'Powerful Performance',
    FEATURE_1_DESC: 'Built for scale and reliability with 99.99% uptime.',
    FEATURE_2_TITLE: 'Easy Integration',
    FEATURE_2_DESC: 'Connect with your favorite tools in minutes.',
    FEATURE_3_TITLE: '24/7 Support',
    FEATURE_3_DESC: 'Our team is always here to help you succeed.',
    HERO_CTA: 'Start Free Trial',
    PRICING_TITLE: 'Plans for Every Team',
    TESTIMONIAL_1: 'Transformed how we manage our workflow. Highly recommend!',
    TESTIMONIAL_1_AUTHOR: 'Emily R., Product Manager'
  },
  'blog': {
    SECTION_TITLE: 'Latest Articles',
    FEATURE_1_TITLE: 'In-Depth Analysis',
    FEATURE_1_DESC: 'Industry insights and trends you need to know.',
    FEATURE_2_TITLE: 'Expert Perspectives',
    FEATURE_2_DESC: 'Thought leadership from recognized industry experts.',
    FEATURE_3_TITLE: 'Actionable Tips',
    FEATURE_3_DESC: 'Practical advice you can implement immediately.',
    HERO_CTA: 'Subscribe',
    PRICING_TITLE: 'Premium Content',
    TESTIMONIAL_1: 'The best source for industry updates. Can\'t miss a single post!',
    TESTIMONIAL_1_AUTHOR: 'Marcus L.'
  },
  'default': {
    SECTION_TITLE: 'Discover More',
    FEATURE_1_TITLE: 'Learn About Us',
    FEATURE_1_DESC: 'Explore what makes us unique and different.',
    FEATURE_2_TITLE: 'See Our Impact',
    FEATURE_2_DESC: 'Real results from real clients just like you.',
    FEATURE_3_TITLE: 'Get Started Today',
    FEATURE_3_DESC: 'Join hundreds of satisfied customers.',
    HERO_CTA: 'Get Started',
    PRICING_TITLE: 'Transparent Pricing',
    TESTIMONIAL_1: 'Great experience from start to finish. Highly satisfied!',
    TESTIMONIAL_1_AUTHOR: 'Customer'
  }
};

function getIndustryMessaging(industry) {
  return INDUSTRY_MESSAGING[industry] || INDUSTRY_MESSAGING['default'];
}
