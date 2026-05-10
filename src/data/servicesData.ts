export interface PricingTier {
  id: string;
  number: string;
  name: string;
  tagline: string;
  priceFrom: string;
  priceTo: string;
  timeline: string;
  features: string[];
  featured?: boolean;
}

export interface AddOn {
  name: string;
  description: string;
  price: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    number: '01',
    name: 'Starter',
    tagline: 'For local businesses or personal brands that need a clean, focused online presence.',
    priceFrom: '$500',
    priceTo: '– $1,200',
    timeline: '1 – 2 weeks',
    features: [
      'Up to 5 pages',
      'Mobile responsive design',
      'Contact form with email notifications',
      'Basic animations and polish',
      'Deployment (Vercel or Netlify)',
      '1 round of revisions',
    ],
  },
  {
    id: 'business',
    number: '02',
    name: 'Business',
    tagline: 'For organizations and small businesses that need a polished, functional site with real depth.',
    priceFrom: '$1,500',
    priceTo: '– $3,500',
    timeline: '2 – 4 weeks',
    features: [
      'Everything in Starter',
      'Up to 10 pages',
      'Database integration for dynamic content',
      'Advanced animations and interactions',
      'Email system integration',
      'Admin-friendly content management',
      '2 rounds of revisions',
    ],
  },
  {
    id: 'premium',
    number: '03',
    name: 'Premium',
    tagline: 'Custom sites with standout design, motion work, and the technical depth to back it up.',
    priceFrom: '$3,000',
    priceTo: '– $6,000',
    timeline: '3 – 6 weeks',
    features: [
      'Everything in Business',
      'Custom motion design (GSAP / Framer Motion)',
      '3D elements and interactive visuals',
      'Full backend API',
      'Authentication system',
      'Performance and SEO optimization',
      '3 rounds of revisions',
    ],
    featured: true,
  },
  {
    id: 'platform',
    number: '04',
    name: 'Platform',
    tagline: 'Full-stack web apps with real users, real data, and infrastructure built to last.',
    priceFrom: '$6,000',
    priceTo: '+',
    timeline: '6 – 12+ weeks',
    features: [
      'Custom backend architecture',
      'Database design and management',
      'User auth — login, OAuth, roles',
      'Dashboards and admin panels',
      'QR codes, payments, or API integrations',
      'CI/CD pipeline and deployment',
      'Ongoing support available',
    ],
  },
];

export const addOns: AddOn[] = [
  { name: 'Logo and branding', description: 'Basic logo design and brand color palette to match the site.', price: '+$200 – $500' },
  { name: 'Extra revisions', description: 'Additional revision round beyond what\'s already included.', price: '+$100 / round' },
  { name: 'Domain and hosting setup', description: 'Domain registration, DNS config, and deployment from scratch.', price: '+$75 – $150' },
  { name: 'SEO package', description: 'Meta tags, Open Graph, sitemap, and structured data.', price: '+$150 – $300' },
  { name: 'Monthly maintenance', description: 'Content updates, bug fixes, and dependency upgrades on a retainer.', price: '$75 – $200 / mo' },
  { name: 'Rush delivery', description: 'Expedited timeline. Subject to availability — ask first.', price: '+25% of project' },
];

export const faqItems: FAQItem[] = [
  {
    question: 'How does payment work?',
    answer: '40% upfront to begin. The remaining 60% is due when the project is complete, before final files and deployment are handed over.',
  },
  {
    question: 'What if I\'m not sure which tier I need?',
    answer: 'That\'s what the discovery call is for. Tell me what you\'re building and I\'ll tell you the right fit. No cost, no pressure.',
  },
  {
    question: 'Do you handle design, or do I bring my own?',
    answer: 'I handle both design and development. If you have a brand guide, I\'ll work from it. If not, I\'ll propose a direction based on your goals.',
  },
  {
    question: 'Can I update the site myself after launch?',
    answer: 'Yes. Most projects are built so you can update text and images without touching code. For bigger changes, the maintenance retainer covers that.',
  },
  {
    question: 'Do you work with student organizations or non-profits?',
    answer: 'Yes — I\'m open to a community rate. Reach out and tell me about your org.',
  },
];

export const websiteTypes = [
  'Personal / Portfolio',
  'Small Business',
  'E-Commerce',
  'Blog / Content',
  'Landing Page',
  'Web Application',
  'Non-Profit / Organization',
  'Other',
];

export const pageOptions = [
  'Home',
  'About',
  'Services',
  'Portfolio / Gallery',
  'Blog',
  'Contact',
  'Pricing',
  'FAQ',
  'Team',
  'Testimonials',
  'Login / Signup',
  'Dashboard',
];

export const featureOptions = [
  'Contact Form',
  'Newsletter Signup',
  'Social Media Integration',
  'Live Chat',
  'Search Functionality',
  'Image Gallery / Lightbox',
  'Video Embedding',
  'Maps Integration',
  'Analytics / Tracking',
  'Payment Processing',
  'User Accounts',
  'Admin Panel / CMS',
];

export const designStyles = [
  'Minimal / Clean',
  'Bold / Modern',
  'Corporate / Professional',
  'Creative / Artistic',
  'Dark / Moody',
  'Light / Airy',
  'Playful / Fun',
  'Luxury / Elegant',
];

export const budgetRanges = [
  'Under $500',
  '$500 – $1,200',
  '$1,500 – $3,500',
  '$3,000 – $6,000',
  '$6,000+',
  'Not sure yet',
];
