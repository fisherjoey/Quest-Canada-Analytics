import { routes } from 'wasp/client/router';
import type { NavigationItem } from './NavBar';

// Empty navigation for public/marketing pages (non-logged-in users)
export const marketingNavigationItems: NavigationItem[] = [] as const;

// Portal navigation items (only shown when logged in)
export const demoNavigationitems: NavigationItem[] = [
  { name: 'Assessments', to: routes.AssessmentsRoute.to },
  { name: 'Import PDF', to: routes.AssessmentImportRoute.to },
  { name: 'Projects', to: routes.ProjectsRoute.to },
  { name: 'Dashboards', to: routes.DashboardsRoute.to },
  { name: 'Analytics', to: routes.AssessmentAnalyticsRoute.to },
] as const;
