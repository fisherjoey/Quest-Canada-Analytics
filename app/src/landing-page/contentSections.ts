export const navigation = [
  { name: 'Features', href: '#features' },
  { name: 'Assessments', href: '/assessments' },
  { name: 'Projects', href: '/projects' },
];

export const features = [
  {
    name: 'Community Energy Planning',
    description: 'Comprehensive assessment tools for tracking municipal climate action and integrated energy solutions.',
    icon: '📊',
    href: '/assessments',
    size: 'medium' as const,
  },
  {
    name: 'Project Management',
    description: 'Track and manage community-scale energy projects from planning through completion.',
    icon: '🌱',
    href: '/projects',
    size: 'medium' as const,
  },
  {
    name: 'Funding Coordination',
    description: 'Coordinate funding sources, track budgets, and monitor progress for community energy initiatives.',
    icon: '💰',
    href: '#',
    size: 'medium' as const,
  },
  {
    name: 'Community Dashboard',
    description: 'Visualize climate action progress across Canadian municipalities with customizable dashboards.',
    icon: '📈',
    href: '/admin',
    size: 'medium' as const,
  },
  {
    name: 'Smart Energy Systems',
    description: 'Advanced analytics for GHG reduction tracking, energy efficiency, and net-zero pathway monitoring.',
    icon: '📉',
    href: '#',
    size: 'medium' as const,
  },
  {
    name: 'Secure & Compliant',
    description: 'Built with data security and privacy principles for community data protection.',
    icon: '🔒',
    href: '#',
    size: 'medium' as const,
  },
];

export const faqs = [
  {
    id: 1,
    question: 'What is Quest Canada?',
    answer:
      'Quest Canada (Quality Urban Energy Systems of Tomorrow) is a national organization supporting Canadian communities on their pathway to net-zero through integrated, community-scale energy solutions.',
  },
  {
    id: 2,
    question: 'How does the assessment tool work?',
    answer:
      'The assessment tool guides communities through evaluating energy systems and climate action readiness across multiple sectors. It generates actionable recommendations and tracks progress toward net-zero goals.',
  },
  {
    id: 3,
    question: 'Who can use this platform?',
    answer:
      'The platform serves Canadian municipalities of all sizes, rural and remote communities, community energy managers, municipal staff, and stakeholders working on community-scale energy solutions.',
  },
  {
    id: 4,
    question: 'How is our data protected?',
    answer:
      'All data is encrypted, access-controlled, and communities retain ownership and control of their climate action data with secure authentication and privacy measures.',
  },
  {
    id: 5,
    question: 'What kind of reports can we generate?',
    answer:
      'Generate comprehensive reports on GHG reduction, energy efficiency, funding status, project progress, and net-zero pathway metrics. Reports are customizable for different stakeholders including funders, leadership, and community members.',
  },
  {
    id: 6,
    question: 'Is training provided?',
    answer:
      'Yes, we provide comprehensive onboarding and training for municipal staff and community champions, with ongoing support to ensure successful platform adoption.',
  },
];

export const footerNavigation = {
  app: [
    { name: 'Features', href: '/#features' },
    { name: 'Assessments', href: '/assessments' },
    { name: 'Projects', href: '/projects' },
  ],
  company: [
    { name: 'About Quest Canada', href: '#' },
    { name: 'Contact', href: '#' },
  ],
};
