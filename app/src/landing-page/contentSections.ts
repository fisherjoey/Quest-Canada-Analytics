export const navigation = [
  { name: 'Features', href: '#features' },
  { name: 'Assessments', href: '/assessments' },
  { name: 'Projects', href: '/projects' },
];

export const features = [
  {
    name: 'Climate Action Assessment',
    description: 'Comprehensive assessment tools for tracking Indigenous community climate initiatives and measuring impact.',
    icon: '📊',
    href: '/assessments',
    size: 'medium' as const,
  },
  {
    name: 'Project Management',
    description: 'Track and manage climate action projects from planning through completion with milestone tracking.',
    icon: '🌱',
    href: '/projects',
    size: 'medium' as const,
  },
  {
    name: 'Funding Coordination',
    description: 'Coordinate funding sources, track budgets, and monitor financial progress for climate initiatives.',
    icon: '💰',
    href: '#',
    size: 'medium' as const,
  },
  {
    name: 'Community Dashboard',
    description: 'Visualize climate action progress across Indigenous communities with customizable dashboards.',
    icon: '📈',
    href: '/admin',
    size: 'medium' as const,
  },
  {
    name: 'Data Analytics',
    description: 'Advanced analytics for GHG reduction tracking, energy efficiency, and environmental impact measurement.',
    icon: '📉',
    href: '#',
    size: 'medium' as const,
  },
  {
    name: 'Secure & Compliant',
    description: 'Built with Indigenous data sovereignty principles and secure authentication for community data protection.',
    icon: '🔒',
    href: '#',
    size: 'medium' as const,
  },
];

export const examples = [
  {
    name: 'Climate Assessment Tools',
    description: 'Comprehensive assessment framework for evaluating community climate action readiness',
    imageSrc: '',
    href: '/assessments',
  },
  {
    name: 'Project Tracking',
    description: 'Track project progress, milestones, and outcomes in real-time',
    imageSrc: '',
    href: '/projects',
  },
  {
    name: 'Impact Reporting',
    description: 'Generate detailed reports on GHG reductions and environmental impact',
    imageSrc: '',
    href: '/admin',
  },
];

export const testimonials = [
  {
    name: 'Community Climate Leader',
    role: 'Indigenous Climate Initiative',
    avatarSrc: '',
    socialUrl: '',
    quote: 'Quest Canada has transformed how we track and report on our climate action progress. The assessment tools help us demonstrate impact to funders.',
  },
  {
    name: 'Project Coordinator',
    role: 'Northern Community',
    avatarSrc: '',
    socialUrl: '',
    quote: 'Managing multiple climate projects across our community is now streamlined. We can track milestones, funding, and outcomes all in one place.',
  },
  {
    name: 'Environmental Director',
    role: 'First Nation',
    avatarSrc: '',
    socialUrl: '',
    quote: 'The data visualization helps our leadership make informed decisions about climate priorities and resource allocation.',
  },
];

export const faqs = [
  {
    id: 1,
    question: 'What is Quest Canada?',
    answer:
      'Quest Canada is a climate action tracking platform designed specifically for Indigenous communities. It helps communities assess, plan, track, and report on climate initiatives while maintaining data sovereignty.',
  },
  {
    id: 2,
    question: 'How does the assessment tool work?',
    answer:
      'The assessment tool guides communities through evaluating climate action readiness across multiple sectors including energy, waste, transportation, and buildings. It generates actionable recommendations and tracks progress over time.',
  },
  {
    id: 3,
    question: 'Can we track multiple communities?',
    answer:
      'Yes, the platform supports tracking climate action across multiple Indigenous communities, with role-based access control to ensure data privacy and sovereignty.',
  },
  {
    id: 4,
    question: 'How is our data protected?',
    answer:
      'We follow Indigenous data sovereignty principles (OCAP®). All data is encrypted, access-controlled, and communities retain ownership and control of their climate action data.',
  },
  {
    id: 5,
    question: 'What kind of reports can we generate?',
    answer:
      'Generate comprehensive reports on GHG reduction, energy efficiency, funding status, project progress, and climate action outcomes. Reports are customizable for different stakeholders including funders, leadership, and community members.',
  },
  {
    id: 6,
    question: 'Is training provided?',
    answer:
      'Yes, we provide comprehensive onboarding and training for community staff, with ongoing support to ensure successful platform adoption.',
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
