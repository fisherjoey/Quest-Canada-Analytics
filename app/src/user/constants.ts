import { LayoutDashboard, Settings, Shield, FolderOpen } from 'lucide-react';
import { routes } from 'wasp/client/router';

export const userMenuItems = [
  {
    name: 'Assessments',
    to: routes.AssessmentsRoute.to,
    icon: LayoutDashboard,
    isAdminOnly: false,
    isAuthRequired: true,
  },
  {
    name: 'Projects',
    to: routes.ProjectsRoute.to,
    icon: FolderOpen,
    isAdminOnly: false,
    isAuthRequired: true,
  },
  {
    name: 'Account Settings',
    to: routes.AccountRoute.to,
    icon: Settings,
    isAuthRequired: false,
    isAdminOnly: false,
  },
  {
    name: 'Admin Dashboard',
    to: routes.AdminRoute.to,
    icon: Shield,
    isAuthRequired: false,
    isAdminOnly: true,
  },
] as const;
