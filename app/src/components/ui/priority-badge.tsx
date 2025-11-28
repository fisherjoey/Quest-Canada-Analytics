import * as React from 'react';
import { cn } from '../../lib/utils';
import { type Priority, getPriorityClasses } from '../../lib/style-utils';

export interface PriorityBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  priority: Priority;
  children?: React.ReactNode;
}

const priorityLabels: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const PriorityBadge = React.forwardRef<HTMLSpanElement, PriorityBadgeProps>(
  ({ priority, children, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(getPriorityClasses(priority), className)}
        {...props}
      >
        {children ?? priorityLabels[priority]}
      </span>
    );
  }
);

PriorityBadge.displayName = 'PriorityBadge';

export { PriorityBadge };
