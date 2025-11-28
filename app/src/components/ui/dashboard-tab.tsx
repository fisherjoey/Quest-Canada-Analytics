import * as React from 'react';
import { cn } from '../../lib/utils';

export interface DashboardTabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
}

const DashboardTab = React.forwardRef<HTMLButtonElement, DashboardTabProps>(
  ({ label, icon, isActive, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(
          'dashboard-tab',
          isActive && 'dashboard-tab-active',
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{label}</span>
      </button>
    );
  }
);

DashboardTab.displayName = 'DashboardTab';

export { DashboardTab };
