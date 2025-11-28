import * as React from 'react';
import { cn } from '../../lib/utils';
import { type Status, getStatusClasses } from '../../lib/style-utils';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: Status;
  children?: React.ReactNode;
}

const statusLabels: Record<Status, string> = {
  completed: 'Completed',
  'in-progress': 'In Progress',
  pending: 'Pending',
  delayed: 'Delayed',
  cancelled: 'Cancelled',
};

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, children, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(getStatusClasses(status), className)}
        {...props}
      >
        {children ?? statusLabels[status]}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { StatusBadge };
